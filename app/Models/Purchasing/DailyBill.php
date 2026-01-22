<?php

namespace App\Models\Purchasing;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class DailyBill extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'daily_bills';

    public $incrementing = false;

    protected $fillable = [
        'id',
        'user_id',
        'customer_id',
        'customer_name',
        'contact_number',
        'invoice_id',
        'discount_amount',
        'total_amount',
        'net_total',
        'amount_received',
        'remain_amount',
    ];
}
