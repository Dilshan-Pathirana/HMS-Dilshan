<?php

namespace App\Models\MedicalInsights;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class PostComment extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $table = 'post_comments';

    protected $fillable = [
        'post_id',
        'user_id',
        'parent_id',
        'content',
        'status',
        'moderated_by',
        'moderated_at',
        'moderation_reason',
    ];

    protected $casts = [
        'moderated_at' => 'datetime',
    ];

    // ============================================
    // Relationships
    // ============================================

    public function post()
    {
        return $this->belongsTo(MedicalPost::class, 'post_id');
    }

    public function user()
    {
        return $this->belongsTo(\App\Models\AllUsers\User::class, 'user_id');
    }

    public function parent()
    {
        return $this->belongsTo(PostComment::class, 'parent_id');
    }

    public function replies()
    {
        return $this->hasMany(PostComment::class, 'parent_id');
    }

    public function visibleReplies()
    {
        return $this->hasMany(PostComment::class, 'parent_id')->where('status', 'visible');
    }

    public function moderator()
    {
        return $this->belongsTo(\App\Models\AllUsers\User::class, 'moderated_by');
    }

    // ============================================
    // Scopes
    // ============================================

    public function scopeVisible($query)
    {
        return $query->where('status', 'visible');
    }

    public function scopeTopLevel($query)
    {
        return $query->whereNull('parent_id');
    }
}
