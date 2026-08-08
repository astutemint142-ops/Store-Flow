<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Imports\ItemsImport;
use App\Models\Item;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;

class ItemController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return Item::with('category')->orderBy('name')->get();
    }

    /**
     * List items whose stock has fallen to or below their low-stock threshold.
     */
    public function lowStock()
    {
        return Item::with('category')
            ->whereColumn('stock_quantity', '<=', 'low_stock_threshold')
            ->orderBy('stock_quantity')
            ->get();
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $data = $request->validate($this->rules());

        return response()->json(Item::create($data)->load('category'), 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Item $item)
    {
        return $item->load('category');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Item $item)
    {
        $data = $request->validate($this->rules());

        $item->update($data);

        return $item->load('category');
    }

    /**
     * Bulk-import items (and their categories) from an uploaded Excel/CSV
     * file. Expected columns: Category, Name, Price, Purchase Price,
     * Stock Quantity, Low Stock Threshold. Categories are created if
     * they don't already exist; an item name that already exists within
     * its category is updated rather than duplicated.
     */
    public function import(Request $request)
    {
        $request->validate([
            'file' => ['required', 'file', 'mimes:xlsx,xls,csv'],
        ]);

        // A large catalog file can legitimately take longer than PHP's
        // default 30s limit even with the optimized queries in ItemsImport —
        // this is just a safety net so a big-but-valid file doesn't fatal-error.
        set_time_limit(120);

        $import = new ItemsImport;
        Excel::import($import, $request->file('file'));

        return response()->json([
            'created' => $import->created,
            'updated' => $import->updated,
            'errors' => $import->errors,
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Item $item)
    {
        try {
            $item->delete();
        } catch (QueryException) {
            abort(409, 'This item has past orders and cannot be deleted.');
        }

        return response()->json(['message' => 'Item deleted.']);
    }

    /**
     * Shared validation rules for store/update.
     */
    private function rules(): array
    {
        return [
            'category_id' => ['required', 'exists:categories,id'],
            'name' => ['required', 'string', 'max:255'],
            'price' => ['required', 'numeric', 'min:0'],
            'purchase_price' => ['required', 'numeric', 'min:0'],
            'stock_quantity' => ['required', 'integer', 'min:0'],
            'low_stock_threshold' => ['required', 'integer', 'min:0'],
        ];
    }
}
