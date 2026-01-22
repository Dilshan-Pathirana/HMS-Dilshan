<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Branch extends Model
{
    use HasUuids;

    public $incrementing = false;
    protected $keyType = 'string';

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

    /**
     * Get all pharmacies for this branch
     */
    public function pharmacies(): HasMany
    {
        return $this->hasMany(Pharmacy::class);
    }

    /**
     * Get all active pharmacies for this branch
     */
    public function activePharmacies(): HasMany
    {
        return $this->hasMany(Pharmacy::class)->where('is_active', true);
    }

    /**
     * Get all user assignments for this branch
     */
    public function userAssignments(): HasMany
    {
        return $this->hasMany(BranchUserAssignment::class);
    }

    /**
     * Get active user assignments for this branch
     */
    public function activeUserAssignments(): HasMany
    {
        return $this->hasMany(BranchUserAssignment::class)->where('is_active', true);
    }

    /**
     * Get users assigned to this branch with a specific role
     */
    public function usersByRole(string $role)
    {
        return $this->userAssignments()
            ->where('role', $role)
            ->where('is_active', true)
            ->with('user');
    }

    /**
     * Get all doctors assigned to this branch
     */
    public function doctors()
    {
        return $this->usersByRole('doctor');
    }

    /**
     * Get all nurses assigned to this branch
     */
    public function nurses()
    {
        return $this->usersByRole('nurse');
    }

    /**
     * Get all pharmacists assigned to this branch
     */
    public function pharmacists()
    {
        return $this->usersByRole('pharmacist');
    }

    /**
     * Get the branch admin
     */
    public function branchAdmin()
    {
        return $this->usersByRole('branch_admin')->first();
    }
}
