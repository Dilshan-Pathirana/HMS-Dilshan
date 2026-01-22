export interface IDoctorSessionFormTypes {
    branch_id: string;
    doctor_id: string;
    patient_id: string;
}

export interface IDropdownOption {
    value: string;
    label: string;
}

export interface IDoctorData {
    user_id: string;
    first_name: string;
    last_name: string;
    medical_registration_number: string;
}

export interface IPatientData {
    id: string;
    first_name: string;
    last_name: string;
}

export interface IDoctorSession {
    id: string;
    branch_id: string;
    branch_center_name: string;
    doctor_id: string;
    doctor_first_name: string;
    doctor_last_name: string;
    patient_id: string;
    patient_first_name: string;
    patient_last_name: string;
    session_date?: string;
    session_time?: string;
    status?: string;
    notes?: string;
}

export interface IGetDoctorSessionsProps {
    refreshSessions?: boolean;
}

export interface IQuestionData {
    id: string;
    doctor_id: string;
    question: string;
    description: string;
    order: number;
    status: number;
    doctor_first_name: string;
    doctor_last_name: string;
}

export interface IQuestionAnswer {
    id: string;
    question_id: string;
    question_text: string;
    answer: string;
}

export interface IQuestionWithAnswers extends IQuestionData {
    answers: IQuestionAnswer[];
    isExpanded: boolean;
}

export interface IQuestionData {
    id: string;
    doctor_id: string;
    question: string;
    description: string;
    order: number;
    status: number;
    doctor_first_name: string;
    doctor_last_name: string;
}

export interface IQuestionAnswer {
    id: string;
    question_id: string;
    question_text: string;
    answer: string;
}

export interface IQuestionWithAnswers extends IQuestionData {
    answers: IQuestionAnswer[];
    isExpanded: boolean;
}

export interface IQuestionsModalProps {
    isOpen: boolean;
    selectedSession: IDoctorSession | null;
    questionsWithAnswers: IQuestionWithAnswers[];
    loadingQuestions: boolean;
    onClose: () => void;
    onToggleQuestion: (questionId: string) => void;
}

export interface DoctorSessionProps {
    sessions: IDoctorSession[];
    onStartSession: (session: IDoctorSession) => void;
}

export interface DoctorModalProps {
    question: IQuestionWithAnswers;
    selectedAnswerId: string | null;
    onToggle: () => void;
    onSelectAnswer: (answerId: string, answerText: string) => void;
}

export interface ExtendedDoctorModalProps extends DoctorModalProps {
    customAnswerText?: string;
    onAddCustomAnswer: (customAnswerText: string) => void;
    isSessionSaved: boolean;
}
