<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
use App\Models\PurchaseRequest;
use App\Models\Supplier;

class PurchaseRequestNotification extends Mailable
{
    use Queueable, SerializesModels;

    public $purchaseRequest;
    public $supplier;
    public $items;
    public $hospitalName;

    /**
     * Create a new message instance.
     *
     * @return void
     */
    public function __construct(PurchaseRequest $purchaseRequest, Supplier $supplier)
    {
        $this->purchaseRequest = $purchaseRequest;
        $this->supplier = $supplier;
        $this->items = $purchaseRequest->items()->with('product')->get();
        $this->hospitalName = config('app.name', 'Hospital Management System');
    }

    /**
     * Build the message.
     *
     * @return $this
     */
    public function build()
    {
        return $this->subject("New Purchase Request - {$this->purchaseRequest->pr_number}")
                    ->view('emails.purchase-request-notification')
                    ->with([
                        'prNumber' => $this->purchaseRequest->pr_number,
                        'priority' => $this->purchaseRequest->priority,
                        'supplierName' => $this->supplier->supplier_name,
                        'items' => $this->items,
                        'totalEstimatedCost' => $this->purchaseRequest->total_estimated_cost,
                        'hospitalName' => $this->hospitalName,
                        'branchName' => $this->purchaseRequest->branch->branch_name ?? 'Main Branch',
                        'contactEmail' => $this->purchaseRequest->branch->email ?? config('mail.from.address'),
                        'contactPhone' => $this->purchaseRequest->branch->contact_number ?? 'N/A',
                        'remarks' => $this->purchaseRequest->general_remarks,
                        'createdDate' => $this->purchaseRequest->created_at->format('Y-m-d H:i:s'),
                    ]);
    }
}
