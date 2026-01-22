<?php

namespace App\Http\Requests\User;

use Illuminate\Foundation\Http\FormRequest;

class NurseUserCreateRequest extends FormRequest
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
            'first_name' => ['required', 'string', 'min:1', 'max:255'],
            'last_name' => ['required', 'string', 'min:1', 'max:255'],
            'password' => ['required', 'string'],
            'branch_id' => ['nullable', 'string', 'min:1', 'max:255'],
            'date_of_birth' => ['required', 'date'],
            'gender' => ['nullable', 'string', 'in:male,female,other'],
            'nic_number' => ['nullable', 'string', 'min:1', 'max:255'],
            'contact_number_mobile' => ['nullable', 'string', 'min:1', 'max:255'],
            'contact_number_landline' => ['nullable', 'string', 'min:1', 'max:255'],
            'email' => ['required', 'string', 'min:1', 'max:255'],
            'home_address' => ['nullable', 'string', 'min:1'],
            'emergency_contact_info' => ['nullable', 'string', 'min:1'],
            'photo' => ['nullable', 'string', 'min:1', 'max:255'],
            'nic_photo' => ['nullable', 'string', 'min:1', 'max:255'],
            'medical_registration_number' => ['nullable', 'string', 'min:1', 'max:255'],
            'qualifications' => ['nullable', 'string'],
            'years_of_experience' => ['nullable', 'integer', 'min:-2147483648', 'max:2147483647'],
            'previous_employment' => ['nullable', 'string', 'min:1'],
            'license_validity_date' => ['nullable', 'date'],
            'joining_date' => ['nullable', 'date'],
            'employee_id' => ['required', 'string', 'min:1', 'max:255'],
            'contract_type' => ['required', 'string', 'in:full-time,part-time,consultant'],
            'contract_duration' => ['nullable', 'string', 'min:1', 'max:255'],
            'probation_start_date' => ['nullable', 'date'],
            'probation_end_date' => ['nullable', 'date'],
            'compensation_package' => ['nullable', 'numeric'],
            'basic_salary' => ['nullable', 'numeric', 'min:0'],
        ];
    }
}
