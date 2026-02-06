import React, { useState } from "react";
import { WarrantyStepProps } from "../../../../../utils/types/pharmacy/Product/ProdcutCreateForm.ts";
import { useDispatch } from "react-redux";
import { addNewWarranty } from "../../../../../utils/slices/Product/productSlice.ts";
import { AppDispatch } from "../../../../../store.tsx";
import {warrantyDuration, warrantyTypes} from "../../../../../utils/staticData/products/ProductCreateForm.ts";
import Select, { SingleValue } from "react-select";
import { SelectOption } from "../../../../../utils/types/pharmacy/Product/IPharmacyProduct.ts";

const WarrantyInformation: React.FC<WarrantyStepProps> = ({
    data,
    setData,
    onNext,
    onBack,
}) => {
    const dispatch = useDispatch<AppDispatch>();
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!data.warrantySerial)
            newErrors.warrantySerial = "This field is required.";
        if (!data.warrantyDuration)
            newErrors.warrantyDuration = "This field is required.";
        if (!data.warrantyStartDate)
            newErrors.warrantyStartDate = "This field is required.";
        if (!data.warrantyExpirationDate)
            newErrors.warrantyExpirationDate = "This field is required.";
        if (!data.warrantyType)
            newErrors.warrantyType = "This field is required.";
        setErrors(newErrors);

        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = event.target;
        setData((prev) => ({ ...prev, [name]: value }));
        setErrors((prev) => ({ ...prev, [name]: "" }));
    };

    const handleWarrantyDuration = (
        selectedOption: SingleValue<SelectOption>,
    ) => {
        setData((prev) => ({
            ...prev,
            warrantyDuration: selectedOption ? selectedOption.value : "",
        }));
        setErrors((prev) => ({ ...prev, warrantyDuration: "" }));
    };

    const handleWarrantyTypes = (
        selectedOption: SingleValue<SelectOption>,
    ) => {
        setData((prev) => ({
            ...prev,
            warrantyType: selectedOption ? selectedOption.value : "",
        }));
        setErrors((prev) => ({ ...prev, warrantyType: "" }));
    }

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        if (validate()) {
            dispatch(addNewWarranty(data));
            onNext();
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="warrantySerial">Warranty Serial/Code</label>
                    <input
                        id="warrantySerial"
                        name="warrantySerial"
                        value={data.warrantySerial}
                        onChange={handleChange}
                        placeholder="Enter warranty serial/code"
                        className={`border p-2 w-full ${errors.warrantySerial ? "border-error-500" : "border-neutral-300"}`}
                    />
                    {errors.warrantySerial && (
                        <p className="text-error-500 text-sm">
                            {errors.warrantySerial}
                        </p>
                    )}
                </div>

                <div>
                    <label htmlFor="warrantyDuration">Warranty Duration</label>
                    <Select
                        id="warrantyDuration"
                        value={warrantyDuration.find(
                            (warranty) =>
                                warranty.value === data.warrantyDuration,
                        )}
                        onChange={handleWarrantyDuration}
                        options={warrantyDuration}
                        placeholder="Select warranty duration"
                        className={`w-full ${errors.warrantyDuration ? "border-error-500" : ""}`}
                        classNamePrefix="react-select"
                    />
                    {errors.warrantyDuration && (
                        <p className="text-error-500 text-sm">
                            {errors.warrantyDuration}
                        </p>
                    )}
                </div>

                <div>
                    <label htmlFor="warrantyStartDate">
                        Warranty Start Date
                    </label>
                    <input
                        id="warrantyStartDate"
                        name="warrantyStartDate"
                        type="date"
                        value={data.warrantyStartDate}
                        onChange={handleChange}
                        className={`border p-2 w-full ${errors.warrantyStartDate ? "border-error-500" : "border-neutral-300"}`}
                    />
                    {errors.warrantyStartDate && (
                        <p className="text-error-500 text-sm">
                            {errors.warrantyStartDate}
                        </p>
                    )}
                </div>

                <div>
                    <label htmlFor="warrantyExpirationDate">
                        Warranty Expiration Date
                    </label>
                    <input
                        id="warrantyExpirationDate"
                        name="warrantyExpirationDate"
                        type="date"
                        value={data.warrantyExpirationDate}
                        onChange={handleChange}
                        className={`border p-2 w-full ${errors.warrantyExpirationDate ? "border-error-500" : "border-neutral-300"}`}
                    />
                    {errors.warrantyExpirationDate && (
                        <p className="text-error-500 text-sm">
                            {errors.warrantyExpirationDate}
                        </p>
                    )}
                </div>

                <div>
                    <label htmlFor="warrantyType">Warranty Type</label>
                    <Select
                        id="warrantyType"
                        value={warrantyTypes.find(
                            (warranty) =>
                                warranty.value === data.warrantyType,
                        )}
                        onChange={handleWarrantyTypes}
                        options={warrantyTypes}
                        placeholder="Select warranty Type"
                        className={`w-full ${errors.warrantyType ? "border-error-500" : ""}`}
                        classNamePrefix="react-select"
                    />
                    {errors.warrantyType && (
                        <p className="text-error-500 text-sm">
                            {errors.warrantyType}
                        </p>
                    )}
                </div>
            </div>

            <div className="flex justify-between mt-4">
                <button
                    onClick={onBack}
                    type="button"
                    className="border px-4 py-2 bg-gray-500 text-white"
                >
                    Back
                </button>
                <button
                    type="submit"
                    className="border px-4 py-2 bg-primary-500 text-white"
                >
                    Next
                </button>
            </div>
        </form>
    );
};

export default WarrantyInformation;
