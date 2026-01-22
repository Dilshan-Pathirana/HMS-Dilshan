import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {ISupplierErrorFields, SupplierInfo} from "../../../../utils/types/pharmacy/Product/ProdcutCreateForm.ts";
import { productSupplierInformationDetails } from "../../../../utils/form/formFieldsAttributes/ProductCreateFormFields.ts";
import { createSuperAdminSupplier } from "../../../../utils/api/pharmacy/SuperAdminUser/SupperAdminCreateSupplier.ts";
import alert from "../../../../utils/alert.ts";
import axios from "axios";
import SupplierCreateFormFields from "../../Common/forms/supplier/SupplierCreateFormFields.tsx";

const SupplierCreateForAdmin: React.FC = () => {
    const navigate = useNavigate();
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
            const response = await createSuperAdminSupplier(supplierInfo);

            if (response.data.status === 200) {
                alert.success("Supplier added successfully");
                // Redirect to pharmacies page after successful addition
                setTimeout(() => {
                    navigate('/pharmacy-dashboard/pharmacies');
                }, 1000);
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

export default SupplierCreateForAdmin;
