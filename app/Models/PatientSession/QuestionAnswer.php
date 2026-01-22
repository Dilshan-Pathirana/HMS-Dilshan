<?php

namespace App\Models\PatientSession;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class QuestionAnswer extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'question_answer';

    public $incrementing = false;

    protected $fillable = [
        'question_id',
        'answer',
    ];

    public function question()
    {
        return $this->belongsTo(MainQuestions::class, 'question_id');
    }
}
