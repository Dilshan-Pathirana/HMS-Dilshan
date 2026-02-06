import React from "react";
import { DoctorQuestionViewModalProps } from "../../../../utils/types/CreateQuestions/IAllQuestions.ts";
import { useQuestionViewData } from "../../../../utils/types/CreateQuestions/useQuestionViewData.ts";
import EditModal from "../../../../components/Doctor/Patient/EditModal.tsx";
import QuestionDetailCard from "../../../../components/Doctor/Patient/QuestionDetailCard.tsx";
import StatusBadge from "../../../../components/Doctor/Patient/StatusBadge.tsx";

const DoctorQuestionViewModal: React.FC<DoctorQuestionViewModalProps> = ({
    isOpen,
    question,
    onClose,
}) => {
    const { status, order, questionText, description } =
        useQuestionViewData(question);

    if (!question) return null;

    return (
        <EditModal
            isOpen={isOpen}
            onClose={onClose}
            title="My Question Details"
        >
            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <QuestionDetailCard title="Status">
                        <StatusBadge status={status} />
                    </QuestionDetailCard>

                    <QuestionDetailCard title="Order">
                        <p className="text-lg text-neutral-900">{order}</p>
                    </QuestionDetailCard>
                </div>

                <QuestionDetailCard title="Question">
                    <p className="text-lg text-neutral-900 whitespace-pre-wrap">
                        {questionText}
                    </p>
                </QuestionDetailCard>

                <QuestionDetailCard title="Description">
                    <p className="text-lg text-neutral-900 whitespace-pre-wrap">
                        {description}
                    </p>
                </QuestionDetailCard>
            </div>

            <div className="flex justify-end mt-6">
                <button
                    onClick={onClose}
                    className="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                    Close
                </button>
            </div>
        </EditModal>
    );
};

export default DoctorQuestionViewModal;
