<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration {
    /**
     * Run the migrations.
     * 
     * Add POS configuration settings
     */
    public function up(): void
    {
        // Insert default POS settings (matching existing system_settings table structure)
        DB::table('system_settings')->insertOrIgnore([
            [
                'key' => 'pos_pricing_strategy',
                'value' => 'fifo', // fifo, weighted_average, manual
                'type' => 'string',
                'group' => 'pos',
                'description' => 'Inventory pricing strategy: fifo (First In First Out), weighted_average, or manual',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'pos_allow_cashier_discount',
                'value' => 'true',
                'type' => 'boolean',
                'group' => 'pos',
                'description' => 'Allow cashiers to apply predefined discounts',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'pos_max_cashier_discount_percent',
                'value' => '10',
                'type' => 'integer',
                'group' => 'pos',
                'description' => 'Maximum discount percentage a cashier can apply without approval',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'pos_override_request_expiry_minutes',
                'value' => '30',
                'type' => 'integer',
                'group' => 'pos',
                'description' => 'Minutes until a price override request expires',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'pos_require_batch_for_sale',
                'value' => 'true',
                'type' => 'boolean',
                'group' => 'pos',
                'description' => 'Require batch tracking for all sales',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'pos_auto_select_expiring_batch',
                'value' => 'true',
                'type' => 'boolean',
                'group' => 'pos',
                'description' => 'Automatically prioritize batches closest to expiry (FEFO)',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('system_settings')
            ->whereIn('key', [
                'pos_pricing_strategy',
                'pos_allow_cashier_discount',
                'pos_max_cashier_discount_percent',
                'pos_override_request_expiry_minutes',
                'pos_require_batch_for_sale',
                'pos_auto_select_expiring_batch',
            ])
            ->delete();
    }
};
