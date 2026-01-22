export interface IDoctorScheduleCancellation {
    id: string;
    schedule_id: string;
    doctor_id: string;
    branch_id: string;
    date: string;
    reason: string;
    status: number;
    reject_reason?: string;
    doctor_first_name: string;
    doctor_last_name: string;
    center_name: string;
    schedule_day: string;
    start_time: string;
    max_patients: number;
    created_at: string;
    updated_at: string;
}

export interface RejectScheduleCancellationModalProps {
    isOpen: boolean;
    cancellation: IDoctorScheduleCancellation | null;
    onClose: () => void;
    onReject: (id: string, reason: string) => Promise<void>;
}
