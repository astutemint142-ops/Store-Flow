<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Enums\UserRole;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

#[Fillable(['name', 'email', 'password', 'role', 'tenant_id'])]
#[Hidden(['password', 'remember_token', 'profile_photo_path'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    protected $appends = ['profile_photo_url'];

    /**
     * Note: unlike the other tenant-owned models, User deliberately does
     * NOT use the BelongsToTenant trait — its automatic global scope would
     * break login, since we don't know which tenant a user belongs to
     * until *after* we've looked them up by email. Any query that needs to
     * list "my tenant's staff" must filter by tenant_id explicitly.
     */
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    /**
     * Orders currently or previously assigned to this Store Worker — used
     * to decide who's "free" when a new order comes in, and to build the
     * staff activity report.
     */
    public function assignedOrders(): HasMany
    {
        return $this->hasMany(Order::class, 'assigned_worker_id');
    }

    /**
     * Orders this Counter Staff member (or Owner) personally took at the
     * counter — used for the staff activity report.
     */
    public function createdOrders(): HasMany
    {
        return $this->hasMany(Order::class, 'created_by');
    }

    /**
     * Built from the CURRENT request's host rather than the static APP_URL
     * config — the mobile app can point at any LAN IP via its own API
     * Settings screen, so a hardcoded APP_URL would produce a photo URL
     * the phone can't actually reach. Mirroring whatever host the client
     * used to reach the API keeps this correct automatically.
     */
    protected function profilePhotoUrl(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->profile_photo_path
                ? request()->getSchemeAndHttpHost().'/storage/'.$this->profile_photo_path
                : null,
        );
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'role' => UserRole::class,
        ];
    }
}
