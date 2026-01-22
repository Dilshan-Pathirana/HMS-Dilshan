<?php

namespace App\Http\Requests\AppointmentSchedule;

use Illuminate\Foundation\Http\FormRequest;

class DoctorScheduleCreateRequest extends FormRequest
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
            'doctor_id' => 'required|exists:users,id',
            'branch_id' => 'required|exists:branches,id',
            'schedule_day' => 'required|string',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'nullable|date_format:H:i',
            'max_patients' => 'required|integer',
            'time_per_patient' => 'nullable|integer|min:5|max:120',
        ];
    }
}
