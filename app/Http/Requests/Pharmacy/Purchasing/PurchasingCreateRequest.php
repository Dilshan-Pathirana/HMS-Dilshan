<?php

namespace App\Http\Requests\Pharmacy\Purchasing;

use Illuminate\Foundation\Http\FormRequest;

class PurchasingCreateRequest extends FormRequest
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
            'cashier_id' => ['required'],
            'net_total' => ['required', 'numeric'],
            'total_amount' => ['required', 'numeric', 'min:1'],
            'amount_received' => ['required', 'numeric'],
            'total_discount_amount' => ['numeric'],
            'remain_amount' => ['numeric'],
            'customer_id' => ['nullable', 'exists:users,id'],
            'customer_name' => ['nullable', 'string'],
            'contact_number' => ['nullable', 'string'],
            'products' => ['required', 'array', 'min:1'],
            'products.*.product_id' => ['required'],
            'products.*.qty' => ['required', 'integer', 'min:1'],
            'products.*.price' => ['required', 'numeric', 'min:1'],
            'products.*.discount_amount' => ['numeric'],
        ];
    }
}
