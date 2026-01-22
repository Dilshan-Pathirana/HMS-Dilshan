<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Pharmacy\Product;
use App\Models\Pharmacy\Supplier;
use App\Models\Pharmacy\Warranty;
use App\Models\Pharmacy\ProductStock;

class SupplierProductSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $suppliers = Supplier::factory()->count(5)->create();

        foreach ($suppliers as $supplier) {
            $products = Product::factory()->count(10)->create([
                'supplier_id' => $supplier->id,
            ]);

            foreach ($products as $product) {
                ProductStock::factory()->create([
                    'product_id' => $product->id,
                ]);

                Warranty::factory()->create([
                    'product_id' => $product->id,
                    'supplier_id' => $supplier->id,
                ]);
            }
        }
    }
}
