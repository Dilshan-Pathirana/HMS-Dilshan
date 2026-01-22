<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PharmacistUserUpdateRequest extends FormRequest
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
        $userId = $this->route('user_id');

        return [
            'first_name' => ['nullable', 'string', 'min:1', 'max:255'],
            'last_name' => ['nullable', 'string', 'min:1', 'max:255'],
            'password' => ['nullable', 'string'],
            'branch_id' => ['nullable', 'string', 'min:1', 'max:255'],
            'date_of_birth' => ['nullable', 'date'],
            'gender' => ['nullable', 'string', 'in:male,female,other'],
            'nic_number' => ['nullable', 'string', 'min:1', 'max:255'],
            'contact_number_mobile' => ['nullable', 'string', 'min:1', 'max:255'],
            'contact_number_landline' => ['nullable', 'string', 'min:1', 'max:255'],
            'email' => ['required', 'string', 'email', 'min:1', 'max:255'],
            'home_address' => ['nullable', 'string', 'min:1'],
            'emergency_contact_info' => ['nullable', 'string', 'min:1'],
            'pharmacist_registration_number' => ['nullable', 'string', 'min:1', 'max:255'],
            'qualifications' => ['nullable', 'string'],
            'years_of_experience' => ['nullable', 'integer', 'min:0', 'max:2147483647'],
            'previous_employment' => ['nullable', 'string', 'min:1'],
            'license_validity_date' => ['nullable', 'date'],
            'joining_date' => ['nullable', 'date'],
            'contract_type' => ['nullable', 'string', 'in:full-time,part-time,consultant'],
            'contract_duration' => ['nullable', 'string', 'min:1', 'max:255'],
            'probation_start_date' => ['nullable', 'date'],
            'probation_end_date' => ['nullable', 'date'],
            'compensation_package' => ['nullable', 'numeric'],
        ];
    }
}
