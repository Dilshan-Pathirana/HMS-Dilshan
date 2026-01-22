<?php

namespace App\Models\PatientSession;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class MainQuestions extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'main_question';

    public $incrementing = false;

    protected $fillable = [
        'doctor_id',
        'question',
        'description',
        'order',
        'status',
    ];
}
