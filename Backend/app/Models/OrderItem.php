<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderItem extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'order_id',
        'item_id',
        'quantity',
        'price_at_order_time',
        'is_collected',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'integer',
            'price_at_order_time' => 'decimal:2',
            'is_collected' => 'boolean',
        ];
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function item(): BelongsTo
    {
        return $this->belongsTo(Item::class);
    }
}
