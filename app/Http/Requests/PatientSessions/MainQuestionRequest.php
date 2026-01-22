<?php

namespace App\Http\Requests\PatientSessions;

use App\Http\Requests\FailedValidation;

class MainQuestionRequest extends FailedValidation
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
            'doctor_id' => ['required', 'exists:doctors,user_id'],
            'question' =>  ['required', 'string'],
            'description' =>  ['nullable', 'string'],
            'order'  =>  ['required', 'integer'],
            'status' => ['nullable', 'integer', 'in:0,1'],
        ];
    }
}
