import api from "../utils/api/axios";

export interface AppointmentBooking {
    id: string;
    patient_name: string;
    patient_id: string;
    patient_phone: string;
    doctor_name: string;
    doctor_id: string;
    doctor_specialization: string;
    branch_name: string;
    branch_id: string;
    appointment_date: string;
    appointment_time: string;
    status: string;
    payment_status: string;
    queue_number: number;
    token_number: number;
    slot_number: number;
    booking_type: string;
    booking_fee: number;
    amount_paid: number;
    notes: string;
    cancellation_reason: string;
    cancelled_by_user_for_doctor: string;
    appointment_type: string;
    created_at: string;
    [key: string]: any;
}

export interface Doctor {
    id: string;
    doctor_id: string;
    name: string;
    specialization: string;
    branch_id: string;
    branch_name: string;
    profile_picture: string;
    [key: string]: any;
}

export interface Branch {
    id: string;
    name: string;
    [key: string]: any;
}

export interface SlotDay {
    date: string;
    day: string;
    available_count: number;
    slots: TimeSlot[];
    [key: string]: any;
}

export interface TimeSlot {
    id: string;
    time: string;
    slot_number: number;
    available: boolean;
    is_available: boolean;
    [key: string]: any;
}

export interface SlotInfo {
    id: string;
    time: string;
    slot_number: number;
    available: boolean;
    is_available: boolean;
    [key: string]: any;
}

export interface PatientSearchResult {
    id: string;
    name: string;
    phone: string;
    email: string;
    [key: string]: any;
}

export interface AppointmentSettings {
    id?: string;
    setting_name?: string;
    setting_value?: string;
    max_advance_booking_days: number;
    min_advance_booking_hours?: number;
    allow_walk_in?: boolean;
    require_payment_for_online?: boolean;
    allow_patient_cancellation?: boolean;
    cancellation_advance_hours?: number;
    allow_reschedule?: boolean;
    max_reschedule_count?: number;
    default_booking_fee?: number;
    walk_in_fee?: number;
    refund_on_cancellation?: boolean;
    send_sms_confirmation?: boolean;
    send_sms_reminder?: boolean;
    reminder_hours_before?: number;
    send_email_confirmation?: boolean;
    default_max_patients_per_session?: number;
    default_time_per_patient?: number;
    [key: string]: any;
}

export interface AppointmentLog {
    id: string;
    action: string;
    timestamp: string;
    action_label?: string;
    performed_by?: string;
    performed_by_role?: string;
    reason?: string;
    previous_status?: string;
    new_status?: string;
    created_at?: string;
    [key: string]: any;
}

export interface AppointmentStatistics {
    total_appointments: number;
    completed: number;
    cancelled: number;
    today: {
        total: number;
        completed: number;
        cancelled: number;
        no_show: number;
        pending: number;
        confirmed: number;
        walk_in: number;
        [key: string]: any;
    };
    this_month: {
        total: number;
        completed: number;
        cancelled: number;
        revenue: number;
        confirmed: number;
        [key: string]: any;
    };
    top_doctors: Array<{
        doctor_id: string;
        doctor_name: string;
        appointment_count: number;
        completed_count: number;
        [key: string]: any;
    }>;
    [key: string]: any;
}

export interface AuditLogEntry {
    id: string;
    action: string;
    user: string;
    timestamp: string;
    performed_by_id: string;
    performed_by: string;
    performed_by_role: string;
    created_at_human: string;
    created_at: string;
    ip_address: string;
    patient_name: string;
    token_number: number;
    action_label: string;
    previous_status: string;
    new_status: string;
    reason: string;
    [key: string]: any;
}

export const appointmentSuperAdminApi = {
    async getAllAppointments() {
        const res = await api.get("/super-admin/appointments");
        return res.data;
    },
    async getBranches(): Promise<{ branches: Branch[]; [key: string]: any }> {
        const res = await api.get("/super-admin/branches");
        return res.data as { branches: Branch[]; [key: string]: any };
    },
    async getAllDoctors(params?: any): Promise<{ doctors: Doctor[]; [key: string]: any }> {
        const res = await api.get("/super-admin/doctors", { params });
        return res.data as { doctors: Doctor[]; [key: string]: any };
    },
    async getBranchSettings(params?: any): Promise<{ branches: Array<{ branch_id: string; settings?: AppointmentSettings; [key: string]: any }>; [key: string]: any }> {
        const res = await api.get("/super-admin/branch-settings", { params });
        return res.data as { branches: Array<{ branch_id: string; settings?: AppointmentSettings; [key: string]: any }>; [key: string]: any };
    }
};

export const appointmentBranchAdminApi = {
    async getAppointments(params?: any) {
        const res = await api.get("/branch-admin/appointments", { params });
        return res.data;
    },
    async getDoctors(): Promise<{ doctors: Doctor[]; [key: string]: any }> {
        const res = await api.get("/branch-admin/doctors");
        return res.data as { doctors: Doctor[]; [key: string]: any };
    },
    async getSpecializations() {
        const res = await api.get("/branch-admin/specializations");
        return res.data;
    },
    async getBranchAuditLogs(params?: any) {
        const res = await api.get("/branch-admin/audit-logs", { params });
        return res.data;
    },
    async getAvailableSlots(doctorId: string, date: string) {
        const res = await api.get(`/branch-admin/slots/${doctorId}/${date}`);
        return res.data;
    },
    async rescheduleAppointment(appointmentId: string, data: any) {
        const res = await api.put(`/branch-admin/appointments/${appointmentId}/reschedule`, data);
        return res.data;
    },
    async cancelAppointment(appointmentId: string, reason: string, data?: any) {
        const res = await api.put(`/branch-admin/appointments/${appointmentId}/cancel`, { reason, ...(data ?? {}) });
        return res.data;
    },
    async getAppointmentLogs(bookingId: string) {
        const res = await api.get(`/branch-admin/appointments/${bookingId}/logs`);
        return res.data;
    },
    async modifyAppointment(bookingId: string, data: any) {
        const res = await api.put(`/branch-admin/appointments/${bookingId}`, data);
        return res.data;
    },
    async getSettings() {
        const res = await api.get("/branch-admin/settings");
        return res.data;
    },
    async updateSettings(data: any) {
        const res = await api.put("/branch-admin/settings", data);
        return res.data;
    },
    async registerPatient(data: any) {
        const res = await api.post("/branch-admin/patients", data);
        return res.data;
    },
    async searchPatients(query: string) {
        const res = await api.get("/branch-admin/patients/search", { params: { q: query } });
        return res.data;
    },
    async createAppointment(data: any) {
        const res = await api.post("/branch-admin/appointments", data);
        return res.data;
    },
    async getStatistics(): Promise<{ statistics: AppointmentStatistics; [key: string]: any }> {
        const res = await api.get("/branch-admin/statistics");
        return res.data as { statistics: AppointmentStatistics; [key: string]: any };
    }
};

export const appointmentReceptionistApi = {
    async getAppointments(params?: any) {
        const res = await api.get("/receptionist/appointments", { params });
        return res.data;
    },
    async getDoctors(params?: any): Promise<{ doctors: Doctor[]; [key: string]: any }> {
        const res = await api.get("/receptionist/doctors", { params });
        return res.data as { doctors: Doctor[]; [key: string]: any };
    },
    async getAvailableDoctors(params?: any): Promise<{ doctors: Doctor[]; [key: string]: any }> {
        const res = await api.get("/receptionist/doctors", { params });
        return res.data as { doctors: Doctor[]; [key: string]: any };
    },
    async searchPatients(query: string) {
        const res = await api.get("/receptionist/patients/search", { params: { q: query } });
        return res.data;
    },
    async createWalkInBooking(data: any) {
        const res = await api.post("/receptionist/appointments/walk-in", data);
        return res.data;
    },
    async checkInPatient(bookingId: string) {
        const res = await api.put(`/receptionist/appointments/${bookingId}/check-in`);
        return res.data;
    },
    async cancelAppointment(bookingId: string, reason: string) {
        const res = await api.put(`/receptionist/appointments/${bookingId}/cancel`, { reason });
        return res.data;
    },
    async recordPayment(bookingId: string, data: any) {
        const res = await api.post(`/receptionist/appointments/${bookingId}/payment`, data);
        return res.data;
    }
};

export const appointmentDoctorApi = {
    async getAppointments(params?: any) {
        const res = await api.get("/doctor/appointments", { params });
        return res.data;
    },
    async getStatistics(): Promise<{ statistics: AppointmentStatistics; [key: string]: any }> {
        const res = await api.get("/doctor/statistics");
        return res.data as { statistics: AppointmentStatistics; [key: string]: any };
    },
    async getTodaysQueue() {
        const res = await api.get("/doctor/queue/today");
        return res.data;
    },
    async checkInPatient(bookingId: string) {
        const res = await api.put(`/doctor/appointments/${bookingId}/check-in`);
        return res.data;
    },
    async startSession(bookingId: string) {
        const res = await api.put(`/doctor/appointments/${bookingId}/start-session`);
        return res.data;
    },
    async completeConsultation(bookingId: string, data?: any) {
        const res = await api.put(`/doctor/appointments/${bookingId}/complete`, data ?? {});
        return res.data;
    },
    async markNoShow(bookingId: string, data?: any) {
        const res = await api.put(`/doctor/appointments/${bookingId}/no-show`, data ?? {});
        return res.data;
    }
};

export const appointmentPublicApi = {
    async getAvailableSlots(doctorId: string, dateOrParams?: any, maybeParams?: any): Promise<{ available_days: SlotDay[]; [key: string]: any }> {
        if (typeof dateOrParams === "string") {
            const res = await api.get(`/public/slots/${doctorId}/${dateOrParams}`, {
                params: maybeParams
            });
            return res.data as { available_days: SlotDay[]; [key: string]: any };
        }

        const res = await api.get(`/public/slots/${doctorId}`, {
            params: dateOrParams
        });
        return res.data as { available_days: SlotDay[]; [key: string]: any };
    },
    async searchDoctors(params?: any): Promise<{ doctors: Doctor[]; [key: string]: any }> {
        const res = await api.get("/public/doctors", { params });
        return res.data as { doctors: Doctor[]; [key: string]: any };
    },
    async getBranches() {
        const res = await api.get("/public/branches");
        return res.data;
    },
    async getSpecializations() {
        const res = await api.get("/public/specializations");
        return res.data;
    },
    async getDoctors(params?: any): Promise<{ doctors: Doctor[]; [key: string]: any }> {
        const res = await api.get("/public/doctors", { params });
        return res.data as { doctors: Doctor[]; [key: string]: any };
    }
};

export const appointmentPatientApi = {
    async getMyAppointments(params?: any): Promise<{ appointments: AppointmentBooking[]; [key: string]: any }> {
        const res = await api.get("/patient/appointments", { params });
        return res.data as { appointments: AppointmentBooking[]; [key: string]: any };
    },
    async bookAppointment(data: any) {
        const res = await api.post("/patient/appointments", data);
        return res.data;
    },
    async createBooking(data: any) {
        const res = await api.post("/patient/appointments", data);
        return res.data;
    },
    async confirmPayment(appointmentId: string, data?: any) {
        const res = await api.post(`/patient/appointments/${appointmentId}/payment/confirm`, data ?? {});
        return res.data;
    },
    async cancelAppointment(appointmentId: string, reason: string, data?: any) {
        const res = await api.put(`/patient/appointments/${appointmentId}/cancel`, { reason, ...(data ?? {}) });
        return res.data;
    },
    async getRescheduleEligibility(appointmentId: string) {
        const res = await api.get(`/patient/appointments/${appointmentId}/reschedule-eligibility`);
        return res.data;
    },
    async rescheduleAppointment(appointmentId: string, data: any) {
        const res = await api.put(`/patient/appointments/${appointmentId}/reschedule`, data);
        return res.data;
    }
};

const appointmentService = {
    appointmentSuperAdminApi,
    appointmentBranchAdminApi,
    appointmentReceptionistApi,
    appointmentDoctorApi,
    appointmentPublicApi,
    appointmentPatientApi,
};

export default appointmentService;
