import React, { useState } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import alert from "../../../../utils/alert.ts";
import { IQuestionFormData } from "../../../../utils/types/CreateQuestions/ICreateQuestions.ts";
import { questionFormInitialState } from "../../../../utils/form/formFieldsAttributes/QuestionsCreate.ts";
import CreateQuestionForm from "../../../../components/Doctor/Patient/CreateQuestionForm.tsx";

const CreateQuestions = () => {
    const userId = useSelector((state: any) => state.auth.userId);
    const [formData, setFormData] = useState<IQuestionFormData>({
        ...questionFormInitialState,
        doctor_id: userId || "",
    });
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const handleInputChange = (
        event: React.ChangeEvent<
            HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >,
    ) => {
        const { name, value } = event.target;
        setFormData({
            ...formData,
            [name]: value,
        });
    };
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        const submitData = {
            ...formData,
            order: parseInt(formData.order),
            status: parseInt(formData.status),
        };

        try {
            const response = await axios.post(
                "api/add-main-question-doctor",
                submitData,
            );
            if (response.status === 200) {
                alert.success(
                    response.data.message ||
                        "Main question created successfully!",
                );
                setFormData({
                    ...questionFormInitialState,
                    doctor_id: userId || "",
                });
                setErrors({});
            }
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 422) {
                setErrors(error.response.data.error || {});
            } else {
                alert.warn(
                    "Failed to create main question: " +
                        (error as Error).message,
                );
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-4">
            <CreateQuestionForm
                formData={formData}
                errors={errors}
                isLoading={isLoading}
                onInputChange={handleInputChange}
                onSubmit={handleSubmit}
            />
        </div>
    );
};

export default CreateQuestions;
