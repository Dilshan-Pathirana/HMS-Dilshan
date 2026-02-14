import api from "../utils/api/axios";

export interface AppointmentBooking {
    id: string;
    patient_name: string;
    patient_id: string;
    doctor_name: string;
    doctor_id: string;
    branch_name: string;
    branch_id: string;
    appointment_date: string;
    appointment_time: string;
    status: string;
    payment_status: string;
    queue_number?: number;
    created_at?: string;
}

export const appointmentSuperAdminApi = {
    async getAllAppointments() {
        const res = await api.get("/super-admin/appointments");
        return res.data;
    }
};
