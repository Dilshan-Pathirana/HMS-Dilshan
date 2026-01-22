<?php

namespace App\Models\Hospital;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Branch extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'branches';
    public $incrementing = false;

    protected $fillable = [
            'center_name',
            'register_number',
            'register_document',
            'center_type',
            'division',
            'division_number',
            'owner_type',
            'owner_full_name',
            'owner_id_number',
            'owner_contact_number',
    ];
}
