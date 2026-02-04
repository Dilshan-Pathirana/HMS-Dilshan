import React, { useEffect, useState } from "react";
import Select, { SingleValue } from "react-select";
import {
    categories,
    units,
} from "../../../../../../utils/staticData/products/ProductCreateForm.ts";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../../../../../store.tsx";
import { getAllProductItemNamesAndItemCodesPharmacist } from "../../../../../../utils/api/pharmacy/SuperAdminUser/SuperAdminGetAllProducts.ts";
import { SelectOption } from "../../../../../../utils/types/pharmacy/Product/IPharmacyProduct.ts";
import {
    checkProductItemCodeDuplication,
    checkProductItemNameDuplication,
    validateProductInformationFields,
} from "../../../../Common/forms/product/ProductInformation/ProductInformationValidation.ts";
import alert from "../../../../../../utils/alert.ts";
import { addNewProduct } from "../../../../../../utils/slices/Product/productSlice.ts";
import { ProductInformationProps } from "../../../../../../utils/types/pharmacy/Product/ProdcutCreateForm.ts";

const ProductInformationForPharmacistUser: React.FC<
    ProductInformationProps
> = ({ data, setData, onNext }) => {
    const dispatch = useDispatch<AppDispatch>();
    const [productItemNames, setProductItemNames] = useState<[]>([]);
    const [productCodes, setProductCodes] = useState<[]>([]);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        fetchProductItemNamesAndItemCodes().then();
    }, []);

    const fetchProductItemNamesAndItemCodes = async () => {
        const response =
            await getAllProductItemNamesAndItemCodesPharmacist().then();

        if (response.status === 200) {
            const { product_names, product_codes } = response.data;
            setProductItemNames(product_names);
            setProductCodes(product_codes);
        }
    };

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = event.target;
        setData((prev) => ({ ...prev, [name]: value }));
        setErrors((prev) => ({ ...prev, [name]: "" }));
    };

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

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();

        if (checkProductItemCodeDuplication(productCodes, data.sku)) {
            alert.warn("Item code / SKU already exists! Please try new name.");
            return;
        }

        if (checkProductItemNameDuplication(productItemNames, data.name)) {
            alert.warn("Item name already exists! Please try new name.");
            return;
        }

        if (validateProductInformationFields(data, setErrors)) {
            dispatch(addNewProduct(data));
            onNext();
        }
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
                        errors.sku ? "border-red-500" : "border-gray-300"
                    }`}
                />
                {errors.sku && (
                    <p className="text-red-500 text-sm">{errors.sku}</p>
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
                        errors.name ? "border-red-500" : "border-gray-300"
                    }`}
                />
                {errors.name && (
                    <p className="text-red-500 text-sm">{errors.name}</p>
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
                        errors.name ? "border-red-500" : "border-gray-300"
                    }`}
                />
                {errors.barcode && (
                    <p className="text-red-500 text-sm">{errors.barcode}</p>
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
                            ? "border-red-500"
                            : "border-gray-300"
                    }`}
                />
                {errors.genericName && (
                    <p className="text-red-500 text-sm">{errors.genericName}</p>
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
                        errors.brandName ? "border-red-500" : "border-gray-300"
                    }`}
                />
                {errors.brandName && (
                    <p className="text-red-500 text-sm">{errors.brandName}</p>
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
                        errors.category ? "border-red-500" : ""
                    }`}
                    classNamePrefix="react-select"
                />
                {errors.category && (
                    <p className="text-red-500 text-sm">{errors.category}</p>
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
                    className={`w-full ${errors.units ? "border-red-500" : ""}`}
                    classNamePrefix="react-select"
                />
                {errors.units && (
                    <p className="text-red-500 text-sm">{errors.units}</p>
                )}
            </div>

            <div className="col-span-1 md:col-span-2 flex justify-between mt-4">
                <button
                    type="submit"
                    className="border px-4 py-2 bg-blue-500 text-white"
                >
                    Next
                </button>
            </div>
        </form>
    );
};

export default ProductInformationForPharmacistUser;
