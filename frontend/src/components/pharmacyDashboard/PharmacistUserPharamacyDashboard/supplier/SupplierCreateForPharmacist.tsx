import axios from 'axios';
import React, { useState } from "react";
import {ISupplierErrorFields, SupplierInfo} from "../../../../utils/types/pharmacy/Product/ProdcutCreateForm.ts";
import { productSupplierInformationDetails } from "../../../../utils/form/formFieldsAttributes/ProductCreateFormFields.ts";
import { createPharmacistSupplier } from "../../../../utils/api/pharmacy/SuperAdminUser/SupperAdminCreateSupplier.ts";
import alert from "../../../../utils/alert.ts";
import api from "../../../../utils/api/axios";
import SupplierCreateFormFields from "../../Common/forms/supplier/SupplierCreateFormFields.tsx";
const SupplierCreateForPharmacist: React.FC = () => {
    const [supplierInfo, setSupplierInfo] = useState<SupplierInfo>(
        productSupplierInformationDetails,
    );
    const [formFieldError, setFormFieldError] = useState<ISupplierErrorFields>({
        supplier_name: '',
        contact_number: '',
    })

    const handleChange = (
        event: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>,
    ) => {
        const { name, value } = event.target;
        setSupplierInfo((prev) => ({ ...prev, [name]: value }));
    };

    const handleSupplierInsert = async (
        event: React.MouseEvent<HTMLButtonElement>,
    ) => {
        event.preventDefault();

        if (supplierInfo.supplier_name === '' || supplierInfo.contact_number === '') {
            setFormFieldError((prevState) => ({
                ...prevState,
                supplier_name: 'Supplier Name is required',
                contact_number: 'Supplier contact number is required',
            }))
            return;
        }

        try {
            const response = await createPharmacistSupplier(supplierInfo);

            if (response.data.status === 200) {
                alert.success("Supplier added successfully");
            } else {
                console.error("Failed to add supplier:", response.statusText);
            }
        } catch (error) {
            if (axios.isAxiosError(error)) {
                alert.warn(error.response?.data);
            } else {
                alert.warn("Error adding supplier.");
            }
        }
    };

    return (
        <SupplierCreateFormFields
            formFieldError={formFieldError}
            handleChange={handleChange}
            handleSupplierInsert={handleSupplierInsert}
        />
    );
};

export default SupplierCreateForPharmacist;
