export interface IDoctorOption {
    value: string;
    label: string;
}

export interface IQuestionFormData {
    doctor_id: string;
    question: string;
    category: string;
    description: string;
    order: string;
    status: string;
}

export interface CreateQuestionFormProps {
    formData: IQuestionFormData;
    doctorOptions: IDoctorOption[];
    selectedDoctor: IDoctorOption | null;
    errors: Record<string, string[]>;
    isLoading: boolean;
    onInputChange: (
        event: React.ChangeEvent<
            HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >,
    ) => void;
    onDoctorChange: (selectedOption: IDoctorOption | null) => void;
    onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

export interface CreateDoctorQuestionFormProps {
    formData: IQuestionFormData;
    errors: Record<string, string[]>;
    isLoading: boolean;
    onInputChange: (
        event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => void;
    onSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
}

export interface DoctorQuestionFormData {
    doctor_id: string;
    question: string;
    category: string;
    description: string;
    order: string;
    status: string;
}

export interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}
