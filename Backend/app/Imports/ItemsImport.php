<?php

namespace App\Imports;

use App\Models\Category;
use App\Models\Item;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

/**
 * Expects columns (any casing/spacing): Category, Name, Price,
 * Purchase Price, Stock Quantity, Low Stock Threshold. Categories are
 * looked up by name and created if they don't exist yet; items are
 * matched by name within their category — an existing item is updated,
 * a new name creates a new item.
 *
 * Categories and existing items are pre-loaded into in-memory lookup maps
 * before the row loop, instead of querying the database on every single
 * row — a large catalog (hundreds/thousands of rows) would otherwise run
 * 2-3 queries per row and could time out.
 */
class ItemsImport implements ToCollection, WithHeadingRow
{
    public int $created = 0;

    public int $updated = 0;

    /** @var array<int, string> */
    public array $errors = [];

    public function collection(Collection $rows): void
    {
        $categoriesByName = Category::all(['id', 'name'])
            ->keyBy(fn (Category $category) => mb_strtolower($category->name));

        $itemsByCategoryAndName = Item::all(['id', 'category_id', 'name'])
            ->keyBy(fn (Item $item) => $item->category_id.'|'.mb_strtolower($item->name));

        DB::transaction(function () use ($rows, &$categoriesByName, &$itemsByCategoryAndName) {
            foreach ($rows as $index => $row) {
                $rowNumber = $index + 2; // +1 for zero-index, +1 for the header row

                $categoryName = trim((string) ($row['category'] ?? ''));
                $name = trim((string) ($row['name'] ?? ''));
                $price = $row['price'] ?? null;
                $purchasePrice = $row['purchase_price'] ?? null;
                $stockQuantity = $row['stock_quantity'] ?? null;
                $lowStockThreshold = $row['low_stock_threshold'] ?? null;

                if ($categoryName === '' && $name === '') {
                    continue; // blank row
                }

                if ($categoryName === '' || $name === '' || $price === null || $purchasePrice === null || $stockQuantity === null || $lowStockThreshold === null) {
                    $this->errors[] = "Row {$rowNumber}: missing a required value, skipped.";

                    continue;
                }

                if (! is_numeric($price) || ! is_numeric($purchasePrice) || ! is_numeric($stockQuantity) || ! is_numeric($lowStockThreshold)) {
                    $this->errors[] = "Row {$rowNumber}: price/stock values must be numbers, skipped.";

                    continue;
                }

                $categoryKey = mb_strtolower($categoryName);
                $category = $categoriesByName[$categoryKey] ?? null;

                if (! $category) {
                    $category = Category::create(['name' => $categoryName]);
                    $categoriesByName[$categoryKey] = $category;
                }

                $attributes = [
                    'category_id' => $category->id,
                    'name' => $name,
                    'price' => (float) $price,
                    'purchase_price' => (float) $purchasePrice,
                    'stock_quantity' => (int) $stockQuantity,
                    'low_stock_threshold' => (int) $lowStockThreshold,
                ];

                $itemKey = $category->id.'|'.mb_strtolower($name);
                $item = $itemsByCategoryAndName[$itemKey] ?? null;

                if ($item) {
                    $item->update($attributes);
                    $this->updated++;
                } else {
                    $item = Item::create($attributes);
                    $itemsByCategoryAndName[$itemKey] = $item;
                    $this->created++;
                }
            }
        });
    }
}
