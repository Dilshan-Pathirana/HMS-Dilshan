import React, { useState, useEffect } from "react";
import { FiPlus, FiTrash, FiSave } from "react-icons/fi";
import axios from "axios";
import alert from "../../../../utils/alert";
import Spinner from "../../../../assets/Common/Spinner.tsx";
import {
    Answer,
    QuestionAnswerModalProps,
} from "../../../../utils/types/QuestionAnswer/IQuestionAnswe.ts";

const QuestionAnswerModal: React.FC<QuestionAnswerModalProps> = ({
    isOpen,
    question,
    onClose,
    triggerRefresh = () => {},
}) => {
    const [answers, setAnswers] = useState<Answer[]>([]);
    const [newAnswers, setNewAnswers] = useState<string[]>([""]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isSaving, setIsSaving] = useState<boolean>(false);

    useEffect(() => {
        if (isOpen && question) {
            fetchAnswers();
        }
    }, [isOpen, question]);

    const fetchAnswers = async () => {
        if (!question) return;

        try {
            setIsLoading(true);
            const response = await axios.get(
                `/api/get-question-answers/${question.id}`,
            );
            if (response.status === 200) {
                const answersData = response.data.question_answers || [];
                setAnswers(answersData);
            }
        } catch (error) {
            alert.error("Failed to fetch answers");
        } finally {
            setIsLoading(false);
        }
    };

    const addNewAnswerField = () => {
        setNewAnswers([...newAnswers, ""]);
    };

    const updateNewAnswer = (index: number, value: string) => {
        const updated = [...newAnswers];
        updated[index] = value;
        setNewAnswers(updated);
    };

    const removeNewAnswerField = (index: number) => {
        if (newAnswers.length > 1) {
            const updated = newAnswers.filter((_, i) => i !== index);
            setNewAnswers(updated);
        }
    };

    const removeExistingAnswer = async (answerId: string) => {
        try {
            const response = await axios.delete(
                `/api/delete-question-answer/${answerId}`,
            );
            if (response.status === 200) {
                alert.success("Answer deleted successfully");
                setAnswers(answers.filter((answer) => answer.id !== answerId));
                triggerRefresh();
            }
        } catch (error) {
            alert.error("Failed to delete answer");
        }
    };

    const saveNewAnswers = async () => {
        if (!question) return;

        const validAnswers = newAnswers.filter(
            (answer) => answer.trim() !== "",
        );
        if (validAnswers.length === 0) {
            alert.warn("Please enter at least one answer");
            return;
        }

        try {
            setIsSaving(true);

            for (const answerText of validAnswers) {
                const payload = {
                    question_id: question.id,
                    answer: answerText.trim(),
                };

                await axios.post("/api/add-question-answer", payload);
            }

            alert.success(
                `${validAnswers.length} answer(s) saved successfully`,
            );
            setNewAnswers([""]);
            fetchAnswers();
            triggerRefresh();
        } catch (error) {
            alert.error("Failed to save answers");
        } finally {
            setIsSaving(false);
        }
    };

    const handleClose = () => {
        setNewAnswers([""]);
        setAnswers([]);
        onClose();
    };

    if (!isOpen || !question) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">
                            Manage Answers
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">
                            Question: {question.question}
                        </p>
                        <p className="text-xs text-gray-500">
                            Doctor: Dr. {question.doctor_first_name}{" "}
                            {question.doctor_last_name}
                        </p>
                    </div>
                    <button
                        onClick={handleClose}
                        className="text-gray-500 hover:text-gray-700 text-2xl"
                    >
                        ✕
                    </button>
                </div>

                <Spinner isLoading={isLoading} />

                {!isLoading && (
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-3">
                                Existing Answers ({answers.length})
                            </h3>
                            {answers.length > 0 ? (
                                <div className="space-y-2">
                                    {answers.map((answer, index) => (
                                        <div
                                            key={answer.id || index}
                                            className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
                                        >
                                            <span className="text-gray-800">
                                                {answer.answer}
                                            </span>
                                            <button
                                                onClick={() =>
                                                    removeExistingAnswer(
                                                        answer.id!,
                                                    )
                                                }
                                                className="text-red-500 hover:text-red-700 p-1"
                                                title="Delete answer"
                                            >
                                                <FiTrash />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-500 text-center py-4">
                                    No answers found for this question
                                </p>
                            )}
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-lg font-semibold text-gray-800">
                                    Add New Answers
                                </h3>
                                <button
                                    onClick={addNewAnswerField}
                                    className="flex items-center space-x-1 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                                >
                                    <FiPlus />
                                    <span>Add Field</span>
                                </button>
                            </div>

                            <div className="space-y-3">
                                {newAnswers.map((answer, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center space-x-2"
                                    >
                                        <input
                                            type="text"
                                            value={answer}
                                            onChange={(e) =>
                                                updateNewAnswer(
                                                    index,
                                                    e.target.value,
                                                )
                                            }
                                            placeholder={`Answer option ${index + 1}`}
                                            className="flex-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        {newAnswers.length > 1 && (
                                            <button
                                                onClick={() =>
                                                    removeNewAnswerField(index)
                                                }
                                                className="text-red-500 hover:text-red-700 p-2"
                                                title="Remove field"
                                            >
                                                <FiTrash />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div className="flex justify-center mt-4">
                                <button
                                    onClick={saveNewAnswers}
                                    disabled={isSaving}
                                    className="flex items-center space-x-2 px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <FiSave />
                                    <span>
                                        {isSaving
                                            ? "Saving..."
                                            : "Save Answers"}
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex justify-end mt-6 pt-4 border-t">
                    <button
                        onClick={handleClose}
                        className="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default QuestionAnswerModal;
