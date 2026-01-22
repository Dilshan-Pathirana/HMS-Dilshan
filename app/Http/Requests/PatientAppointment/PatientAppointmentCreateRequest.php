<?php

namespace App\Http\Requests\PatientAppointment;

use Illuminate\Foundation\Http\FormRequest;

class PatientAppointmentCreateRequest extends FormRequest
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
            'doctor_id' => ['required', 'string'],
            'branch_id' => ['required', 'string'],
            'schedule_id' => ['required', 'string'],
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'phone' => ['required', 'string', 'max:10'],
            'email' => ['nullable', 'email', 'max:255'],
            'NIC' => ['nullable', 'string'],
            'address' => ['nullable', 'string', 'max:500'],
            'date' => ['required', 'date', 'after_or_equal:today'],
            'slot' => ['required'],
        ];
    }
}
