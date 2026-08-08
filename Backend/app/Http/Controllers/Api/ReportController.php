<?php

namespace App\Http\Controllers\Api;

use App\Enums\OrderStatus;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\User;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    /**
     * Analytics for the Owner: sales over the last 30 days, top-selling
     * items, and a breakdown of completed orders by payment type.
     */
    public function summary()
    {
        $days = 30;
        $startDate = today()->subDays($days - 1);

        $salesByDate = Order::where('order_status', OrderStatus::Completed)
            ->where('updated_at', '>=', $startDate)
            ->selectRaw('DATE(updated_at) as date, SUM(total_amount) as total')
            ->groupBy('date')
            ->pluck('total', 'date');

        $salesOverTime = [];
        for ($i = 0; $i < $days; $i++) {
            $date = $startDate->copy()->addDays($i)->toDateString();
            $salesOverTime[] = [
                'date' => $date,
                'total' => (float) ($salesByDate[$date] ?? 0),
            ];
        }

        $topItems = OrderItem::join('orders', 'orders.id', '=', 'order_items.order_id')
            ->join('items', 'items.id', '=', 'order_items.item_id')
            ->where('orders.order_status', OrderStatus::Completed->value)
            ->selectRaw('items.name as name, SUM(order_items.quantity) as quantity, SUM(order_items.quantity * order_items.price_at_order_time) as revenue')
            ->groupBy('items.id', 'items.name')
            ->orderByDesc('quantity')
            ->limit(5)
            ->get();

        $paymentBreakdown = Order::where('order_status', OrderStatus::Completed)
            ->selectRaw('payment_type, COUNT(*) as count, SUM(total_amount) as total')
            ->groupBy('payment_type')
            ->get();

        return response()->json([
            'sales_over_time' => $salesOverTime,
            'top_items' => $topItems,
            'payment_breakdown' => $paymentBreakdown,
        ]);
    }

    /**
     * How much work each Counter Staff / Store Worker has handled —
     * order counts (and sales, for counter staff) since they joined, or
     * within an optional date range.
     */
    public function staffActivity(Request $request)
    {
        $tenantId = $request->user()->tenant_id;

        $data = $request->validate([
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date'],
        ]);
        $dateFrom = $data['date_from'] ?? null;
        $dateTo = $data['date_to'] ?? null;

        $withinRange = fn ($q) => $q
            ->when($dateFrom, fn ($q2) => $q2->whereDate('created_at', '>=', $dateFrom))
            ->when($dateTo, fn ($q2) => $q2->whereDate('created_at', '<=', $dateTo));

        $counterStaff = User::where('tenant_id', $tenantId)
            ->where('role', UserRole::CounterStaff)
            ->withCount(['createdOrders' => $withinRange])
            ->get()
            ->map(fn (User $u) => [
                'id' => $u->id,
                'name' => $u->name,
                'email' => $u->email,
                'role' => 'counter_staff',
                'orders_count' => $u->created_orders_count,
                'total_sales' => (float) Order::where('created_by', $u->id)
                    ->where('order_status', OrderStatus::Completed)
                    ->when($dateFrom, fn ($q) => $q->whereDate('created_at', '>=', $dateFrom))
                    ->when($dateTo, fn ($q) => $q->whereDate('created_at', '<=', $dateTo))
                    ->sum('total_amount'),
            ]);

        $storeWorkers = User::where('tenant_id', $tenantId)
            ->where('role', UserRole::StoreWorker)
            ->withCount(['assignedOrders' => $withinRange])
            ->get()
            ->map(fn (User $u) => [
                'id' => $u->id,
                'name' => $u->name,
                'email' => $u->email,
                'role' => 'store_worker',
                'orders_count' => $u->assigned_orders_count,
                'total_sales' => null,
            ]);

        return response()->json($counterStaff->concat($storeWorkers)->values());
    }
}
