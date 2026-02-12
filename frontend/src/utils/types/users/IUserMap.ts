import { UserRole } from "./UserRole.ts";

export const mapCashierData = (userData: any) => {
    return {
        first_name: userData.first_name,
        last_name: userData.last_name,
        email: userData.cashiers_email,
        branch_id: userData.cashiers_branch_id,
        date_of_birth: userData.cashiers_date_of_birth,
        gender: userData.cashiers_gender,
        nic_number: userData.cashiers_nic_number,
        contact_number_mobile: userData.cashiers_contact_number_mobile,
        contact_number_landline: userData.cashiers_contact_number_landline,
        home_address: userData.cashiers_home_address,
        emergency_contact_info: userData.cashiers_emergency_contact_info,
        qualifications: userData.cashiers_qualifications,
        years_of_experience: userData.cashiers_years_of_experience,
        joining_date: userData.cashiers_joining_date,
        contract_type: userData.cashiers_contract_type,
        contract_duration: userData.cashiers_contract_duration,
        compensation_package: userData.cashiers_compensation_package,
    };
};

export const mapPharmacistData = (userData: any) => {
    return {
        first_name: userData.first_name,
        last_name: userData.last_name,
        email: userData.pharmacists_email,
        branch_id: userData.pharmacists_branch_id,
        date_of_birth: userData.pharmacists_date_of_birth,
        gender: userData.pharmacists_gender,
        nic_number: userData.pharmacists_nic_number,
        contact_number_mobile: userData.pharmacists_contact_number_mobile,
        contact_number_landline: userData.pharmacists_contact_number_landline,
        home_address: userData.pharmacists_home_address,
        emergency_contact_info: userData.pharmacists_emergency_contact_info,
        qualifications: userData.pharmacists_qualifications,
        years_of_experience: userData.pharmacists_years_of_experience,
        joining_date: userData.pharmacists_joining_date,
        employee_id: userData.pharmacists_employee_id,
        contract_type: userData.pharmacists_contract_type,
        contract_duration: userData.pharmacists_contract_duration,
        compensation_package: userData.pharmacists_compensation_package,
        pharmacist_registration_number:
            userData.pharmacists_pharmacist_registration_number,
        previous_employment: userData.pharmacists_previous_employment,
        license_validity_date: userData.pharmacists_license_validity_date,
        probation_start_date: userData.pharmacists_probation_start_date,
        probation_end_date: userData.pharmacists_probation_end_date,
    };
};
export const mapDoctorData = (userData: any) => {
    return {
        first_name: userData.first_name,
        last_name: userData.last_name,
        email: userData.email,
        role_as: userData.role_as,
        doctor_user_id: userData.doctors_user_id,
        date_of_birth: userData.doctors_date_of_birth,
        gender: userData.doctors_gender,
        nic_number: userData.doctors_nic_number,
        contact_number_mobile: userData.doctors_contact_number_mobile,
        contact_number_landline: userData.doctors_contact_number_landline,
        home_address: userData.doctors_home_address,
        emergency_contact_info: userData.doctors_emergency_contact_info,
        photo: userData.doctors_photo,
        nic_photo: userData.doctors_nic_photo,
        medical_registration_number:
            userData.doctors_medical_registration_number,
        qualifications: userData.doctors_qualifications,
        years_of_experience: userData.doctors_years_of_experience,
        areas_of_specialization: Array.isArray(
            userData.doctors_areas_of_specialization,
        )
            ? userData.doctors_areas_of_specialization
            : typeof userData.doctors_areas_of_specialization === "string"
              ? userData.doctors_areas_of_specialization
                    .split(",")
                    .map((s: string) => s.trim())
              : [],
        previous_employment: userData.doctors_previous_employment,
        license_validity_date: userData.doctors_license_validity_date,
        joining_date: userData.doctors_joining_date,
        employee_id: userData.doctors_employee_id,
        contract_type: userData.doctors_contract_type,
        contract_duration: userData.doctors_contract_duration,
        probation_start_date: userData.doctors_probation_start_date,
        probation_end_date: userData.doctors_probation_end_date,
        compensation_package: userData.doctors_compensation_package,
        branch_ids: userData.branch_ids || userData.doctors_branches || [],
    };
};

export const mapDetailsToRoleFields = (details: any, roleAs: UserRole) => {
    if (roleAs === UserRole.Cashier) {
        return {
            ...details,
            id: details.id,
            first_name: details.first_name,
            last_name: details.last_name,
            email: details.email,
            role_as: details.role_as,
            cashiers_email: details.email,
            cashiers_branch_id: details.branch_id,
            cashiers_date_of_birth: details.date_of_birth,
            cashiers_gender: details.gender,
            cashiers_nic_number: details.nic_number,
            cashiers_contact_number_mobile: details.contact_number_mobile,
            cashiers_contact_number_landline: details.contact_number_landline,
            cashiers_home_address: details.home_address,
            cashiers_emergency_contact_info: details.emergency_contact_info,
            cashiers_qualifications: details.qualifications,
            cashiers_years_of_experience: details.years_of_experience,
            cashiers_joining_date: details.joining_date,
            cashiers_employee_id: details.employee_id,
            cashiers_contract_type: details.contract_type,
            cashiers_contract_duration: details.contract_duration,
            cashiers_compensation_package: details.compensation_package,
        };
    } else if (roleAs === UserRole.Pharmacist) {
        return {
            ...details,
            id: details.id,
            first_name: details.first_name,
            last_name: details.last_name,
            email: details.email,
            role_as: details.role_as,
            pharmacists_email: details.email,
            pharmacists_branch_id: details.branch_id,
            pharmacists_date_of_birth: details.date_of_birth,
            pharmacists_gender: details.gender,
            pharmacists_nic_number: details.nic_number,
            pharmacists_contact_number_mobile: details.contact_number_mobile,
            pharmacists_contact_number_landline:
                details.contact_number_landline,
            pharmacists_home_address: details.home_address,
            pharmacists_emergency_contact_info: details.emergency_contact_info,
            pharmacists_qualifications: details.qualifications,
            pharmacists_years_of_experience: details.years_of_experience,
            pharmacists_joining_date: details.joining_date,
            pharmacists_employee_id: details.employee_id,
            pharmacists_contract_type: details.contract_type,
            pharmacists_contract_duration: details.contract_duration,
            pharmacists_compensation_package: details.compensation_package,
            pharmacists_pharmacist_registration_number:
                details.pharmacist_registration_number,
            pharmacists_previous_employment: details.previous_employment,
            pharmacists_license_validity_date: details.license_validity_date,
            pharmacists_probation_start_date: details.probation_start_date,
            pharmacists_probation_end_date: details.probation_end_date,
        };
    } else if (roleAs === UserRole.Doctor) {
        return {
            ...details,
            id: details.id,
            first_name: details.first_name,
            last_name: details.last_name,
            email: details.email,
            role_as: details.role_as,
            doctors_email: details.email,
            branch_ids: details.branch_ids || [],
            doctors_date_of_birth: details.date_of_birth,
            doctors_gender: details.gender,
            doctors_nic_number: details.nic_number,
            doctors_contact_number_mobile: details.contact_number_mobile,
            doctors_contact_number_landline: details.contact_number_landline,
            doctors_home_address: details.home_address,
            doctors_emergency_contact_info: details.emergency_contact_info,
            doctors_qualifications: details.qualifications,
            doctors_areas_of_specialization: details.areas_of_specialization
                || (details.specialization ? details.specialization.split(',').map((s: string) => s.trim()) : []),
            doctors_years_of_experience: details.years_of_experience,
            doctors_previous_employment: details.previous_employment,
            doctors_license_validity_date: details.license_validity_date,
            doctors_joining_date: details.joining_date,
            doctors_employee_id: details.employee_id,
            doctors_medical_registration_number: details.medical_registration_number,
            doctors_contract_type: details.contract_type,
            doctors_contract_duration: details.contract_duration,
            doctors_compensation_package: details.compensation_package,
            doctors_probation_start_date: details.probation_start_date,
            doctors_probation_end_date: details.probation_end_date,
        };
    }
    return details;
};
