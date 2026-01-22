<?php

namespace App\Models\MedicalInsights;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class MedicalPost extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $table = 'medical_posts';

    protected $fillable = [
        'doctor_id',
        'title',
        'slug',
        'category',
        'short_description',
        'content',
        'video_url',
        'video_file_path',
        'pdf_file_path',
        'thumbnail_path',
        'visibility',
        'status',
        'view_count',
        'like_count',
        'comment_count',
        'question_count',
        'moderated_by',
        'moderated_at',
        'moderation_reason',
        'published_at',
    ];

    protected $casts = [
        'published_at' => 'datetime',
        'moderated_at' => 'datetime',
        'view_count' => 'integer',
        'like_count' => 'integer',
        'comment_count' => 'integer',
        'question_count' => 'integer',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($post) {
            if (empty($post->slug)) {
                $post->slug = Str::slug($post->title) . '-' . Str::random(6);
            }
        });
    }

    // ============================================
    // Relationships
    // ============================================

    public function doctor()
    {
        return $this->belongsTo(\App\Models\AllUsers\User::class, 'doctor_id');
    }

    public function moderator()
    {
        return $this->belongsTo(\App\Models\AllUsers\User::class, 'moderated_by');
    }

    public function comments()
    {
        return $this->hasMany(PostComment::class, 'post_id');
    }

    public function visibleComments()
    {
        return $this->hasMany(PostComment::class, 'post_id')->where('status', 'visible');
    }

    public function questions()
    {
        return $this->hasMany(PostQuestion::class, 'post_id');
    }

    public function visibleQuestions()
    {
        return $this->hasMany(PostQuestion::class, 'post_id')->whereIn('status', ['pending', 'answered']);
    }

    public function views()
    {
        return $this->hasMany(PostView::class, 'post_id');
    }

    public function likes()
    {
        return $this->hasMany(PostLike::class, 'post_id');
    }

    public function ratings()
    {
        return $this->hasMany(PostRating::class, 'post_id');
    }

    // ============================================
    // Scopes
    // ============================================

    public function scopePublished($query)
    {
        return $query->where('status', 'published');
    }

    public function scopeByCategory($query, $category)
    {
        return $query->where('category', $category);
    }

    public function scopeByDoctor($query, $doctorId)
    {
        return $query->where('doctor_id', $doctorId);
    }

    public function scopeVisibleTo($query, $user = null)
    {
        if (!$user) {
            return $query->where('visibility', 'public');
        }

        // Patients can see public and patients_only posts
        if ($user->role_as == 5) { // Patient role
            return $query->whereIn('visibility', ['public', 'patients_only', 'logged_in_only']);
        }

        // Logged in users can see all except hidden
        return $query->whereIn('visibility', ['public', 'patients_only', 'logged_in_only']);
    }

    // ============================================
    // Helpers
    // ============================================

    public function incrementViewCount()
    {
        $this->increment('view_count');
    }

    public function incrementLikeCount()
    {
        $this->increment('like_count');
    }

    public function decrementLikeCount()
    {
        $this->decrement('like_count');
    }

    public function updateCommentCount()
    {
        $this->update(['comment_count' => $this->visibleComments()->count()]);
    }

    public function updateQuestionCount()
    {
        $this->update(['question_count' => $this->visibleQuestions()->count()]);
    }

    public function getCategoryLabelAttribute()
    {
        $labels = [
            'success_story' => 'Success Story',
            'medical_finding' => 'Medical Finding',
            'video_vlog' => 'Video Vlog',
            'research_article' => 'Research Article',
        ];
        return $labels[$this->category] ?? $this->category;
    }

    public function getAverageRatingAttribute()
    {
        return $this->ratings()->avg('rating') ?? 0;
    }
}
