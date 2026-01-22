<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('mfa_tokens', function (Blueprint $table) {
            $table->id();
            $table->uuid('user_id');
            $table->string('token', 100); // Unique token identifier
            $table->string('code', 10); // OTP code
            $table->timestamp('expires_at');
            $table->timestamp('verified_at')->nullable();
            $table->timestamp('created_at');

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            
            $table->index(['user_id', 'expires_at']);
            $table->index('token');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mfa_tokens');
    }
};
