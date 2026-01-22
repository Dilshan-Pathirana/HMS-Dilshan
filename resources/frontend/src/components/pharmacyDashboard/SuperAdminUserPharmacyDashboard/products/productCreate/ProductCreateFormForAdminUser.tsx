import React, { useState } from "react";
import ProductInformationForAdminUser from "./ProductInformationForAdminUser.tsx";
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
import SupplierInformationForAdminUser from "./SupplierInformationForAdminUser.tsx";
import WarrantyInformation from "./WarrantyInformation.tsx";
import StockInformationForAdminUser from "./StockInformationForAdminUser.tsx";

const ProductCreateFormForAdminUser: React.FC = () => {
    const [currentStep, setCurrentStep] = useState(1);
    const [stepOneData, setStepOneData] =
        useState<ProductInformationStep>(ProductBasicDetails);
    const [stepTwoData, setStepTwoData] = useState<SupplierStepData>(
        ProductSupplierDetails,
    );
    const [stepThreeData, setStepThreeData] = useState<WarrantyStepData>(
        ProductWarrantyDetails,
    );
    const [stepFourData, setStepFourData] =
        useState<StockInformationStep>(ProductStockDetails);

    const handleNextStep = () => setCurrentStep((prev) => prev + 1);
    const handlePreviousStep = () => setCurrentStep((prev) => prev - 1);

    const renderFormStep = () => {
        switch (currentStep) {
            case 1:
                return (
                    <ProductInformationForAdminUser
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
                        data={stepFourData}
                        setData={setStepFourData}
                        onBack={handlePreviousStep}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <main className="flex-1 overflow-x-hidden overflow-y-auto mt-20 ml-72 p-6">
            <div>{renderFormStep()}</div>
        </main>
    );
};

export default ProductCreateFormForAdminUser;
