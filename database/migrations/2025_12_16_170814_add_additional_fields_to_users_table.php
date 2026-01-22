<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('name')->nullable()->after('last_name');
            $table->string('username')->nullable()->unique()->after('name');
            $table->string('phone')->nullable()->after('email');
            $table->string('nic')->nullable()->unique()->after('phone');
            $table->date('date_of_birth')->nullable()->after('nic');
            $table->string('gender')->nullable()->after('date_of_birth');
            $table->foreignUuid('branch_id')->nullable()->constrained('branches')->onDelete('set null')->after('gender');
            $table->text('address')->nullable()->after('branch_id');
            $table->string('user_type')->nullable()->after('address');
            $table->string('photo')->nullable()->after('user_type');
            $table->string('nic_photo')->nullable()->after('photo');
            $table->boolean('is_active')->default(true)->after('nic_photo');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'name',
                'username',
                'phone',
                'nic',
                'date_of_birth',
                'gender',
                'branch_id',
                'address',
                'user_type',
                'photo',
                'nic_photo',
                'is_active'
            ]);
        });
    }
};
