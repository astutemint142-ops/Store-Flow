<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Customer extends Model
{
    use BelongsToTenant;

    protected $fillable = ['name', 'phone', 'total_due'];

    protected function casts(): array
    {
        return [
            'total_due' => 'decimal:2',
        ];
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    public function dueReminders(): HasMany
    {
        return $this->hasMany(DueReminder::class);
    }
}
