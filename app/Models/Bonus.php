<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Bonus extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_id',
        'amount',
        'bonus_type',
        'reason',
        'bonus_date',
        'approved_by',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'bonus_date' => 'date',
    ];

    /**
     * Get the employee
     */
    public function employee()
    {
        return $this->belongsTo(User::class, 'employee_id');
    }

    /**
     * Get the approver
     */
    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    /**
     * Scope to get bonuses by type
     */
    public function scopeByType($query, $type)
    {
        return $query->where('bonus_type', $type);
    }

    /**
     * Scope to get bonuses by date range
     */
    public function scopeDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('bonus_date', [$startDate, $endDate]);
    }
}
