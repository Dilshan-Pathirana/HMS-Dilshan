import React, { useState } from "react";
import ProductInformationForm from "../../../Common/forms/product/ProductInformation/ProductInformationForm.tsx";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../../../../store.tsx";
import { validateProductInformationFields } from "../../../Common/forms/product/ProductInformation/ProductInformationValidation.ts";
import { addNewProduct } from "../../../../../utils/slices/Product/productSlice.ts";
import { ProductInformationProps } from "../../../../../utils/types/pharmacy/Product/ProdcutCreateForm.ts";

const ProductEditModelForAdmin: React.FC<ProductInformationProps> = ({
    data,
    setData,
    onNext,
}) => {
    const dispatch = useDispatch<AppDispatch>();
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();

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

export default ProductEditModelForAdmin;
