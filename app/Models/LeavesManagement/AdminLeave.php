<?php

namespace App\Models\LeavesManagement;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class AdminLeave extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'admin_leave_management';

    public $incrementing = false;

    protected $fillable = [
        'leave_id',
        'status',
        'comments',
        'admin_access',
    ];
}
