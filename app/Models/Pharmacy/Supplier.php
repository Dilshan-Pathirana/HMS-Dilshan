<?php

namespace App\Models\Pharmacy;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Supplier extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'suppliers';

    protected $fillable = [
        'pharmacy_id',
        'user_id',
        'supplier_name',
        'contact_person',
        'contact_number',
        'contact_email',
        'supplier_address',
        'supplier_city',
        'supplier_country',
        'supplier_type',
        'products_supplied',
        'rating',
        'discounts_agreements',
        'return_policy',
        'delivery_time',
        'payment_terms',
        'bank_details',
        'note',
    ];

    public function pharmacy()
    {
        return $this->belongsTo(\App\Models\Pharmacy::class);
    }

    public function user()
    {
        return $this->belongsTo(\App\Models\AllUsers\User::class);
    }
}
