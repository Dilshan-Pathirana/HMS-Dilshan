<?php

namespace App\Http\Requests\Pharmacy\Product;

use Illuminate\Support\Facades\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Http\Exceptions\HttpResponseException;

class ProductCreateRequest extends FormRequest
{
    private array $stringRules = ['string'];
    private array $bigStringRules = ['string'];
    private array $numericRules = ['numeric'];

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
          'supplier_id' => 'required|exists:suppliers,id',
          'item_code' => ['required', 'string', 'min:1', 'unique:products,item_code'],
          'barcode' => ['required', 'string', 'min:1', 'unique:products,barcode'],
          'item_name' => ['required', 'string', 'min:1', 'unique:products,item_name'],
          'generic_name' => $this->stringRules,
          'brand_name' => $this->stringRules,
          'category' => $this->stringRules,
          'unit'  => $this->bigStringRules,
          'warranty_serial' => $this->bigStringRules,
          'warranty_duration' => $this->bigStringRules,
          'warranty_start_date' => $this->bigStringRules,
          'warranty_end_date' => $this->bigStringRules,
          'warranty_type' => $this->bigStringRules,
          'current_stock' => $this->numericRules,
          'min_stock' => $this->numericRules,
          'reorder_level' => $this->numericRules,
          'reorder_quantity' => $this->numericRules,
            'unit_cost' => $this->numericRules,
            'unit_selling_price' => $this->numericRules,
            'expiry_date' => $this->bigStringRules,
            'entry_date' => $this->bigStringRules,
            'stock_status'  => $this->bigStringRules,
            'product_store_location'  => $this->bigStringRules,
            'stock_update_date' => $this->bigStringRules,
            'damaged_stock' => ['nullable', 'string'],

        ];
    }

    protected function failedValidation(Validator|\Illuminate\Contracts\Validation\Validator $validator)
    {
        $response = response()->json([
            'status' => Response::HTTP_UNPROCESSABLE_ENTITY,
            'error' => $validator->errors(),
        ], Response::HTTP_UNPROCESSABLE_ENTITY);
        throw new HttpResponseException($response);
    }
}
