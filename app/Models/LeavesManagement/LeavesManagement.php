<?php

namespace App\Models\LeavesManagement;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class LeavesManagement extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'leaves_management';

    public $incrementing = false;

    protected $fillable = [
        'user_id',
        'leaves_start_date',
        'leaves_end_date',
        'reason',
        'status',
        'assigner',
        'approval_date',
        'comments',
        'leaves_days',
    ];
}
