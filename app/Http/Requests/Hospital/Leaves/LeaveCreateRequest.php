<?php

namespace App\Http\Requests\Hospital\Leaves;

use Illuminate\Foundation\Http\FormRequest;

class LeaveCreateRequest extends FormRequest
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
            'leaves_start_date' => 'required|date|before:leaves_end_date',
            'leaves_end_date' => 'required|date|after:leaves_start_date',
            'reason' => 'nullable|string|max:255',
            'status' => 'nullable|in:Pending,Approved,Rejected,Cancelled',
            'assigner' => 'required|uuid',
            'approval_date' => 'nullable|date|after_or_equal:leaves_end_date',
            'comments' => 'nullable|string|max:255',
        ];
    }
}
