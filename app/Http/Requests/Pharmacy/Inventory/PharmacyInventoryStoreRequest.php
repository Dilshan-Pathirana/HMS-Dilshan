<?php

namespace App\Http\Requests\Pharmacy\Inventory;

use Illuminate\Foundation\Http\FormRequest;

class PharmacyInventoryStoreRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        // Map frontend field names to backend field names
        $mappings = [
            'medicine_name' => 'medication_name',
            'quantity' => 'quantity_in_stock',
            'unit' => 'dosage_form',
            'unit_price' => 'unit_cost',
            'expiry_date' => 'expiration_date',
        ];

        $data = $this->all();
        
        foreach ($mappings as $frontend => $backend) {
            if (isset($data[$frontend]) && !isset($data[$backend])) {
                $data[$backend] = $data[$frontend];
            }
        }

        // Set selling_price to unit_cost if not provided
        if (isset($data['unit_cost']) && !isset($data['selling_price'])) {
            $data['selling_price'] = $data['unit_cost'];
        }

        $this->merge($data);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'pharmacy_id' => ['required', 'exists:pharmacies,id'],
            'medication_name' => ['required', 'string', 'max:100'],
            'generic_name' => ['nullable', 'string', 'max:100'],
            'dosage_form' => ['required', 'string', 'max:50'],
            'strength' => ['nullable', 'string', 'max:50'],
            'manufacturer' => ['nullable', 'string', 'max:100'],
            'supplier' => ['nullable', 'string', 'max:100'],
            'batch_number' => ['required', 'string', 'max:50'],
            'expiration_date' => ['required', 'date'],
            'quantity_in_stock' => ['required', 'integer', 'min:0'],
            'reorder_level' => ['required', 'integer', 'min:0'],
            'unit_cost' => ['required', 'numeric', 'min:0'],
            'selling_price' => ['nullable', 'numeric', 'min:0'],
            'discount_percentage' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'storage_location' => ['nullable', 'string', 'max:50'],
            'notes' => ['nullable', 'string'],
            'is_active' => ['boolean'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'pharmacy_id.required' => 'Please select a pharmacy.',
            'pharmacy_id.exists' => 'Selected pharmacy does not exist.',
            'medication_name.required' => 'Medicine name is required.',
            'dosage_form.required' => 'Dosage form is required.',
            'batch_number.required' => 'Batch number is required.',
            'expiration_date.required' => 'Expiry date is required.',
            'quantity_in_stock.required' => 'Quantity is required.',
            'quantity_in_stock.min' => 'Quantity cannot be negative.',
            'unit_cost.required' => 'Unit cost is required.',
            'unit_cost.min' => 'Unit cost cannot be negative.',
        ];
    }
}
