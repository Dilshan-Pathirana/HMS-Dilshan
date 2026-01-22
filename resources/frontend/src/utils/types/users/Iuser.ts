import { MultiSelectOption } from "../Appointment/IAppointment.ts";
export interface IUser {
    id: string;
    first_name: string;
    last_name: string;
    center_name?: string;
    branch_id?: string;
    rate_for_hour: number;
    maximum_hours_can_work: number;
    total_hours_worked_current_month: number;
}

export interface IUserData {
    branch_id: string;
    cashier_id: string;
    center_name: string;
    contact_number_mobile: string;
    email: string;
    first_name: string;
    id: string;
    last_name: string;
    role_as: number;
    user_type?: string;
    branches: string[];
}

export interface UserTableFilterSectionProps {
    searchTerm: string;
    branchDropDownOptions: MultiSelectOption[];
    selectedBranch: MultiSelectOption[];
    roleDropDownOptions: MultiSelectOption[];
    selectedRole: MultiSelectOption[];
    setSearchTerm: (searchTerm: string) => void;
    setSelectedBranch: (selectedBranch: MultiSelectOption[]) => void;
    setSelectedRole: (selectedRole: MultiSelectOption[]) => void;
}

export interface UserTableStructureProps {
    isLoading: boolean;
    filteredUsers: IUserData[];
    paginatedUsers: IUserData[];
    refreshUsers?: () => void;

}
export  interface UserDeleteViewModalProps {
    onClose: () => void;
    userId: string;
    roleAs: number;
    onSuccess: () => void;
}
export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastProps {
    message: string;
    type?: ToastType;
    duration?: number;
    onClose: () => void;
    position?: "top-right" | "top-left" | "bottom-right" | "bottom-left";
    showCloseButton?: boolean;
}
export interface DoctorAppointmentCardProps {
    handleShowMoreSchedules: () => Promise<void>;

}

