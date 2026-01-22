<?php

namespace App\Http\Requests\Pharmacy\Product;

use Illuminate\Foundation\Http\FormRequest;

class ProductDiscountCreateRequest extends FormRequest
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
            'product_id' => 'required|uuid',
            'discount_type' => 'required',
            'discount_amount' => 'required_if:discount_type,amount|nullable|numeric|min:0',
            'discount_percentage' => 'required_if:discount_type,percentage|nullable|numeric|min:0|max:100',
        ];
    }
}
