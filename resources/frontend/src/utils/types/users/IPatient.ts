export interface PatientDetails {
    firstName: string;
    lastName: string;
    phone: string;
    nic: string;
    email: string;
    address: string;
    patientId?: string;
    branchId?: string;
    city?: string;
    dateOfBirth?: string;
    gender?: string;
    bloodType?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
}

export interface IPatientDetailsForSales {
    id: string;
    first_name: string;
    last_name: string;
}
