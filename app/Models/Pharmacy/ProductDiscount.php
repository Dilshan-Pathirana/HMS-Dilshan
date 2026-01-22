<?php

namespace App\Models\Pharmacy;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class ProductDiscount extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'product_discount';

    public $timestamps = false;

    protected $fillable = [
        'product_id',
        'discount_type',
        'discount_amount',
        'discount_percentage',
    ];
}
