<?php

namespace App\Http\Controllers\Api;

use App\Enums\TenantStatus;
use App\Http\Controllers\Controller;
use App\Models\Tenant;
use Illuminate\Support\Facades\DB;

class TenantController extends Controller
{
    /**
     * List every registered business with a basic staff count. The Super
     * Admin can see this summary but never the tenant's actual store data
     * (items, orders, customers).
     */
    public function index()
    {
        return Tenant::withCount('users')->orderBy('business_name')->get();
    }

    /**
     * Suspend a business — its staff will no longer be able to log in.
     */
    public function suspend(Tenant $tenant)
    {
        $tenant->update(['status' => TenantStatus::Suspended]);

        return $tenant;
    }

    /**
     * Reactivate a previously suspended business.
     */
    public function reactivate(Tenant $tenant)
    {
        $tenant->update(['status' => TenantStatus::Active]);

        return $tenant;
    }

    /**
     * Permanently remove a business and everything tied to it — staff
     * accounts, items, categories, orders, customers, purchases, and due
     * reminders. This is irreversible, mainly meant for cleaning up test
     * accounts created during development.
     *
     * Staff (users) rows are deleted explicitly first: their tenant_id
     * foreign key is nullOnDelete (not cascadeOnDelete), since a user
     * losing its tenant shouldn't normally delete the user itself. Deleting
     * them here is what actually frees up their email for reuse. Every
     * other tenant-owned table (categories, items, orders, order_items,
     * customers, purchases, purchase_items, due_reminders, reminder_logs)
     * has a real cascadeOnDelete constraint, so deleting the Tenant row
     * removes all of it automatically.
     */
    public function destroy(Tenant $tenant)
    {
        DB::transaction(function () use ($tenant) {
            $tenant->users()->delete();
            $tenant->delete();
        });

        return response()->json(['message' => 'Business permanently deleted.']);
    }
}
