import React, { useEffect, useState } from "react";
import { SingleValue } from "react-select";
import {
    DamageStockFormData,
    DamageStockFormInitialValues,
    ProductOptionToDropDown,
} from "../../../../../utils/types/pos/IProduct.ts";
import alert from "../../../../../utils/alert.ts";
import SuperAdminDamageStockForm from "./SuperAdminDamageStockForm.tsx";
import { addDamageStockSuperAdmin } from "../../../../../utils/api/pharmacy/PharmacyPOS/SuperAdminPharmacyPOS/SuperAdminDamageStockAdd.ts";
import Spinner from "../../../../../assets/Common/Spinner.tsx";
import { useSelector } from "react-redux";
import { AuthState } from "../../../../../utils/types/auth";
import { fetchAllProducts } from "../../../Common/dataFetching/AllProductFetching.ts";

export default function SuperAdminAddDamageStock() {
    const [selectedProduct, setSelectedProduct] =
        useState<SingleValue<ProductOptionToDropDown>>(null);
    const [formData, setFormData] = useState<DamageStockFormData>(
        DamageStockFormInitialValues,
    );
    const [isLoading, setIsLoading] = useState(false);
    const [productOptions, setProductOptions] = useState<
        ProductOptionToDropDown[]
    >([]);
    const userRole = useSelector(
        (state: { auth: AuthState }) => state.auth.userRole,
    );

    useEffect(() => {
        const controller = new AbortController();
        fetchAllProducts(userRole, setIsLoading, setProductOptions).then();
        return () => controller.abort();
    }, []);

    const handleProductChange = (
        selectedOption: SingleValue<ProductOptionToDropDown>,
    ) => {
        setSelectedProduct(selectedOption);
    };

    const handleInputChange = (
        event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => {
        const { id, value } = event.target;
        setFormData((prevState) => ({
            ...prevState,
            [id]:
                id === "quantity"
                    ? value === ""
                        ? ""
                        : Math.max(0, parseInt(value))
                    : value,
        }));
    };

    const handleAddDamageStock = async () => {
        const { quantity, remarks } = formData;

        if (!selectedProduct || !quantity || !remarks.trim()) {
            alert.warn(
                "Please select a product, enter a valid quantity, and provide a remark.",
            );
            return;
        }

        setIsLoading(true);

        try {
            const response = await addDamageStockSuperAdmin(
                selectedProduct.value,
                quantity,
                remarks,
            );

            if (response.data.status === 200) {
                alert.success(
                    response.data.message || "Damage stock added successfully!",
                );
            } else {
                alert.warn(
                    response.data.message ||
                        "Failed to add damage stock. Please try again.",
                );
            }

            setSelectedProduct(null);
            setFormData(DamageStockFormInitialValues);
        } catch (error) {
            console.error("Error adding damage stock:", error);
            alert.warn("Failed to add damage stock. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-6 bg-white rounded-lg shadow-md max-w-lg ml-48 mt-16 mb-5">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">
                Damage Product Stock
            </h2>
            <Spinner isLoading={isLoading} />
            <SuperAdminDamageStockForm
                productOptions={productOptions}
                selectedProduct={selectedProduct}
                onProductChange={handleProductChange}
                formData={formData}
                onInputChange={handleInputChange}
                onSubmit={handleAddDamageStock}
                isLoading={isLoading}
            />
        </div>
    );
}
