<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('blacklisted_tokens', function (Blueprint $table) {
            $table->id();
            $table->string('token_hash', 64)->unique(); // SHA256 hash of JWT
            $table->timestamp('expires_at');
            $table->timestamp('created_at');

            $table->index('token_hash');
            $table->index('expires_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('blacklisted_tokens');
    }
};
