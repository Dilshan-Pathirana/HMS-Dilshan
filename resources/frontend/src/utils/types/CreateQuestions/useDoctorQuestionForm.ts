import { useMemo, useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { DoctorQuestionFormData } from "./ICreateQuestions.ts";

export const useDoctorQuestionForm = (questionData: any, isOpen: boolean) => {
    const currentUserId = useSelector((state: any) => state.auth.userId);

    const initialFormData = useMemo<DoctorQuestionFormData>(() => {
        if (questionData && isOpen && currentUserId) {
            return {
                doctor_id: currentUserId,
                question: questionData.question || "",
                description: questionData.description || "",
                order: questionData.order?.toString() || "",
                status: questionData.status?.toString() || "",
            };
        }
        return {
            doctor_id: "",
            question: "",
            description: "",
            order: "",
            status: "",
        };
    }, [questionData, isOpen, currentUserId]);

    const [formData, setFormData] =
        useState<DoctorQuestionFormData>(initialFormData);
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [isLoading, setIsLoading] = useState<boolean>(false);
    useEffect(() => {
        setFormData(initialFormData);
    }, [initialFormData]);

    const handleInputChange = (
        event: React.ChangeEvent<
            HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >,
    ) => {
        const { name, value } = event.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    return {
        formData,
        setFormData,
        errors,
        setErrors,
        isLoading,
        setIsLoading,
        handleInputChange,
        currentUserId,
    };
};
