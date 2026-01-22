<?php

namespace App\Models\Notification;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class NotificationManagement extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'notification_management';

    public $incrementing = false;

    protected $fillable = [
        'user_id',
        'notification_type',
        'notification_message',
        'notification_status',
    ];
}
