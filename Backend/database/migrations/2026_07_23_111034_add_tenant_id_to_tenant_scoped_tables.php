<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * The tenant-owned tables that need a required tenant_id column.
     *
     * @var string[]
     */
    private array $tables = [
        'categories',
        'items',
        'orders',
        'order_items',
        'customers',
        'purchases',
        'purchase_items',
        'due_reminders',
    ];

    /**
     * Run the migrations.
     */
    public function up(): void
    {
        foreach ($this->tables as $table) {
            Schema::table($table, function (Blueprint $table) {
                $table->foreignId('tenant_id')->after('id')->constrained()->cascadeOnDelete();
            });
        }

        // A phone number only needs to be unique *within* a business, not
        // across the whole platform — two different stores can each have
        // their own customer record for the same phone number.
        Schema::table('customers', function (Blueprint $table) {
            $table->unique(['tenant_id', 'phone']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->dropUnique(['tenant_id', 'phone']);
        });

        foreach ($this->tables as $table) {
            Schema::table($table, function (Blueprint $table) {
                $table->dropConstrainedForeignId('tenant_id');
            });
        }
    }
};
