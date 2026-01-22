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
        Schema::create('system_settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->text('value')->nullable();
            $table->string('type')->default('string'); // string, integer, decimal, boolean, json
            $table->string('group')->default('general'); // general, appointments, payments, etc.
            $table->string('description')->nullable();
            $table->timestamps();
        });

        // Insert default booking fee per slot
        DB::table('system_settings')->insert([
            [
                'key' => 'booking_fee_per_slot',
                'value' => '350.00',
                'type' => 'decimal',
                'group' => 'appointments',
                'description' => 'Default booking fee per appointment slot (LKR)',
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
        Schema::dropIfExists('system_settings');
    }
};
