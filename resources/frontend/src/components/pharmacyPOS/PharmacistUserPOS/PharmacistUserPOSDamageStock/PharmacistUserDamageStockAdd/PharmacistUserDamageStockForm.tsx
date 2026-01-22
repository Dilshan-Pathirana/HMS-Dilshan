import React from "react";
import Select from "react-select";
import { DamageStockFormProps } from "../../../../../utils/types/pos/IProduct.ts";

const PharmacistUserDamageStockForm: React.FC<DamageStockFormProps> = ({
    productOptions,
    selectedProduct,
    onProductChange,
    formData,
    onInputChange,
    onSubmit,
    isLoading,
}) => {
    return (
        <div>
            <div className="mb-4">
                <label
                    htmlFor="product"
                    className="block text-sm font-medium text-gray-700 mb-1"
                >
                    Select Product
                </label>
                <Select
                    id="product"
                    options={productOptions}
                    value={selectedProduct}
                    onChange={onProductChange}
                    placeholder="Select a product"
                />
            </div>

            <div className="mb-4">
                <label
                    htmlFor="quantity"
                    className="block text-sm font-medium text-gray-700 mb-1"
                >
                    Quantity
                </label>
                <input
                    type="number"
                    id="quantity"
                    className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring focus:ring-blue-300"
                    value={formData.quantity}
                    onChange={onInputChange}
                    min="0"
                    placeholder="Enter stock quantity"
                />
            </div>

            <div className="mb-4">
                <label
                    htmlFor="remarks"
                    className="block text-sm font-medium text-gray-700 mb-1"
                >
                    Remark
                </label>
                <textarea
                    id="remarks"
                    className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring focus:ring-blue-300"
                    value={formData.remarks}
                    onChange={onInputChange}
                    placeholder="Enter reason for the damage"
                    rows={4}
                />
            </div>

            <button
                onClick={onSubmit}
                disabled={isLoading}
                className={`w-full bg-blue-600 text-white py-2 rounded-md font-semibold hover:bg-blue-700 transition ${
                    isLoading ? "opacity-50 cursor-not-allowed" : ""
                }`}
            >
                {isLoading ? "Processing..." : "Add Damage Stock"}
            </button>
        </div>
    );
};

export default PharmacistUserDamageStockForm;
