<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Deduction extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_id',
        'amount',
        'deduction_type',
        'reason',
        'deduction_date',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'deduction_date' => 'date',
    ];

    /**
     * Get the employee
     */
    public function employee()
    {
        return $this->belongsTo(User::class, 'employee_id');
    }

    /**
     * Scope to get deductions by type
     */
    public function scopeByType($query, $type)
    {
        return $query->where('deduction_type', $type);
    }

    /**
     * Scope to get deductions by date range
     */
    public function scopeDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('deduction_date', [$startDate, $endDate]);
    }
}
