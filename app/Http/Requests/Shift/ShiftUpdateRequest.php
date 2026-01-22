<?php

namespace App\Http\Requests\Shift;

use Illuminate\Foundation\Http\FormRequest;

class ShiftUpdateRequest extends FormRequest
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
            'user_id' => 'required|exists:users,id',
            'branch_id' => 'required|exists:branches,id',
            'shift_type' => 'required|string',
            'days_of_week' => 'required|string',
            'days_of_week.*' => 'in:1,2,3,4,5,6,7',
            'start_time' => 'required',
            'end_time' => 'required',
            'notes' => 'nullable|string',
        ];
    }
}
