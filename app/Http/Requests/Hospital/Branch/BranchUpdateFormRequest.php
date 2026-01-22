<?php

namespace App\Http\Requests\Hospital\Branch;

use Illuminate\Foundation\Http\FormRequest;

class BranchUpdateFormRequest extends FormRequest
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
            'center_name' => ['required', 'string', 'min:1', 'max:255'],
            'register_number' => ['nullable', 'string', 'min:1', 'max:255'],
            'register_document' => ['nullable', 'file', 'mimes:pdf,doc,docx,jpg,png', 'max:5120'],
            'center_type' => ['nullable', 'string', 'min:1', 'max:255'],
            'division' => ['nullable', 'string', 'min:1', 'max:255'],
            'division_number' => ['nullable', 'string', 'min:1', 'max:255'],
            'owner_type' => ['nullable', 'string', 'min:1', 'max:255'],
            'owner_full_name' => ['nullable', 'string', 'min:1', 'max:255'],
            'owner_id_number' => ['nullable', 'string', 'min:1', 'max:255'],
            'owner_contact_number' => ['nullable', 'string', 'min:1', 'max:255'],
        ];
    }
}
