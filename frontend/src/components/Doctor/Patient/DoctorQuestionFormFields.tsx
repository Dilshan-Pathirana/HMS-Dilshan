import { DoctorQuestionFormFieldsProps } from "../../../utils/form/formFieldsAttributes/QuestionsCreate.ts";

const DoctorQuestionFormFields: React.FC<DoctorQuestionFormFieldsProps> = ({
    formData,
    errors,
    onChange,
}) => {
    return (
        <div className="grid grid-cols-1 gap-4">
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
                    onChange={onChange}
                    rows={3}
                    className="w-full p-2 border border-neutral-300 rounded"
                    required
                />
                {errors.question && (
                    <p className="text-red-700">{errors.question[0]}</p>
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
                    onChange={onChange}
                    rows={4}
                    className="w-full p-2 border border-neutral-300 rounded"
                />
                {errors.description && (
                    <p className="text-red-700">{errors.description[0]}</p>
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
                        onChange={onChange}
                        className="w-full p-2 border border-neutral-300 rounded"
                        min="1"
                    />
                    {errors.order && (
                        <p className="text-red-700">{errors.order[0]}</p>
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
                        onChange={onChange}
                        className="w-full p-2 border border-neutral-300 rounded"
                    >
                        <option value="">Select Status</option>
                        <option value="1">Active</option>
                        <option value="0">Inactive</option>
                    </select>
                    {errors.status && (
                        <p className="text-red-700">{errors.status[0]}</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DoctorQuestionFormFields;
