<?php

namespace App\Http\Requests\DoctorSession;

use Illuminate\Foundation\Http\FormRequest;

class DoctorSessionRequest extends FormRequest
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
            'branch_id' => 'required|uuid',
            'doctor_id' => 'required|uuid',
            'patient_id' => 'required|uuid',
        ];
    }
}
