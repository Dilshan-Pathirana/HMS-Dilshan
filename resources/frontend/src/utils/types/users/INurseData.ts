export interface INurseFormData {
    full_name: string;
    date_of_birth: string;
    gender: string;
    nic_or_passport: string;
    mobile_number: string;
    landline_number: string;
    email: string;
    home_address: string;
    emergency_contact: string;
    recent_photo: File | null;
    nursing_reg_number: string;
    qualifications: string;
    years_of_experience: number;
    specialization: string;
    work_experience: string;
    nurse_training_certifications: string;
    license_validity_date: string;
    additional_certifications: string;
    joining_date: string;
    employee_id: string;
    contract_type: string;
    contract_duration: string;
    probation_period: { start: string; end: string };
    compensation_package: string;
}
