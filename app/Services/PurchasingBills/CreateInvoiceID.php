<?php

namespace App\Services\PurchasingBills;

class CreateInvoiceID
{
    public static function execute(): string
    {
        return now()->format('ymd').rand(10000, 99999);
    }
}
