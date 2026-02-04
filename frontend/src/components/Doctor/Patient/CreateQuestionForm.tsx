import React from "react";
import { CreateDoctorQuestionFormProps } from "../../../utils/types/CreateQuestions/ICreateQuestions.ts";

const CreateQuestionForm: React.FC<CreateDoctorQuestionFormProps> = ({
    formData,
    errors,
    isLoading,
    onInputChange,
    onSubmit,
}) => {
    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
                Create Main Question
            </h2>

            <form onSubmit={onSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Question *
                    </label>
                    <input
                        type="text"
                        name="question"
                        value={formData.question}
                        onChange={onInputChange}
                        className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter your question..."
                    />
                    {errors.question && (
                        <p className="text-red-500 text-sm mt-1">
                            {errors.question[0]}
                        </p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                    </label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={onInputChange}
                        rows={4}
                        className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter question description..."
                    />
                    {errors.description && (
                        <p className="text-red-500 text-sm mt-1">
                            {errors.description[0]}
                        </p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Order *
                    </label>
                    <input
                        type="number"
                        name="order"
                        value={formData.order}
                        onChange={onInputChange}
                        min="1"
                        className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter display order"
                    />
                    {errors.order && (
                        <p className="text-red-500 text-sm mt-1">
                            {errors.order[0]}
                        </p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Status *
                    </label>
                    <select
                        name="status"
                        value={formData.status}
                        onChange={onInputChange}
                        className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="1">Active</option>
                        <option value="0">Inactive</option>
                    </select>
                    {errors.status && (
                        <p className="text-red-500 text-sm mt-1">
                            {errors.status[0]}
                        </p>
                    )}
                </div>

                <div className="flex justify-center pt-4">
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="bg-blue-500 text-white px-8 py-3 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {isLoading
                            ? "Creating Main Question..."
                            : "Create Main Question"}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreateQuestionForm;
