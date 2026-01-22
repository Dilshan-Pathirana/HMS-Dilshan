export interface IDoctorData {
    first_name: string;
    last_name: string;
    date_of_birth: string;
    gender: string;
    nic_or_passport: string;
    mobile_number: string;
    landline_number: string;
    email: string;
    home_address: string;
    emergency_contact: string;
    recent_photo: File | null;
    nic_photo: (File | null)[];
    medical_reg_number: string;
    qualifications: string;
    years_of_experience: number;
    areas_of_specialization: string[];
    work_experience: string;
    branch_ids: string[];
    license_validity_date: string;
    joining_date: string;
    employee_id: string;
    contract_type: string;
    contract_duration: string;
    probation_period: {
        start: string;
        end: string;
    };
    compensation_package: string;
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
export interface Appointment {
    id: string;
    user_id: string;
    doctor_id: string;
    status: number;
    branch_id: string;
    date: string;
    patient_selected_slot: string;
    all_available_slots_for_doctor: number;
    patient_first_name: string;
    patient_last_name: string;
    patient_phone: string;
}
export interface DoctorAppointmentsProps {
    handleModalClose: () => void;
    schedule: DoctorSchedule;
}
export interface AppointmentModalStructureProps {
    handleModalClose: () => void;
    schedule: DoctorSchedule;
    loading: boolean;
    userId: string;
    appointments: Appointment[];
    onAppointmentsCancelled?: () => void;
}

export interface IPatientDetailsShowTableProps {
    appointmentWithGrouped: Appointment[];
}

export interface IPatientAppointmentTableHeaderProps {
    date: string;
    bookedCount: number;
    availableSlots: number;
    expandedDates: string[];
    toggleDate: (date: string) => void;
    schedule: DoctorSchedule;
    userId: string;
    onAppointmentsCancelled?: () => void;
    appointmentWithGrouped?: Appointment[];
    appointmentsForDate?: Appointment[];
}

export interface IAppointmentModalHeaderProps {
    schedule: DoctorSchedule;
    handleModalClose: () => void;
}

export interface CancelReasonModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (reason: string) => void;
    date: string;
    isLoading: boolean;
}

export interface IDoctorAppointmentFilterProps {
    searchTerm: string;
    setSearchTerm: (searchTerm: string) => void;
}

export interface IDoctorAllAppointmentTableProps {
    filteredSchedules: DoctorSchedule[];
    searchTerm: string;
    handleModalOpen: (schedule: DoctorSchedule) => void;
    setSearchTerm: (searchTerm: string) => void;
}
