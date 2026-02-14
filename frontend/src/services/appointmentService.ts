import api from "../utils/api/axios";

export interface AppointmentBooking {
    id: string;
    patient_name: string;
    patient_id: string;
    patient_phone?: string;
    doctor_name: string;
    doctor_id: string;
    doctor_specialization?: string;
    branch_name: string;
    branch_id: string;
    appointment_date: string;
    appointment_time: string;
    status: string;
    payment_status: string;
    queue_number?: number;
    token_number?: number;
    slot_number?: number;
    booking_type?: string;
    booking_fee?: number;
    amount_paid?: number;
    notes?: string;
    cancellation_reason?: string;
    cancelled_by_user_for_doctor?: string;
    appointment_type?: string;
    created_at?: string;
}

export interface Doctor {
    id: string;
    name: string;
    specialization?: string;
}

export interface Branch {
    id: string;
    name: string;
}

export interface SlotDay {
    date: string;
    slots: TimeSlot[];
}

export interface TimeSlot {
    id: string;
    time: string;
    available: boolean;
}

export interface SlotInfo {
    id: string;
    time: string;
    available: boolean;
}

export interface PatientSearchResult {
    id: string;
    name: string;
    phone?: string;
}

export interface AppointmentSettings {
    id: string;
    setting_name: string;
    setting_value: string;
}

export interface AppointmentLog {
    id: string;
    action: string;
    timestamp: string;
}

export interface AppointmentStatistics {
    total_appointments: number;
    completed: number;
    cancelled: number;
}

export interface AuditLogEntry {
    id: string;
    action: string;
    user: string;
    timestamp: string;
}

export const appointmentSuperAdminApi = {
    async getAllAppointments() {
        const res = await api.get("/super-admin/appointments");
        return res.data;
    },
    async getBranches() {
        const res = await api.get("/super-admin/branches");
        return res.data;
    },
    async getAllDoctors() {
        const res = await api.get("/super-admin/doctors");
        return res.data;
    },
    async getBranchSettings() {
        const res = await api.get("/super-admin/branch-settings");
        return res.data;
    }
};

export const appointmentBranchAdminApi = {
    async getAppointments(params?: any) {
        const res = await api.get("/branch-admin/appointments", { params });
        return res.data;
    },
    async getDoctors() {
        const res = await api.get("/branch-admin/doctors");
        return res.data;
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
    async cancelAppointment(appointmentId: string, reason: string) {
        const res = await api.put(`/branch-admin/appointments/${appointmentId}/cancel`, { reason });
        return res.data;
    },
    async getSettings() {
        const res = await api.get("/branch-admin/settings");
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
    async getStatistics() {
        const res = await api.get("/branch-admin/statistics");
        return res.data;
    }
};

export const appointmentReceptionistApi = {
    async getAppointments(params?: any) {
        const res = await api.get("/receptionist/appointments", { params });
        return res.data;
    },
    async getDoctors() {
        const res = await api.get("/receptionist/doctors");
        return res.data;
    }
};

export const appointmentDoctorApi = {
    async getAppointments(params?: any) {
        const res = await api.get("/doctor/appointments", { params });
        return res.data;
    },
    async getStatistics() {
        const res = await api.get("/doctor/statistics");
        return res.data;
    }
};

export const appointmentPublicApi = {
    async getAvailableSlots(doctorId: string, date: string) {
        const res = await api.get(`/public/slots/${doctorId}/${date}`);
        return res.data;
    },
    async getDoctors() {
        const res = await api.get("/public/doctors");
        return res.data;
    },
    async getBranches() {
        const res = await api.get("/public/branches");
        return res.data;
    }
};

export const appointmentPatientApi = {
    async getMyAppointments() {
        const res = await api.get("/patient/appointments");
        return res.data;
    },
    async bookAppointment(data: any) {
        const res = await api.post("/patient/appointments", data);
        return res.data;
    },
    async cancelAppointment(appointmentId: string, reason: string) {
        const res = await api.put(`/patient/appointments/${appointmentId}/cancel`, { reason });
        return res.data;
    }
};
