import api from '../utils/api/axios';

export interface SessionListItem {
    id: string;
    session_date: string;
    start_time: string;
    end_time: string;
    doctor_id: string;
    doctor_name: string;
    branch_id: string;
    branch_name: string;
    appointment_count: number;
    total_slots: number;
    assigned_staff_count: number;
    status: string;
    patients: any[];
}

export interface SessionDetail extends SessionListItem {
    schedule_id?: string;
    assigned_nurses: { id: string; name: string }[];
    queue_status?: {
        current_doctor_slot: number;
        current_nurse_slot: number;
        status: string;
    };
}

export interface NurseItem {
    id: string;
    name: string;
}

export const patientSessionApi = {
    getSessions: async (params?: any) => {
        const data = await api.get<SessionListItem[]>('/sessions', { params });
        return { sessions: data, status: 200 };
    },
    getSessionDetail: async (id: string) => {
        const data = await api.get<SessionDetail>(`/sessions/${id}`);
        return data;
    },
    getAvailableNurses: async (sessionId: string) => {
        const data = await api.get<NurseItem[]>(`/sessions/${sessionId}/available-nurses`);
        return data;
    },
    assignNurses: async (sessionId: string, nurseIds: string[]) => {
        const data = await api.post(`/sessions/${sessionId}/assign-nurses`, { nurse_ids: nurseIds });
        return data;
    },
    initiateSession: async (sessionId: string, nurseIds: string[]) => {
        const data = await api.post<SessionDetail>(`/sessions/${sessionId}/initiate`, { nurse_ids: nurseIds });
        return data;
    },
    getMySessions: async (params?: { session_date?: string; doctor_id?: string; branch_id?: string }) => {
        const data = await api.get<SessionListItem[]>('/my-sessions', { params });
        return data;
    },
    getMyActiveSessions: async () => {
        const data = await api.get<SessionListItem[]>('/my-active-sessions');
        return data;
    },
    updateQueue: async (sessionId: string, payload: { current_doctor_slot?: number; current_nurse_slot?: number; status?: string }) => {
        const data = await api.patch(`/sessions/${sessionId}/queue`, payload);
        return data;
    },
    getSessionPatients: async (sessionId: string) => {
        const data = await api.get<SessionPatientItem[]>(`/sessions/${sessionId}/patients`);
        return data;
    },
    getSessionSlots: async (sessionId: string) => {
        const data = await api.get<SessionSlotItem[]>(`/sessions/${sessionId}/slots`);
        return data;
    },
    searchSessionPatients: async (sessionId: string, params: { q?: string; phone?: string }) => {
        const data = await api.get<SessionPatientSearchItem[]>(`/sessions/${sessionId}/patient-search`, { params });
        return data;
    },
    attachPatientToSlot: async (
        sessionId: string,
        slotIndex: number,
        payload: {
            patient_id?: string;
            force_replace?: boolean;
            new_patient?: { name: string; age?: number; address?: string; phone: string };
        }
    ) => {
        const data = await api.post(`/sessions/${sessionId}/slots/${slotIndex}/attach-patient`, payload);
        return data;
    },
    deleteSession: async (sessionId: string) => {
        const data = await api.delete(`/sessions/${sessionId}`);
        return data;
    }
};

export interface SessionPatientItem {
    appointment_id: string;
    appointment_time: string;
    status: string;
    patient_id: string;
    patient_name: string;
}

export interface SessionSlotItem {
    slot_index: number;
    slot_time: string;
    appointment_id?: string | null;
    patient_id?: string | null;
    patient_name?: string | null;
    status?: string | null;
    is_current_with_doctor: boolean;
    is_current_with_nurse: boolean;
}

export interface SessionPatientSearchItem {
    patient_id: string;
    user_id: string;
    name: string;
    phone?: string;
    address?: string;
}
