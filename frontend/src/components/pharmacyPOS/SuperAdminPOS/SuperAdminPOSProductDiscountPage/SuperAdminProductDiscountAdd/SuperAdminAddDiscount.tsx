import React, { useEffect, useState } from "react";
import Select, { SingleValue } from "react-select";
import axios, { AxiosError } from "axios";
import { ProductOptionToDropDown } from "../../../../../utils/types/pos/IProduct.ts";
import alert from "../../../../../utils/alert.ts";
import Spinner from "../../../../../assets/Common/Spinner.tsx";
import { fetchAllProducts } from "../../../Common/dataFetching/AllProductFetching.ts";
import { useSelector } from "react-redux";
import { AuthState } from "../../../../../utils/types/auth";

const addProductDiscount = async (
    productId: string,
    discountType: string,
    discountAmount: number | null,
    discountPercentage: number | null,
) => {
    return await axios.post("/api/add-product-discount", {
        product_id: productId,
        discount_type: discountType,
        discount_amount: discountAmount,
        discount_percentage: discountPercentage,
    });
};

export default function SuperAdminAddDiscount() {
    const [selectedProduct, setSelectedProduct] =
        useState<SingleValue<ProductOptionToDropDown>>(null);
    const [discountType, setDiscountType] = useState<string>("amount");
    const [discountAmount, setDiscountAmount] = useState<number | "">("");
    const [discountPercentage, setDiscountPercentage] = useState<number | "">(
        "",
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

    const handleDiscountTypeChange = (
        event: React.ChangeEvent<HTMLSelectElement>,
    ) => {
        setDiscountType(event.target.value);
        setDiscountAmount("");
        setDiscountPercentage("");
    };

    const handleDiscountAmountChange = (
        event: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const value = event.target.value;
        setDiscountAmount(value === "" ? "" : Math.max(0, parseFloat(value)));
    };

    const handleDiscountPercentageChange = (
        event: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const value = event.target.value;
        const parsedValue = value === "" ? "" : parseFloat(value);
        if (typeof parsedValue === "number") {
            setDiscountPercentage(Math.min(100, Math.max(0, parsedValue)));
        } else {
            setDiscountPercentage(parsedValue);
        }
    };

    const handleAddDiscount = async () => {
        if (!selectedProduct) {
            alert.warn("Please select a product.");
            return;
        }

        if (discountType === "amount" && !discountAmount) {
            alert.warn("Please enter a valid discount amount.");
            return;
        }

        if (discountType === "percentage" && !discountPercentage) {
            alert.warn("Please enter a valid discount percentage.");
            return;
        }

        setIsLoading(true);

        try {
            const response = await addProductDiscount(
                selectedProduct.value,
                discountType,
                discountType === "amount" ? Number(discountAmount) : null,
                discountType === "percentage"
                    ? Number(discountPercentage)
                    : null,
            );

            if (response.data.status === 200) {
                alert.success(
                    response.data.message || "Discount added successfully!",
                );
                setSelectedProduct(null);
                setDiscountType("amount");
                setDiscountAmount("");
                setDiscountPercentage("");
            } else {
                alert.warn(
                    response.data.message ||
                        "Failed to add discount. Please try again.",
                );
            }
        } catch (error) {
            console.error("Error adding discount:", error);

            if (error instanceof AxiosError) {
                alert.warn("Failed to add discount: " + error.message);
            } else {
                alert.warn(
                    "Failed to add discount: An unknown error occurred.",
                );
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-neutral-100">
            <div className="p-6 bg-white rounded-lg m-6 shadow">
                <h2 className="text-xl font-semibold text-neutral-700 mb-4">
                    Add Product Discount
                </h2>

                <Spinner isLoading={isLoading} />

                <div className="mb-4">
                    <label
                        htmlFor="product"
                        className="block text-sm font-medium text-neutral-700 mb-1"
                    >
                        Select Product
                    </label>
                    <Select
                        id="product"
                        options={productOptions}
                        value={selectedProduct}
                        onChange={handleProductChange}
                        placeholder="Select a product"
                        isDisabled={isLoading}
                    />
                </div>

                <div className="mb-4">
                    <label
                        htmlFor="discountType"
                        className="block text-sm font-medium text-neutral-700 mb-1"
                    >
                        Discount Type
                    </label>
                    <select
                        id="discountType"
                        className="w-full border border-neutral-300 rounded-md p-2 focus:outline-none focus:ring focus:ring-blue-300"
                        value={discountType}
                        onChange={handleDiscountTypeChange}
                        disabled={isLoading}
                    >
                        <option value="amount">Fixed Amount</option>
                        <option value="percentage">Percentage</option>
                    </select>
                </div>

                {discountType === "amount" ? (
                    <div className="mb-4">
                        <label
                            htmlFor="discountAmount"
                            className="block text-sm font-medium text-neutral-700 mb-1"
                        >
                            Discount Amount
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                id="discountAmount"
                                className="w-full border border-neutral-300 rounded-md p-2 focus:outline-none focus:ring focus:ring-blue-300"
                                value={discountAmount}
                                onChange={handleDiscountAmountChange}
                                min="0"
                                step="0.01"
                                placeholder="Enter discount amount"
                                disabled={isLoading}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="mb-4">
                        <label
                            htmlFor="discountPercentage"
                            className="block text-sm font-medium text-neutral-700 mb-1"
                        >
                            Discount Percentage
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                id="discountPercentage"
                                className="w-full border border-neutral-300 rounded-md p-2 pr-10 focus:outline-none focus:ring focus:ring-blue-300"
                                value={discountPercentage}
                                onChange={handleDiscountPercentageChange}
                                min="0"
                                max="100"
                                step="0.1"
                                placeholder="Enter discount percentage"
                                disabled={isLoading}
                            />
                            <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-neutral-500">
                                %
                            </span>
                        </div>
                    </div>
                )}

                <button
                    onClick={handleAddDiscount}
                    disabled={isLoading}
                    className={`w-full bg-primary-500 text-white py-2 rounded-md font-semibold hover:bg-primary-600 transition ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                    {isLoading ? "Processing..." : "Add Discount"}
                </button>
            </div>
        </div>
    );
}
