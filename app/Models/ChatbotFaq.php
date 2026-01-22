<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class ChatbotFaq extends Model
{
    use HasUuids;

    protected $table = 'chatbot_faqs';

    protected $fillable = [
        'category',
        'question_en',
        'answer_en',
        'question_si',
        'answer_si',
        'keywords',
        'is_active',
        'priority',
        'created_by',
    ];

    protected $casts = [
        'keywords' => 'array',
        'is_active' => 'boolean',
        'priority' => 'integer',
    ];

    /**
     * Get question in specified language with fallback
     */
    public function getQuestion(string $lang = 'en'): string
    {
        $field = "question_{$lang}";
        return $this->$field ?? $this->question_en;
    }

    /**
     * Get answer in specified language with fallback
     */
    public function getAnswer(string $lang = 'en'): string
    {
        $field = "answer_{$lang}";
        return $this->$field ?? $this->answer_en;
    }

    /**
     * Scope to get only active FAQs
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope to filter by category
     */
    public function scopeCategory($query, $category)
    {
        return $query->where('category', $category);
    }
}
