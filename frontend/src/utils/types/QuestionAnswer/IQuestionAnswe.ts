import {IQuestionData} from "../CreateQuestions/IAllQuestions.ts";

export interface Answer {
    id?: string;
    answer: string;
}

export interface QuestionAnswerModalProps {
    isOpen: boolean;
    question: IQuestionData | null;
    onClose: () => void;
    triggerRefresh?: () => void;
}
