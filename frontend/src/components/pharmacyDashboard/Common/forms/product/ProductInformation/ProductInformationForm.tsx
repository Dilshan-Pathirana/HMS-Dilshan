import React from "react";
import Select, { SingleValue } from "react-select";
import {
    categories,
    units,
} from "../../../../../../utils/staticData/products/ProductCreateForm.ts";
import { SelectOption } from "../../../../../../utils/types/pharmacy/Product/IPharmacyProduct.ts";
import { ProductInformationFormProps } from "../../../../../../utils/types/pos/IProduct.ts";
const ProductInformationForm: React.FC<ProductInformationFormProps> = ({
    data,
    errors,
    setData,
    setErrors,
    handleSubmit,
}) => {
    const handleCategorySelect = (
        selectedOption: SingleValue<SelectOption>,
    ) => {
        setData((prev) => ({
            ...prev,
            category: selectedOption ? selectedOption.value : "",
        }));
        setErrors((prev) => ({ ...prev, category: "" }));
    };

    const handleUnitSelect = (selectedOption: SingleValue<SelectOption>) => {
        setData((prev) => ({
            ...prev,
            units: selectedOption ? selectedOption.value : "",
        }));
        setErrors((prev) => ({ ...prev, units: "" }));
    };
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = event.target;
        setData((prev) => ({ ...prev, [name]: value }));
        setErrors((prev) => ({ ...prev, [name]: "" }));
    };

    return (
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <div className="flex flex-col">
                <label htmlFor="sku">Item Code / SKU</label>
                <input
                    id="sku"
                    name="sku"
                    value={data.sku}
                    onChange={handleChange}
                    placeholder="Enter unique SKU"
                    className={`border p-2 w-full ${
                        errors.sku ? "border-error-500" : "border-neutral-300"
                    }`}
                />
                {errors.sku && (
                    <p className="text-error-500 text-sm">{errors.sku}</p>
                )}
            </div>

            <div className="flex flex-col">
                <label htmlFor="name">Item Name</label>
                <input
                    id="name"
                    name="name"
                    value={data.name}
                    onChange={handleChange}
                    placeholder="Enter product name"
                    className={`border p-2 w-full ${
                        errors.name ? "border-error-500" : "border-neutral-300"
                    }`}
                />
                {errors.name && (
                    <p className="text-error-500 text-sm">{errors.name}</p>
                )}
            </div>

            <div className="flex flex-col">
                <label htmlFor="barcode">Item Barcode</label>
                <input
                    id="barcode"
                    name="barcode"
                    value={data.barcode}
                    onChange={handleChange}
                    placeholder="Enter item barcode"
                    className={`border p-2 w-full ${
                        errors.name ? "border-error-500" : "border-neutral-300"
                    }`}
                />
                {errors.barcode && (
                    <p className="text-error-500 text-sm">{errors.barcode}</p>
                )}
            </div>

            <div className="flex flex-col">
                <label htmlFor="genericName">Generic Name</label>
                <input
                    id="genericName"
                    name="genericName"
                    value={data.genericName}
                    onChange={handleChange}
                    placeholder="Enter generic name"
                    className={`border p-2 w-full ${
                        errors.genericName
                            ? "border-error-500"
                            : "border-neutral-300"
                    }`}
                />
                {errors.genericName && (
                    <p className="text-error-500 text-sm">{errors.genericName}</p>
                )}
            </div>

            <div className="flex flex-col">
                <label htmlFor="brandName">Brand Name</label>
                <input
                    id="brandName"
                    name="brandName"
                    value={data.brandName}
                    onChange={handleChange}
                    placeholder="Enter brand name"
                    className={`border p-2 w-full ${
                        errors.brandName ? "border-error-500" : "border-neutral-300"
                    }`}
                />
                {errors.brandName && (
                    <p className="text-error-500 text-sm">{errors.brandName}</p>
                )}
            </div>

            <div className="flex flex-col">
                <label htmlFor="category">Category</label>
                <Select
                    id="category"
                    value={categories.find(
                        (category) => category.value === data.category,
                    )}
                    onChange={handleCategorySelect}
                    options={categories}
                    placeholder="Select Category"
                    className={`w-full ${
                        errors.category ? "border-error-500" : ""
                    }`}
                    classNamePrefix="react-select"
                />
                {errors.category && (
                    <p className="text-error-500 text-sm">{errors.category}</p>
                )}
            </div>

            <div className="flex flex-col">
                <label htmlFor="units">Units</label>
                <Select
                    id="units"
                    value={units.find((unit) => unit.value === data.units)}
                    onChange={handleUnitSelect}
                    options={units}
                    placeholder="Select Unit"
                    className={`w-full ${errors.units ? "border-error-500" : ""}`}
                    classNamePrefix="react-select"
                />
                {errors.units && (
                    <p className="text-error-500 text-sm">{errors.units}</p>
                )}
            </div>

            <div className="col-span-1 md:col-span-2 flex justify-between mt-4">
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

export default ProductInformationForm;
