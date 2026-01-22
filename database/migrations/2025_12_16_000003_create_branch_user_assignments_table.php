<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('branch_user_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignUuid('branch_id')->constrained('branches')->onDelete('cascade');
            $table->string('role'); // role within this specific branch
            $table->boolean('is_primary_branch')->default(false); // main branch for this user
            $table->date('assigned_date');
            $table->date('end_date')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['user_id', 'branch_id']);
            $table->index(['branch_id', 'role', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('branch_user_assignments');
    }
};
