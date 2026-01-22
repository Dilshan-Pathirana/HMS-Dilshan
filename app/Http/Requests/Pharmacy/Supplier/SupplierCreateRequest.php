<?php

namespace App\Http\Requests\Pharmacy\Supplier;

use Illuminate\Foundation\Http\FormRequest;

class SupplierCreateRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'supplier_name' => 'required|string|max:255',
            'contact_person' => 'nullable|string|max:255',
            'contact_number' => 'nullable|string|max:15',
            'contact_email' => 'nullable|email|max:255',
            'supplier_address' => 'nullable|string|max:255',
            'supplier_city' => 'nullable|string|max:100',
            'supplier_country' => 'nullable|string|max:100',
            'supplier_type' => 'nullable|string|max:50',
            'products_supplied' => 'nullable|string|max:255',
            'rating' => 'nullable|string|max:255',
            'discounts_agreements' => 'nullable|string|max:255',
            'return_policy' => 'nullable|string|max:255',
            'delivery_time' => 'nullable|string|max:50',
            'payment_terms' => 'nullable|string|max:255',
            'bank_details' => 'nullable|string|max:255',
            'note' => 'nullable|string|max:500',
        ];
    }
}
