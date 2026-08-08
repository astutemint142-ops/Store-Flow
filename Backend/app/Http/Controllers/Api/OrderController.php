<?php

namespace App\Http\Controllers\Api;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Enums\PaymentType;
use App\Enums\ReminderStatus;
use App\Enums\UserRole;
use App\Events\OrderPlaced;
use App\Events\OrderReady;
use App\Events\OrderUpdated;
use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\DueReminder;
use App\Models\Item;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\User;
use App\Services\TwilioSmsService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class OrderController extends Controller
{
    /**
     * Display a listing of the resource. A Store Worker only ever sees
     * their own assigned orders — an unassigned (queued) order stays
     * invisible to everyone until a worker frees up and it's dispatched
     * to them (see dispatchQueuedOrderTo()).
     *
     * Optional filters (date_from, date_to, q, status, created_by,
     * assigned_worker_id) power the Order History / My Orders / My Picked
     * Orders drill-down screens. created_by/assigned_worker_id only ever
     * narrow the results when explicitly passed — Counter Staff is NOT
     * implicitly scoped to their own bookings here, since PaymentsPage
     * calls this same endpoint expecting to see every ready order.
     */
    public function index(Request $request)
    {
        $data = $request->validate([
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date'],
            'q' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', 'in:placed,picking,ready,completed'],
            'created_by' => ['nullable'],
            'assigned_worker_id' => ['nullable'],
        ]);

        $query = Order::with(['items.item', 'customer', 'assignedWorker', 'creator'])->latest();

        if ($request->user()->role === UserRole::StoreWorker) {
            $query->where('assigned_worker_id', $request->user()->id);
        }

        if (! empty($data['created_by'])) {
            $query->where('created_by', $data['created_by'] === 'me' ? $request->user()->id : $data['created_by']);
        }

        if (! empty($data['assigned_worker_id'])) {
            $query->where('assigned_worker_id', $data['assigned_worker_id'] === 'me' ? $request->user()->id : $data['assigned_worker_id']);
        }

        $query->createdBetween($data['date_from'] ?? null, $data['date_to'] ?? null)
            ->search($data['q'] ?? null)
            ->when(! empty($data['status']), fn ($q) => $q->where('order_status', $data['status']));

        return $query->get();
    }

    /**
     * Assign a freshly placed order to whichever Store Worker on this
     * tenant is currently free (no order still being picked). Ties are
     * broken by whoever has been assigned the fewest orders overall, so
     * work spreads out evenly. Leaves assigned_worker_id null if every
     * worker is busy — the order simply waits until dispatchQueuedOrderTo()
     * hands it to the next worker who frees up.
     */
    private function assignFreeWorker(Order $order): void
    {
        $busyWorkerIds = Order::where('tenant_id', $order->tenant_id)
            ->whereNotNull('assigned_worker_id')
            ->whereIn('order_status', [OrderStatus::Placed, OrderStatus::Picking])
            ->pluck('assigned_worker_id');

        $freeWorker = User::where('tenant_id', $order->tenant_id)
            ->where('role', UserRole::StoreWorker)
            ->whereNotIn('id', $busyWorkerIds)
            ->withCount('assignedOrders')
            ->orderBy('assigned_orders_count')
            ->first();

        if ($freeWorker) {
            $order->update(['assigned_worker_id' => $freeWorker->id]);
        }
    }

    /**
     * Called when a worker's order becomes "ready" (they just freed up).
     * Hands them the oldest still-queued order for this tenant, if any —
     * urgent orders skip ahead of the rest of the queue (but never
     * interrupt a worker who is already actively picking something else).
     */
    private function dispatchQueuedOrderTo(int $tenantId, int $workerId): void
    {
        $queued = Order::where('tenant_id', $tenantId)
            ->whereNull('assigned_worker_id')
            ->whereIn('order_status', [OrderStatus::Placed, OrderStatus::Picking])
            ->orderByDesc('is_urgent')
            ->oldest()
            ->first();

        if ($queued) {
            $queued->update(['assigned_worker_id' => $workerId]);
            $queued->load(['items.item', 'customer', 'assignedWorker']);
            broadcast(new OrderPlaced($queued));
        }
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'items' => ['required', 'array', 'min:1'],
            'items.*.item_id' => ['required', 'integer', 'exists:items,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'wants_credit' => ['boolean'],
            'is_urgent' => ['sometimes', 'boolean'],
            'customer_name' => ['required', 'string', 'max:255'],
            'customer_phone' => ['required', 'string', 'max:30'],
        ]);

        $order = DB::transaction(function () use ($data) {
            $itemIds = collect($data['items'])->pluck('item_id');
            $items = Item::whereIn('id', $itemIds)->lockForUpdate()->get()->keyBy('id');

            $totalAmount = 0;

            foreach ($data['items'] as $line) {
                $item = $items[$line['item_id']];

                if ($line['quantity'] > $item->stock_quantity) {
                    throw ValidationException::withMessages([
                        'items' => ["Not enough stock for \"{$item->name}\". Only {$item->stock_quantity} left."],
                    ]);
                }

                $totalAmount += $item->price * $line['quantity'];
            }

            $customer = Customer::firstOrCreate(
                ['phone' => $data['customer_phone']],
                ['name' => $data['customer_name']]
            );

            $order = Order::create([
                'customer_id' => $customer->id,
                'created_by' => request()->user()->id,
                'total_amount' => $totalAmount,
                'is_urgent' => $data['is_urgent'] ?? false,
            ]);

            foreach ($data['items'] as $line) {
                $item = $items[$line['item_id']];

                $order->items()->create([
                    'item_id' => $item->id,
                    'quantity' => $line['quantity'],
                    'price_at_order_time' => $item->price,
                ]);
            }

            return $order;
        });

        $this->assignFreeWorker($order);
        $order->load(['items.item', 'customer', 'assignedWorker']);

        broadcast(new OrderPlaced($order));

        return response()->json($order, 201);
    }

    /**
     * Mark a single order item as collected (or un-collected) by a store
     * worker. Reaching "every item collected" no longer auto-completes the
     * order — the worker must do a final crosscheck and explicitly call
     * confirmReady() below, so items from different customers don't get
     * mixed up on an instant, easy-to-fumble auto-transition.
     */
    public function markItemCollected(Request $request, Order $order, OrderItem $orderItem)
    {
        if ($orderItem->order_id !== $order->id) {
            abort(404);
        }

        $data = $request->validate([
            'is_collected' => ['required', 'boolean'],
        ]);

        $orderItem->update(['is_collected' => $data['is_collected']]);

        if ($order->order_status === OrderStatus::Placed && $data['is_collected']) {
            $order->update(['order_status' => OrderStatus::Picking]);
        }

        return $order->load(['items.item', 'customer', 'assignedWorker']);
    }

    /**
     * The worker's final crosscheck step: once every item is collected,
     * this is the explicit action that actually flips the order to Ready
     * (instead of it happening automatically on the last checkbox tick).
     */
    public function confirmReady(Order $order)
    {
        if (! in_array($order->order_status, [OrderStatus::Placed, OrderStatus::Picking], true)) {
            abort(409, 'This order cannot be marked ready right now.');
        }

        if ($order->items()->where('is_collected', false)->exists()) {
            abort(409, 'Not every item has been collected yet.');
        }

        $order->update(['order_status' => OrderStatus::Ready]);
        broadcast(new OrderReady($order));

        if ($order->assigned_worker_id) {
            $this->dispatchQueuedOrderTo($order->tenant_id, $order->assigned_worker_id);
        }

        return $order->load(['items.item', 'customer', 'assignedWorker']);
    }

    /**
     * Let Owner/Counter Staff edit an order's items while it's still being
     * picked (before Ready) — e.g. the customer changed their mind. Stock
     * is only ever decremented at payment time, so no "release" bookkeeping
     * is needed here, just re-validation against current stock. A quantity
     * change on an already-collected line resets that line back to
     * uncollected so the worker re-verifies it; unrelated collected lines
     * are left alone. Broadcasts OrderUpdated so an already-open Web pick
     * list reflects the edit live (Mobile picks it up on its next 6s poll
     * with no extra code needed).
     */
    public function updateItems(Request $request, Order $order)
    {
        if (! in_array($order->order_status, [OrderStatus::Placed, OrderStatus::Picking], true)) {
            abort(409, 'This order can no longer be edited.');
        }

        $data = $request->validate([
            'items' => ['required', 'array', 'min:1'],
            'items.*.item_id' => ['required', 'integer', 'exists:items,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'is_urgent' => ['sometimes', 'boolean'],
        ]);

        $order = DB::transaction(function () use ($data, $order) {
            $itemIds = collect($data['items'])->pluck('item_id');
            $items = Item::whereIn('id', $itemIds)->lockForUpdate()->get()->keyBy('id');

            $totalAmount = 0;
            $keptOrderItemIds = [];

            foreach ($data['items'] as $line) {
                $item = $items[$line['item_id']];

                if ($line['quantity'] > $item->stock_quantity) {
                    throw ValidationException::withMessages([
                        'items' => ["Not enough stock for \"{$item->name}\". Only {$item->stock_quantity} left."],
                    ]);
                }

                $totalAmount += $item->price * $line['quantity'];

                $existing = $order->items()->where('item_id', $item->id)->first();

                if ($existing) {
                    $quantityChanged = $existing->quantity !== $line['quantity'];
                    $existing->update([
                        'quantity' => $line['quantity'],
                        'price_at_order_time' => $item->price,
                        'is_collected' => $quantityChanged ? false : $existing->is_collected,
                    ]);
                    $keptOrderItemIds[] = $existing->id;
                } else {
                    $created = $order->items()->create([
                        'item_id' => $item->id,
                        'quantity' => $line['quantity'],
                        'price_at_order_time' => $item->price,
                    ]);
                    $keptOrderItemIds[] = $created->id;
                }
            }

            $order->items()->whereNotIn('id', $keptOrderItemIds)->delete();

            $anyCollected = $order->items()->where('is_collected', true)->exists();

            $order->update([
                'total_amount' => $totalAmount,
                'is_urgent' => $data['is_urgent'] ?? $order->is_urgent,
                'order_status' => $anyCollected ? OrderStatus::Picking : OrderStatus::Placed,
            ]);

            return $order;
        });

        $order->load(['items.item', 'customer', 'assignedWorker', 'creator']);

        broadcast(new OrderUpdated($order));

        return $order;
    }

    /**
     * Process payment for an order that is ready for pickup and mark it completed.
     * Cash/Card are settled immediately. Credit records the amount against the
     * customer's running balance and schedules a due reminder for 7 days later.
     * Stock is deducted for every item on the order at this point.
     */
    public function processPayment(Request $request, Order $order)
    {
        if ($order->order_status !== OrderStatus::Ready) {
            abort(409, 'This order is not ready for payment yet.');
        }

        $data = $request->validate([
            'payment_type' => ['required', 'in:cash,card,credit'],
        ]);

        $isCredit = $data['payment_type'] === 'credit';

        $order = DB::transaction(function () use ($data, $order, $isCredit) {
            foreach ($order->items as $orderItem) {
                Item::where('id', $orderItem->item_id)->decrement('stock_quantity', $orderItem->quantity);
            }

            if ($isCredit) {
                $customer = $order->customer;
                $customer->increment('total_due', $order->total_amount);

                DueReminder::create([
                    'customer_id' => $customer->id,
                    'order_id' => $order->id,
                    'amount' => $order->total_amount,
                    'reminder_status' => ReminderStatus::Pending,
                    'next_reminder_date' => now()->addDays(7),
                ]);

                $order->update([
                    'payment_type' => PaymentType::Credit,
                    'payment_status' => PaymentStatus::Pending,
                    'order_status' => OrderStatus::Completed,
                ]);
            } else {
                $order->update([
                    'payment_type' => $data['payment_type'],
                    'payment_status' => PaymentStatus::Paid,
                    'order_status' => OrderStatus::Completed,
                ]);
            }

            return $order;
        });

        $order->load(['items.item', 'customer']);

        // Credit customers haven't actually paid yet (payment_status stays
        // "pending" until they clear their due) — their thank-you SMS fires
        // from DueReminderController::clear() instead, at the point they
        // actually pay.
        if (! $isCredit && $order->customer) {
            $businessName = $order->tenant->business_name ?? 'us';
            app(TwilioSmsService::class)->send(
                $order->customer->phone,
                "Thank you for shopping with {$businessName}! We appreciate your business."
            );
        }

        return $order;
    }
}
