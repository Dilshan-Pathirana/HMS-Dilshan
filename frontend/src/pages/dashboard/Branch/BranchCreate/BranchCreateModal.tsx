import React, { useState } from "react";
import api from "../../../../utils/api/axios";
import alert from "../../../../utils/alert";
import { IBranchFormDataProps } from "../../../../utils/types/Branch/IBranchData.ts";
import {
    branchFormInitialState,
    centerTypes,
    ownerTypes,
} from "../../../../utils/api/branch/BranchesData.ts";
import { appendFormData } from "../../../../utils/formUtils.ts";
import { IoDocument } from "react-icons/io5";

interface BranchCreateModalProps {
    isOpen: boolean;
    closeModal: () => void;
    onBranchCreated: () => void;
}

const BranchCreateModal: React.FC<BranchCreateModalProps> = ({
    isOpen,
    closeModal,
    onBranchCreated,
}) => {
    const [formData, setFormData] = useState<IBranchFormDataProps>(
        branchFormInitialState,
    );
    const [errors, setErrors] = useState({
        center_name: "",
        register_number: "",
    });

    const resetForm = () => {
        setFormData(branchFormInitialState);
        setErrors({
            center_name: "",
            register_number: "",
        });
    };

    const handleCloseModal = () => {
        resetForm();
        closeModal();
    };

    const handleChange = (
        event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    ) => {
        const { name, value } = event.target;
        setFormData({
            ...formData,
            [name]: value,
        });

        if (errors[name as keyof typeof errors]) {
            setErrors((prevState) => ({
                ...prevState,
                [name]: "",
            }));
        }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            setFormData({
                ...formData,
                register_document: event.target.files[0],
            });
        }
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        // Create a copy of formData and sanitize
        const sanitizedData = { ...formData } as any;

        // Treat empty strings as null/undefined for optional unique fields
        if (!sanitizedData.register_number) delete sanitizedData.register_number;
        if (!sanitizedData.center_type) delete sanitizedData.center_type;
        if (!sanitizedData.division) delete sanitizedData.division;
        if (!sanitizedData.division_number) delete sanitizedData.division_number;
        if (!sanitizedData.owner_type) delete sanitizedData.owner_type;
        if (!sanitizedData.owner_full_name) delete sanitizedData.owner_full_name;
        if (!sanitizedData.owner_id_number) delete sanitizedData.owner_id_number;
        if (!sanitizedData.owner_contact_number) delete sanitizedData.owner_contact_number;

        const formDataToSend = appendFormData(sanitizedData);

        try {
            const response = await api.post(
                "/api/v1/branches",
                formDataToSend,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                },
            ) as any;

            // Since interceptor returns data directly, check if we have data or simply success
            if (response) {
                alert.success(
                    response.message || "Branch created successfully.",
                );
                onBranchCreated();
                handleCloseModal();
            }
        } catch (error: any) {
            console.error("Create branch error:", error);
            if (error.response?.data?.detail) {
                alert.error(error.response.data.detail);
            } else if (error.response?.data?.errors) {
                setErrors((prevState) => ({
                    ...prevState,
                    ...error.response.data.errors,
                }));

                if (error.response.data.errors.center_name) {
                    alert.error(
                        "A branch with this center name already exists. Please use a different name.",
                    );
                } else {
                    alert.error(
                        "Failed to create branch. Please check the form and try again.",
                    );
                }
            } else {
                alert.error("Failed to create branch. Please try again.");
            }
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-3xl">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Create Branch</h2>
                    <button
                        onClick={handleCloseModal}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        ✕
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label
                                htmlFor="center_name"
                                className="block text-gray-700 font-bold mb-2"
                            >
                                Center Name
                            </label>
                            <input
                                type="text"
                                id="center_name"
                                name="center_name"
                                value={formData.center_name}
                                onChange={handleChange}
                                className="w-full p-2 border border-gray-300 rounded"
                                required
                            />
                            {errors.center_name && (
                                <p className="text-red-700">
                                    {errors.center_name[0]}
                                </p>
                            )}
                        </div>
                        <div>
                            <label
                                htmlFor="register_number"
                                className="block text-gray-700 font-bold mb-2"
                            >
                                Register Number
                            </label>
                            <input
                                type="text"
                                id="register_number"
                                name="register_number"
                                value={formData.register_number}
                                onChange={handleChange}
                                className="w-full p-2 border border-gray-300 rounded"
                                required
                            />
                            {errors.register_number && (
                                <p className="text-red-700">
                                    {errors.register_number[0]}
                                </p>
                            )}
                        </div>
                        <div>
                            <label
                                htmlFor="register_document"
                                className="block text-gray-700 font-bold mb-2"
                            >
                                Register Document
                            </label>
                            <input
                                type="file"
                                id="register_document"
                                name="register_document"
                                accept=".pdf"
                                onChange={handleFileChange}
                                className="w-full p-2 border border-gray-300 rounded"
                            />
                            {formData.register_document && (
                                <div className="mt-2 flex items-center p-2 border border-gray-300 rounded bg-gray-50">
                                    <div className="flex-shrink-0 bg-pink-500 rounded-full p-2">
                                        <IoDocument
                                            className={"text-white"}
                                            size={20}
                                        />
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-gray-700">
                                            {
                                                (
                                                    formData.register_document as File
                                                ).name
                                            }
                                        </p>
                                        <p className="text-gray-500 text-sm">
                                            Document
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div>
                            <label
                                htmlFor="center_type"
                                className="block text-gray-700 font-bold mb-2"
                            >
                                Type of Center
                            </label>
                            <select
                                id="center_type"
                                name="center_type"
                                value={formData.center_type}
                                onChange={handleChange}
                                className="w-full p-2 border border-gray-300 rounded"
                            >
                                <option value="">Select type</option>
                                {centerTypes.map((type, value) => (
                                    <option key={value} value={type}>
                                        {type}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label
                                htmlFor="owner_type"
                                className="block text-gray-700 font-bold mb-2"
                            >
                                Owner Type
                            </label>
                            <select
                                id="owner_type"
                                name="owner_type"
                                value={formData.owner_type}
                                onChange={handleChange}
                                className="w-full p-2 border border-gray-300 rounded"
                            >
                                <option value="">Select owner type</option>
                                {ownerTypes.map((type, value) => (
                                    <option key={value} value={type}>
                                        {type}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label
                                htmlFor="owner_full_name"
                                className="block text-gray-700 font-bold mb-2"
                            >
                                Owner Full Name
                            </label>
                            <input
                                type="text"
                                id="owner_full_name"
                                name="owner_full_name"
                                value={formData.owner_full_name}
                                onChange={handleChange}
                                className="w-full p-2 border border-gray-300 rounded"
                            />
                        </div>
                        <div>
                            <label
                                htmlFor="owner_id_number"
                                className="block text-gray-700 font-bold mb-2"
                            >
                                Owner ID
                            </label>
                            <input
                                type="text"
                                id="owner_id_number"
                                name="owner_id_number"
                                value={formData.owner_id_number}
                                onChange={handleChange}
                                className="w-full p-2 border border-gray-300 rounded"
                            />
                        </div>
                        <div>
                            <label
                                htmlFor="owner_contact_number"
                                className="block text-gray-700 font-bold mb-2"
                            >
                                Contact Number
                            </label>
                            <input
                                type="text"
                                id="owner_contact_number"
                                name="owner_contact_number"
                                value={formData.owner_contact_number}
                                onChange={handleChange}
                                className="w-full p-2 border border-gray-300 rounded"
                            />
                        </div>
                        <div>
                            <label
                                htmlFor="division"
                                className="block text-gray-700 font-bold mb-2"
                            >
                                Division
                            </label>
                            <input
                                type="text"
                                id="division"
                                name="division"
                                value={formData.division}
                                onChange={handleChange}
                                className="w-full p-2 border border-gray-300 rounded"
                            />
                        </div>
                        <div>
                            <label
                                htmlFor="division_number"
                                className="block text-gray-700 font-bold mb-2"
                            >
                                Division Number
                            </label>
                            <input
                                type="text"
                                id="division_number"
                                name="division_number"
                                value={formData.division_number}
                                onChange={handleChange}
                                className="w-full p-2 border border-gray-300 rounded"
                            />
                        </div>
                    </div>
                    <div className="text-right mt-6">
                        <button
                            type="button"
                            onClick={handleCloseModal}
                            className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 mr-2"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                            Create Branch
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default BranchCreateModal;
