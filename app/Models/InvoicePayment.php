<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class InvoicePayment extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $fillable = [
        'payment_reference',
        'invoice_id',
        'branch_id',
        'payment_date',
        'payment_amount',
        'payment_method',
        'transaction_reference',
        'cheque_number',
        'cheque_date',
        'bank_name',
        'processed_by',
        'remarks',
    ];

    protected $casts = [
        'payment_date' => 'date',
        'cheque_date' => 'date',
        'payment_amount' => 'decimal:2',
    ];

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(SupplierInvoice::class, 'invoice_id');
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function processor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'processed_by');
    }

    public static function generatePaymentReference(): string
    {
        $date = now()->format('ymd');
        $latest = self::where('payment_reference', 'like', "PAY-{$date}-%")->latest('created_at')->first();
        
        if ($latest) {
            $lastNumber = (int) substr($latest->payment_reference, -4);
            $newNumber = str_pad($lastNumber + 1, 4, '0', STR_PAD_LEFT);
        } else {
            $newNumber = '0001';
        }
        
        return "PAY-{$date}-{$newNumber}";
    }
}
