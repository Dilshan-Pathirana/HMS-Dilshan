export interface Leave {
    admin_status: string;
    id: string;
    leaves_start_date: string;
    leaves_end_date: string;
    reason?: string;
    status: string;
    assigner?: string;
    approval_date?: string;
    comments?: string;
    admin_comments?: string;
    assigner_first_name?: string;
    assigner_last_name?: string;
    user_first_name: string;
    user_last_name: string;
    leaves_days: number;
}

export interface LeaveManagementTableProps {
    refreshLeaves: boolean;
}

export interface AuthState {
    userId: string;
    userRole: number;
}

export interface AddLeaveModalProps {
    closeModal: () => void;
    onLeaveAdded: () => void;
}

export interface User {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
}
