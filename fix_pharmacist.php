<?php
require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== Fixing Pharmacist Users ===\n\n";

// Fix all pharmacists
$pharmacists = \DB::table('users')->where('email', 'LIKE', 'pharmacist%')->get();

foreach ($pharmacists as $p) {
    // Construct name from first_name and last_name if name is empty
    $name = $p->first_name . ' ' . $p->last_name;
    
    \DB::table('users')
        ->where('id', $p->id)
        ->update([
            'name' => trim($name) ?: 'Pharmacist',
        ]);
    
    echo "Fixed: " . $p->email . " -> name: " . trim($name) . "\n";
}

echo "\n=== Verifying Pharmacist Users ===\n";
$pharmacists = \DB::table('users')->where('email', 'LIKE', 'pharmacist%')->get();
foreach ($pharmacists as $p) {
    echo "- " . $p->email . "\n";
    echo "  Name: " . ($p->name ?: $p->first_name . ' ' . $p->last_name) . "\n";
    echo "  Role: " . $p->role_as . "\n";
    echo "  Active: " . ($p->is_active ? 'Yes' : 'No') . "\n";
    echo "  Branch: " . $p->branch_id . "\n\n";
}

echo "Done!\n";
