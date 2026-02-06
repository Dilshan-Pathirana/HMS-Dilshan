import React, { useState, useEffect } from "react";
import ProductInformationForAdminUser from "./ProductInformationForAdminUser.tsx";
import SupplierInformationForAdminUser from "./SupplierInformationForAdminUser.tsx";
import WarrantyInformation from "./WarrantyInformation.tsx";
import StockInformationForAdminUser from "./StockInformationForAdminUser.tsx";
import { AiOutlineClose } from "react-icons/ai";
import {
    ProductCreateModalProps,
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
import ProductEditModelForAdmin from "../productEdit/ProductEditModelForAdmin.tsx";

const ProductCreateModal: React.FC<ProductCreateModalProps> = ({
    isOpen,
    onClose,
    initialData,
    isEditing = false,
    productId,
}) => {
    const [currentStep, setCurrentStep] = useState(1);
    const [stepOneData, setStepOneData] = useState<ProductInformationStep>(
        initialData?.stepOne || ProductBasicDetails,
    );
    const [stepTwoData, setStepTwoData] = useState<SupplierStepData>(
        initialData?.stepTwo || ProductSupplierDetails,
    );
    const [stepThreeData, setStepThreeData] = useState<WarrantyStepData>(
        initialData?.stepThree || ProductWarrantyDetails,
    );
    const [stepFourData, setStepFourData] = useState<StockInformationStep>(
        initialData?.stepFour || ProductStockDetails,
    );

    useEffect(() => {
        if (initialData) {
            setStepOneData(initialData.stepOne);
            setStepTwoData(initialData.stepTwo);
            setStepThreeData(initialData.stepThree);
            setStepFourData(initialData.stepFour);
        }
    }, [initialData]);

    const handleNextStep = () => setCurrentStep((prev) => prev + 1);
    const handlePreviousStep = () => setCurrentStep((prev) => prev - 1);

    const renderFormStep = () => {
        switch (currentStep) {
            case 1:
                return !isEditing ? (
                    <ProductInformationForAdminUser
                        data={stepOneData}
                        setData={setStepOneData}
                        onNext={handleNextStep}
                    />
                ) : (
                    <ProductEditModelForAdmin
                        data={stepOneData}
                        setData={setStepOneData}
                        onNext={handleNextStep}
                    />
                );
            case 2:
                return (
                    <SupplierInformationForAdminUser
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
                    <StockInformationForAdminUser
                        isEditing={isEditing}
                        data={stepFourData}
                        setData={setStepFourData}
                        onBack={handlePreviousStep}
                        productId={productId}
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
                    className="absolute top-4 right-4 text-neutral-500 hover:text-neutral-700"
                    onClick={onClose}
                >
                    <AiOutlineClose size={24} />
                </button>
                <h2 className="text-lg font-semibold">
                    {isEditing ? "Edit Product" : "Add New Product"} - Step{" "}
                    {currentStep}
                </h2>
                <div className="py-4">
                    <div
                        style={{ width: `${(currentStep / 4) * 100}%` }}
                        className="bg-primary-500 h-2 rounded"
                    ></div>
                </div>
                {renderFormStep()}
            </div>
        </div>
    );
};

export default ProductCreateModal;
