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
        Schema::create('purchase_requests', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('pr_number')->unique(); // PR-YYMMDD-0001
            $table->uuid('branch_id');
            $table->unsignedBigInteger('pharmacy_id')->nullable();
            $table->uuid('created_by'); // pharmacist user id
            $table->enum('priority', ['Normal', 'Urgent', 'Emergency'])->default('Normal');
            $table->enum('status', ['Draft', 'Pending', 'Approved', 'Rejected', 'Converted'])->default('Draft');
            $table->text('general_remarks')->nullable();
            $table->decimal('total_estimated_cost', 15, 2)->default(0);
            $table->integer('total_items')->default(0);
            $table->uuid('approved_by')->nullable(); // branch admin user id
            $table->text('approval_remarks')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->uuid('rejected_by')->nullable();
            $table->text('rejection_reason')->nullable();
            $table->timestamp('rejected_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('branch_id')->references('id')->on('branches')->onDelete('cascade');
            $table->foreign('created_by')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('approved_by')->references('id')->on('users')->onDelete('set null');
            $table->foreign('rejected_by')->references('id')->on('users')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('purchase_requests');
    }
};
