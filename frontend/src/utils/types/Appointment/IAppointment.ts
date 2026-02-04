import React from "react";

export interface Doctor {
    user_id: string;
    first_name: string;
    last_name: string;
}

export interface Branch {
    id: string;
    center_name: string;
}

export interface MultiSelectOption {
    label: string;
    value: string;
}

export interface FilterProps {
    onApplyFilter: (filters: Filters) => void;
    onResetFilter: () => void;
}

export type Filters = {
    branch_id: string | null;
    doctor_id: string | null;
    areas_of_specialization: string | null;
    date: string | null;
    patient_name?: string | null;
};

export type DoctorSchedule = {
    id: string;
    user_first_name: string;
    user_last_name: string;
    areas_of_specialization: string;
    branch_center_name: string;
    schedule_day: string;
    start_time: string;
};
export interface Appointment {
    id: string;
    patient_first_name: string;
    patient_last_name: string;
    phone: string;
    NIC: string;
    email: string;
    doctor_first_name: string;
    doctor_last_name: string;
    areas_of_specialization: string;
    center_name: string;
    date: string;
    slot: number;
    branch_id?: string;
}

export interface AppointmentDetailsModalProps {
    appointment: Appointment;
    onClose: () => void;
}

export interface Appointment {
    areas_of_specialization: string;
    date: string;
    doctor_first_name: string;
    doctor_id: string;
    doctor_last_name: string;
    id: string;
    slot: number;
    user_id: string;
}

export interface IAppointment {
    NIC: string;
    address: string;
    areas_of_specialization: string;
    date: string;
    doctor_first_name: string;
    doctor_id: string;
    doctor_last_name: string;
    email: string;
    id: string;
    schedule_id: string;
    slot: number;
    user_id: string;
    patient_first_name: string;
    patient_last_name: string;
    phone: string;
    branch_id: string;
    center_name: string;
    reschedule_count: number;
}

export interface CancelScheduleButtonProps {
    onClick: () => void;
    isLoading: boolean;
    disabled: boolean;
    allCancelled: boolean;
}

export interface SlotBadgeProps {
    count: number;
    type: "booked" | "available";
}

export interface ToggleDetailsButtonProps {
    onClick: () => void;
    isExpanded: boolean;
}

export interface IPatientAppointmentScheduleProp {
    filteredAppointments: IAppointment[];
    visibleAppointments: number;
}

export interface PatientAppointmentScheduleChangeModalProps {
    selectedAppointmentDetails?: IAppointment;
    setIsOpenappointmentDateModal: (isOpen: boolean) => void;
    handleAppointmentChangeSubmit: (
        event: React.FormEvent<HTMLFormElement>,
    ) => void;
    handleSelectDate: (event: React.ChangeEvent<HTMLInputElement>) => void;
    appointments: IAppointment[];
}
