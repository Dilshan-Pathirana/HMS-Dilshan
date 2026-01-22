<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Feedback extends Model
{
    protected $table = 'feedbacks';

    protected $fillable = [
        'uuid',
        'user_id',
        'user_type',
        'user_name',
        'branch_id',
        'branch_name',
        'doctor_id',
        'doctor_name',
        'category',
        'subject',
        'description',
        'rating',
        'experience',
        'priority',
        'status',
        'admin_response',
        'responded_by',
        'responded_by_name',
        'responded_at',
        'internal_notes',
        'is_anonymous',
        'is_flagged',
        'flag_reason',
    ];

    protected $casts = [
        'responded_at' => 'datetime',
        'is_anonymous' => 'boolean',
        'is_flagged' => 'boolean',
        'rating' => 'integer',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($feedback) {
            if (empty($feedback->uuid)) {
                $feedback->uuid = (string) Str::uuid();
            }
        });
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function doctor()
    {
        return $this->belongsTo(User::class, 'doctor_id');
    }

    public function responder()
    {
        return $this->belongsTo(User::class, 'responded_by');
    }
}
