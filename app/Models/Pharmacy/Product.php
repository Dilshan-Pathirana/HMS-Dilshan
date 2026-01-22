<?php

namespace App\Models\Pharmacy;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Product extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'products';

    public $incrementing = false;

    protected $fillable = [
        'supplier_id',
        'item_code',
        'barcode',
        'item_name',
        'generic_name',
        'brand_name',
        'category',
    ];
}
