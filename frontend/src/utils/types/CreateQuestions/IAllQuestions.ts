export interface IQuestionData {
    id: string;
    doctor_id: string;
    doctor_first_name: string;
    doctor_last_name: string;
    question: string;
    category?: string;
    description: string;
    order: number;
    status: string;
}

export interface QuestionEditModalProps {
    isOpen: boolean;
    questionData: IQuestionData | null;
    onClose: () => void;
    triggerRefresh: () => void;
}

export interface QuestionViewModalProps {
    isOpen: boolean;
    question: IQuestionData | null;
    onClose: () => void;
}

export interface DoctorQuestionViewModalProps {
    isOpen: boolean;
    question: IQuestionData | null;
    onClose: () => void;
}

export interface DoctorQuestionEditModalProps {
    isOpen: boolean;
    questionData: IQuestionData | null;
    onClose: () => void;
    triggerRefresh: () => void;
}
