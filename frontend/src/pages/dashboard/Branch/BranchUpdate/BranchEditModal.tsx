import React, { useEffect, useState } from "react";
import { IBranchData } from "../../../../utils/types/Branch/IBranchData.ts";
import { IoDocument } from "react-icons/io5";
import {
    centerTypes,
    ownerTypes,
} from "../../../../utils/api/branch/BranchesData.ts";
import { AiOutlineClose } from "react-icons/ai";
import api from "../../../../utils/api/axios";
import axios from "axios";
import alert from "../../../../utils/alert.ts";

interface EditModalProps {
    isOpen: boolean;
    onClose: () => void;
    branchData: IBranchData | null;
    triggerRefresh: () => void;
}

const BranchEditModal: React.FC<EditModalProps> = ({
    isOpen,
    onClose,
    branchData,
    triggerRefresh,
}) => {
    const [formData, setFormData] = useState<IBranchData | null>(null);
    const [file, setFile] = useState<File | null>(null);

    useEffect(() => {
        setFormData(branchData);
    }, [branchData]);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    ) => {
        if (formData) {
            setFormData({ ...formData, [e.target.name]: e.target.value });
        }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files.length > 0) {
            const selectedFile = event.target.files[0];
            setFile(selectedFile);

            if (formData) {
                setFormData({
                    ...formData,
                    register_document: selectedFile,
                });
            }
        }
    };

    const handleBranchUpdateFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData) {
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

            const formDataToSend = new FormData();
            Object.keys(sanitizedData).forEach((key) => {
                // Skip register_document here, handle separately
                if (key !== "register_document" && sanitizedData[key] !== null && sanitizedData[key] !== undefined) {
                    formDataToSend.append(key, sanitizedData[key]);
                }
            });

            if (file) {
                formDataToSend.append("register_document", file);
            }

            try {
                const response = await api.put(
                    `/api/v1/branches/${formData.id}`,
                    formDataToSend,
                    {
                        headers: {
                            "Content-Type": "multipart/form-data",
                        },
                    },
                ) as any;

                if (response) {
                    alert.success("Branch updated successfully.");
                    triggerRefresh();
                    onClose();
                }
            } catch (error: any) {
                console.error("Update branch error:", error);
                if (error.response?.data?.detail) {
                    alert.error(error.response.data.detail);
                } else if (axios.isAxiosError(error)) {
                    alert.warn(error.response?.data?.message || "Error occurred.");
                } else {
                    alert.warn("Failed to update branch.");
                }
            }
        } else {
            console.error("Form data is null. Cannot submit.");
        }
    };

    return isOpen ? (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-4 rounded shadow-lg max-w-4xl mx-auto max-h-[80vh] overflow-auto">
                <div className="flex justify-between items-center">
                    <h2 className="text-lg font-bold mb-4">Edit Branch</h2>
                    <button
                        onClick={onClose}
                        className="text-neutral-600 hover:text-neutral-900"
                    >
                        <AiOutlineClose size={24} />
                    </button>
                </div>
                {formData && (
                    <form onSubmit={handleBranchUpdateFormSubmit}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label
                                    htmlFor="center_name"
                                    className="block text-neutral-700 font-bold mb-2"
                                >
                                    Center Name
                                </label>
                                <input
                                    type="text"
                                    id="center_name"
                                    name="center_name"
                                    value={formData.center_name || ""}
                                    onChange={handleChange}
                                    className="w-full p-2 border border-neutral-300 rounded"
                                    required
                                />
                            </div>
                            <div>
                                <label
                                    htmlFor="register_number"
                                    className="block text-neutral-700 font-bold mb-2"
                                >
                                    Register Number
                                </label>
                                <input
                                    type="text"
                                    id="register_number"
                                    name="register_number"
                                    value={formData.register_number}
                                    onChange={handleChange}
                                    className="w-full p-2 border border-neutral-300 rounded"
                                    required
                                />
                            </div>
                            <div>
                                <label
                                    htmlFor="register_document"
                                    className="block text-neutral-700 font-bold mb-2"
                                >
                                    Register Document
                                </label>
                                <input
                                    type="file"
                                    id="register_document"
                                    name="register_document"
                                    accept=".pdf"
                                    onChange={handleFileChange}
                                    className="w-full p-2 border border-neutral-300 rounded"
                                />
                                {file && (
                                    <div className="mt-2 flex items-center p-2 border border-neutral-300 rounded bg-neutral-50">
                                        <div className="flex-shrink-0 bg-pink-500 rounded-full p-2">
                                            <IoDocument
                                                className={"text-white"}
                                                size={20}
                                            />
                                        </div>
                                        <div className="ml-3">
                                            <p className="text-neutral-700">
                                                {file.name}
                                            </p>
                                            <p className="text-neutral-500 text-sm">
                                                Document
                                            </p>
                                        </div>
                                    </div>
                                )}
                                {!file && formData && (
                                    <div className="mt-2">
                                        <h4 className="text-neutral-700 font-bold mb-2">
                                            View Existing Document:
                                        </h4>

                                        {typeof formData.register_document ===
                                            "string" && (
                                                <a
                                                    href={
                                                        formData.register_document
                                                    }
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-primary-500 underline"
                                                >
                                                    Open in a new tab
                                                </a>
                                            )}
                                    </div>
                                )}
                            </div>
                            <div>
                                <label
                                    htmlFor="center_type"
                                    className="block text-neutral-700 font-bold mb-2"
                                >
                                    Type of Center
                                </label>
                                <select
                                    id="center_type"
                                    name="center_type"
                                    value={formData.center_type}
                                    onChange={handleChange}
                                    className="w-full p-2 border border-neutral-300 rounded"
                                    required
                                >
                                    <option value="">Select type</option>
                                    {centerTypes.map((type, index) => (
                                        <option key={index} value={type}>
                                            {type}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label
                                    htmlFor="owner_type"
                                    className="block text-neutral-700 font-bold mb-2"
                                >
                                    Owner Type
                                </label>
                                <select
                                    id="owner_type"
                                    name="owner_type"
                                    value={formData.owner_type}
                                    onChange={handleChange}
                                    className="w-full p-2 border border-neutral-300 rounded"
                                    required
                                >
                                    <option value="">Select owner type</option>
                                    {ownerTypes.map((type, index) => (
                                        <option key={index} value={type}>
                                            {type}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label
                                    htmlFor="owner_full_name"
                                    className="block text-neutral-700 font-bold mb-2"
                                >
                                    Owner Full Name
                                </label>
                                <input
                                    type="text"
                                    id="owner_full_name"
                                    name="owner_full_name"
                                    value={formData.owner_full_name}
                                    onChange={handleChange}
                                    className="w-full p-2 border border-neutral-300 rounded"
                                    required
                                />
                            </div>
                            <div>
                                <label
                                    htmlFor="owner_id_number"
                                    className="block text-neutral-700 font-bold mb-2"
                                >
                                    Owner ID
                                </label>
                                <input
                                    type="text"
                                    id="owner_id_number"
                                    name="owner_id_number"
                                    value={formData.owner_id_number}
                                    onChange={handleChange}
                                    className="w-full p-2 border border-neutral-300 rounded"
                                    required
                                />
                            </div>
                            <div>
                                <label
                                    htmlFor="owner_contact_number"
                                    className="block text-neutral-700 font-bold mb-2"
                                >
                                    Contact Number
                                </label>
                                <input
                                    type="text"
                                    id="owner_contact_number"
                                    name="owner_contact_number"
                                    value={formData.owner_contact_number}
                                    onChange={handleChange}
                                    className="w-full p-2 border border-neutral-300 rounded"
                                    required
                                />
                            </div>
                            <div>
                                <label
                                    htmlFor="division"
                                    className="block text-neutral-700 font-bold mb-2"
                                >
                                    Division
                                </label>
                                <input
                                    type="text"
                                    id="division"
                                    name="division"
                                    value={formData.division}
                                    onChange={handleChange}
                                    className="w-full p-2 border border-neutral-300 rounded"
                                    required
                                />
                            </div>
                            <div>
                                <label
                                    htmlFor="division_number"
                                    className="block text-neutral-700 font-bold mb-2"
                                >
                                    Division Number
                                </label>
                                <input
                                    type="text"
                                    id="division_number"
                                    name="division_number"
                                    value={formData.division_number}
                                    onChange={handleChange}
                                    className="w-full p-2 border border-neutral-300 rounded"
                                    required
                                />
                            </div>
                        </div>
                        <div className="flex justify-end mt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="bg-neutral-300 text-black rounded px-4 py-2 mr-2"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="bg-primary-500 text-white rounded px-4 py-2"
                            >
                                Update
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    ) : null;
};

export default BranchEditModal;
