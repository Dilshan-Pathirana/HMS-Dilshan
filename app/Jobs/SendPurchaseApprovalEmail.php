<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use App\Mail\PurchaseRequestApproved;
use App\Models\PurchaseRequest;
use App\Models\Pharmacy\Supplier;

class SendPurchaseApprovalEmail implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $purchaseRequest;
    public $supplierId;
    
    /**
     * The number of times the job may be attempted.
     *
     * @var int
     */
    public $tries = 3;

    /**
     * The number of seconds to wait before retrying the job.
     *
     * @var int
     */
    public $backoff = 60; // Retry after 60 seconds

    /**
     * Delete the job if its models no longer exist.
     *
     * @var bool
     */
    public $deleteWhenMissingModels = true;

    /**
     * Create a new job instance.
     *
     * @param PurchaseRequest $purchaseRequest
     * @param string $supplierId
     * @return void
     */
    public function __construct(PurchaseRequest $purchaseRequest, $supplierId)
    {
        $this->purchaseRequest = $purchaseRequest;
        $this->supplierId = $supplierId;
    }

    /**
     * Execute the job.
     *
     * @return void
     */
    public function handle()
    {
        try {
            // Fetch supplier
            $supplier = Supplier::find($this->supplierId);
            
            if (!$supplier) {
                Log::error("Supplier not found for PR approval email", [
                    'pr_number' => $this->purchaseRequest->pr_number,
                    'supplier_id' => $this->supplierId
                ]);
                return;
            }

            // Get supplier email - check multiple possible fields
            $supplierEmail = $supplier->contact_email ?? $supplier->email ?? $supplier->supplier_email ?? null;
            
            if (!$supplierEmail) {
                Log::warning("Supplier has no email address for approval notification", [
                    'pr_number' => $this->purchaseRequest->pr_number,
                    'supplier_id' => $supplier->id,
                    'supplier_name' => $supplier->supplier_name
                ]);
                return;
            }

            // Load the purchase request with relationships for the email
            $this->purchaseRequest->load(['branch', 'approver', 'items.product']);

            // Get items for this specific supplier
            $supplierItems = $this->purchaseRequest->items->where('supplier_id', $this->supplierId);

            // Send email
            Mail::to($supplierEmail)->send(new PurchaseRequestApproved(
                $this->purchaseRequest, 
                $supplier, 
                $supplierItems
            ));

            // Log success
            Log::info("Purchase Request approval email sent successfully", [
                'pr_number' => $this->purchaseRequest->pr_number,
                'supplier_email' => $supplierEmail,
                'supplier_name' => $supplier->supplier_name,
                'items_count' => $supplierItems->count()
            ]);

        } catch (\Exception $e) {
            Log::error("Failed to send Purchase Request approval email", [
                'pr_number' => $this->purchaseRequest->pr_number,
                'supplier_id' => $this->supplierId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            // Re-throw to trigger retry
            throw $e;
        }
    }

    /**
     * Handle a job failure.
     *
     * @param  \Throwable  $exception
     * @return void
     */
    public function failed(\Throwable $exception)
    {
        // Log final failure after all retries
        Log::critical("Purchase Request approval email failed after all retries", [
            'pr_number' => $this->purchaseRequest->pr_number,
            'supplier_id' => $this->supplierId,
            'error' => $exception->getMessage(),
            'attempts' => $this->attempts()
        ]);
    }
}
