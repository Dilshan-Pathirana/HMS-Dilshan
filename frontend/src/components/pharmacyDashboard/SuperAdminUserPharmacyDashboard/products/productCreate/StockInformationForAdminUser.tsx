import axios from 'axios';
import React, { useState } from "react";
import { StockInformationProps } from "../../../../../utils/types/pharmacy/Product/ProdcutCreateForm.ts";
import { useDispatch, useSelector } from "react-redux";
import { addNewProductStock } from "../../../../../utils/slices/Product/productSlice.ts";
import { AppDispatch, RootState } from "../../../../../store.tsx";
import api from "../../../../../utils/api/axios";
import alert from "../../../../../utils/alert.ts";
import { updateSuperAdminProduct } from "../../../../../utils/api/pharmacy/SuperAdminUser/SuperAdminUpdateProduct.ts";
import { createSuperAdminProduct } from "../../../../../utils/api/pharmacy/SuperAdminUser/SuperAdminCreateProduct.ts";
import { createFormSubmitData } from "../../../../../utils/helperFunctions/CreateProductFromSubmitData.ts";
import { AiOutlineLoading } from "react-icons/ai";
import { validate } from "../../../Common/forms/product/StockInformationValidataion.tsx";
import { stockInformationFormFields } from "../../../Common/forms/product/StockInformationFormFields.ts";
import { useNavigate } from "react-router-dom";

const StockInformationForAdminUser: React.FC<StockInformationProps> = ({
    isEditing,
    data,
    setData,
    onBack,
    productId,
}) => {
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const productData = useSelector((state: RootState) => state.product);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (
        event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => {
        const { name, value } = event.target;
        setData((prev) => ({ ...prev, [name]: value }));
        setErrors((prev) => ({ ...prev, [name]: "" }));
    };

    const checkResponseIsSuccessAndNavigateToList = (response: {
        status: number;
        data: any;
    }) => {
        if (response.status === 200 || response.data.status === 200) {
            alert.success("Product saved successfully");
            navigate("/pharmacy-dashboard/product-list");
           setTimeout(() => {
               window.location.reload();
           }, 1000);
        } else {
            alert.error("Failed to save product.");
            window.location.reload();
        }
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!validate(data, setErrors)) return;

        setIsLoading(true);

        dispatch(addNewProductStock(data));

        const productSubmitFormData = createFormSubmitData(productData, data);

        try {
            let response;
            if (productId) {
                response = await updateSuperAdminProduct(
                    productId,
                    productSubmitFormData,
                );

                checkResponseIsSuccessAndNavigateToList(response);
            } else {
                response = await createSuperAdminProduct(productSubmitFormData);
            }

            checkResponseIsSuccessAndNavigateToList(response);
        } catch (error) {
            console.error("Error saving product:", error);
            if (axios.isAxiosError(error)) {
                alert.warn(error.response?.data);
            } else {
                alert.warn("Error saving product.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {stockInformationFormFields.map(
                    ({ label, name, type = "text" }) => (
                        <div key={name}>
                            <label htmlFor={name}>{label}</label>
                            <input
                                id={name}
                                name={name}
                                type={type}
                                value={data[name] || ""}
                                onChange={handleChange}
                                placeholder={`Enter ${label.toLowerCase()}`}
                                className={`border p-2 w-full ${
                                    errors[name]
                                        ? "border-red-500"
                                        : "border-gray-300"
                                }`}
                            />
                            {errors[name] && (
                                <p className="text-red-500 text-sm">
                                    {errors[name]}
                                </p>
                            )}
                        </div>
                    ),
                )}

                <div className="col-span-2">
                    <label htmlFor="damagedStock">
                        Damaged/Defective Stock
                    </label>
                    <textarea
                        id="damagedStock"
                        name="damagedStock"
                        value={data.damagedStock || ""}
                        onChange={handleChange}
                        placeholder="Enter details and quantity of damaged items"
                        className={`border p-2 w-full ${
                            errors.damagedStock
                                ? "border-red-500"
                                : "border-gray-300"
                        }`}
                    />
                    {errors.damagedStock && (
                        <p className="text-red-500 text-sm">
                            {errors.damagedStock}
                        </p>
                    )}
                </div>

                <div className="col-span-2">
                    <label htmlFor="product_store_location">
                        Stock Location
                    </label>
                    <textarea
                        id="product_store_location"
                        name="product_store_location"
                        value={data.product_store_location || ""}
                        onChange={handleChange}
                        placeholder="Enter stock location"
                        className={`border p-2 w-full ${
                            errors.product_store_location
                                ? "border-red-500"
                                : "border-gray-300"
                        }`}
                    />
                    {errors.product_store_location && (
                        <p className="text-red-500 text-sm">
                            {errors.product_store_location}
                        </p>
                    )}
                </div>
            </div>

            <div className="flex justify-between mt-4">
                <button
                    onClick={onBack}
                    className="border px-4 py-2 bg-gray-500 text-white"
                >
                    Back
                </button>
                <button
                    type="submit"
                    disabled={isLoading}
                    className="border px-4 py-2 bg-blue-500 text-white flex items-center justify-center"
                >
                    {isLoading ? (
                        <>
                            <AiOutlineLoading className="animate-spin mr-2" />
                            Loading...
                        </>
                    ) : !isEditing ? (
                        "Create product"
                    ) : (
                        "Update product"
                    )}
                </button>
            </div>
        </form>
    );
};

export default StockInformationForAdminUser;
