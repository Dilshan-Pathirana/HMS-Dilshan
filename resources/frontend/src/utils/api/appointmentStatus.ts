import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

export interface AppointmentStatusResponse {
    success: boolean;
    status?: 'success' | 'pending' | 'failed';
    message: string;
    data?: {
        appointment_id: number;
        payment_status: string;
        status: string;
        payment_amount?: number;
        payment_date?: string;
        order_id: string;
    };
}

export const checkAppointmentStatus = async (orderId: string): Promise<AppointmentStatusResponse> => {
    try {
        const response = await axios.post(`${API_BASE_URL}/api/appointments/status`, {
            order_id: orderId
        });

        return response.data;
    } catch (error) {
        console.error('Error checking appointment status:', error);
        return {
            success: false,
            status: 'failed',
            message: 'Failed to check appointment status'
        };
    }
};
