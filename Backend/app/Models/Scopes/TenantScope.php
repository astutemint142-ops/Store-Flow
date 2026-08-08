<?php

namespace App\Models\Scopes;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;

/**
 * Automatically limits every query on a tenant-owned model to the
 * logged-in user's own business. If there is no logged-in tenant user
 * (guest, or a Super Admin who has no tenant_id), the query returns no
 * rows at all rather than everything — a business's data is never shown
 * by accident.
 */
class TenantScope implements Scope
{
    public function apply(Builder $builder, Model $model): void
    {
        // Console commands (migrations, seeders, tinker) run with no
        // logged-in user — let them see everything.
        if (app()->runningInConsole()) {
            return;
        }

        $user = auth()->user();

        if ($user && $user->tenant_id) {
            $builder->where($model->getTable().'.tenant_id', $user->tenant_id);

            return;
        }

        $builder->whereRaw('1 = 0');
    }
}
