<?php

namespace App\Http\Requests\AppointmentSchedule;

use Illuminate\Foundation\Http\FormRequest;

class DoctorScheduleUpdateRequest extends FormRequest
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
            'doctor_id' => 'exists:users,id',
            'branch_id' => 'exists:branches,id',
            'schedule_day' => 'string',
            'start_time' => 'string',
            'max_patients' => 'integer',
        ];
    }
}
