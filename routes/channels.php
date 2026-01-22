<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('vivd-firefly-891', function ($user) {
    return $user->auth()->check();
});
