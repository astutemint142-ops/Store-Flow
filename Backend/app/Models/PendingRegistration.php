<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PendingRegistration extends Model
{
    protected $fillable = [
        'token',
        'business_name',
        'owner_name',
        'owner_email',
        'owner_phone',
        'password',
        'verification_code',
        'attempts',
        'expires_at',
    ];

    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function isExpired(): bool
    {
        return $this->expires_at->isPast();
    }
}
