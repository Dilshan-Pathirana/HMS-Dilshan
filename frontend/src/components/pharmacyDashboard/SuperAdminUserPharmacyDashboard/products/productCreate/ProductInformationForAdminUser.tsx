import React, { useEffect, useState } from "react";
import { ProductInformationProps } from "../../../../../utils/types/pharmacy/Product/ProdcutCreateForm.ts";
import { useDispatch } from "react-redux";
import { addNewProduct } from "../../../../../utils/slices/Product/productSlice.ts";
import { AppDispatch } from "../../../../../store.tsx";
import {
    checkProductItemCodeDuplication,
    checkProductItemNameDuplication,
    validateProductInformationFields,
} from "../../../Common/forms/product/ProductInformation/ProductInformationValidation.ts";
import alert from "../../../../../utils/alert.ts";
import ProductInformationForm from "../../../Common/forms/product/ProductInformation/ProductInformationForm.tsx";
import { fetchProductItemNamesAndItemCodes } from "../../../Common/forms/product/ProductInformation/CommonFunctionalities.ts";

const ProductInformationForAdminUser: React.FC<ProductInformationProps> = ({
    data,
    setData,
    onNext,
}) => {
    const dispatch = useDispatch<AppDispatch>();
    const [productItemNames, setProductItemNames] = useState<[]>([]);
    const [productCodes, setProductCodes] = useState<[]>([]);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        fetchProductItemNamesAndItemCodes(
            setProductItemNames,
            setProductCodes,
        ).then();
    }, []);

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
        <ProductInformationForm
            data={data}
            errors={errors}
            setData={setData}
            setErrors={setErrors}
            handleSubmit={handleSubmit}
        />
    );
};

export default ProductInformationForAdminUser;
