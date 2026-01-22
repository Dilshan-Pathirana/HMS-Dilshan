<?php

namespace App\Models;

use App\Models\AllUsers\User;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserResignation extends Model
{
    use HasUuids;

    protected $fillable = [
        'user_id',
        'resignation_date',
        'last_working_date',
        'reason',
        'reason_details',
        'final_salary',
        'pending_leaves_payment',
        'deductions',
        'total_final_pay',
        'status',
        'processed_by',
        'notes',
    ];

    protected $casts = [
        'resignation_date' => 'date',
        'last_working_date' => 'date',
        'final_salary' => 'decimal:2',
        'pending_leaves_payment' => 'decimal:2',
        'deductions' => 'decimal:2',
        'total_final_pay' => 'decimal:2',
    ];

    public const REASONS = [
        'personal_reasons' => 'Personal Reasons',
        'better_opportunity' => 'Better Job Opportunity',
        'relocation' => 'Relocation',
        'health_issues' => 'Health Issues',
        'family_reasons' => 'Family Reasons',
        'career_change' => 'Career Change',
        'retirement' => 'Retirement',
        'termination' => 'Termination by Employer',
        'contract_end' => 'Contract End',
        'misconduct' => 'Misconduct',
        'performance_issues' => 'Performance Issues',
        'other' => 'Other',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function processedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'processed_by');
    }
}
