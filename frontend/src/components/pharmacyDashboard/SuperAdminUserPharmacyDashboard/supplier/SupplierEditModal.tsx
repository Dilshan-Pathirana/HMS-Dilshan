import React, { useState, useEffect } from "react";
import { FaTimes } from "react-icons/fa";
import Select, { SingleValue } from "react-select";
import { SupplierList } from "../../../../utils/types/pos/IProduct.ts";
import { SupplierEditModalProps } from "../../../../utils/types/pharmacy/Supplier/ISupplier.ts";
import { supplierTypes } from "../../../../utils/staticData/supplier/SupplierTypes.ts";
import { updateValidateForm } from "../../Common/forms/supplier/SupplierFormUpdateValidation.ts";

const SupplierEditModal: React.FC<SupplierEditModalProps> = ({
    isOpen,
    supplier,
    onClose,
    onSave,
}) => {
    const [formData, setFormData] = useState<SupplierList | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (supplier) {
            setFormData(supplier);
        }
    }, [supplier]);

    if (!isOpen || !formData) return null;

    const handleChange = (
        event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => {
        const { name, value } = event.target;
        setFormData((prev) => (prev ? { ...prev, [name]: value } : null));
        setErrors((prev) => ({ ...prev, [name]: "" }));
    };

    const handleSupplierTypeSelect = (
        selectedOption: SingleValue<{ value: string; label: string }>,
    ) => {
        setFormData((prev) =>
            prev
                ? {
                      ...prev,
                      supplier_type: selectedOption ? selectedOption.value : "",
                  }
                : null,
        );
        setErrors((prev) => ({ ...prev, supplier_type: "" }));
    };

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        if (formData && updateValidateForm(formData, setErrors)) {
            onSave(formData);
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg shadow-lg w-[90%] max-w-3xl relative p-6">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-600 hover:text-gray-800"
                >
                    <FaTimes size={20} />
                </button>

                <h2 className="text-xl font-semibold mb-4">Edit Supplier</h2>

                <form
                    onSubmit={handleSubmit}
                    className="grid grid-cols-2 gap-4"
                >
                    <div className="flex flex-col">
                        <label htmlFor="supplier_name">Supplier Name</label>
                        <input
                            id="supplier_name"
                            name="supplier_name"
                            value={formData.supplier_name}
                            onChange={handleChange}
                            placeholder="Enter supplier name"
                            className={`border p-2 w-full ${
                                errors.supplier_name
                                    ? "border-red-500"
                                    : "border-gray-300"
                            }`}
                        />
                        {errors.supplier_name && (
                            <p className="text-red-500 text-sm">
                                {errors.supplier_name}
                            </p>
                        )}
                    </div>

                    <div className="flex flex-col">
                        <label htmlFor="contact_person">Contact Person</label>
                        <input
                            id="contact_person"
                            name="contact_person"
                            value={formData.contact_person}
                            onChange={handleChange}
                            placeholder="Enter contact person name"
                            className={`border p-2 w-full ${
                                errors.contact_person
                                    ? "border-red-500"
                                    : "border-gray-300"
                            }`}
                        />
                        {errors.contact_person && (
                            <p className="text-red-500 text-sm">
                                {errors.contact_person}
                            </p>
                        )}
                    </div>

                    <div className="flex flex-col">
                        <label htmlFor="contact_number">Contact Number</label>
                        <input
                            id="contact_number"
                            name="contact_number"
                            value={formData.contact_number}
                            onChange={handleChange}
                            placeholder="Enter contact number"
                            className={`border p-2 w-full ${
                                errors.contact_number
                                    ? "border-red-500"
                                    : "border-gray-300"
                            }`}
                        />
                        {errors.contact_number && (
                            <p className="text-red-500 text-sm">
                                {errors.contact_number}
                            </p>
                        )}
                    </div>

                    <div className="flex flex-col">
                        <label htmlFor="contact_email">Email</label>
                        <input
                            id="contact_email"
                            name="contact_email"
                            value={formData.contact_email}
                            onChange={handleChange}
                            placeholder="Enter email address"
                            className={`border p-2 w-full ${
                                errors.contact_email
                                    ? "border-red-500"
                                    : "border-gray-300"
                            }`}
                        />
                        {errors.contact_email && (
                            <p className="text-red-500 text-sm">
                                {errors.contact_email}
                            </p>
                        )}
                    </div>

                    <div className="flex flex-col">
                        <label htmlFor="supplier_address">Address</label>
                        <input
                            id="supplier_address"
                            name="supplier_address"
                            value={formData.supplier_address}
                            onChange={handleChange}
                            placeholder="Enter address"
                            className={`border p-2 w-full ${
                                errors.supplier_address
                                    ? "border-red-500"
                                    : "border-gray-300"
                            }`}
                        />
                        {errors.supplier_address && (
                            <p className="text-red-500 text-sm">
                                {errors.supplier_address}
                            </p>
                        )}
                    </div>

                    <div className="flex flex-col">
                        <label htmlFor="supplier_city">City</label>
                        <input
                            id="supplier_city"
                            name="supplier_city"
                            value={formData.supplier_city}
                            onChange={handleChange}
                            placeholder="Enter city"
                            className={`border p-2 w-full ${
                                errors.supplier_city
                                    ? "border-red-500"
                                    : "border-gray-300"
                            }`}
                        />
                        {errors.supplier_city && (
                            <p className="text-red-500 text-sm">
                                {errors.supplier_city}
                            </p>
                        )}
                    </div>

                    <div className="flex flex-col">
                        <label htmlFor="supplier_country">Country</label>
                        <input
                            id="supplier_country"
                            name="supplier_country"
                            value={formData.supplier_country}
                            onChange={handleChange}
                            placeholder="Enter country"
                            className={`border p-2 w-full ${
                                errors.supplier_country
                                    ? "border-red-500"
                                    : "border-gray-300"
                            }`}
                        />
                        {errors.supplier_country && (
                            <p className="text-red-500 text-sm">
                                {errors.supplier_country}
                            </p>
                        )}
                    </div>

                    <div className="flex flex-col">
                        <label htmlFor="supplier_type">Supplier Type</label>
                        <Select
                            id="supplier_type"
                            value={supplierTypes.find(
                                (type) => type.value === formData.supplier_type,
                            )}
                            onChange={handleSupplierTypeSelect}
                            options={supplierTypes}
                            placeholder="Select Supplier Type"
                            className={`w-full ${
                                errors.supplier_type ? "border-red-500" : ""
                            }`}
                            classNamePrefix="react-select"
                        />
                        {errors.supplier_type && (
                            <p className="text-red-500 text-sm">
                                {errors.supplier_type}
                            </p>
                        )}
                    </div>

                    <div className="col-span-2 flex justify-end gap-2 mt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="border px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="border px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SupplierEditModal;
