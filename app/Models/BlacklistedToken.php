<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BlacklistedToken extends Model
{
    use HasFactory;

    const UPDATED_AT = null; // Only has created_at

    protected $fillable = [
        'token_hash',
        'expires_at',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'created_at' => 'datetime',
    ];

    /**
     * Check if token is expired
     */
    public function isExpired()
    {
        return $this->expires_at->isPast();
    }

    /**
     * Scope to get active blacklisted tokens
     */
    public function scopeActive($query)
    {
        return $query->where('expires_at', '>', now());
    }

    /**
     * Scope to get expired tokens for cleanup
     */
    public function scopeExpired($query)
    {
        return $query->where('expires_at', '<=', now());
    }

    /**
     * Static method to check if token is blacklisted
     */
    public static function isBlacklisted($tokenHash)
    {
        return static::where('token_hash', $tokenHash)
                     ->where('expires_at', '>', now())
                     ->exists();
    }
}
