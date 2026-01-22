<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Add supplier_entity role to user_roles table
        DB::table('user_roles')->insert([
            'role_name' => 'supplier_entity',
            'display_name' => 'Supplier Entity',
            'description' => 'External supplier entity user with access to supplier portal',
            'permissions' => json_encode([
                'supplier.dashboard',
                'supplier.products.view',
                'supplier.orders.view',
                'supplier.orders.manage',
                'supplier.inventory.update',
                'supplier.profile.manage'
            ]),
            'hierarchy_level' => 7,
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('user_roles')->where('role_name', 'supplier_entity')->delete();
    }
};
