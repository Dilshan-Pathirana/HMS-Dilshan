<?php

namespace App\Models\Pharmacy;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class ProductStock extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'products_stock';

    public $incrementing = false;

    protected $fillable = [
        'product_id',
        'unit',
        'current_stock',
        'min_stock',
        'reorder_level',
        'reorder_quantity',
        'unit_cost',
        'unit_selling_price',
        'expiry_date',
        'entry_date',
        'stock_status',
        'product_store_location',
        'stock_update_date',
        'damaged_stock',
    ];
}
