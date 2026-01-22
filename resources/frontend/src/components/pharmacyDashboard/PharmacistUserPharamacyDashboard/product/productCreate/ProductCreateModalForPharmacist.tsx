import React, { useState, useEffect } from "react";
import { AiOutlineClose } from "react-icons/ai";
import ProductInformationForPharmacistUser from "./productInformation/ProductInformationForPharmacistUser.tsx";
import SupplierInformationForPharmacistUser from "./supplierInformation/SupplierInformationForPharmacistUser.tsx";
import WarrantyInformation from "../../../SuperAdminUserPharmacyDashboard/products/productCreate/WarrantyInformation.tsx";
import StockInformationForPharmacistUser from "./StockInformationForPharmacistUser.tsx";
import {
    ProductInformationStep,
    StockInformationStep,
    SupplierStepData,
    WarrantyStepData,
} from "../../../../../utils/types/pharmacy/Product/ProdcutCreateForm.ts";
import {
    ProductBasicDetails,
    ProductStockDetails,
    ProductSupplierDetails,
    ProductWarrantyDetails,
} from "../../../../../utils/form/formFieldsAttributes/ProductCreateFormFields.ts";

interface ProductCreateModalForPharmacistProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    editItem?: any;
}

const ProductCreateModalForPharmacist: React.FC<ProductCreateModalForPharmacistProps> = ({
    isOpen,
    onClose,
    onSuccess,
    editItem,
}) => {
    const [currentStep, setCurrentStep] = useState(1);
    const [stepOneData, setStepOneData] = useState<ProductInformationStep>(
        editItem ? {
            ...ProductBasicDetails,
            sku: editItem.batch_number || ProductBasicDetails.sku,
            name: editItem.medicine_name || ProductBasicDetails.name,
            barcode: editItem.barcode || ProductBasicDetails.barcode,
            genericName: editItem.generic_name || ProductBasicDetails.genericName,
            brandName: editItem.brand_name || ProductBasicDetails.brandName,
            category: editItem.category || ProductBasicDetails.category,
            units: editItem.unit || ProductBasicDetails.units,
        } : ProductBasicDetails
    );
    const [stepTwoData, setStepTwoData] = useState<SupplierStepData>(
        editItem ? {
            ...ProductSupplierDetails,
            supplier_id: editItem.supplier_id || editItem.supplier || ProductSupplierDetails.supplier_id,
        } : ProductSupplierDetails
    );
    const [stepThreeData, setStepThreeData] = useState<WarrantyStepData>(ProductWarrantyDetails);
    const [stepFourData, setStepFourData] = useState<StockInformationStep>(
        editItem ? {
            ...ProductStockDetails,
            quantityInStock: editItem.quantity?.toString() || ProductStockDetails.quantityInStock,
            reorderLevel: editItem.reorder_level?.toString() || ProductStockDetails.reorderLevel,
            sellingPrice: editItem.unit_price?.toString() || ProductStockDetails.sellingPrice,
            expiryDate: editItem.expiry_date || ProductStockDetails.expiryDate,
        } : ProductStockDetails
    );

    // Update form data when editItem changes
    useEffect(() => {
        if (editItem) {
            setStepOneData({
                ...ProductBasicDetails,
                sku: editItem.batch_number || ProductBasicDetails.sku,
                name: editItem.medicine_name || ProductBasicDetails.name,
                barcode: editItem.barcode || ProductBasicDetails.barcode,
                genericName: editItem.generic_name || ProductBasicDetails.genericName,
                brandName: editItem.brand_name || ProductBasicDetails.brandName,
                category: editItem.category || ProductBasicDetails.category,
                units: editItem.unit || ProductBasicDetails.units,
            });
            setStepTwoData({
                ...ProductSupplierDetails,
                supplier_id: editItem.supplier_id || editItem.supplier || ProductSupplierDetails.supplier_id,
            });
            setStepFourData({
                ...ProductStockDetails,
                quantityInStock: editItem.quantity?.toString() || ProductStockDetails.quantityInStock,
                reorderLevel: editItem.reorder_level?.toString() || ProductStockDetails.reorderLevel,
                sellingPrice: editItem.unit_price?.toString() || ProductStockDetails.sellingPrice,
                expiryDate: editItem.expiry_date || ProductStockDetails.expiryDate,
            });
        } else {
            setStepOneData(ProductBasicDetails);
            setStepTwoData(ProductSupplierDetails);
            setStepThreeData(ProductWarrantyDetails);
            setStepFourData(ProductStockDetails);
        }
    }, [editItem]);

    const handleNextStep = () => setCurrentStep((prev) => prev + 1);
    const handlePreviousStep = () => setCurrentStep((prev) => prev - 1);

    const handleClose = () => {
        setCurrentStep(1);
        setStepOneData(ProductBasicDetails);
        setStepTwoData(ProductSupplierDetails);
        setStepThreeData(ProductWarrantyDetails);
        setStepFourData(ProductStockDetails);
        onClose();
    };

    const handleSuccess = () => {
        handleClose();
        if (onSuccess) {
            onSuccess();
        }
    };

    const renderFormStep = () => {
        switch (currentStep) {
            case 1:
                return (
                    <ProductInformationForPharmacistUser
                        data={stepOneData}
                        setData={setStepOneData}
                        onNext={handleNextStep}
                    />
                );
            case 2:
                return (
                    <SupplierInformationForPharmacistUser
                        data={stepTwoData}
                        setData={setStepTwoData}
                        onNext={handleNextStep}
                        onBack={handlePreviousStep}
                    />
                );
            case 3:
                return (
                    <WarrantyInformation
                        data={stepThreeData}
                        setData={setStepThreeData}
                        onNext={handleNextStep}
                        onBack={handlePreviousStep}
                    />
                );
            case 4:
                return (
                    <StockInformationForPharmacistUser
                        data={stepFourData}
                        setData={setStepFourData}
                        onBack={handlePreviousStep}
                        onSuccess={handleSuccess}
                    />
                );
            default:
                return null;
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-3xl relative max-h-[80vh] overflow-y-auto">
                <button
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                    onClick={handleClose}
                >
                    <AiOutlineClose size={24} />
                </button>
                <h2 className="text-lg font-semibold">
                    {editItem ? 'Edit Product' : 'Add New Product'} - Step {currentStep} of 4
                </h2>
                <div className="py-4">
                    <div
                        style={{ width: `${(currentStep / 4) * 100}%` }}
                        className="bg-blue-500 h-2 rounded transition-all duration-300"
                    ></div>
                </div>
                {renderFormStep()}
            </div>
        </div>
    );
};

export default ProductCreateModalForPharmacist;
