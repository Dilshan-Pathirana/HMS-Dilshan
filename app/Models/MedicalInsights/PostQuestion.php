<?php

namespace App\Models\MedicalInsights;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class PostQuestion extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $table = 'post_questions';

    protected $fillable = [
        'post_id',
        'patient_id',
        'question',
        'answer',
        'answered_by',
        'answered_at',
        'status',
        'moderated_by',
        'moderated_at',
        'moderation_reason',
    ];

    protected $casts = [
        'answered_at' => 'datetime',
        'moderated_at' => 'datetime',
    ];

    // ============================================
    // Relationships
    // ============================================

    public function post()
    {
        return $this->belongsTo(MedicalPost::class, 'post_id');
    }

    public function patient()
    {
        return $this->belongsTo(\App\Models\AllUsers\User::class, 'patient_id');
    }

    public function answeredBy()
    {
        return $this->belongsTo(\App\Models\AllUsers\User::class, 'answered_by');
    }

    public function moderator()
    {
        return $this->belongsTo(\App\Models\AllUsers\User::class, 'moderated_by');
    }

    // ============================================
    // Scopes
    // ============================================

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeAnswered($query)
    {
        return $query->where('status', 'answered');
    }

    public function scopeVisible($query)
    {
        return $query->whereIn('status', ['pending', 'answered']);
    }
}
