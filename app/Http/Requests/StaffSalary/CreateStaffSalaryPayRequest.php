<?php

namespace App\Http\Requests\StaffSalary;

use Illuminate\Foundation\Http\FormRequest;

class CreateStaffSalaryPayRequest extends FormRequest
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
            'paid_salary_amount' => 'required|numeric|min:0',
            'month' => 'required',
        ];
    }
}
