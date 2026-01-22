export interface Leave {
    admin_status: string;
    id: string;
    user_first_name: string;
    user_last_name: string;
    admin_comments: string;
    leaves_start_date: string;
    leaves_end_date: string;
    status: string;
    leaves_days: number;
    reason: string | null;
    comments: string | null;
}

export interface LeaveRequestTableProps {
    assignerId: string;
}

export interface LeaveDetailsModalProps {
    leave: {
        id: string;
        user_first_name: string;
        user_last_name: string;
        leaves_start_date: string;
        leaves_end_date: string;
        status: string;
        admin_status: string;
        admin_comments: string;
        leaves_days: number;
        reason: string | null;
        comments: string | null;
    };
    onClose: (refresh?: boolean) => void;
}
