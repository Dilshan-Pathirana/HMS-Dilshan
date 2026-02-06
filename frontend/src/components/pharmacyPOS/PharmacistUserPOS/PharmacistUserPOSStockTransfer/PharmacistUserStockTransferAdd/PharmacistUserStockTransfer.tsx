import { useEffect, useState } from "react";
import {
    Product,
    ProductOptionToDropDown,
    TransferStockFormData,
    TransferStockFormInitialValues,
} from "../../../../../utils/types/pos/IProduct.ts";
import { SingleValue } from "react-select";
import alert from "../../../../../utils/alert.ts";
import PharmacistUserStockTransferForm from "./PharmacistUserStockTransferForm.tsx";
import { AxiosError } from "axios";
import Spinner from "../../../../../assets/Common/Spinner.tsx";
import { getAllProducts } from "../../../../../utils/api/pharmacy/PharmacyPOS/PharmacistUserPOS/PharmacistUserGetAllProducts.ts";
import { addTransferStockPharmacistUser } from "../../../../../utils/api/pharmacy/PharmacyPOS/PharmacistUserPOS/PharmacistUserTransferStockAdd.ts";

export default function PharmacistUserStockTransfer() {
    const [selectedProduct, setSelectedProduct] =
        useState<SingleValue<ProductOptionToDropDown>>(null);
    const [formData, setFormData] = useState<TransferStockFormData>(
        TransferStockFormInitialValues,
    );
    const [isLoading, setIsLoading] = useState(false);
    const [productOptions, setProductOptions] = useState<
        ProductOptionToDropDown[]
    >([]);

    useEffect(() => {
        const fetchAllProducts = async () => {
            setIsLoading(true);
            try {
                const response = await getAllProducts();

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
            } catch (error) {
                if (error instanceof AxiosError) {
                    alert.warn(
                        "Failed to fetch product list: " + error.message,
                    );
                } else {
                    alert.warn(
                        "Failed to fetch product list: An unknown error occurred.",
                    );
                }
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

    const handleAddTransferStock = async () => {
        const { quantity, remarks } = formData;

        if (!selectedProduct || !quantity || !remarks.trim()) {
            alert.warn(
                "Please select a product, enter a valid quantity, and provide a remark.",
            );
            return;
        }

        setIsLoading(true);

        try {
            const response = await addTransferStockPharmacistUser(
                selectedProduct.value,
                quantity,
                remarks,
            );

            if (response?.data?.status === 200) {
                alert.success(
                    response.data.message ||
                        "Transfer stock added successfully!",
                );
                setSelectedProduct(null);
                setFormData({ quantity: "", remarks: "" });
            } else {
                alert.warn(
                    response?.data?.message ||
                        "Failed to add transfer stock. Please try again.",
                );
            }
        } catch (error) {
            if (error instanceof AxiosError) {
                alert.warn("Failed to add transfer stock: " + error.message);
            } else {
                alert.warn(
                    "Failed to add transfer stock: An unknown error occurred.",
                );
            }
        }

        setIsLoading(false);
    };

    return (
        <div className="p-6 bg-white rounded-lg shadow-md max-w-lg ml-48 mt-16 mb-5">
            <h2 className="text-xl font-semibold text-neutral-700 mb-4">
                Add Transfer Stock
            </h2>
            <Spinner isLoading={isLoading} />
            <PharmacistUserStockTransferForm
                productOptions={productOptions}
                selectedProduct={selectedProduct}
                onProductChange={handleProductChange}
                formData={formData}
                onInputChange={handleInputChange}
                onSubmit={handleAddTransferStock}
                isLoading={isLoading}
            />
        </div>
    );
}
