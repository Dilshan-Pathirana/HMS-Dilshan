import React from "react";
import { QuestionViewModalProps } from "../../../../utils/types/CreateQuestions/IAllQuestions.ts";

const QuestionViewModal: React.FC<QuestionViewModalProps> = ({
    isOpen,
    question,
    onClose,
}) => {
    if (!isOpen || !question) return null;

    const getStatusBadge = (status: string | number | null | undefined) => {
        const statusClasses = {
            active: "bg-green-100 text-green-800",
            inactive: "bg-error-100 text-red-800",
        };

        let statusString = "";
        let displayStatus = "";

        if (status === 1 || status === "1") {
            statusString = "active";
            displayStatus = "Active";
        } else if (status === 0 || status === "0") {
            statusString = "inactive";
            displayStatus = "Inactive";
        } else {
            statusString = "unknown";
            displayStatus = "Unknown";
        }

        const className =
            statusClasses[statusString as keyof typeof statusClasses] ||
            "bg-neutral-100 text-neutral-800";

        return (
            <span
                className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${className}`}
            >
                {displayStatus}
            </span>
        );
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-neutral-800">
                        Question Details
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-neutral-500 hover:text-neutral-700 text-2xl"
                    >
                        ✕
                    </button>
                </div>

                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-neutral-50 p-4 rounded-lg">
                            <h3 className="text-sm font-medium text-neutral-500 uppercase tracking-wide">
                                Doctor Name
                            </h3>
                            <p className="mt-1 text-lg text-neutral-900">
                                Dr. {question.doctor_first_name}{" "}
                                {question.doctor_last_name}
                            </p>
                        </div>

                        <div className="bg-neutral-50 p-4 rounded-lg">
                            <h3 className="text-sm font-medium text-neutral-500 uppercase tracking-wide">
                                Status
                            </h3>
                            <div className="mt-1">
                                {getStatusBadge(question.status)}
                            </div>
                        </div>
                    </div>

                    <div className="bg-neutral-50 p-4 rounded-lg">
                        <h3 className="text-sm font-medium text-neutral-500 uppercase tracking-wide">
                            Question
                        </h3>
                        <p className="mt-1 text-lg text-neutral-900 whitespace-pre-wrap">
                            {question.question}
                        </p>
                    </div>

                    <div className="bg-neutral-50 p-4 rounded-lg">
                        <h3 className="text-sm font-medium text-neutral-500 uppercase tracking-wide">
                            Description
                        </h3>
                        <p className="mt-1 text-lg text-neutral-900 whitespace-pre-wrap">
                            {question.description || "No description provided"}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-neutral-50 p-4 rounded-lg">
                            <h3 className="text-sm font-medium text-neutral-500 uppercase tracking-wide">
                                Order
                            </h3>
                            <p className="mt-1 text-lg text-neutral-900">
                                {question.order}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end mt-6">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default QuestionViewModal;
