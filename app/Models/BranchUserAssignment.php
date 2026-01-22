<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\AllUsers\User;

class BranchUserAssignment extends Model
{
    protected $fillable = [
        'user_id',
        'branch_id',
        'role',
        'is_primary_branch',
        'assigned_date',
        'end_date',
        'is_active',
    ];

    protected $casts = [
        'is_primary_branch' => 'boolean',
        'is_active' => 'boolean',
        'assigned_date' => 'date',
        'end_date' => 'date',
    ];

    /**
     * Get the user for this assignment
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the branch for this assignment
     */
    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    /**
     * Check if assignment is currently active
     */
    public function isCurrentlyActive(): bool
    {
        if (!$this->is_active) {
            return false;
        }

        if ($this->end_date && $this->end_date < now()) {
            return false;
        }

        return true;
    }
}
