import React, { useEffect, useState } from "react";
import { ISalesHeaderCardProps } from "../../../../utils/types/pos/IBillModalprops.ts";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../../../store.tsx";
import Select, { SingleValue } from "react-select";
import NotRegisterCustomerDetailsSection from "../../SuperAdminPOS/SuperAdminPOSSalesPage/Cards/SuperAdminSales/SuperAdminPaymentModal/NotRegisterCustomerDetailsSection.tsx";
import { clearCart } from "../../../../utils/slices/cart/cartSlice.ts";
import { IPatientDetailsForSales } from "../../../../utils/types/users/IPatient.ts";
import { ConfirmAlert } from "../../../../assets/Common/Alert/ConfirmAlert.tsx";
import { User, UserPlus, Trash2, ShoppingCart } from "lucide-react";

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
        <header className="grid grid-cols-1 md:grid-cols-2 gap-4 px-6 py-5 bg-white border-b border-neutral-200 shadow-sm sticky top-0 z-20">
            <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 mb-1">
                    <div className="p-2 bg-primary-50 rounded-lg text-primary-600">
                        <User className="w-5 h-5" />
                    </div>
                    <h2 className="text-lg font-bold text-neutral-800">Customer Details</h2>
                </div>

                <div className={`${isShowCustomerAddFields ? "hidden" : "block transition-all duration-300"}`}>
                    <Select
                        value={setValuesForSelectors(patientOptions)}
                        onChange={handleCustomerChange}
                        options={patientOptions}
                        className="w-full text-sm react-select-container"
                        classNamePrefix="react-select"
                        placeholder="Select Registered Customer..."
                        styles={{
                            control: (base) => ({
                                ...base,
                                borderColor: '#e5e7eb',
                                borderRadius: '0.75rem',
                                padding: '2px',
                                boxShadow: 'none',
                                '&:hover': {
                                    borderColor: '#10b981'
                                }
                            }),
                            option: (base, state) => ({
                                ...base,
                                backgroundColor: state.isSelected ? '#10b981' : state.isFocused ? '#d1fae5' : 'white',
                                color: state.isSelected ? 'white' : '#374151',
                            })
                        }}
                    />
                </div>

                <button
                    className={`flex items-center gap-2 text-sm font-medium ${isShowCustomerAddFields ? 'text-neutral-500' : 'text-primary-600'} hover:text-primary-700 transition-colors self-start`}
                    onClick={() => showCustomerAddFields()}
                >
                    <UserPlus className="w-4 h-4" />
                    {isShowCustomerAddFields ? "Cancel New Customer" : "Add New / Guest Customer"}
                </button>

                <div className={`mt-2 ${isShowCustomerAddFields ? 'block animate-in fade-in slide-in-from-top-2' : 'hidden'}`}>
                    <NotRegisterCustomerDetailsSection
                        customerDetails={customerDetails}
                        isShowCustomerAddFields={isShowCustomerAddFields}
                        handleNotRegisterCustomerChanges={
                            handleNotRegisterCustomerChanges
                        }
                    />
                </div>
            </div>

            <div className="flex flex-col items-end justify-center md:border-l md:border-neutral-100 md:pl-6">
                <button
                    onClick={() => clearShoppingCart()}
                    className="flex items-center gap-3 px-5 py-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 hover:text-red-700 transition-all border border-red-100 shadow-sm group w-full md:w-auto justify-center"
                >
                    <Trash2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span className="font-semibold">Clear Cart</span>
                </button>
                <div className="mt-3 text-xs text-neutral-400 flex items-center gap-1">
                    <ShoppingCart className="w-3 h-3" />
                    <span>Resets current transaction</span>
                </div>
            </div>
        </header>
    );
};

export default SalesHeader;
