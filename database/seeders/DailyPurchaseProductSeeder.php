<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Pharmacy\Product;
use App\Models\Purchasing\DailyBill;
use App\Models\Purchasing\DailyPurchaseProduct;

class DailyPurchaseProductSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $productsForBill1 = Product::factory()->withSupplier()->count(4)->create();
        $bill1 = DailyBill::factory()->create();

        $productsForBill1->each(function (Product $product) use ($bill1) {
            DailyPurchaseProduct::factory()->create([
                'product_id' => $product->id,
                'bill_id' => $bill1->id,
            ]);
        });
    }
}
