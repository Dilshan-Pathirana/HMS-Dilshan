<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use App\Mail\PurchaseRequestNotification;
use App\Models\PurchaseRequest;
use App\Models\Pharmacy\Supplier;

class SendPurchaseRequestEmail implements ShouldQueue
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
                Log::error("Supplier not found for PR email", [
                    'pr_number' => $this->purchaseRequest->pr_number,
                    'supplier_id' => $this->supplierId
                ]);
                return;
            }

            // Check if supplier has email
            $supplierEmail = $supplier->email ?? $supplier->supplier_email ?? null;
            
            if (!$supplierEmail) {
                Log::warning("Supplier has no email address", [
                    'pr_number' => $this->purchaseRequest->pr_number,
                    'supplier_id' => $supplier->id,
                    'supplier_name' => $supplier->supplier_name
                ]);
                return;
            }

            // Send email
            Mail::to($supplierEmail)->send(new PurchaseRequestNotification($this->purchaseRequest, $supplier));

            // Log success
            Log::info("Purchase Request email sent successfully", [
                'pr_number' => $this->purchaseRequest->pr_number,
                'supplier_email' => $supplierEmail,
                'supplier_name' => $supplier->supplier_name
            ]);

        } catch (\Exception $e) {
            Log::error("Failed to send Purchase Request email", [
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
        Log::critical("Purchase Request email failed after all retries", [
            'pr_number' => $this->purchaseRequest->pr_number,
            'supplier_id' => $this->supplierId,
            'error' => $exception->getMessage(),
            'attempts' => $this->attempts()
        ]);

        // TODO: Send alert to admin (implement notification system)
        // Notification::route('mail', config('mail.admin_email'))
        //     ->notify(new PurchaseRequestEmailFailedNotification($this->purchaseRequest, $exception));
    }
}
