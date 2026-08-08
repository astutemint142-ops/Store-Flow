<?php

namespace App\Models;

use App\Enums\ReminderStatus;
use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DueReminder extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'customer_id',
        'order_id',
        'amount',
        'reminder_status',
        'next_reminder_date',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'reminder_status' => ReminderStatus::class,
            'next_reminder_date' => 'date',
        ];
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function logs(): HasMany
    {
        return $this->hasMany(ReminderLog::class);
    }
}
