<?php

namespace App\Models\Pharmacy;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class ProductEventDetails extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'product_event_details';

    public $incrementing = false;

    protected $fillable = [
        'product_id',
        'user_id',
        'previous_stock',
        'stock_related_to_event',
        'current_stock',
        'event_type',
        'event_reason',
    ];
}
