<?php

namespace App\Models;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Enums\PaymentType;
use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'customer_id',
        'created_by',
        'assigned_worker_id',
        'total_amount',
        'payment_type',
        'payment_status',
        'order_status',
        'is_urgent',
    ];

    protected function casts(): array
    {
        return [
            'total_amount' => 'decimal:2',
            'payment_type' => PaymentType::class,
            'payment_status' => PaymentStatus::class,
            'order_status' => OrderStatus::class,
            'is_urgent' => 'boolean',
        ];
    }

    /**
     * Narrow to orders created within an optional date range (either bound
     * may be omitted). Used by history/search drill-down pages.
     */
    public function scopeCreatedBetween($query, ?string $from, ?string $to)
    {
        return $query
            ->when($from, fn ($q) => $q->whereDate('created_at', '>=', $from))
            ->when($to, fn ($q) => $q->whereDate('created_at', '<=', $to));
    }

    /**
     * Free-text search by order id or customer name/phone. Used by
     * history/search drill-down pages.
     */
    public function scopeSearch($query, ?string $term)
    {
        return $query->when($term, fn ($q) => $q->where(function ($q2) use ($term) {
            $q2->where('id', 'like', "%{$term}%")
                ->orWhereHas('customer', function ($c) use ($term) {
                    $c->where('name', 'like', "%{$term}%")
                        ->orWhere('phone', 'like', "%{$term}%");
                });
        }));
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function assignedWorker(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_worker_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function dueReminders(): HasMany
    {
        return $this->hasMany(DueReminder::class);
    }
}
