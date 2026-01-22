<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SessionMedia extends Model
{
    use HasFactory;

    protected $fillable = [
        'session_id',
        'file_type',
        'file_url',
        'file_name',
        'file_size',
        'description',
        'uploaded_by',
        'upload_date',
    ];

    protected $casts = [
        'file_size' => 'integer',
        'upload_date' => 'datetime',
    ];

    /**
     * Get the session
     */
    public function session()
    {
        return $this->belongsTo(Session::class, 'session_id');
    }

    /**
     * Get the user who uploaded
     */
    public function uploader()
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    /**
     * Get file size in human readable format
     */
    public function getFileSizeHumanAttribute()
    {
        if (!$this->file_size) {
            return null;
        }

        $units = ['KB', 'MB', 'GB'];
        $size = $this->file_size;
        $unit = 0;

        while ($size >= 1024 && $unit < count($units) - 1) {
            $size /= 1024;
            $unit++;
        }

        return round($size, 2) . ' ' . $units[$unit];
    }
}
