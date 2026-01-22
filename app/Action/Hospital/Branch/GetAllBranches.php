<?php

namespace App\Action\Hospital\Branch;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\Response;

class GetAllBranches
{
    public function __invoke(): array
    {
        // Fetch branches from the database
        $branches = DB::table('branches')->select(
            'id',
            'center_name',
            'register_number',
            'register_document',
            'center_type',
            'division',
            'division_number',
            'owner_type',
            'owner_full_name',
            'owner_id_number',
            'owner_contact_number'
        )->get();

        // Modify each branch's register_document to include the full public URL
        $branches = $branches->map(function ($branch) {
            if ($branch->register_document) {
                // Generate full URL for the register_document
                $branch->register_document = Storage::url($branch->register_document);
            }

            return $branch;
        });

        // Storage::url('documents/branches/eOY0k5v9ZqDoMCncYxEi0QDXlX30Zev0w72pLIAn.pdf');

        return [
            'status' => Response::HTTP_OK,
            'branches' => $branches,
        ];
    }
}
