import React from "react";

export interface IDoctorSchedule {
    id: string;
    doctor_id: string;
    branch_id: string;
    schedule_day: string;
    start_time: string;
    max_patients: number;
    user_first_name?: string;
    user_last_name?: string;
    branch_center_name?: string;
}

export interface AddDoctorScheduleModalProps {
    closeModal: () => void;
    onScheduleAdded: () => void;
}

export interface User {
    id: string;
    first_name: string;
    last_name: string;
    branch_id: string;
    center_name?: string;
    branch_center_name?: string;
}
export interface Branch {
    branch_id: string;
    branch_center_name: string;
}

export interface User {
    user_id: string;
    doctor_id: string;
    first_name: string;
    last_name: string;
    email: string;
    date_of_birth: string;
    gender: string | null;
    nic_number: string;
    contact_number_mobile: string;
    contact_number_landline: string;
    home_address: string;
    emergency_contact_info: string;
    photo: string | null;
    nic_photo: string | null;
    medical_registration_number: string | null;
    qualifications: string;
    years_of_experience: number;
    areas_of_specialization: string | null;
    previous_employment: string;
    license_validity_date: string;
    joining_date: string;
    employee_id: string;
    contract_type: string;
    contract_duration: string;
    probation_start_date: string;
    probation_end_date: string;
    compensation_package: string;
    branches: Branch[];
}

export interface DoctorProps {
    schedule: {
        user_first_name: string;
        user_last_name: string;
        areas_of_specialization: string;
        branch_center_name: string;
        start_time: string;
        schedule_day: string;
        doctor_id: string;
    };
    selectedDate: Date | null;
    setSelectedDate: (date: Date | null) => void;
    isLoadingSlots: boolean;
    error: string | null;
    allSlots?: number[];
    availableSlots?: number[];
    bookedSlots?: string[];
    selectedSlot: number | null;
    handleSlotClick: (slot: number) => void;
}
export interface userDetailsTypes {
    firstName: string;
    lastName: string;
    phone: string;
    nic: string;
    email: string;
    address: string;
    patientId?: string;
    branchId?: string;
}

export interface PatientProps {
    userDetails: userDetailsTypes;
    handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleBooking: () => void;
    timer: number;
    formatTimer: (seconds: number) => string;
    isLookingUpPatient?: boolean;
    patientFound?: boolean | null;
}

export interface FormErrors {
    firstName?: string;
    lastName?: string;
    phone?: string;
    nic?: string;
    email?: string;
    address?: string;
    general?: string;
}
export interface AvailableSlotsProps {
    schedulesWithBranches: MoreBranchesProps[];
    setAllSlotsChild: (slots: number[]) => void;
    setIsUpdateSlots: (value: boolean) => void;
    setBookingSlotNumbers: (slotNumbers: number[]) => void;
    activeScheduleKey: string | null;
    setActiveScheduleKey: (key: string | null) => void;
    selectedDates: Record<string, Date | null>;
    setSelectedDates: (dates: any) => void;
}

export interface SelectAvailableSlotsProps {
    slots: number[];
    allSlotsChild: number[];
    bookedSlots: number[];
    selectedSlot: number | null;
    originalSlot: number;
    isOriginalDate: boolean;
    hoveredOriginalSlot: number | null;
}
export interface ChangeSlotsectionProps {
    originalSlot?: number;
    appointmentDate?: string;
    doctorSchedule: {
        schedule_day: string;
    };
}

export interface Branch {
    id: string;
    center_name: string;
    register_number: string;
    register_document: string;
    center_type: string;
}
export interface MoreBranchesProps {
    id: string;
    doctor_id: string;
    branch_id: string;
    schedule_day: string;
    start_time: string;
    max_patients: number;
    user_first_name?: string;
    user_last_name?: string;
    branch_center_name?: string;
    branch?: Branch | null;
}

export interface BranchSlots {
    [branchId: string]: {
        allSlots: number[];
        bookedSlots: string[];
    };
}
export interface Schedule {
    schedule_day: string;
    start_time: string;
    max_patients: number;
    branch?: Branch;
}
export interface ScheduleWithBranch extends Schedule {
    branch: Branch;
}
export interface ScheduleWithBranch {
    branch_id: string;
    schedule_day: string;
    start_time: string;
    end_time: string;
    max_patients: number;
}
export interface ScheduleItemProps {
    schedule: MoreBranchesProps;
    scheduleKey: string;
    selectedDateLocal: Date | null;
    isCurrentBranchSelected: boolean;
    today: Date;
    oneMonthLater: Date;
    filterScheduleDays: (date: Date, day: string) => boolean;
    handleDateChange: (date: Date | null, scheduleKey: string) => void;
    handleAvailableSlots: (schedule: MoreBranchesProps) => void;
    activeScheduleKey: string | null;
}

export interface IGetDoctorQuestionsProps {
    refreshQuestions?: boolean;
    triggerRefresh?: () => void;
}

export interface EnhancedScheduleItemProps {
    schedule: any;
    scheduleKey: string;
    selectedDateLocal: Date | null;
    isCurrentBranchSelected: boolean;
    today: Date;
    oneMonthLater: Date;
    filterScheduleDays: (date: Date, day: string) => boolean;
    handleDateChange: (date: Date | null, scheduleKey: string) => void;
    handleAvailableSlots: (schedule: any) => void;
    activeScheduleKey: string | null;
    isLoading?: boolean;
    isDisabled?: boolean;
}
