<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

echo "=== Updating branch_id for seeded users ===\n\n";

// Get all branches
$branches = DB::table('branches')->get(['id', 'center_name']);
echo "Branches found:\n";
foreach ($branches as $branch) {
    echo "  ID: $branch->id, Name: $branch->center_name\n";
}

// Map branch numbers to branch IDs
$branchMap = [];
$branchNum = 1;
foreach ($branches as $branch) {
    $branchMap[$branchNum] = $branch->id;
    $branchNum++;
}

echo "\n=== Updating users based on email pattern ===\n";

// Update users with .branch1, .branch2, .branch3 in their email
$patterns = [
    '.branch1@' => $branchMap[1] ?? null,
    '.branch2@' => $branchMap[2] ?? null,
    '.branch3@' => $branchMap[3] ?? null,
];

$totalUpdated = 0;
foreach ($patterns as $pattern => $branchId) {
    if (!$branchId) continue;
    
    $updated = DB::table('users')
        ->where('email', 'like', "%$pattern%")
        ->whereNull('branch_id')
        ->update(['branch_id' => $branchId]);
    
    echo "Updated $updated users with pattern '$pattern' to branch $branchId\n";
    $totalUpdated += $updated;
}

echo "\nTotal users updated: $totalUpdated\n";

// Verify the result
echo "\n=== Users with branch_id after update ===\n";
$usersWithBranches = DB::table('users')
    ->whereNotNull('branch_id')
    ->where('branch_id', '!=', '')
    ->orderBy('branch_id')
    ->get(['email', 'role_as', 'branch_id']);

$count = 0;
foreach ($usersWithBranches as $u) {
    echo "  [$u->role_as] $u->email\n";
    $count++;
}
echo "\nTotal users with branch_id: $count\n";

echo "\nDone!\n";
