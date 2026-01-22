import React from "react";
import axios from "axios";
import alert from "../../../../utils/alert";
import { DoctorQuestionEditModalProps } from "../../../../utils/types/CreateQuestions/IAllQuestions.ts";
import { useDoctorQuestionForm } from "../../../../utils/types/CreateQuestions/useDoctorQuestionForm.ts";
import DoctorQuestionFormFields from "../../../../components/Doctor/Patient/DoctorQuestionFormFields.tsx";
import EditModal from "../../../../components/Doctor/Patient/EditModal.tsx";

const DoctorQuestionEditModal: React.FC<DoctorQuestionEditModalProps> = ({
    isOpen,
    questionData,
    onClose,
    triggerRefresh,
}) => {
    const {
        formData,
        errors,
        isLoading,
        setErrors,
        setIsLoading,
        handleInputChange,
    } = useDoctorQuestionForm(questionData, isOpen);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!questionData) return;

        setIsLoading(true);
        setErrors({});

        const submitData = {
            ...formData,
            order: parseInt(formData.order),
            status: parseInt(formData.status),
        };

        try {
            const response = await axios.put(
                `/api/update-doctor-main-question/${questionData.id}`,
                submitData,
            );

            if (response.status === 200) {
                alert.success(
                    response.data.message || "Question updated successfully!",
                );
                onClose();
                triggerRefresh();
            }
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 422) {
                setErrors(error.response.data.error || {});
            } else {
                alert.error(
                    "Failed to update question: " + (error as Error).message,
                );
            }
        } finally {
            setIsLoading(false);
        }
    };

    if (!questionData) return null;

    return (
        <EditModal isOpen={isOpen} onClose={onClose} title="Edit My Question">
            <form onSubmit={handleSubmit}>
                <DoctorQuestionFormFields
                    formData={formData}
                    errors={errors}
                    onChange={handleInputChange}
                />

                <div className="text-right mt-6">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 mr-2"
                        disabled={isLoading}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        disabled={isLoading}
                    >
                        {isLoading ? "Updating..." : "Update Question"}
                    </button>
                </div>
            </form>
        </EditModal>
    );
};

export default DoctorQuestionEditModal;
