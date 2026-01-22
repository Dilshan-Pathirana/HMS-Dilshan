<?php

namespace App\Action\Pharmacy\Supplier;

use App\Response\CommonResponse;
use App\Models\Pharmacy\Supplier;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\Request;

class GetAllSupplierDetails
{
    public function __invoke(Request $request = null): array
    {
        try {
            $query = Supplier::with('pharmacy')->select(
                'id',
                'pharmacy_id',
                'supplier_name',
                'contact_person',
                'contact_number',
                'contact_email',
                'supplier_address',
                'supplier_city',
                'supplier_country',
                'supplier_type',
                'products_supplied',
            );

            // Apply filters if request is provided
            if ($request) {
                if ($request->has('pharmacy_id') && $request->pharmacy_id !== 'all') {
                    $query->where('pharmacy_id', $request->pharmacy_id);
                }

                if ($request->has('country') && $request->country !== 'all') {
                    $query->where('supplier_country', $request->country);
                }

                if ($request->has('city') && $request->city !== 'all') {
                    $query->where('supplier_city', $request->city);
                }

                if ($request->has('type') && $request->type !== 'all') {
                    $query->where('supplier_type', $request->type);
                }

                if ($request->has('product_type') && $request->product_type !== 'all') {
                    $query->where('products_supplied', 'like', '%' . $request->product_type . '%');
                }

                if ($request->has('search') && $request->search) {
                    $search = $request->search;
                    $query->where(function($q) use ($search) {
                        $q->where('supplier_name', 'like', '%' . $search . '%')
                          ->orWhere('contact_person', 'like', '%' . $search . '%')
                          ->orWhere('contact_email', 'like', '%' . $search . '%');
                    });
                }
            }

            // Check if pagination is requested
            if ($request && $request->has('page')) {
                $perPage = 20;
                $paginated = $query->paginate($perPage);

                $suppliers = $paginated->getCollection()->map(function($supplier) {
                    return [
                        'id' => $supplier->id,
                        'pharmacy_id' => $supplier->pharmacy_id,
                        'pharmacy_name' => $supplier->pharmacy?->name ?? 'N/A',
                        'supplier_name' => $supplier->supplier_name,
                        'contact_person' => $supplier->contact_person,
                        'contact_number' => $supplier->contact_number,
                        'contact_email' => $supplier->contact_email,
                        'supplier_address' => $supplier->supplier_address,
                        'supplier_city' => $supplier->supplier_city,
                        'supplier_country' => $supplier->supplier_country,
                        'supplier_type' => $supplier->supplier_type,
                        'products_supplied' => $supplier->products_supplied,
                    ];
                });

                return [
                    'status' => 200,
                    'suppliers' => $suppliers,
                    'pagination' => [
                        'current_page' => $paginated->currentPage(),
                        'last_page' => $paginated->lastPage(),
                        'per_page' => $paginated->perPage(),
                        'total' => $paginated->total(),
                        'from' => $paginated->firstItem(),
                        'to' => $paginated->lastItem(),
                    ]
                ];
            }

            // Return all without pagination
            $suppliers = $query->get()->map(function($supplier) {
                return [
                    'id' => $supplier->id,
                    'pharmacy_id' => $supplier->pharmacy_id,
                    'pharmacy_name' => $supplier->pharmacy?->name ?? 'N/A',
                    'supplier_name' => $supplier->supplier_name,
                    'contact_person' => $supplier->contact_person,
                    'contact_number' => $supplier->contact_number,
                    'contact_email' => $supplier->contact_email,
                    'supplier_address' => $supplier->supplier_address,
                    'supplier_city' => $supplier->supplier_city,
                    'supplier_country' => $supplier->supplier_country,
                    'supplier_type' => $supplier->supplier_type,
                    'products_supplied' => $supplier->products_supplied,
                ];
            });

            return CommonResponse::sendSuccessResponseWithData('suppliers', $suppliers);
        } catch (\Exception $exception) {
            Log::error('Failed to fetch suppliers: '.$exception->getMessage());

            return CommonResponse::sendBadResponse();
        }
    }
}
