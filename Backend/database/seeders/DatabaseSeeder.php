<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        User::factory()->create([
            'name' => 'Super Admin',
            'email' => 'admin@storeflow.test',
            'password' => bcrypt('password'),
            'role' => UserRole::SuperAdmin,
            'tenant_id' => null,
        ]);

        $tenant = Tenant::create([
            'business_name' => 'Demo Superstore',
            'business_type' => 'grocery',
            'owner_name' => 'Store Owner',
            'owner_email' => 'owner@storeflow.test',
            'owner_phone' => '03000000000',
        ]);

        User::factory()->create([
            'tenant_id' => $tenant->id,
            'name' => 'Store Owner',
            'email' => 'owner@storeflow.test',
            'password' => bcrypt('password'),
            'role' => UserRole::Owner,
        ]);

        User::factory()->create([
            'tenant_id' => $tenant->id,
            'name' => 'Counter Staff',
            'email' => 'counter@storeflow.test',
            'password' => bcrypt('password'),
            'role' => UserRole::CounterStaff,
        ]);

        User::factory()->create([
            'tenant_id' => $tenant->id,
            'name' => 'Store Worker',
            'email' => 'worker@storeflow.test',
            'password' => bcrypt('password'),
            'role' => UserRole::StoreWorker,
        ]);

        // A second business, purely so multi-tenant isolation can be tested —
        // its data must never show up for the first business and vice versa.
        $secondTenant = Tenant::create([
            'business_name' => 'City Grocers',
            'business_type' => 'grocery',
            'owner_name' => 'Second Owner',
            'owner_email' => 'owner2@storeflow.test',
            'owner_phone' => '03111111111',
        ]);

        User::factory()->create([
            'tenant_id' => $secondTenant->id,
            'name' => 'Second Owner',
            'email' => 'owner2@storeflow.test',
            'password' => bcrypt('password'),
            'role' => UserRole::Owner,
        ]);
    }
}
