<?php

namespace App\Http\Requests\StaffSalary;

use Illuminate\Foundation\Http\FormRequest;

class CreateStaffSalaryRequest extends FormRequest
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
            'basic_salary_amount' => 'required|numeric|min:0',
            'allocation_amount' => 'nullable|numeric',
            'rate_for_hour' => 'nullable|numeric',
            'maximum_hours_can_work' => 'nullable|integer',

            'bank_name' => 'required_without_all:branch_name,branch_code,account_number,account_owner_name|string|max:255',
            'branch_name' => 'required_without_all:bank_name,branch_code,account_number,account_owner_name|string|max:255',
            'branch_code' => 'required_without_all:bank_name,branch_name,account_number,account_owner_name|string|max:20',
            'account_number' => 'required_without_all:bank_name,branch_name,branch_code,account_owner_name|string|max:50',
            'account_owner_name' => 'required_without_all:bank_name,branch_name,branch_code,account_number|string|max:255',
        ];
    }
}
