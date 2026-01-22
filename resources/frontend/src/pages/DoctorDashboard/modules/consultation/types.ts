// Consultation Module Types

export interface QueuePatient {
    id: string;
    patient_id: string;
    appointment_date: string;
    appointment_time: string;
    slot_number: number;
    token_number: number;
    status: string;
    payment_status: string;
    notes: string | null;
    patient_name: string;
    patient_phone: string;
    patient_gender: string;
    patient_dob: string | null;
    age: number | null;
    consultation_id: string | null;
    consultation_status: string | null;
    display_status: 'Waiting' | 'Checked In' | 'In Consultation' | 'Completed';
}

export interface PatientOverview {
    patient: {
        id: string;
        first_name: string;
        last_name: string;
        phone: string;
        email: string | null;
        date_of_birth: string | null;
        age: number | null;
        gender: string | null;
        blood_type: string | null;
        allergies: string | null;
        medical_conditions: string | null;
        emergency_contact: string | null;
        address: string | null;
    };
    past_consultations: PastConsultation[];
    all_diagnoses: DiagnosisRecord[];
    medication_history: MedicationRecord[];
}

export interface PastConsultation {
    id: string;
    started_at: string;
    chief_complaint: string | null;
    clinical_notes: string | null;
    follow_up_instructions: string | null;
    consultation_fee: number;
    status: string;
    doctor_first_name: string;
    doctor_last_name: string;
    diagnoses: { diagnosis_name: string; diagnosis_type: string }[];
    prescriptions: {
        medicine_name: string;
        potency: string;
        dosage: string;
        frequency: string;
        duration: string;
        instructions: string | null;
    }[];
}

export interface DiagnosisRecord {
    diagnosis_name: string;
    diagnosis_type: string;
    created_at: string;
}

export interface MedicationRecord {
    medicine_name: string;
    potency: string;
    dosage: string;
    frequency: string;
    duration: string;
    started_at: string;
}

export interface Consultation {
    id: string;
    appointment_id: string;
    patient_id: string;
    doctor_id: string;
    branch_id: string;
    status: 'in_progress' | 'completed' | 'payment_pending' | 'paid' | 'medicines_issued';
    started_at: string;
    completed_at: string | null;
    chief_complaint: string | null;
    clinical_notes: string | null;
    follow_up_instructions: string | null;
    consultation_fee: number;
    payment_collected_at: string | null;
    payment_collected_by: string | null;
    medicines_issued_at: string | null;
    medicines_issued_by: string | null;
}

export interface QuestionBankItem {
    id: string;
    category: 'general_symptoms' | 'mental_state' | 'physical_symptoms' | 'modalities';
    sub_category: string | null;
    question_text: string;
    answer_type: 'text' | 'yes_no' | 'scale' | 'multiple_choice';
    options: string[] | null;
    is_required: boolean;
    display_order: number;
}

export interface ConsultationQuestion {
    id: string;
    consultation_id: string;
    question_bank_id: string | null;
    question_text: string;
    answer_text: string;
    is_custom: boolean;
}

export interface Diagnosis {
    id: string;
    diagnosis_code: string;
    diagnosis_name: string;
    category: 'acute' | 'chronic' | 'constitutional';
    description: string | null;
}

export interface ConsultationDiagnosis {
    diagnosis_id: string;
    diagnosis_type: 'primary' | 'secondary' | 'differential';
    notes: string;
}

export interface Medicine {
    id: number;
    product_name: string;
    batch_number: string | null;
    sku: string | null;
    category: string;
    current_quantity: number;
    unit: string;
    price: number;
}

export interface Prescription {
    medicine_id: number | null;
    medicine_name: string;
    potency: string;
    dosage: string;
    frequency: string;
    duration: string;
    quantity: number;
    instructions: string;
}

export interface ConsultationFlowState {
    currentStep: number;
    consultation: Consultation | null;
    patient: PatientOverview | null;
    questions: ConsultationQuestion[];
    diagnoses: ConsultationDiagnosis[];
    prescriptions: Prescription[];
    consultationFee: number;
    chiefComplaint: string;
    clinicalNotes: string;
    followUpInstructions: string;
}

// Fee options
export const CONSULTATION_FEE_OPTIONS = [
    { label: 'Free', value: 0 },
    { label: 'Rs. 500', value: 500 },
    { label: 'Rs. 1,000', value: 1000 },
    { label: 'Rs. 2,000', value: 2000 },
    { label: 'Rs. 2,500', value: 2500 },
    { label: 'Rs. 3,000', value: 3000 },
    { label: 'Rs. 3,500', value: 3500 },
];
