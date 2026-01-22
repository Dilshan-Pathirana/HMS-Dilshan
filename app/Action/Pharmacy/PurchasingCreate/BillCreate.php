<?php

namespace App\Action\Pharmacy\PurchasingCreate;

use Illuminate\Support\Str;
use App\Models\Purchasing\DailyBill;
use App\Services\PurchasingBills\CreateInvoiceID;

class BillCreate
{
    public static function execute(array $request): string
    {
        $dailyBill = DailyBill::create([
            'id' => Str::uuid(),
            'invoice_id' => CreateInvoiceID::execute(),
            'user_id' => $request['cashier_id'],
            'customer_id' => $request['customer_id'] ?? null,
            'customer_name' => $request['customer_name'] ?? null,
            'contact_number' => $request['contact_number'] ?? null,
            'discount_amount' => $request['total_discount_amount'],
            'total_amount' => $request['total_amount'],
            'net_total' => $request['net_total'],
            'amount_received' => $request['amount_received'],
            'remain_amount' => $request['remain_amount'],
        ]);

        return $dailyBill->id;
    }
}
