export interface IShift {
    id: number;
    user_first_name: string;
    user_last_name: string;
    branch_center_name: string;
    shift_type: string;
    days_of_week: string;
    start_time: string;
    end_time: string;
    notes?: string;
}

export interface ShiftViewModalProps {
    isOpen: boolean;
    notes: string;
    days: string[];
    onClose: () => void;
}

export interface EditShiftModalProps {
    isOpen: boolean;
    shift: any;
    onClose: () => void;
    onShiftUpdated: () => void;
}

export const dayMap: { [key: string]: string } = {
    "1": "Sunday",
    "2": "Monday",
    "3": "Tuesday",
    "4": "Wednesday",
    "5": "Thursday",
    "6": "Friday",
    "7": "Saturday",
};


export interface Shift {
    id: string;
    user_id: string;
    user_first_name: string;
    user_last_name: string;
    branch_id: string;
    branch_center_name: string;
    shift_type: string;
    days_of_week: string;
    start_time: string;
    end_time: string;
    notes?: string;
}
