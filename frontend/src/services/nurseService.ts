import axios from "axios";

// Base API configuration
const nurseApi = axios.create({
    baseURL: `${import.meta.env.VITE_API_BASE_URL || ''}/api/nurse`,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    }
});

// Add auth token interceptor
nurseApi.interceptors.request.use(function (config) {
    const authorizationToken = localStorage.getItem("token");
    config.headers.Authorization = authorizationToken
        ? `Bearer ${authorizationToken}`
        : "";
    return config;
});

// Types
export interface DashboardStats {
    assignedPatients: number;
    vitalSignsRecorded: number;
    criticalAlerts: number;
    pendingHandovers: number;
    currentShift: NurseShift | null;
    recentVitalSigns: VitalSign[];
    upcomingShifts: NurseShift[];
}

export interface Patient {
    id: number;
    name: string;
    registration_number: string;
    phone: string;
    gender: string;
    age: number;
    blood_type: string;
}

export interface PatientAssignment {
    id: number;
    nurse_id: number;
    patient_id: number;
    branch_id: number;
    ward: string;
    assigned_date: string;
    shift: 'morning' | 'afternoon' | 'night';
    is_primary: boolean;
    is_active: boolean;
    notes: string | null;
    patient: Patient;
    latest_vital_recorded: string | null;
}

export interface VitalSign {
    id: number;
    patient_id: number;
    nurse_id: number;
    branch_id: number;
    temperature: number | null;
    temperature_unit: 'C' | 'F';
    blood_pressure_systolic: number | null;
    blood_pressure_diastolic: number | null;
    pulse_rate: number | null;
    respiration_rate: number | null;
    oxygen_saturation: number | null;
    weight: number | null;
    height: number | null;
    pain_level: number | null;
    consciousness_level: 'Alert' | 'Verbal' | 'Pain' | 'Unresponsive' | null;
    notes: string | null;
    is_abnormal: boolean;
    abnormal_flags: Record<string, string> | null;
    recorded_at: string;
    patient?: { id: number; name: string; registration_number?: string };
    nurse?: { id: number; name: string };
}

export interface VitalSignInput {
    patient_id: number;
    temperature?: number;
    temperature_unit?: 'C' | 'F';
    blood_pressure_systolic?: number;
    blood_pressure_diastolic?: number;
    pulse_rate?: number;
    respiration_rate?: number;
    oxygen_saturation?: number;
    weight?: number;
    height?: number;
    pain_level?: number;
    consciousness_level?: 'Alert' | 'Verbal' | 'Pain' | 'Unresponsive';
    notes?: string;
}

export interface NurseShift {
    id: number;
    nurse_id: number;
    branch_id: number;
    ward: string;
    shift_date: string;
    shift_type: 'morning' | 'afternoon' | 'night';
    scheduled_start: string;
    scheduled_end: string;
    actual_start: string | null;
    actual_end: string | null;
    status: 'scheduled' | 'started' | 'completed' | 'missed' | 'cancelled';
    notes: string | null;
}

export interface ShiftHandover {
    id: number;
    from_nurse_id: number;
    to_nurse_id: number;
    branch_id: number;
    ward: string;
    handover_date: string;
    from_shift: 'morning' | 'afternoon' | 'night';
    to_shift: 'morning' | 'afternoon' | 'night';
    patient_updates: PatientUpdate[];
    pending_tasks: PendingTask[];
    critical_alerts: CriticalAlert[];
    general_notes: string | null;
    special_observations: string | null;
    is_acknowledged: boolean;
    acknowledged_at: string | null;
    fromNurse?: { id: number; name: string };
    toNurse?: { id: number; name: string };
}

export interface PatientUpdate {
    patient_id: number;
    patient_name: string;
    update: string;
}

export interface PendingTask {
    description: string;
    patient_id?: number;
    patient_name?: string;
    priority: 'high' | 'medium' | 'low';
}

export interface CriticalAlert {
    patient_id: number;
    patient_name: string;
    alert: string;
    severity: 'critical' | 'warning';
}

export interface HandoverInput {
    to_nurse_id: number;
    ward: string;
    from_shift: 'morning' | 'afternoon' | 'night';
    to_shift: 'morning' | 'afternoon' | 'night';
    patient_updates?: PatientUpdate[];
    pending_tasks?: PendingTask[];
    critical_alerts?: CriticalAlert[];
    general_notes?: string;
    special_observations?: string;
}

export interface NurseProfile {
    user: {
        id: number;
        name: string;
        email: string;
        phone: string | null;
        address: string | null;
        emergency_contact: string | null;
        profile_picture: string | null;
        role: string;
        medicalCenter?: { id: number; name: string; address: string };
    };
    stats: {
        totalVitalSignsRecorded: number;
        totalShiftsCompleted: number;
        totalHandoversCreated: number;
    };
}

export interface Nurse {
    id: number;
    name: string;
    email: string;
}

// API Functions
export const nurseService = {
    // Dashboard
    getDashboardStats: async (): Promise<DashboardStats | null> => {
        try {
            const response = await nurseApi.get('/dashboard-stats');
            return response.data?.data || null;
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
            return null;
        }
    },

    // Patients
    getAssignedPatients: async (params?: { ward?: string; shift?: string; date?: string }) => {
        const response = await nurseApi.get('/patients', { params });
        return response.data.data as PatientAssignment[];
    },

    getAllPatients: async (search?: string) => {
        const response = await nurseApi.get('/patients/all', { params: { search } });
        return response.data.data as Patient[];
    },

    getPatientDetails: async (patientId: number) => {
        const response = await nurseApi.get(`/patients/${patientId}`);
        return response.data.data;
    },

    // Vital Signs
    getVitalSigns: async (params?: {
        patient_id?: number;
        nurse_id?: number;
        start_date?: string;
        end_date?: string;
        abnormal_only?: boolean;
        per_page?: number;
        page?: number;
    }) => {
        const response = await nurseApi.get('/vital-signs', { params });
        return response.data.data;
    },

    recordVitalSigns: async (data: VitalSignInput): Promise<VitalSign> => {
        const response = await nurseApi.post('/vital-signs', data);
        return response.data.data;
    },

    updateVitalSigns: async (id: number, data: Partial<VitalSignInput>): Promise<VitalSign> => {
        const response = await nurseApi.put(`/vital-signs/${id}`, data);
        return response.data.data;
    },

    // Shifts
    getShifts: async (params?: { start_date?: string; end_date?: string }) => {
        const response = await nurseApi.get('/shifts', { params });
        return response.data.data as NurseShift[];
    },

    getCurrentShift: async (): Promise<NurseShift | null> => {
        const response = await nurseApi.get('/shifts/current');
        return response.data.data;
    },

    startShift: async (shiftId: number): Promise<NurseShift> => {
        const response = await nurseApi.post(`/shifts/${shiftId}/start`);
        return response.data.data;
    },

    endShift: async (shiftId: number): Promise<NurseShift> => {
        const response = await nurseApi.post(`/shifts/${shiftId}/end`);
        return response.data.data;
    },

    // Handovers
    getHandovers: async (params?: {
        start_date?: string;
        end_date?: string;
        pending_only?: boolean;
        per_page?: number;
        page?: number;
    }) => {
        const response = await nurseApi.get('/handovers', { params });
        return response.data.data;
    },

    createHandover: async (data: HandoverInput): Promise<ShiftHandover> => {
        const response = await nurseApi.post('/handovers', data);
        return response.data.data;
    },

    acknowledgeHandover: async (handoverId: number): Promise<ShiftHandover> => {
        const response = await nurseApi.post(`/handovers/${handoverId}/acknowledge`);
        return response.data.data;
    },

    // Profile
    getProfile: async (): Promise<NurseProfile> => {
        const response = await nurseApi.get('/profile');
        return response.data.data;
    },

    updateProfile: async (data: { phone?: string; address?: string; emergency_contact?: string }) => {
        const response = await nurseApi.put('/profile', data);
        return response.data.data;
    },

    changePassword: async (data: { current_password: string; new_password: string; new_password_confirmation: string }) => {
        const response = await nurseApi.put('/profile/password', data);
        return response.data;
    },

    // Utilities
    getWards: async (): Promise<string[]> => {
        const response = await nurseApi.get('/wards');
        return response.data.data;
    },

    getNursesList: async (): Promise<Nurse[]> => {
        const response = await nurseApi.get('/nurses-list');
        return response.data.data;
    },
};

export default nurseService;
