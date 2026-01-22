<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PatientUserUpdateRequest extends FormRequest
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
        $patient = $this->route('patient');

        return [
            'first_name' => ['nullable', 'string', 'min:1', 'max:255'],
            'last_name' => ['nullable', 'string', 'min:1', 'max:255'],
            'branch_id' => ['nullable', 'string', 'min:1', 'max:255'],
            'contact_number_mobile' => ['nullable', 'string', 'min:1', 'max:255'],
            'NIC' => ['nullable', 'min:5', 'max:20'],
            'email' => ['nullable', 'string', 'email', 'max:255'],
            'home_address' => ['nullable', 'string', 'max:500'],
            'password' => ['nullable', 'string', 'min:6'],
        ];
    }
}
