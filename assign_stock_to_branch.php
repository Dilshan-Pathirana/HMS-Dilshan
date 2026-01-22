<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

echo "=== Assigning existing stock to branches ===\n\n";

// Get all branches
$branches = DB::table('branches')->select('id', 'center_name')->get();
echo "Available branches:\n";
foreach ($branches as $branch) {
    echo "- " . $branch->id . " | " . $branch->center_name . "\n";
}

// Get stock entries without branch_id
$nullStocks = DB::table('products_stock')->whereNull('branch_id')->get();
echo "\nStock entries without branch_id: " . count($nullStocks) . "\n";

if (count($nullStocks) > 0 && count($branches) > 0) {
    $firstBranchId = $branches[0]->id;
    echo "\nAssigning all NULL branch_id stock to: " . $branches[0]->center_name . " (" . $firstBranchId . ")\n";
    
    $updated = DB::table('products_stock')
        ->whereNull('branch_id')
        ->update(['branch_id' => $firstBranchId]);
    
    echo "Updated " . $updated . " stock entries.\n";
    
    // Verify
    echo "\n=== Verification ===\n";
    $stocks = DB::table('products_stock')
        ->select('branch_id', DB::raw('count(*) as count'), DB::raw('SUM(current_stock) as total_stock'))
        ->groupBy('branch_id')
        ->get();
    
    foreach ($stocks as $stock) {
        echo "Branch ID: " . ($stock->branch_id ?? 'NULL') . " | Products: " . $stock->count . " | Total Stock: " . $stock->total_stock . "\n";
    }
}
