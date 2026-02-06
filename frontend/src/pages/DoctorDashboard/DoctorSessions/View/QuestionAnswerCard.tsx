import React, { useState } from "react";
import { FiCheck, FiChevronDown, FiChevronUp, FiPlus } from "react-icons/fi";
import { ExtendedDoctorModalProps } from "../../../../utils/types/DoctorSession/IDoctorSession";

const QuestionAnswerCard: React.FC<ExtendedDoctorModalProps> = ({
    question,
    selectedAnswerId,
    customAnswerText,
    onToggle,
    onSelectAnswer,
    onAddCustomAnswer,
    isSessionSaved,
}) => {
    const [newCustomAnswer, setNewCustomAnswer] = useState("");
    const isAnswered = selectedAnswerId !== null;
    const isCustomAnswerSelected = selectedAnswerId?.startsWith("custom_");

    const handleAddCustomAnswer = () => {
        if (newCustomAnswer.trim()) {
            onAddCustomAnswer(newCustomAnswer.trim());
            setNewCustomAnswer("");
        }
    };

    const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "Enter") {
            handleAddCustomAnswer();
        }
    };

    return (
        <div
            className={`border rounded-lg ${isAnswered ? "border-green-300 bg-green-50" : "border-neutral-200"}`}
        >
            <div
                className={`p-4 cursor-pointer hover:bg-neutral-100 transition-colors duration-200 ${isAnswered ? "bg-green-50 hover:bg-green-100" : "bg-neutral-50"}`}
                onClick={onToggle}
            >
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <div className="flex items-center">
                            <h4 className="font-semibold text-neutral-900 text-lg mb-1">
                                {question.question}
                            </h4>
                            {isAnswered && (
                                <FiCheck className="ml-2 text-green-600" />
                            )}
                        </div>
                        <p className="text-sm text-neutral-600">
                            {question.description}
                        </p>
                    </div>
                    <div className="ml-4">
                        {question.isExpanded ? (
                            <FiChevronUp />
                        ) : (
                            <FiChevronDown />
                        )}
                    </div>
                </div>
            </div>

            {question.isExpanded && (
                <div className="p-4 border-t border-neutral-200 bg-white">
                    {question.answers.length > 0 ? (
                        <div className="space-y-3">
                            <p className="text-sm font-medium text-neutral-700 mb-3">
                                Select one answer:
                            </p>
                            {question.answers.map((answer) => (
                                <div
                                    key={answer.id}
                                    className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                                        selectedAnswerId === answer.id
                                            ? "border-primary-500 bg-blue-50"
                                            : "border-neutral-200 hover:border-blue-300 hover:bg-blue-25"
                                    }`}
                                    onClick={() =>
                                        onSelectAnswer(answer.id, answer.answer)
                                    }
                                >
                                    <div className="flex items-center">
                                        <input
                                            type="radio"
                                            name={`question_${question.id}`}
                                            value={answer.id}
                                            checked={
                                                selectedAnswerId === answer.id
                                            }
                                            onChange={() =>
                                                onSelectAnswer(
                                                    answer.id,
                                                    answer.answer,
                                                )
                                            }
                                            className="h-4 w-4 text-primary-500 focus:ring-primary-500 border-neutral-300"
                                            disabled={isSessionSaved}
                                        />
                                        <label className="ml-3 text-neutral-800 cursor-pointer flex-1">
                                            {answer.answer}
                                        </label>
                                    </div>
                                </div>
                            ))}

                            <div className="mt-6 p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                                <div className="flex items-center mb-3">
                                    <FiPlus className="text-neutral-600 mr-2" />
                                    <p className="text-sm font-medium text-neutral-700">
                                        Add Custom Answer
                                    </p>
                                </div>

                                {customAnswerText ? (
                                    <div
                                        className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                                            isCustomAnswerSelected
                                                ? "border-primary-500 bg-blue-50"
                                                : "border-neutral-200 hover:border-blue-300 hover:bg-blue-25"
                                        }`}
                                        onClick={() => {
                                            if (!isSessionSaved) {
                                                onAddCustomAnswer(
                                                    customAnswerText,
                                                );
                                            }
                                        }}
                                    >
                                        <div className="flex items-center">
                                            <input
                                                type="radio"
                                                name={`question_${question.id}`}
                                                checked={isCustomAnswerSelected}
                                                onChange={() =>
                                                    onAddCustomAnswer(
                                                        customAnswerText,
                                                    )
                                                }
                                                className="h-4 w-4 text-primary-500 focus:ring-primary-500 border-neutral-300"
                                                disabled={isSessionSaved}
                                            />
                                            <label className="ml-3 text-neutral-800 cursor-pointer flex-1">
                                                {customAnswerText}
                                                <span className="ml-2 text-xs text-primary-500 font-medium">
                                                    (Custom)
                                                </span>
                                            </label>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex space-x-2">
                                        <input
                                            type="text"
                                            value={newCustomAnswer}
                                            onChange={(e) =>
                                                setNewCustomAnswer(
                                                    e.target.value,
                                                )
                                            }
                                            onKeyPress={handleKeyPress}
                                            placeholder="Enter your custom answer..."
                                            className="flex-1 p-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                                            disabled={isSessionSaved}
                                        />
                                        <button
                                            onClick={handleAddCustomAnswer}
                                            disabled={
                                                !newCustomAnswer.trim() ||
                                                isSessionSaved
                                            }
                                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                                                newCustomAnswer.trim() &&
                                                !isSessionSaved
                                                    ? "bg-primary-500 text-white hover:bg-primary-600"
                                                    : "bg-neutral-300 text-neutral-500 cursor-not-allowed"
                                            }`}
                                        >
                                            Add
                                        </button>
                                    </div>
                                )}

                                {isSessionSaved && (
                                    <p className="text-xs text-neutral-500 mt-2">
                                        Session is saved. Custom answers cannot
                                        be modified.
                                    </p>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div>
                            <p className="text-neutral-500 italic mb-4">
                                No predefined answers available for this
                                question.
                            </p>

                            <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                                <div className="flex items-center mb-3">
                                    <FiPlus className="text-neutral-600 mr-2" />
                                    <p className="text-sm font-medium text-neutral-700">
                                        Add Your Answer
                                    </p>
                                </div>

                                {customAnswerText ? (
                                    <div className="p-3 rounded-lg border border-primary-500 bg-blue-50">
                                        <div className="flex items-center">
                                            <FiCheck className="text-primary-500 mr-2" />
                                            <span className="text-neutral-800 flex-1">
                                                {customAnswerText}
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex space-x-2">
                                        <input
                                            type="text"
                                            value={newCustomAnswer}
                                            onChange={(e) =>
                                                setNewCustomAnswer(
                                                    e.target.value,
                                                )
                                            }
                                            onKeyPress={handleKeyPress}
                                            placeholder="Enter your answer..."
                                            className="flex-1 p-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                                            disabled={isSessionSaved}
                                        />
                                        <button
                                            onClick={handleAddCustomAnswer}
                                            disabled={
                                                !newCustomAnswer.trim() ||
                                                isSessionSaved
                                            }
                                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                                                newCustomAnswer.trim() &&
                                                !isSessionSaved
                                                    ? "bg-primary-500 text-white hover:bg-primary-600"
                                                    : "bg-neutral-300 text-neutral-500 cursor-not-allowed"
                                            }`}
                                        >
                                            Add
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default QuestionAnswerCard;
