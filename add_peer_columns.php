<?php

require_once __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

// Check current columns
echo "Checking schedule_change_requests table...\n";
$columns = DB::select("PRAGMA table_info(schedule_change_requests)");

$existingColumns = [];
foreach ($columns as $col) {
    $existingColumns[] = $col->name;
    echo "  - {$col->name} ({$col->type})\n";
}

// Add missing columns for peer approval
$requiredColumns = [
    'peer_status' => "VARCHAR DEFAULT 'pending'",
    'peer_responded_at' => "DATETIME",
    'peer_rejection_reason' => "TEXT",
    'interchange_shift_date' => "DATE",
    'interchange_shift_type' => "VARCHAR"
];

echo "\nAdding missing columns...\n";
foreach ($requiredColumns as $colName => $colType) {
    if (!in_array($colName, $existingColumns)) {
        try {
            DB::statement("ALTER TABLE schedule_change_requests ADD COLUMN {$colName} {$colType}");
            echo "  Added: {$colName}\n";
        } catch (\Exception $e) {
            echo "  Error adding {$colName}: " . $e->getMessage() . "\n";
        }
    } else {
        echo "  Already exists: {$colName}\n";
    }
}

echo "\nDone!\n";
