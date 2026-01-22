<?php

namespace App\Http\Requests\DoctorAppointments;

use Illuminate\Foundation\Http\FormRequest;

class CancelDoctorScheduleRequest extends FormRequest
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
            'schedule_id' => 'required|uuid',
            'doctor_id' => 'required|uuid',
            'branch_id' => 'required|uuid',
            'date' => 'required|date',
            'reason' => 'required|string',
        ];
    }
}
