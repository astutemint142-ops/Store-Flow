<?php

namespace App\Http\Controllers\Api;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class StaffController extends Controller
{
    /**
     * List the Counter Staff and Store Worker accounts for the Owner's
     * own business. The User model is not tenant-scoped automatically
     * (see App\Models\User), so we filter by tenant_id explicitly here.
     */
    public function index(Request $request)
    {
        return User::where('tenant_id', $request->user()->tenant_id)
            ->whereIn('role', [UserRole::CounterStaff->value, UserRole::StoreWorker->value])
            ->orderBy('name')
            ->get(['id', 'name', 'email', 'role']);
    }

    /**
     * Create a new Counter Staff or Store Worker account under the
     * Owner's own business.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            'role' => ['required', Rule::in([UserRole::CounterStaff->value, UserRole::StoreWorker->value])],
        ]);

        $staff = User::create([
            'tenant_id' => $request->user()->tenant_id,
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => $data['password'],
            'role' => $data['role'],
        ]);

        return response()->json([
            'id' => $staff->id,
            'name' => $staff->name,
            'email' => $staff->email,
            'role' => $staff->role,
        ], 201);
    }

    /**
     * Remove a staff account — only if it belongs to the requesting
     * Owner's own business (User isn't globally tenant-scoped, so this
     * check has to happen explicitly).
     */
    public function destroy(Request $request, User $staff)
    {
        if ($staff->tenant_id !== $request->user()->tenant_id) {
            abort(404);
        }

        $staff->delete();

        return response()->json(['message' => 'Staff account removed.']);
    }
}
