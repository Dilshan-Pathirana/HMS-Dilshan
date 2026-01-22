<?php

namespace App\Services\Branch;

use App\Models\Hospital\Branch;

class CheckBranchExisting
{
    public static function check(string $branchId)
    {
        return Branch::where('id', $branchId)->exists();
    }
}
