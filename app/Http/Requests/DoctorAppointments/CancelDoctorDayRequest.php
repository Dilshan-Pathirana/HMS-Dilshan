<?php

namespace App\Http\Requests\DoctorAppointments;

use Illuminate\Foundation\Http\FormRequest;

class CancelDoctorDayRequest extends FormRequest
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
            'doctor_id' => 'required|uuid',
            'branch_id' => 'nullable|uuid',
            'date' => 'required|date|after:today',
            'reason' => 'required|string',
        ];
    }
}
