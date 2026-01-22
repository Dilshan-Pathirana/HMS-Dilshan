import axios from 'axios';
import {
    QueuePatient,
    PatientOverview,
    Consultation,
    QuestionBankItem,
    ConsultationQuestion,
    Diagnosis,
    ConsultationDiagnosis,
    Medicine,
    Prescription
} from './types';

// Get authorization headers
const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    };
};

// Queue Management
export const getTodayQueue = async (doctorId: string): Promise<{
    queue: QueuePatient[];
    date: string;
    total: number;
    waiting: number;
    in_consultation: number;
    completed: number;
}> => {
    const response = await axios.get(`/api/consultation/queue/${doctorId}`, getAuthHeaders());
    return response.data;
};

export const getAppointmentsByDate = async (doctorId: string, date: string): Promise<{
    appointments: QueuePatient[];
    date: string;
    total: number;
}> => {
    const response = await axios.get(`/api/consultation/appointments/${doctorId}/${date}`, getAuthHeaders());
    return response.data;
};

// Patient Overview
export const getPatientOverview = async (patientId: string): Promise<PatientOverview> => {
    const response = await axios.get(`/api/consultation/patient/${patientId}`, getAuthHeaders());
    return response.data;
};

// Consultation Management
export const startConsultation = async (appointmentId: string, doctorId: string, chiefComplaint?: string): Promise<{
    status: number;
    message: string;
    consultation: Consultation;
}> => {
    const response = await axios.post('/api/consultation/start', {
        appointment_id: appointmentId,
        doctor_id: doctorId,
        chief_complaint: chiefComplaint
    }, getAuthHeaders());
    return response.data;
};

export const getConsultation = async (consultationId: string): Promise<{
    status: number;
    consultation: Consultation;
    questions: ConsultationQuestion[];
    diagnoses: any[];
    prescriptions: any[];
}> => {
    const response = await axios.get(`/api/consultation/${consultationId}`, getAuthHeaders());
    return response.data;
};

export const submitConsultation = async (
    consultationId: string,
    data: {
        consultation_fee: number;
        clinical_notes?: string;
        follow_up_instructions?: string;
    }
): Promise<{ status: number; message: string }> => {
    const response = await axios.post(`/api/consultation/${consultationId}/submit`, data, getAuthHeaders());
    return response.data;
};

// Question Bank
export const getQuestionBank = async (category?: string): Promise<{
    status: number;
    questions: QuestionBankItem[];
    categories: string[];
}> => {
    const params = category ? `?category=${category}` : '';
    const response = await axios.get(`/api/consultation/questions/bank${params}`, getAuthHeaders());
    return response.data;
};

export const saveQuestions = async (
    consultationId: string,
    questions: { question_bank_id?: string; question_text: string; answer_text: string; is_custom?: boolean }[]
): Promise<{ status: number; message: string }> => {
    const response = await axios.post(`/api/consultation/${consultationId}/questions`, {
        questions
    }, getAuthHeaders());
    return response.data;
};

// Diagnoses
export const getDiagnoses = async (search?: string, category?: string): Promise<{
    status: number;
    diagnoses: Diagnosis[];
}> => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (category) params.append('category', category);
    const queryString = params.toString();
    const response = await axios.get(`/api/consultation/diagnoses/list${queryString ? '?' + queryString : ''}`, getAuthHeaders());
    return response.data;
};

export const addDiagnosis = async (diagnosis: {
    diagnosis_code: string;
    diagnosis_name: string;
    category: 'acute' | 'chronic' | 'constitutional';
    description?: string;
}): Promise<{
    status: number;
    message: string;
    diagnosis: Diagnosis;
}> => {
    const response = await axios.post('/api/consultation/diagnoses/add', diagnosis, getAuthHeaders());
    return response.data;
};

export const saveDiagnoses = async (
    consultationId: string,
    diagnoses: ConsultationDiagnosis[]
): Promise<{ status: number; message: string }> => {
    const response = await axios.post(`/api/consultation/${consultationId}/diagnoses`, {
        diagnoses
    }, getAuthHeaders());
    return response.data;
};

// Medicines
export const getMedicines = async (search?: string, branchId?: string): Promise<{
    status: number;
    medicines: Medicine[];
}> => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (branchId) params.append('branch_id', branchId);
    const queryString = params.toString();
    const response = await axios.get(`/api/consultation/medicines/list${queryString ? '?' + queryString : ''}`, getAuthHeaders());
    return response.data;
};

export const savePrescriptions = async (
    consultationId: string,
    prescriptions: Prescription[]
): Promise<{ status: number; message: string }> => {
    const response = await axios.post(`/api/consultation/${consultationId}/prescriptions`, {
        prescriptions
    }, getAuthHeaders());
    return response.data;
};

// Audit Log
export const getAuditLog = async (consultationId: string): Promise<{
    status: number;
    audit_logs: {
        id: string;
        user_id: string;
        user_role: string;
        action: string;
        details: string;
        old_values: any;
        new_values: any;
        ip_address: string;
        created_at: string;
    }[];
}> => {
    const response = await axios.get(`/api/consultation/${consultationId}/audit`, getAuthHeaders());
    return response.data;
};
