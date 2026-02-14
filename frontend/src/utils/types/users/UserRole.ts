import { MultiSelectOption } from "../Appointment/IAppointment.ts";

export enum UserRole {
    SuperAdmin = 1,
    BranchAdmin = 2,
    Doctor = 3,
    Nurse = 4,
    Patient = 5,
    Cashier = 6,
    Receptionist = 11,
    Pharmacist = 7,
    ITSupport = 8,
    CenterAid = 9,
    Auditor = 10,
    // Legacy aliases for backward compatibility
    Admin = 2,
}

export const roleOptions: MultiSelectOption[] = [
    { label: "Super Admin", value: "1" },
    { label: "Branch Admin", value: "2" },
    { label: "Doctor", value: "3" },
    { label: "Nurse", value: "4" },
    { label: "Patient", value: "5" },
    { label: "Cashier", value: "6" },
    { label: "Pharmacist", value: "7" },
    { label: "IT Support", value: "8" },
    { label: "Center Aid", value: "9" },
    { label: "Auditor", value: "10" },
];
