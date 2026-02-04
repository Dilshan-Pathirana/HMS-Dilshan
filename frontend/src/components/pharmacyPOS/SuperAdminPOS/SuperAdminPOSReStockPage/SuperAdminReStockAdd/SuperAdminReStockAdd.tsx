import React, { useEffect, useState } from "react";
import Select, { SingleValue } from "react-select";
import { AxiosError } from "axios";
import { ProductOptionToDropDown } from "../../../../../utils/types/pos/IProduct.ts";
import alert from "../../../../../utils/alert.ts";
import { addReOrderStock } from "../../../../../utils/api/pharmacy/PharmacyPOS/Common/UpdateProductStockDetails.ts";
import Spinner from "../../../../../assets/Common/Spinner.tsx";
import SellingPriceChangeSection from "./SellingPriceChangeSection.tsx";
import { productRestockFormAttributes } from "../../../../../utils/form/formFieldsAttributes/POS.ts";
import { IProductRestock } from "../../../../../utils/types/pos/IProductRestock";
import { fetchAllProducts } from "../../../Common/dataFetching/AllProductFetching.ts";
import { useSelector } from "react-redux";
import { AuthState } from "../../../../../utils/types/auth";
import { useNavigate } from "react-router-dom";
const SuperAdminAddReStock: React.FC = () => {
    const [selectedProduct, setSelectedProduct] =
        useState<SingleValue<ProductOptionToDropDown>>(null);
    const [newProductStockDetails, setNewProductStockDetails] =
        useState<IProductRestock>(productRestockFormAttributes);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [
        isVisibleSellingPriceChangeSection,
        setIsVisibleSellingPriceChangeSection,
    ] = useState<boolean>(false);
    const [productOptions, setProductOptions] = useState<
        ProductOptionToDropDown[]
    >([]);
    const userRole = useSelector(
        (state: { auth: AuthState }) => state.auth.userRole,
    );
    const navigate = useNavigate();

    useEffect(() => {
        const controller = new AbortController();
        fetchAllProducts(userRole, setIsLoading, setProductOptions).then();
        return () => controller.abort();
    }, []);

    const handleProductChange = (
        selectedOption: SingleValue<ProductOptionToDropDown>,
    ) => {
        setSelectedProduct(selectedOption);
        setNewProductStockDetails((prevState: any) => ({
            ...prevState,
            product_id: selectedOption?.value,
        }));
    };

    const handleProductStockChange = (
        event: React.ChangeEvent<HTMLInputElement>,
    ): void => {
        const { name, value } = event.target;

        setNewProductStockDetails((prevState: any) => ({
            ...prevState,
            [name]: value,
        }));
    };

    const handleReOrder = async () => {
        if (!selectedProduct) {
            alert.warn("Please select a product and enter a valid quantity.");
            return;
        }

        setIsLoading(true);

        try {
            const response = await addReOrderStock(
                newProductStockDetails,
                userRole,
            );

            if (response?.data.status === 200) {
                alert.success(
                    response.data.message || "Stock re-ordered successfully!",
                );
                navigate("/pos/inventory");
            } else {
                alert.warn(
                    response?.data.message ||
                        "Failed to re-order stock. Please try again.",
                );
            }

            setSelectedProduct(null);
        } catch (error) {
            console.error("Error re-ordering stock:", error);

            if (error instanceof AxiosError) {
                alert.warn("Failed to re-order stock: " + error.message);
            } else {
                alert.warn(
                    "Failed to re-order stock: An unknown error occurred.",
                );
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleSellingPriceChangeSectionVisibilities = () => {
        setIsVisibleSellingPriceChangeSection((prev) => !prev);
    };

    return (
        <div className="flex flex-col min-h-screen bg-gray-100">
            <div className="p-6 bg-white rounded-lg m-6 shadow">
                <h2 className="text-xl font-semibold text-gray-700 mb-4">
                    Re-Order Product Stock
                </h2>

                <Spinner isLoading={isLoading} />
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
                        onChange={handleProductChange}
                        placeholder="Select a product"
                        isDisabled={isLoading}
                    />
                </div>

                <div className="mb-4">
                    <label
                        htmlFor="new_added_stock"
                        className="block text-sm font-medium text-gray-700 mb-1"
                    >
                        New Quantity
                    </label>
                    <input
                        type="number"
                        id="new_added_stock"
                        name="new_added_stock"
                        className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring focus:ring-blue-300"
                        value={newProductStockDetails.new_added_stock}
                        onChange={handleProductStockChange}
                        min="0"
                        placeholder="Enter stock quantity"
                        disabled={isLoading}
                    />
                </div>

                <button
                    type="button"
                    onClick={handleSellingPriceChangeSectionVisibilities}
                    className="text-blue-600 hover:underline mb-4"
                >
                    Have changed selling prices?
                </button>

                {isVisibleSellingPriceChangeSection && (
                    <SellingPriceChangeSection
                        newProductStockDetails={newProductStockDetails}
                        handleProductStockChange={handleProductStockChange}
                    />
                )}

                <button
                    onClick={handleReOrder}
                    disabled={isLoading}
                    className={`w-full bg-blue-600 text-white py-2 rounded-md font-semibold hover:bg-blue-700 transition ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                    {isLoading ? "Processing..." : "Re-Order"}
                </button>
            </div>
        </div>
    );
};

export default SuperAdminAddReStock;
