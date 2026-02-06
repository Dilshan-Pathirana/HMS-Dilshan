import React, { useEffect, useState } from "react";
import { SingleValue } from "react-select";
import {
    DamageStockFormData,
    DamageStockFormInitialValues,
    Product,
    ProductOptionToDropDown,
} from "../../../../../utils/types/pos/IProduct.ts";
import alert from "../../../../../utils/alert.ts";
import handleAsync from "../../../../../utils/types/handleAsync.ts";
import CashierUserDamageStockForm from "./CashierUserDamageStockForm.tsx";
import Spinner from "../../../../../assets/Common/Spinner.tsx";
import {
    getAllProducts
} from "../../../../../utils/api/pharmacy/PharmacyPOS/ChasierUserPharmacyPOS/CashierUserGetAllProducts.ts";
import {
    addDamageStockCashierUser
} from "../../../../../utils/api/pharmacy/PharmacyPOS/ChasierUserPharmacyPOS/CashierUserDamageStockAdd.ts";

export default function CashierUserAddDamageStock() {
    const [selectedProduct, setSelectedProduct] =
        useState<SingleValue<ProductOptionToDropDown>>(null);
    const [formData, setFormData] = useState<DamageStockFormData>(
        DamageStockFormInitialValues,
    );
    const [isLoading, setIsLoading] = useState(false);
    const [productOptions, setProductOptions] = useState<
        ProductOptionToDropDown[]
    >([]);

    useEffect(() => {
        const fetchAllProducts = async () => {
            setIsLoading(true);
            const [error, response] = await handleAsync(getAllProducts());

            if (error) {
                alert.warn("Failed to fetch product list: " + error.message);
                setIsLoading(false);
                return;
            }

            if (response?.data?.status === 200) {
                const options = response.data.products.map(
                    (product: Product) => ({
                        value: product.id,
                        label: product.item_name,
                    }),
                );
                setProductOptions(options);
            } else {
                alert.warn("Failed to fetch product list.");
            }

            setIsLoading(false);
        };

        fetchAllProducts();
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
            const response = await addDamageStockCashierUser(
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
            <h2 className="text-xl font-semibold text-neutral-700 mb-4">
                Damage Product Stock
            </h2>
            <Spinner isLoading={isLoading} />
            <CashierUserDamageStockForm
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
