<?php

namespace App\Models\HRM;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class HRPolicy extends Model
{
    use HasUuids;

    protected $table = 'hr_policies';

    protected $fillable = [
        'branch_id',
        'policy_name',
        'policy_category',
        'description',
        'policy_content',
        'effective_date',
        'expiry_date',
        'status',
        'document_path',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'effective_date' => 'date',
        'expiry_date' => 'date',
    ];

    public function branch()
    {
        return $this->belongsTo(\App\Models\Branch::class, 'branch_id');
    }

    public function creator()
    {
        return $this->belongsTo(\App\Models\AllUsers\User::class, 'created_by');
    }

    public function updater()
    {
        return $this->belongsTo(\App\Models\AllUsers\User::class, 'updated_by');
    }
}
