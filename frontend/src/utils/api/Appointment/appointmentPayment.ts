import api from "../axios";
import { userDetailsTypes } from "../../types/Appointment/IDoctorSchedule.ts";

export interface AppointmentData {
    doctorId: string;
    scheduleId: string;
    branchId: string;
    date: string;
    slot: number;
}

export interface CreateAppointmentPayload {
    first_name: string;
    last_name: string;
    phone: string;
    NIC: string;
    email: string;
    address: string;
    doctor_id?: string;
    schedule_id?: string;
    branch_id?: string;
    date?: string;
    slot?: number;
}

export interface CreateAppointmentResponse {
    success: boolean;
    data?: {
        id: string;
        appointment_id: string;
        order_id: string;
        [key: string]: any;
    };
    message?: string;
    error?: string;
}

export const createAppointmentForPayment = async (
    userDetails: userDetailsTypes,
    appointmentData?: AppointmentData
): Promise<CreateAppointmentResponse> => {
    try {
        const payload: CreateAppointmentPayload = {
            first_name: userDetails.firstName,
            last_name: userDetails.lastName,
            phone: userDetails.phone,
            NIC: userDetails.nic,
            email: userDetails.email,
            address: userDetails.address,
            doctor_id: appointmentData?.doctorId,
            schedule_id: appointmentData?.scheduleId,
            branch_id: appointmentData?.branchId,
            date: appointmentData?.date,
            slot: appointmentData?.slot
        };

        // const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

        const { data: result } = await api.post(`api/create-patient-appointment`, payload, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                // Add any authentication headers if needed
                // 'Authorization': `Bearer ${token}`,
            }
        });

        return {
            success: true,
            data: result.data || result,
            message: result.message
        };

    } catch (error) {
        console.error('Error creating appointment:', error);

        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
};

export const generatePaymentOrderId = (appointmentId?: string): string => {
    if (appointmentId) {
        return `APPT_${appointmentId}_${Date.now()}`;
    }
    return `ORDER_${Date.now()}`;
};
