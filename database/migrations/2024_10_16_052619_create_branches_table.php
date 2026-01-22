<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('branches', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('center_name');
            $table->string('register_number')->nullable();
            $table->string('register_document')->nullable();
            $table->string('center_type')->nullable();
            $table->string('owner_type')->nullable();
            $table->string('owner_full_name')->nullable();
            $table->string('owner_id_number')->nullable();
            $table->string('owner_contact_number')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('branches');
    }
};
