<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Pharmacy\Product;
use App\Models\Pharmacy\Warranty;
use Illuminate\Support\Collection;
use App\Models\Pharmacy\ProductStock;

class ProductSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $products = $this->createProducts();

        $this->createProductStockForRelatedProduct($products);
        $this->createProductWarranty($products);
    }

    public function createProducts() : Collection
    {
        return Product::factory()->withSupplier()->count(10)->create();
    }

    public function createProductStockForRelatedProduct(Collection $products): void
    {
        $products->each(function ($product) {
            ProductStock::factory()->create([
                'product_id' => $product->id,
            ]);
        });
    }

    public function createProductWarranty(Collection $products): void
    {
        $products->each(function ($product) {
            Warranty::factory()->create([
                'product_id' => $product->id,
                'supplier_id' => $product->supplier_id,
            ]);
        });
    }
}
