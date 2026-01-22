import React, { useEffect } from "react";
import { FiX, FiSave, FiCheck } from "react-icons/fi";
import { useDispatch, useSelector } from "react-redux";
import Spinner from "../../../../assets/Common/Spinner.tsx";
import { IQuestionsModalProps } from "../../../../utils/types/DoctorSession/IDoctorSession.ts";
import { RootState } from "../../../../store";
import {
    initializeSession,
    selectAnswer,
    addCustomAnswer,
    saveSessionStart,
    saveSessionSuccess,
    saveSessionFailure,
    clearCurrentSession,
} from "../../../../utils/slices/sessionAnswers/sessionAnswersSlice.ts";
import alert from "../../../../utils/alert";
import QuestionAnswerCard from "./QuestionAnswerCard.tsx";

const QuestionsModal: React.FC<IQuestionsModalProps> = ({
    isOpen,
    selectedSession,
    questionsWithAnswers,
    loadingQuestions,
    onClose,
    onToggleQuestion,
}) => {
    const dispatch = useDispatch();
    const { current_session, is_saving } = useSelector(
        (state: RootState) => state.sessionAnswers,
    );

    useEffect(() => {
        if (isOpen && selectedSession) {
            dispatch(
                initializeSession({
                    patient_id: selectedSession.patient_id || "",
                    doctor_id: selectedSession.doctor_id || "",
                    branch_id: selectedSession.branch_id || "",
                    session_id: selectedSession.id,
                    patient_name: `${selectedSession.patient_first_name} ${selectedSession.patient_last_name}`,
                    branch_name: selectedSession.branch_center_name || "",
                }),
            );
        }
    }, [isOpen, selectedSession, dispatch]);

    useEffect(() => {
        if (!isOpen) {
            dispatch(clearCurrentSession());
        }
    }, [isOpen, dispatch]);

    const handleAnswerSelect = (
        questionId: string,
        answerId: string,
        answerText: string,
        questionText: string,
    ) => {
        dispatch(
            selectAnswer({
                question_id: questionId,
                selected_answer_id: answerId,
                answer_text: answerText,
                question_text: questionText,
            }),
        );
    };

    const handleAddCustomAnswer = (
        questionId: string,
        customAnswerText: string,
        questionText: string,
    ) => {
        dispatch(
            addCustomAnswer({
                question_id: questionId,
                custom_answer_text: customAnswerText,
                question_text: questionText,
            }),
        );
    };

    const getSelectedAnswerId = (questionId: string): string | null => {
        const selectedAnswer = current_session?.selected_answers.find(
            (answer) => answer.question_id === questionId,
        );
        return selectedAnswer?.selected_answer_id || null;
    };

    const getCustomAnswer = (questionId: string): string => {
        const customAnswer = current_session?.custom_answers.find(
            (answer) => answer.question_id === questionId,
        );
        return customAnswer?.custom_answer_text || "";
    };

    const handleSaveSession = async () => {
        if (
            !current_session ||
            (current_session.selected_answers?.length ?? 0) === 0
        ) {
            alert.warn("Please select at least one answer before saving.");
            return;
        }

        try {
            dispatch(saveSessionStart());
            await new Promise((resolve) => setTimeout(resolve, 500));

            dispatch(saveSessionSuccess());
            alert.success("Session answers saved successfully!");
        } catch (error) {
            dispatch(saveSessionFailure());
            alert.error("An error occurred while saving session answers.");
            console.error("Error saving session answers:", error);
        }
    };

    const handleClose = () => {
        dispatch(clearCurrentSession());
        onClose();
    };

    if (!isOpen) return null;
    const selectedAnswersCount = current_session?.selected_answers?.length ?? 0;
    const hasAnsweredQuestions = selectedAnswersCount > 0;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-4 mx-auto p-5 border w-11/12 lg:w-4/5 xl:w-3/4 shadow-lg rounded-lg bg-white max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">
                            Session Questions & Answers
                        </h3>
                        {selectedSession && (
                            <p className="text-gray-600 mt-1">
                                Patient: {selectedSession.patient_first_name}{" "}
                                {selectedSession.patient_last_name} •{" "}
                                {selectedSession.branch_center_name}
                            </p>
                        )}
                        {current_session?.is_saved && (
                            <div className="flex items-center mt-2 text-green-600">
                                <FiCheck className="mr-1" />
                                <span className="text-sm font-medium">
                                    Session Saved
                                </span>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-gray-600 text-2xl"
                    >
                        <FiX />
                    </button>
                </div>

                {loadingQuestions ? (
                    <div className="flex justify-center items-center py-12">
                        <Spinner isLoading={true} />
                        <span className="ml-3 text-gray-600">
                            Loading questions...
                        </span>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {questionsWithAnswers.map((question) => (
                            <QuestionAnswerCard
                                key={question.id}
                                question={question}
                                selectedAnswerId={getSelectedAnswerId(
                                    question.id,
                                )}
                                customAnswerText={getCustomAnswer(question.id)}
                                onToggle={() => onToggleQuestion(question.id)}
                                onSelectAnswer={(answerId, answerText) =>
                                    handleAnswerSelect(
                                        question.id,
                                        answerId,
                                        answerText,
                                        question.question,
                                    )
                                }
                                onAddCustomAnswer={(customAnswerText) =>
                                    handleAddCustomAnswer(
                                        question.id,
                                        customAnswerText,
                                        question.question,
                                    )
                                }
                                isSessionSaved={
                                    current_session?.is_saved || false
                                }
                            />
                        ))}
                    </div>
                )}

                <div className="mt-6 flex justify-between items-center">
                    <div className="text-sm text-gray-600">
                        {hasAnsweredQuestions && (
                            <span>
                                {current_session?.selected_answers.length}{" "}
                                answer(s) selected
                            </span>
                        )}
                        {(current_session?.custom_answers?.length ?? 0) > 0 && (
                            <span className="ml-4">
                                • {current_session?.custom_answers.length}{" "}
                                custom answer(s)
                            </span>
                        )}
                    </div>

                    <div className="flex space-x-3">
                        <button
                            onClick={handleClose}
                            className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors duration-200"
                        >
                            Cancel
                        </button>

                        <button
                            onClick={handleSaveSession}
                            disabled={
                                !hasAnsweredQuestions ||
                                is_saving ||
                                current_session?.is_saved
                            }
                            className={`px-6 py-2 rounded-lg transition-colors duration-200 flex items-center ${
                                hasAnsweredQuestions &&
                                !current_session?.is_saved
                                    ? "bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
                                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                            }`}
                        >
                            {is_saving ? (
                                <>
                                    <Spinner isLoading={true} />
                                    <span className="ml-2">Saving...</span>
                                </>
                            ) : current_session?.is_saved ? (
                                <>
                                    <FiCheck className="mr-2" />
                                    Saved
                                </>
                            ) : (
                                <>
                                    <FiSave className="mr-2" />
                                    Save Session
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuestionsModal;
