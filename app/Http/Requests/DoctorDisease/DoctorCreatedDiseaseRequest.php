<?php

namespace App\Http\Requests\DoctorDisease;

use Illuminate\Foundation\Http\FormRequest;

class DoctorCreatedDiseaseRequest extends FormRequest
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
            'doctor_id'     => 'required|uuid',
            'disease_name'  => 'required|string|max:255',
            'description'   => 'nullable|string',
            'priority'      => 'nullable|integer|min:1|max:10',
        ];
    }
}
