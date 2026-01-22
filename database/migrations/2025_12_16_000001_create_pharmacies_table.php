<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pharmacies', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('branch_id')->constrained('branches')->onDelete('cascade');
            $table->string('pharmacy_name', 100);
            $table->string('pharmacy_code', 20)->unique();
            $table->string('license_number', 50)->unique();
            $table->date('license_expiry_date')->nullable();
            $table->string('phone', 20)->nullable();
            $table->string('email', 100)->nullable();
            $table->text('location_in_branch')->nullable(); // e.g., "Ground Floor, Wing A"
            $table->json('operating_hours')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->index(['branch_id', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pharmacies');
    }
};
