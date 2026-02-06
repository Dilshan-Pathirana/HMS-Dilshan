import React, { useState, useEffect } from "react";
import api from "../../../../utils/api/axios";
import axios from 'axios';
import alert from "../../../../utils/alert";
import {
    IDoctorOption,
    IQuestionFormData,
} from "../../../../utils/types/CreateQuestions/ICreateQuestions.ts";
import { QuestionEditModalProps } from "../../../../utils/types/CreateQuestions/IAllQuestions.ts";

const QuestionEditModal: React.FC<QuestionEditModalProps> = ({
    isOpen,
    questionData,
    onClose,
    triggerRefresh,
}) => {
    const [formData, setFormData] = useState<IQuestionFormData>({
        doctor_id: "",
        question: "",
        description: "",
        order: "",
        status: "",
    });
    const [doctorOptions, setDoctorOptions] = useState<IDoctorOption[]>([]);
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [isLoading, setIsLoading] = useState<boolean>(false);

    useEffect(() => {
        const fetchDoctors = async () => {
            try {
                const response = await api.get("/doctors");
                if (response.status === 200) {
                    const options = response.data.doctors.map(
                        (doctor: any) => ({
                            value: doctor.user_id,
                            label: `Dr. ${doctor.first_name} ${doctor.last_name}`,
                        }),
                    );
                    setDoctorOptions(options);
                }
            } catch (error) {
                if (axios.isAxiosError(error)) {
                    alert.warn("Failed to fetch doctors: " + (error as any).message);
                } else {
                    alert.warn("Failed to fetch doctors.");
                }
            }
        };
        fetchDoctors();
    }, []);

    useEffect(() => {
        if (questionData && isOpen) {
            setFormData({
                doctor_id: questionData.doctor_id || "",
                question: questionData.question || "",
                description: questionData.description || "",
                order: questionData.order?.toString() || "",
                status: questionData.status?.toString() || "",
            });
        }
    }, [questionData, isOpen]);

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
        if (!questionData) return;

        setIsLoading(true);
        setErrors({});

        const submitData = {
            ...formData,
            order: parseInt(formData.order),
            status: parseInt(formData.status),
        };

        try {
            const response = await api.put(
                `/update-main-question/${questionData.id}`,
                submitData,
            );

            if (response.status === 200) {
                alert.success(
                    response.data.message ||
                        "Main question updated successfully!",
                );
                onClose();
                triggerRefresh();
            }
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 422) {
                setErrors(error.response.data.error || {});
            } else {
                alert.error(
                    "Failed to update main question: " +
                        (error as Error).message,
                );
            }
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen || !questionData) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Edit Question</h2>
                    <button
                        onClick={onClose}
                        className="text-neutral-500 hover:text-neutral-700"
                    >
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <label
                                htmlFor="doctor_id"
                                className="block text-neutral-700 font-bold mb-2"
                            >
                                Doctor
                            </label>
                            <select
                                id="doctor_id"
                                name="doctor_id"
                                value={formData.doctor_id}
                                onChange={handleInputChange}
                                className="w-full p-2 border border-neutral-300 rounded"
                                required
                            >
                                <option value="">Select Doctor</option>
                                {doctorOptions.map((doctor) => (
                                    <option
                                        key={doctor.value}
                                        value={doctor.value}
                                    >
                                        {doctor.label}
                                    </option>
                                ))}
                            </select>
                            {errors.doctor_id && (
                                <p className="text-red-700">
                                    {errors.doctor_id[0]}
                                </p>
                            )}
                        </div>

                        <div>
                            <label
                                htmlFor="question"
                                className="block text-neutral-700 font-bold mb-2"
                            >
                                Question
                            </label>
                            <textarea
                                id="question"
                                name="question"
                                value={formData.question}
                                onChange={handleInputChange}
                                rows={3}
                                className="w-full p-2 border border-neutral-300 rounded"
                                required
                            />
                            {errors.question && (
                                <p className="text-red-700">
                                    {errors.question[0]}
                                </p>
                            )}
                        </div>

                        <div>
                            <label
                                htmlFor="description"
                                className="block text-neutral-700 font-bold mb-2"
                            >
                                Description
                            </label>
                            <textarea
                                id="description"
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                rows={4}
                                className="w-full p-2 border border-neutral-300 rounded"
                            />
                            {errors.description && (
                                <p className="text-red-700">
                                    {errors.description[0]}
                                </p>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label
                                    htmlFor="order"
                                    className="block text-neutral-700 font-bold mb-2"
                                >
                                    Order
                                </label>
                                <input
                                    type="number"
                                    id="order"
                                    name="order"
                                    value={formData.order}
                                    onChange={handleInputChange}
                                    className="w-full p-2 border border-neutral-300 rounded"
                                    min="1"
                                />
                                {errors.order && (
                                    <p className="text-red-700">
                                        {errors.order[0]}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label
                                    htmlFor="status"
                                    className="block text-neutral-700 font-bold mb-2"
                                >
                                    Status
                                </label>
                                <select
                                    id="status"
                                    name="status"
                                    value={formData.status}
                                    onChange={handleInputChange}
                                    className="w-full p-2 border border-neutral-300 rounded"
                                >
                                    <option value="">Select Status</option>
                                    <option value="1">Active</option>
                                    <option value="0">Inactive</option>
                                </select>
                                {errors.status && (
                                    <p className="text-red-700">
                                        {errors.status[0]}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="text-right mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 bg-neutral-300 text-neutral-700 rounded hover:bg-gray-400 mr-2"
                            disabled={isLoading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-primary-500 text-white rounded hover:bg-primary-600"
                            disabled={isLoading}
                        >
                            {isLoading ? "Updating..." : "Update Question"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default QuestionEditModal;
