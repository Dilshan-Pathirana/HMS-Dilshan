<?php

namespace App\Models\HRM;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\AllUsers\User;

class EPFETFRateHistory extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'epf_etf_rate_history';

    protected $fillable = [
        'config_id',
        'old_epf_employee_rate',
        'new_epf_employee_rate',
        'old_epf_employer_rate',
        'new_epf_employer_rate',
        'old_etf_employer_rate',
        'new_etf_employer_rate',
        'effective_from',
        'change_reason',
        'changed_by',
    ];

    protected $casts = [
        'old_epf_employee_rate' => 'decimal:2',
        'new_epf_employee_rate' => 'decimal:2',
        'old_epf_employer_rate' => 'decimal:2',
        'new_epf_employer_rate' => 'decimal:2',
        'old_etf_employer_rate' => 'decimal:2',
        'new_etf_employer_rate' => 'decimal:2',
        'effective_from' => 'date',
    ];

    /**
     * Get config
     */
    public function config()
    {
        return $this->belongsTo(EPFETFConfig::class, 'config_id');
    }

    /**
     * Get user who changed
     */
    public function changedBy()
    {
        return $this->belongsTo(User::class, 'changed_by');
    }
}
