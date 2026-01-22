import { useMemo } from "react";

interface QuestionData {
    status: string | number | null | undefined;
    order: string | number | null | undefined;
    question: string;
    description?: string;
}

export const useQuestionViewData = (question: QuestionData | null) => {
    const questionDetails = useMemo(() => {
        if (!question) {
            return {
                status: null,
                order: "",
                questionText: "",
                description: "",
            };
        }

        return {
            status: question.status,
            order: question.order?.toString() || "",
            questionText: question.question || "",
            description: question.description || "No description provided",
        };
    }, [question]);

    return questionDetails;
};
