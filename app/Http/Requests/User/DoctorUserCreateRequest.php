<?php

namespace App\Http\Requests\User;

use Illuminate\Foundation\Http\FormRequest;

class DoctorUserCreateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'first_name' => ['required', 'string', 'min:1', 'max:255'],
            'last_name' => ['required', 'string', 'min:1', 'max:255'],
            'password' => ['required', 'string'],
            'branch_id' => ['required', 'string'],
            'date_of_birth' => ['required', 'date'],
            'gender' => ['nullable', 'string', 'in:male,female,other'],
            'nic_number' => ['required', 'string', 'min:1', 'max:255'],
            'contact_number_mobile' => ['required', 'string', 'min:1', 'max:255'],
            'contact_number_landline' => ['required', 'string', 'min:1', 'max:255'],
            'email' => ['required', 'string', 'email', 'min:1', 'max:255'],
            'home_address' => ['nullable', 'string', 'min:1'],
            'emergency_contact_info' => ['required', 'string', 'min:1'],
            'medical_registration_number' => ['nullable', 'string', 'min:1', 'max:255'],
            'qualifications' => ['nullable', 'string'],
            'years_of_experience' => ['nullable', 'integer', 'min:0', 'max:2147483647'],
            'areas_of_specialization' => ['nullable', 'string'],
            'previous_employment' => ['nullable', 'string', 'min:1'],
            'license_validity_date' => ['nullable', 'date'],
            'joining_date' => ['nullable', 'date'],
            'contract_type' => ['required', 'string', 'in:full-time,part-time,consultant'],
            'contract_duration' => ['nullable', 'string', 'min:1', 'max:255'],
            'probation_start_date' => ['nullable', 'date'],
            'probation_end_date' => ['nullable', 'date'],
            'compensation_package' => ['nullable', 'numeric'],
        ];
    }
}
