import {
    DoctorQuestionFormData,
    IQuestionFormData,
} from "../../types/CreateQuestions/ICreateQuestions.ts";

export const questionFormInitialState: IQuestionFormData = {
    doctor_id: "",
    question: "",
    description: "",
    order: "",
    status: "1",
};

export interface DoctorQuestionFormFieldsProps {
    formData: DoctorQuestionFormData;
    errors: Record<string, string[]>;
    onChange: (
        event: React.ChangeEvent<
            HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >,
    ) => void;
}
