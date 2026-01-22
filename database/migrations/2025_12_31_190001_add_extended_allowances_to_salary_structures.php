<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Extended allowances, bonuses, and deductions for salary structures
     */
    public function up(): void
    {
        Schema::table('salary_structures', function (Blueprint $table) {
            // =====================
            // ADDITIONAL ALLOWANCES
            // =====================
            if (!Schema::hasColumn('salary_structures', 'q_pay')) {
                $table->decimal('q_pay', 10, 2)->default(0)->after('other_allowance');
            }
            if (!Schema::hasColumn('salary_structures', 'cost_of_living')) {
                $table->decimal('cost_of_living', 10, 2)->default(0)->after('q_pay');
            }
            if (!Schema::hasColumn('salary_structures', 'uniform_allowance')) {
                $table->decimal('uniform_allowance', 10, 2)->default(0)->after('cost_of_living');
            }
            if (!Schema::hasColumn('salary_structures', 'cola_allowance')) {
                $table->decimal('cola_allowance', 10, 2)->default(0)->after('uniform_allowance');
            }
            if (!Schema::hasColumn('salary_structures', 'attendance_allowance')) {
                $table->decimal('attendance_allowance', 10, 2)->default(0)->after('cola_allowance');
            }
            if (!Schema::hasColumn('salary_structures', 'telephone_allowance')) {
                $table->decimal('telephone_allowance', 10, 2)->default(0)->after('attendance_allowance');
            }
            if (!Schema::hasColumn('salary_structures', 'professional_allowance')) {
                $table->decimal('professional_allowance', 10, 2)->default(0)->after('telephone_allowance');
            }
            if (!Schema::hasColumn('salary_structures', 'shift_allowance')) {
                $table->decimal('shift_allowance', 10, 2)->default(0)->after('professional_allowance');
            }
            if (!Schema::hasColumn('salary_structures', 'night_duty_allowance')) {
                $table->decimal('night_duty_allowance', 10, 2)->default(0)->after('shift_allowance');
            }
            if (!Schema::hasColumn('salary_structures', 'on_call_allowance')) {
                $table->decimal('on_call_allowance', 10, 2)->default(0)->after('night_duty_allowance');
            }
            
            // =====================
            // BONUSES
            // =====================
            if (!Schema::hasColumn('salary_structures', 'annual_bonus')) {
                $table->decimal('annual_bonus', 10, 2)->default(0)->after('on_call_allowance');
            }
            if (!Schema::hasColumn('salary_structures', 'performance_bonus')) {
                $table->decimal('performance_bonus', 10, 2)->default(0)->after('annual_bonus');
            }
            if (!Schema::hasColumn('salary_structures', 'festival_bonus')) {
                $table->decimal('festival_bonus', 10, 2)->default(0)->after('performance_bonus');
            }
            if (!Schema::hasColumn('salary_structures', 'incentive_bonus')) {
                $table->decimal('incentive_bonus', 10, 2)->default(0)->after('festival_bonus');
            }
            if (!Schema::hasColumn('salary_structures', 'commission_rate')) {
                $table->decimal('commission_rate', 5, 2)->default(0)->after('incentive_bonus');
            }
            
            // =====================
            // DEDUCTIONS
            // =====================
            if (!Schema::hasColumn('salary_structures', 'paye_applicable')) {
                $table->boolean('paye_applicable')->default(false)->after('etf_applicable');
            }
            if (!Schema::hasColumn('salary_structures', 'welfare_fund')) {
                $table->decimal('welfare_fund', 10, 2)->default(0)->after('paye_applicable');
            }
            if (!Schema::hasColumn('salary_structures', 'insurance_deduction')) {
                $table->decimal('insurance_deduction', 10, 2)->default(0)->after('welfare_fund');
            }
            
            // =====================
            // LOAN & ADVANCE LIMITS
            // =====================
            if (!Schema::hasColumn('salary_structures', 'max_salary_advance')) {
                $table->decimal('max_salary_advance', 10, 2)->default(0)->after('insurance_deduction');
            }
            if (!Schema::hasColumn('salary_structures', 'max_loan_amount')) {
                $table->decimal('max_loan_amount', 12, 2)->default(0)->after('max_salary_advance');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('salary_structures', function (Blueprint $table) {
            $table->dropColumn([
                'q_pay',
                'cost_of_living',
                'uniform_allowance',
                'cola_allowance',
                'attendance_allowance',
                'telephone_allowance',
                'professional_allowance',
                'shift_allowance',
                'night_duty_allowance',
                'on_call_allowance',
                'annual_bonus',
                'performance_bonus',
                'festival_bonus',
                'incentive_bonus',
                'commission_rate',
                'paye_applicable',
                'welfare_fund',
                'insurance_deduction',
                'max_salary_advance',
                'max_loan_amount',
            ]);
        });
    }
};
