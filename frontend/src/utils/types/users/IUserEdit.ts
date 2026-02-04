import { ICashierUserDetails } from "./ICashierUserFormTypes.ts";
import { IPharmacistUserDetails } from "./IPharmacistUserFormTypes.ts";
import { IDoctorUserDetails } from "./IDoctorUserFormTypes.ts";

export interface EditUserModalProps {
    isOpen: boolean;
    userId: string;
    roleAs: number;
    onClose: () => void;
    onSuccess: () => void;
}

export interface BranchOption {
    value: string;
    label: string;
}
export interface UpdateUserParams {
    userId: string;
    roleAs: number;
    userData: any;
}
export interface PatientEditFormProps {
    userDetails: any;
    branchOptions: any[];
    handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleBranchChange: (selectedOption: any) => void;
}
export interface CashierEditFormProps {
    userDetails: ICashierUserDetails;
    branchOptions: any[];
    handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleBranchChange: (selectedOption: any) => void;
}
export interface PharmacistEditFormProps {
    userDetails: IPharmacistUserDetails;
    branchOptions: any[];
    handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleBranchChange: (selectedOption: any) => void;
}

export interface CommonFormFieldsProps {
    userDetails: any;
    branchOptions: BranchOption[];
    handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleBranchChange: (selectedOption: any) => void;
}

export interface BranchOption {
    value: string;
    label: string;
}

export interface EditUserModalProps {
    isOpen: boolean;
    userId: string;
    roleAs: number;
    onClose: () => void;
    onSuccess: () => void;
}

export interface UpdateUserParams {
    userId: string;
    roleAs: number;
    userData: any;
}

export interface DoctorEditFormProps {
    userDetails: IDoctorUserDetails;
    branchOptions: any[];
    handleInputChange: (
        e: React.ChangeEvent<
            HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >,
    ) => void;
    handleBranchChange: (selectedOption: any) => void;
}
export interface IDoctorSchedule {
    id: string;
    doctor_id: string;
    branch_id: string;
    day_of_week: string;
    start_time: string;
    end_time: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    schedule_day?: string;

}

export interface IAppointment {
    id: string;
    date: string;
    slot: string;
    doctor_id: string;
    branch_id: string;
    doctor_first_name: string;
    doctor_last_name: string;
    areas_of_specialization: string;
    center_name: string;
    address: string;
    patient_first_name: string;
    patient_last_name: string;
    email: string;
    phone: string;
    user_id: string;
    reschedule_count: number;
}
