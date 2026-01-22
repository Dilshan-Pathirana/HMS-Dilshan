<?php

namespace App\Models\AllUsers;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\PersonalAccessToken;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\AllUsers\UserFactory> */
    use HasApiTokens, HasFactory, Notifiable, HasUuids;

    public $incrementing = false;

    public function branch()
    {
        return $this->belongsTo(\App\Models\Branch::class);
    }

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'first_name',
        'last_name',
        'name',
        'username',
        'email',
        'phone',
        'nic',
        'date_of_birth',
        'gender',
        'branch_id',
        'address',
        'user_type',
        'photo',
        'nic_photo',
        'profile_picture',
        'joining_date',
        'basic_salary',
        'role_as',
        'password',
        'is_active',
        // HRM Fields
        'employee_id',
        'employment_type',
        'contract_end_date',
        'confirmation_date',
        'epf_applicable',
        'epf_number',
        'emergency_contact_name',
        'emergency_contact_phone',
        'emergency_contact_relationship',
        'qualifications',
        'certifications',
        'department',
        'designation',
        'weekly_hours',
        'shift_eligible',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'password' => 'hashed',
        ];
    }

    public function personalAccessTokens(): MorphMany
    {
        return $this->morphMany(PersonalAccessToken::class, 'tokenable');
    }

    public function supplier()
    {
        return $this->hasOne(\App\Models\Pharmacy\Supplier::class);
    }

    /**
     * Get the role name based on role_as
     */
    public function getRoleAttribute(): string
    {
        $roles = [
            1 => 'super_admin',
            2 => 'branch_admin',
            3 => 'doctor',
            4 => 'pharmacist',
            5 => 'nurse',
            6 => $this->user_type === 'Receptionist' ? 'receptionist' : 'patient',
            7 => 'cashier',
            8 => 'supplier',
            9 => 'it_support',
            10 => 'center_aid',
            11 => 'auditor',
        ];

        return $roles[$this->role_as] ?? 'unknown';
    }
}
