<?php

namespace App\Models\Pharmacy;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Warranty extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'warranty';

    public $incrementing = false;
    protected $fillable = [
        'product_id',
        'supplier_id',
        'warranty_serial',
        'warranty_duration',
        'warranty_start_date',
        'warranty_end_date',
        'warranty_type',
    ];
}
