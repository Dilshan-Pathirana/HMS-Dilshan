<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserRole extends Model
{
    protected $fillable = [
        'role_name',
        'display_name',
        'description',
        'permissions',
        'hierarchy_level',
        'is_active',
    ];

    protected $casts = [
        'permissions' => 'array',
        'is_active' => 'boolean',
    ];

    /**
     * Check if role has a specific permission
     */
    public function hasPermission(string $permission): bool
    {
        if (!$this->permissions) {
            return false;
        }

        // Check for wildcard permission
        if (in_array('*', $this->permissions)) {
            return true;
        }

        // Check for exact permission
        if (in_array($permission, $this->permissions)) {
            return true;
        }

        // Check for wildcard permission patterns (e.g., "branch.*")
        foreach ($this->permissions as $perm) {
            if (str_ends_with($perm, '.*')) {
                $prefix = substr($perm, 0, -2);
                if (str_starts_with($permission, $prefix . '.')) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Check if this role has higher hierarchy than another role
     */
    public function isHigherThan(UserRole $role): bool
    {
        return $this->hierarchy_level < $role->hierarchy_level;
    }
}
