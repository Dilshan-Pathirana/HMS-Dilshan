import api from "../../../../utils/api/axios";
import {
    QueuePatient,
    PatientOverview,
    Consultation,
    QuestionBankItem,
    ConsultationQuestion,
    Diagnosis,
    ConsultationDiagnosis,
    Medicine,
    Prescription,
    DoctorOpinion,
    AutoSummary,
    IssuedMedicine,
    PharmacyQueueItem,
    VitalSigns,
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

// ============================================================
// Queue Management
// ============================================================

export const getTodayQueue = async (doctorId: string): Promise<{
    queue: QueuePatient[];
    date: string;
    total: number;
    waiting: number;
    in_consultation: number;
    completed: number;
}> => {
    const response = await api.get(`/consultation/queue/${doctorId}`, getAuthHeaders());
    return response.data;
};

export const getAppointmentsByDate = async (doctorId: string, date: string): Promise<{
    appointments: QueuePatient[];
    date: string;
    total: number;
}> => {
    const response = await api.get(`/consultation/appointments/${doctorId}/${date}`, getAuthHeaders());
    return response.data;
};

// ============================================================
// Patient Overview
// ============================================================

export const getPatientOverview = async (patientId: string): Promise<PatientOverview> => {
    const response = await api.get(`/consultation/patient/${patientId}`, getAuthHeaders());
    return response.data;
};

// ============================================================
// Consultation Management
// ============================================================

export const startConsultation = async (appointmentId: string, doctorId: string, chiefComplaint?: string): Promise<{
    status: number;
    message: string;
    consultation: Consultation;
}> => {
    const response = await api.post('/consultation/start', {
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
    const response = await api.get(`/consultation/${consultationId}`, getAuthHeaders());
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
    const response = await api.post(`/consultation/${consultationId}/submit`, data, getAuthHeaders());
    return response.data;
};

// ============================================================
// Question Bank
// ============================================================

export const getQuestionBank = async (category?: string): Promise<{
    status: number;
    questions: QuestionBankItem[];
    categories: string[];
}> => {
    const params = category ? `?category=${category}` : '';
    const response = await api.get(`/consultation/questions/bank${params}`, getAuthHeaders());
    return response.data;
};

export const saveQuestions = async (
    consultationId: string,
    questions: { question_bank_id?: string; question_text: string; answer_text: string; is_custom?: boolean; answer_type?: string; category?: string; display_order?: number }[]
): Promise<{ status: number; message: string }> => {
    const response = await api.post(`/consultation/${consultationId}/questions`, {
        questions
    }, getAuthHeaders());
    return response.data;
};

export const getConsultationQuestions = async (consultationId: string): Promise<{
    questions: ConsultationQuestion[];
}> => {
    const response = await api.get(`/consultation/${consultationId}/questions`, getAuthHeaders());
    return response.data;
};

// ============================================================
// Auto-Summary
// ============================================================

export const generateAutoSummary = async (consultationId: string): Promise<{
    summary: AutoSummary;
}> => {
    const response = await api.post(`/consultation/${consultationId}/auto-summary`, {}, getAuthHeaders());
    return response.data;
};

// ============================================================
// Nurse Vitals (for doctor view)
// ============================================================

export const getConsultationVitals = async (consultationId: string): Promise<{
    vitals: VitalSigns | null;
}> => {
    const response = await api.get(`/consultation/${consultationId}/vitals`, getAuthHeaders());
    return response.data;
};

// ============================================================
// Second Opinion
// ============================================================

export const requestSecondOpinion = async (
    consultationId: string,
    reviewingDoctorId: string
): Promise<DoctorOpinion> => {
    const response = await api.post(`/consultation/${consultationId}/request-opinion`, {
        reviewing_doctor_id: reviewingDoctorId,
    }, getAuthHeaders());
    return response.data;
};

export const respondToOpinion = async (
    opinionId: string,
    data: { status: string; comment?: string; suggestion?: string }
): Promise<DoctorOpinion> => {
    const response = await api.post(`/consultation/opinions/${opinionId}/respond`, data, getAuthHeaders());
    return response.data;
};

export const getConsultationOpinions = async (consultationId: string): Promise<{
    opinions: DoctorOpinion[];
}> => {
    const response = await api.get(`/consultation/${consultationId}/opinions`, getAuthHeaders());
    return response.data;
};

export const getPendingOpinions = async (): Promise<{
    opinions: DoctorOpinion[];
}> => {
    const response = await api.get('/consultation/opinions/pending', getAuthHeaders());
    return response.data;
};

// ============================================================
// Diagnoses
// ============================================================

export const getDiagnoses = async (search?: string, category?: string): Promise<{
    status: number;
    diagnoses: Diagnosis[];
}> => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (category) params.append('category', category);
    const queryString = params.toString();
    const response = await api.get(`/consultation/diagnoses/list${queryString ? '?' + queryString : ''}`, getAuthHeaders());
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
    const response = await api.post('/consultation/diagnoses/add', diagnosis, getAuthHeaders());
    return response.data;
};

export const saveDiagnoses = async (
    consultationId: string,
    diagnoses: ConsultationDiagnosis[]
): Promise<{ status: number; message: string }> => {
    const response = await api.post(`/consultation/${consultationId}/diagnoses`, {
        diagnoses
    }, getAuthHeaders());
    return response.data;
};

export const getConsultationDiagnoses = async (consultationId: string): Promise<{
    diagnoses: any[];
}> => {
    const response = await api.get(`/consultation/${consultationId}/diagnoses`, getAuthHeaders());
    return response.data;
};

// ============================================================
// Medicines & Prescriptions
// ============================================================

export const getMedicines = async (search?: string, branchId?: string): Promise<{
    status: number;
    medicines: Medicine[];
}> => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (branchId) params.append('branch_id', branchId);
    const queryString = params.toString();
    const response = await api.get(`/consultation/medicines/list${queryString ? '?' + queryString : ''}`, getAuthHeaders());
    return response.data;
};

export const savePrescriptions = async (
    consultationId: string,
    prescriptions: Prescription[]
): Promise<{ status: number; message: string }> => {
    const response = await api.post(`/consultation/${consultationId}/prescriptions`, {
        prescriptions
    }, getAuthHeaders());
    return response.data;
};

export const getConsultationPrescriptions = async (consultationId: string): Promise<{
    prescriptions: any[];
}> => {
    const response = await api.get(`/consultation/${consultationId}/prescriptions`, getAuthHeaders());
    return response.data;
};

// ============================================================
// Pharmacy
// ============================================================

export const getPharmacyQueue = async (branchId?: string): Promise<{
    queue: PharmacyQueueItem[];
}> => {
    const params = branchId ? `?branch_id=${branchId}` : '';
    const response = await api.get(`/consultation/pharmacy/queue${params}`, getAuthHeaders());
    return response.data;
};

export const issueMedicine = async (
    consultationId: string,
    data: {
        prescription_id: string;
        medicine_name: string;
        quantity_issued: number;
        batch_number?: string;
        notes?: string;
    }
): Promise<IssuedMedicine> => {
    const response = await api.post(`/consultation/${consultationId}/issue-medicine`, data, getAuthHeaders());
    return response.data;
};

export const markMedicinesIssued = async (consultationId: string): Promise<{
    consultation: Consultation;
}> => {
    const response = await api.post(`/consultation/${consultationId}/mark-issued`, {}, getAuthHeaders());
    return response.data;
};

export const getIssuedMedicines = async (consultationId: string): Promise<{
    issued_medicines: IssuedMedicine[];
}> => {
    const response = await api.get(`/consultation/${consultationId}/issued-medicines`, getAuthHeaders());
    return response.data;
};

// ============================================================
// Payment
// ============================================================

export const collectPayment = async (
    consultationId: string,
    fee?: number
): Promise<{ consultation: Consultation }> => {
    const response = await api.post(`/consultation/${consultationId}/collect-payment`, { fee }, getAuthHeaders());
    return response.data;
};

// ============================================================
// Audit Log
// ============================================================

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
    const response = await api.get(`/consultation/${consultationId}/audit`, getAuthHeaders());
    return response.data;
};
