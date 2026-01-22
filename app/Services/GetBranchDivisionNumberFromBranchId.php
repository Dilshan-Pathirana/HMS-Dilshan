<?php

namespace App\Services;

use App\Models\Branch;

class GetBranchDivisionNumberFromBranchId
{
    public static function getBranchDivisionNumber(string $branchId): ?string
    {
        $branch = Branch::find($branchId);

        return $branch?->division_number ?? '';
    }
}
