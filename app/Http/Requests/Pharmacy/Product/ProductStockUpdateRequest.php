<?php

namespace App\Http\Requests\Pharmacy\Product;

use Illuminate\Foundation\Http\FormRequest;

class ProductStockUpdateRequest extends FormRequest
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
            'product_id' => ['required', 'exists:products,id'],
            'new_added_stock' => ['required', 'min:1'],
            'new_selling_unit_price' => ['nullable', 'min:1'],
            'new_expiry_date' => ['nullable', 'min:1'],
            'new_entry_date' => ['nullable', 'min:1'],
        ];
    }
}
