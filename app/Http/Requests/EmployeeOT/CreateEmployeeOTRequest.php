<?php

namespace App\Http\Requests\EmployeeOT;

use Illuminate\Foundation\Http\FormRequest;

class CreateEmployeeOTRequest extends FormRequest
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
            'employee_id' => 'required|exists:users,id',
            'date' => 'required|date',
            'hours_worked' => 'required|numeric|min:0.01',
            'ot_rate' => 'required|numeric|min:0.01',
            'total_ot_amount' => 'nullable|numeric|min:0',
        ];
    }
}
