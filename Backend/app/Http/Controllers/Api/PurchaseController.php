<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Item;
use App\Models\Purchase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PurchaseController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return Purchase::with(['items.item', 'user'])
            ->latest()
            ->get();
    }

    /**
     * Store a newly created resource in storage. Increases stock and updates
     * each item's purchase price to reflect the latest cost.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'items' => ['required', 'array', 'min:1'],
            'items.*.item_id' => ['required', 'integer', 'exists:items,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'items.*.purchase_price' => ['required', 'numeric', 'min:0'],
        ]);

        $purchase = DB::transaction(function () use ($data) {
            $totalAmount = collect($data['items'])
                ->sum(fn ($line) => $line['quantity'] * $line['purchase_price']);

            $purchase = Purchase::create([
                'user_id' => request()->user()->id,
                'total_amount' => $totalAmount,
            ]);

            foreach ($data['items'] as $line) {
                $purchase->items()->create([
                    'item_id' => $line['item_id'],
                    'quantity' => $line['quantity'],
                    'purchase_price' => $line['purchase_price'],
                ]);

                Item::where('id', $line['item_id'])->update([
                    'purchase_price' => $line['purchase_price'],
                ]);
                Item::where('id', $line['item_id'])->increment('stock_quantity', $line['quantity']);
            }

            return $purchase;
        });

        return response()->json($purchase->load(['items.item', 'user']), 201);
    }
}
