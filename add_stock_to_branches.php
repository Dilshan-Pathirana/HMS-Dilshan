<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

echo "=== Adding sample stock to all branches ===\n\n";

// Get all branches
$branches = DB::table('branches')->select('id', 'center_name')->get();
echo "Branches:\n";
foreach ($branches as $branch) {
    echo "- " . $branch->center_name . " (" . $branch->id . ")\n";
}

// Get all products
$products = DB::table('products')->select('id', 'item_name', 'item_code')->get();
echo "\nProducts:\n";
foreach ($products as $product) {
    echo "- " . $product->item_name . " (" . $product->item_code . ")\n";
}

// For each branch (except the first which already has stock), create stock entries
$firstBranchId = $branches[0]->id;

foreach ($branches as $index => $branch) {
    if ($index === 0) {
        echo "\nSkipping " . $branch->center_name . " (already has stock)\n";
        continue;
    }
    
    echo "\nAdding stock to: " . $branch->center_name . "\n";
    
    foreach ($products as $productIndex => $product) {
        // Check if stock already exists for this product/branch
        $exists = DB::table('products_stock')
            ->where('product_id', $product->id)
            ->where('branch_id', $branch->id)
            ->exists();
        
        if ($exists) {
            echo "  - " . $product->item_name . ": Already exists\n";
            continue;
        }
        
        // Create varied stock levels for each branch
        $stockMultiplier = $index + 1; // Different stock for each branch
        $baseStock = 50 + ($productIndex * 20);
        $currentStock = $baseStock * $stockMultiplier;
        $unitCost = 100 + ($productIndex * 50);
        $sellingPrice = $unitCost * 1.3; // 30% markup
        
        DB::table('products_stock')->insert([
            'id' => \Illuminate\Support\Str::uuid()->toString(),
            'product_id' => $product->id,
            'branch_id' => $branch->id,
            'unit' => 'pcs',
            'current_stock' => $currentStock,
            'min_stock' => 10,
            'reorder_level' => 20,
            'reorder_quantity' => 50,
            'unit_cost' => $unitCost,
            'unit_selling_price' => $sellingPrice,
            'expiry_date' => date('Y-m-d', strtotime('+1 year')),
            'entry_date' => date('Y-m-d'),
            'stock_status' => 'available',
            'stock_update_date' => now(),
            'damaged_stock' => 0,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        
        echo "  - " . $product->item_name . ": " . $currentStock . " units @ Rs." . $sellingPrice . "\n";
    }
}

echo "\n=== Verification: Stock by Branch ===\n";
$stockByBranch = DB::table('products_stock')
    ->join('branches', 'products_stock.branch_id', '=', 'branches.id')
    ->select('branches.center_name', DB::raw('count(*) as product_count'), DB::raw('SUM(current_stock) as total_stock'))
    ->groupBy('branches.center_name', 'products_stock.branch_id')
    ->get();

foreach ($stockByBranch as $stock) {
    echo $stock->center_name . ": " . $stock->product_count . " products, " . $stock->total_stock . " total units\n";
}

echo "\nDone! Each branch now has different stock levels.\n";
