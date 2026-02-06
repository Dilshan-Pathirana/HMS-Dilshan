import React, { useEffect, useState } from "react";
import { ISalesHeaderCardProps } from "../../../../utils/types/pos/IBillModalprops.ts";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../../../store.tsx";
import Select, { SingleValue } from "react-select";
import NotRegisterCustomerDetailsSection from "../../SuperAdminPOS/SuperAdminPOSSalesPage/Cards/SuperAdminSales/SuperAdminPaymentModal/NotRegisterCustomerDetailsSection.tsx";
import { clearCart } from "../../../../utils/slices/cart/cartSlice.ts";
import { IPatientDetailsForSales } from "../../../../utils/types/users/IPatient.ts";
import {ConfirmAlert} from "../../../../assets/Common/Alert/ConfirmAlert.tsx";

const SalesHeader: React.FC<ISalesHeaderCardProps> = ({
    patientsDetails,
    customerDetails,
    setCustomerDetails,
    setIsReachedMaximumStock,
}) => {
    const [isShowCustomerAddFields, setIsShowCustomerAddFields] =
        useState<boolean>(false);
    const [patientOptions, setPatientOptions] = useState<
        { value: string; label: string }[]
    >([]);
    const dispatch = useDispatch<AppDispatch>();

    useEffect(() => {
        const options = patientsDetails.map(
            (patient: IPatientDetailsForSales) => ({
                value: patient.id,
                label: patient.first_name + " " + patient.last_name,
            }),
        );
        setPatientOptions(options);
    }, [patientsDetails, customerDetails]);
    const showCustomerAddFields = () => {
        setIsShowCustomerAddFields((prev) => !prev);
        setCustomerDetails((customerDetails) => ({
            ...customerDetails,
            customer_id: "",
        }));
    };

    const handleCustomerChange = (
        selectedCustomer: SingleValue<{ value: string; label: string }>,
    ) => {
        setCustomerDetails((customerDetails) => ({
            ...customerDetails,
            customer_id: selectedCustomer?.value,
        }));
    };

    const handleNotRegisterCustomerChanges = (
        event: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const { name, value } = event.target;

        setCustomerDetails((customerDetails) => ({
            ...customerDetails,
            [name]: value,
        }));
    };

    const setValuesForSelectors = (
        patientOptions: { value: string; label: string }[],
    ) => {
        const result = patientOptions.find(
            (option) => option.value === customerDetails.customer_id,
        );

        return result === undefined ? { value: "", label: "" } : result;
    };

    const clearShoppingCart = async () => {
        const isConfirmed = await ConfirmAlert(
            "Do you want clear shopping cart?",
            "Do you really want to clear this cart details?",
        );

        if (isConfirmed) {
            dispatch(clearCart());
            setIsReachedMaximumStock(false);
        }
    };
    return (
        <header className="grid grid-cols-2 px-6 py-4 bg-white border-b mt-9 ml-5 mr-5 rounded-lg shadow-lg">
            <div>
                <div className={isShowCustomerAddFields ? "hidden" : ""}>
                    <label
                        htmlFor="patient"
                        className="text-sm font-medium text-neutral-700"
                    >
                        Select Customer:
                    </label>
                    <Select
                        value={setValuesForSelectors(patientOptions)}
                        onChange={handleCustomerChange}
                        options={patientOptions}
                        className="mt-1 mb-2"
                        placeholder="Select Customers"
                    />
                </div>
                <button
                    className="text-sm text-primary-500 mt-0 mb-2"
                    onClick={() => showCustomerAddFields()}
                >
                    Not Registered Customer
                </button>

                <NotRegisterCustomerDetailsSection
                    customerDetails={customerDetails}
                    isShowCustomerAddFields={isShowCustomerAddFields}
                    handleNotRegisterCustomerChanges={
                        handleNotRegisterCustomerChanges
                    }
                />
            </div>
            <div>
                <button
                    onClick={() => clearShoppingCart()}
                    className="m-5 bg-primary-500 text-white p-3 rounded-lg flex flex-col justify-center items-start h-auto hover:bg-primary-500 transition-colors text-left"
                >
                    Clear Shopping Cart
                </button>
            </div>
        </header>
    );
};

export default SalesHeader;
