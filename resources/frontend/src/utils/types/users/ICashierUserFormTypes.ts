export interface ICashierUserFormTypes {
    first_name: string;
    last_name: string;
    branch_id: string;
    date_of_birth: string;
    gender: string;
    nic_number: string;
    contact_number_mobile: string;
    contact_number_landline: string;
    email: string;
    home_address: string;
    emergency_contact_info: string;
    photo: File | null;
    nic_photo: File | null;
    qualifications: string;
    years_of_experience: string;
    joining_date: string;
    contract_type: string;
    contract_duration: string;
    compensation_package: string;
    basic_salary: string;
    password: string;
}

export interface ICashierUserDetails {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    role_as: number;
    branch_id: string;
    date_of_birth: string;
    gender: string;
    nic_number: string;
    contact_number_mobile: string;
    contact_number_landline: string;
    home_address: string;
    emergency_contact_info: string;
    photo: string;
    cashiers_email: string;
    cashiers_branch_id: string;
    cashiers_date_of_birth: string;
    cashiers_gender: string;
    cashiers_nic_number: string;
    cashiers_contact_number_mobile: string;
    cashiers_contact_number_landline: string;
    cashiers_home_address: string;
    cashiers_emergency_contact_info: string;
    cashiers_qualifications: string;
    cashiers_years_of_experience: string;
    cashiers_joining_date: string;
    cashiers_employee_id: string;
    cashiers_contract_type: string;
    cashiers_contract_duration: string;
    cashiers_compensation_package: string;
}
