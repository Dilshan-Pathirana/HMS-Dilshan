export interface CalendarDate {
    date: Date;
    schedules: DoctorSchedule[];
    isCurrentMonth: boolean;
    isToday: boolean;
}

export interface DoctorSchedule {
    id: string;
    doctor_id: string;
    user_first_name: string;
    user_last_name: string;
    branch_id: string;
    branch_center_name: string;
    schedule_day: string;
    start_time: string;
    max_patients: number;
}

export interface CancelModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (reason: string) => void;
    schedule: DoctorSchedule | null;
    selectedDate: Date | null;
    isLoading: boolean;
    isCancelingEntireDay?: boolean;
    schedulesCount?: number;
}

export interface DoctorScheduleCancellation {
    id: number;
    schedule_id: string;
    doctor_id: number;
    branch_id: number;
    date: string;
    reason: string;
    status: number;
    reject_reason?: string;
    created_at: string;
    doctor_first_name: string;
    doctor_last_name: string;
    center_name: string;
    schedule_day: string;
    start_time: string;
    max_patients: number;
}

export interface EnhancedCalendarDate extends CalendarDate {
    cancellations: DoctorScheduleCancellation[];
}
