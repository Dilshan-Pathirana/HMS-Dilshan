<?php

namespace App\Http\Requests\PatientAppointment;

use Illuminate\Foundation\Http\FormRequest;

class PatientAppointmentUpdateRequest extends FormRequest
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
            'doctor_id' => ['required'],
            'schedule_id' => ['required', 'string'],
            'date' => ['required'],
            'new_slot'=>['required'],
            'existing_slot'=>['required'],
            'new_date' => ['required', 'min:1'],
            'new_branch_id' => ['required', 'string'],
        ];
    }
}
