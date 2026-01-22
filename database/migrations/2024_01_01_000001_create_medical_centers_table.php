<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('medical_centers', function (Blueprint $table) {
            $table->id();
            $table->string('center_name', 100);
            $table->string('center_code', 20)->unique();
            $table->text('address');
            $table->string('city', 50);
            $table->string('state', 50)->nullable();
            $table->string('zip_code', 10)->nullable();
            $table->string('phone_number', 20);
            $table->string('email', 100);
            $table->string('license_number', 50)->nullable();
            $table->text('operating_hours')->nullable(); // JSON format
            $table->decimal('latitude', 10, 8)->nullable();
            $table->decimal('longitude', 11, 8)->nullable();
            $table->unsignedBigInteger('tenant_admin_id')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->index('is_active');
            $table->index('city');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('medical_centers');
    }
};
