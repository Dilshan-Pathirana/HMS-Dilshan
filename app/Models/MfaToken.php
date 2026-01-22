<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MfaToken extends Model
{
    use HasFactory;

    const UPDATED_AT = null; // Only has created_at

    protected $fillable = [
        'user_id',
        'token',
        'code',
        'expires_at',
        'verified_at',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'verified_at' => 'datetime',
        'created_at' => 'datetime',
    ];

    protected $hidden = [
        'code',
        'token',
    ];

    /**
     * Get the user
     */
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Check if token is expired
     */
    public function isExpired()
    {
        return $this->expires_at->isPast();
    }

    /**
     * Check if token is verified
     */
    public function isVerified()
    {
        return $this->verified_at !== null;
    }

    /**
     * Mark token as verified
     */
    public function markAsVerified()
    {
        $this->update(['verified_at' => now()]);
    }

    /**
     * Scope to get valid tokens (not expired and not verified)
     */
    public function scopeValid($query)
    {
        return $query->where('expires_at', '>', now())
                     ->whereNull('verified_at');
    }

    /**
     * Scope to get expired tokens
     */
    public function scopeExpired($query)
    {
        return $query->where('expires_at', '<=', now());
    }
}
