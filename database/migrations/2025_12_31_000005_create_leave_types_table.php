<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * STEP 8: Leave Types Configuration Table
     */
    public function up(): void
    {
        Schema::create('leave_types', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('code')->unique(); // annual, casual, sick, maternity, etc.
            $table->string('name');
            $table->integer('annual_quota')->default(0);
            $table->boolean('carry_forward')->default(false);
            $table->integer('max_carry_forward')->default(0);
            $table->boolean('paid_leave')->default(true);
            $table->enum('eligibility', ['all', 'male', 'female'])->default('all');
            $table->integer('min_service_months')->default(0); // Minimum service required
            $table->integer('max_consecutive_days')->nullable();
            $table->boolean('requires_document')->default(false); // e.g., medical certificate
            $table->boolean('is_active')->default(true);
            $table->text('description')->nullable();
            $table->timestamps();
        });
        
        // Seed default Sri Lanka leave types
        DB::table('leave_types')->insert([
            [
                'id' => \Illuminate\Support\Str::uuid(),
                'code' => 'annual',
                'name' => 'Annual Leave',
                'annual_quota' => 14,
                'carry_forward' => true,
                'max_carry_forward' => 7,
                'paid_leave' => true,
                'eligibility' => 'all',
                'min_service_months' => 12,
                'max_consecutive_days' => 14,
                'requires_document' => false,
                'is_active' => true,
                'description' => 'Standard annual leave entitlement',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'id' => \Illuminate\Support\Str::uuid(),
                'code' => 'casual',
                'name' => 'Casual Leave',
                'annual_quota' => 7,
                'carry_forward' => false,
                'max_carry_forward' => 0,
                'paid_leave' => true,
                'eligibility' => 'all',
                'min_service_months' => 0,
                'max_consecutive_days' => 3,
                'requires_document' => false,
                'is_active' => true,
                'description' => 'For urgent personal matters',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'id' => \Illuminate\Support\Str::uuid(),
                'code' => 'sick',
                'name' => 'Sick Leave',
                'annual_quota' => 7,
                'carry_forward' => false,
                'max_carry_forward' => 0,
                'paid_leave' => true,
                'eligibility' => 'all',
                'min_service_months' => 0,
                'max_consecutive_days' => null,
                'requires_document' => true,
                'is_active' => true,
                'description' => 'Medical leave with certificate required for 2+ days',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'id' => \Illuminate\Support\Str::uuid(),
                'code' => 'maternity',
                'name' => 'Maternity Leave',
                'annual_quota' => 84,
                'carry_forward' => false,
                'max_carry_forward' => 0,
                'paid_leave' => true,
                'eligibility' => 'female',
                'min_service_months' => 12,
                'max_consecutive_days' => 84,
                'requires_document' => true,
                'is_active' => true,
                'description' => '12 weeks maternity leave as per Sri Lanka law',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'id' => \Illuminate\Support\Str::uuid(),
                'code' => 'paternity',
                'name' => 'Paternity Leave',
                'annual_quota' => 3,
                'carry_forward' => false,
                'max_carry_forward' => 0,
                'paid_leave' => true,
                'eligibility' => 'male',
                'min_service_months' => 6,
                'max_consecutive_days' => 3,
                'requires_document' => true,
                'is_active' => true,
                'description' => 'Paternity leave for new fathers',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'id' => \Illuminate\Support\Str::uuid(),
                'code' => 'no_pay',
                'name' => 'No Pay Leave',
                'annual_quota' => 30,
                'carry_forward' => false,
                'max_carry_forward' => 0,
                'paid_leave' => false,
                'eligibility' => 'all',
                'min_service_months' => 0,
                'max_consecutive_days' => null,
                'requires_document' => false,
                'is_active' => true,
                'description' => 'Unpaid leave when other leave types exhausted',
                'created_at' => now(),
                'updated_at' => now()
            ]
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('leave_types');
    }
};
