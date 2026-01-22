<?php

namespace App\Http\Requests\User;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Http\Exceptions\HttpResponseException;

class CashierUserCreateRequest extends FormRequest
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
            'date_of_birth' => ['nullable', 'date'],
            'gender' => ['nullable', 'string', 'in:male,female,other'],
            'nic_number' => ['nullable', 'string', 'min:1', 'max:255'],
            'contact_number_mobile' => ['nullable', 'string', 'min:1', 'max:255'],
            'contact_number_landline' => ['nullable', 'string', 'min:1', 'max:255'],
            'email' => ['required', 'string', 'email', 'min:1', 'max:255'],
            'home_address' => ['nullable', 'string', 'min:1'],
            'emergency_contact_info' => ['nullable', 'string', 'min:1'],
            'qualifications' => ['nullable', 'string'],
            'years_of_experience' => ['nullable', 'integer', 'min:0', 'max:2147483647'],
            'joining_date' => ['nullable', 'date'],
            'contract_type' => ['nullable', 'string', 'in:full-time,part-time,consultant'],
            'contract_duration' => ['nullable', 'string', 'min:1', 'max:255'],
            'compensation_package' => ['nullable', 'numeric'],
            'basic_salary' => ['nullable', 'numeric', 'min:0'],
        ];
    }

    public function failedValidation(\Illuminate\Support\Facades\Validator|Validator $validator)
    {
        $response = response()->json([
            'status' => Response::HTTP_UNPROCESSABLE_ENTITY,
            'error' => $validator->errors(),
        ], Response::HTTP_UNPROCESSABLE_ENTITY);

        throw new HttpResponseException($response);
    }
}
