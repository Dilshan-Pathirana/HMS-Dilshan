<?php

namespace App\Models\MedicalInsights;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PostView extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'post_views';

    protected $fillable = [
        'post_id',
        'user_id',
        'ip_address',
        'user_agent',
    ];

    public function post()
    {
        return $this->belongsTo(MedicalPost::class, 'post_id');
    }

    public function user()
    {
        return $this->belongsTo(\App\Models\AllUsers\User::class, 'user_id');
    }
}

class PostLike extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'post_likes';

    protected $fillable = [
        'post_id',
        'user_id',
    ];

    public function post()
    {
        return $this->belongsTo(MedicalPost::class, 'post_id');
    }

    public function user()
    {
        return $this->belongsTo(\App\Models\AllUsers\User::class, 'user_id');
    }
}

class PostRating extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'post_ratings';

    protected $fillable = [
        'post_id',
        'user_id',
        'rating',
        'feedback',
    ];

    protected $casts = [
        'rating' => 'integer',
    ];

    public function post()
    {
        return $this->belongsTo(MedicalPost::class, 'post_id');
    }

    public function user()
    {
        return $this->belongsTo(\App\Models\AllUsers\User::class, 'user_id');
    }
}

class MedicalInsightsAuditLog extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'medical_insights_audit_logs';

    protected $fillable = [
        'user_id',
        'user_role',
        'action',
        'entity_type',
        'entity_id',
        'old_values',
        'new_values',
        'ip_address',
        'user_agent',
    ];

    protected $casts = [
        'old_values' => 'array',
        'new_values' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(\App\Models\AllUsers\User::class, 'user_id');
    }

    public static function log($user, $action, $entityType, $entityId, $oldValues = null, $newValues = null)
    {
        $roleMap = [
            1 => 'admin',
            2 => 'branch_admin',
            3 => 'cashier',
            4 => 'pharmacist',
            5 => 'patient',
            6 => 'doctor',
            7 => 'nurse',
        ];

        return self::create([
            'user_id' => $user->id,
            'user_role' => $roleMap[$user->role_as] ?? 'unknown',
            'action' => $action,
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);
    }
}
