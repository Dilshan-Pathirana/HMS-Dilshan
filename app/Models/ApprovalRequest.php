<?php

namespace App\Models;

use App\Models\AllUsers\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ApprovalRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'requested_by',
        'action',
        'entity_type',
        'request_data',
        'reason',
        'status',
        'approved_by',
        'approval_notes',
        'requested_at',
        'approved_at',
    ];

    protected $casts = [
        'request_data' => 'array',
        'requested_at' => 'datetime',
        'approved_at' => 'datetime',
    ];

    /**
     * Get the user who requested
     */
    public function requester()
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    /**
     * Get the user who approved/rejected
     */
    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    /**
     * Check if approved
     */
    public function isApproved()
    {
        return $this->status === 'approved';
    }

    /**
     * Check if rejected
     */
    public function isRejected()
    {
        return $this->status === 'rejected';
    }

    /**
     * Check if pending
     */
    public function isPending()
    {
        return $this->status === 'pending';
    }

    /**
     * Scope to get pending requests
     */
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    /**
     * Scope to get approved requests
     */
    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    /**
     * Scope to get rejected requests
     */
    public function scopeRejected($query)
    {
        return $query->where('status', 'rejected');
    }
}
