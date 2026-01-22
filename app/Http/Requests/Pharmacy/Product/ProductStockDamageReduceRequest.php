<?php

namespace App\Http\Requests\Pharmacy\Product;

use Illuminate\Foundation\Http\FormRequest;

class ProductStockDamageReduceRequest extends FormRequest
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
            'product_id' => ['required', 'string', 'exists:products,id'],
            'damaged_stock' => ['required', 'numeric'],
            'event_reason' => ['required', 'string'],
        ];
    }
}
