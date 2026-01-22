<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
use App\Models\PurchaseRequest;
use App\Models\Pharmacy\Supplier;

class PurchaseRequestApproved extends Mailable
{
    use Queueable, SerializesModels;

    public $purchaseRequest;
    public $supplier;
    public $items;
    public $hospitalName;

    /**
     * Create a new message instance.
     *
     * @param PurchaseRequest $purchaseRequest
     * @param Supplier $supplier
     * @param array $items - The items for this specific supplier
     */
    public function __construct(PurchaseRequest $purchaseRequest, Supplier $supplier, $items = null)
    {
        $this->purchaseRequest = $purchaseRequest;
        $this->supplier = $supplier;
        $this->hospitalName = config('app.name', 'Hospital Management System');
        
        // If items are provided, use them; otherwise, get items for this supplier
        if ($items) {
            $this->items = $items;
        } else {
            $this->items = $purchaseRequest->items()
                ->where('supplier_id', $supplier->id)
                ->with('product')
                ->get();
        }
    }

    /**
     * Build the message.
     *
     * @return $this
     */
    public function build()
    {
        $totalCost = $this->items->sum(function ($item) {
            return $item->requested_quantity * $item->estimated_unit_price;
        });

        return $this->subject("Purchase Order Approved - {$this->purchaseRequest->pr_number}")
                    ->view('emails.purchase-request-approved')
                    ->with([
                        'prNumber' => $this->purchaseRequest->pr_number,
                        'priority' => $this->purchaseRequest->priority,
                        'supplierName' => $this->supplier->supplier_name,
                        'items' => $this->items,
                        'totalEstimatedCost' => $totalCost,
                        'hospitalName' => $this->hospitalName,
                        'branchName' => $this->purchaseRequest->branch->branch_name ?? 'Main Branch',
                        'branchAddress' => $this->purchaseRequest->branch->address ?? 'N/A',
                        'contactEmail' => $this->purchaseRequest->branch->email ?? config('mail.from.address'),
                        'contactPhone' => $this->purchaseRequest->branch->contact_number ?? 'N/A',
                        'approvalRemarks' => $this->purchaseRequest->approval_remarks,
                        'approvedDate' => $this->purchaseRequest->approved_at ? $this->purchaseRequest->approved_at->format('Y-m-d H:i:s') : now()->format('Y-m-d H:i:s'),
                        'approverName' => $this->purchaseRequest->approver ? 
                            ($this->purchaseRequest->approver->first_name . ' ' . $this->purchaseRequest->approver->last_name) : 'Branch Admin',
                    ]);
    }
}
