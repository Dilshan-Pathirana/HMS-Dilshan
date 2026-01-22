<?php

use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

// Determine if the application is in maintenance mode...
if (file_exists($maintenance = __DIR__.'/../storage/framework/maintenance.php')) {
    require $maintenance;
}

// Register the Composer autoloader...
require __DIR__.'/../vendor/autoload.php';

// Serve static SPA index for root path to avoid 404 from route setup
$requestUri = $_SERVER['REQUEST_URI'] ?? '/';
if ($requestUri === '/' || $requestUri === '') {
    http_response_code(200);
    echo file_get_contents(__DIR__.'/index.html');
    exit;
}

// Bootstrap Laravel and handle the request...
(require_once __DIR__.'/../bootstrap/app.php')
    ->handleRequest(Request::capture());
