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
        Schema::table('products_stock', function (Blueprint $table) {
            $table->string('branch_id')->nullable()->after('product_id');
            $table->foreign('branch_id')->references('id')->on('branches')->onDelete('set null');
            
            // Add index for faster branch-specific queries
            $table->index(['product_id', 'branch_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products_stock', function (Blueprint $table) {
            $table->dropForeign(['branch_id']);
            $table->dropIndex(['product_id', 'branch_id']);
            $table->dropColumn('branch_id');
        });
    }
};
