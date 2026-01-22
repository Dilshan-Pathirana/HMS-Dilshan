<?php

namespace App\Models\Purchasing;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class DailyPurchaseProduct extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'daily_purchase_products';

    public $incrementing = false;

    protected $fillable = [
        'id',
        'product_id',
        'bill_id',
        'qty',
        'discount_amount',
        'price',
    ];
}
