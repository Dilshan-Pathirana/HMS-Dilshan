import axios from 'axios';
import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../../../../../store.tsx";
import {
    SelectOption,
    Suppliers,
    SupplierStepProps,
} from "../../../../../../utils/types/pharmacy/Product/ProdcutCreateForm.ts";
import { setSelectedSupplier } from "../../../../../../utils/slices/Product/productSlice.ts";
import api from "../../../../../../utils/api/axios";
import alert from "../../../../../../utils/alert.ts";
import Select from "react-select";
import { AiOutlineClose, AiOutlinePlus } from "react-icons/ai";
import SupplierCreateFormForAdmin from "../../../../SuperAdminUserPharmacyDashboard/products/productCreate/SupplierCreateFormForAdmin.tsx";
import {
    getAllPharmacistSuppliers
} from "../../../../../../utils/api/pharmacy/PharmacistUser/PharmasistGetAllProducts.ts";

const SupplierInformationForPharmacistUser: React.FC<SupplierStepProps> = ({
    data,
    setData,
    onNext,
    onBack,
}) => {
    const dispatch = useDispatch<AppDispatch>();

    const [isAddingSupplier, setIsAddingSupplier] = useState(false);
    const [supplierOptions, setSupplierOptions] = useState<SelectOption[]>([]);
    const [currentSelection, setCurrentSelection] =
        useState<SelectOption | null>(null);
    const [error, setError] = useState<string>("");

    useEffect(() => {
        fetchSuppliers().then();

        if (data.supplier_id) {
            dispatch(setSelectedSupplier(data));
        }
    }, [data, dispatch]);

    const fetchSuppliers = async () => {
        try {
            const response = await getAllPharmacistSuppliers();
            if (response.data.status === 200) {
                const transformedSuppliers = response.data.suppliers.map(
                    (supplier: Suppliers) => ({
                        value: supplier.id,
                        label: supplier.supplier_name,
                    }),
                );

                setSupplierOptions(transformedSuppliers);

                if (data.supplier_id) {
                    const initialSupplier = transformedSuppliers.find(
                        (supplier: Suppliers) =>
                            supplier.value === data.supplier_id,
                    );
                    if (initialSupplier) {
                        setCurrentSelection(initialSupplier);
                    }
                }
            } else {
                console.error(
                    "Failed to fetch suppliers:",
                    response.statusText,
                );
            }
        } catch (error) {
            if (axios.isAxiosError(error)) {
                alert.warn(error.response?.data);
            } else {
                alert.warn("Error fetching suppliers.");
            }
        }
    };

    const handleSupplierSelect = (selectedOption: SelectOption | null) => {
        setCurrentSelection(selectedOption);
        setData({ supplier_id: selectedOption ? selectedOption.value : "" });
        setError("");
    };

    const toggleAddSupplierForm = () => {
        setIsAddingSupplier((prev) => !prev);
    };

    const handleSubmit = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        if (!data.supplier_id) {
            setError("Please select a supplier.");
            return;
        }
        dispatch(setSelectedSupplier(data));
        onNext();
    };
    return (
        <div className="grid grid-cols-1 gap-4">
            <div className="grid grid-cols-2 gap-2 md:col-span-2 items-center">
                <div className="flex-1">
                    <label htmlFor="supplier" className="block mb-2">
                        Select Supplier
                    </label>
                    <Select
                        id="supplier"
                        value={currentSelection}
                        onChange={handleSupplierSelect}
                        options={supplierOptions}
                        placeholder="Select Supplier"
                        className={`max-w-md ${error ? "border-error-500" : ""}`}
                        classNamePrefix="react-select"
                        isDisabled={isAddingSupplier}
                    />
                    {error && (
                        <p className="text-error-500 text-sm mt-1">{error}</p>
                    )}
                </div>
                <div className="flex items-center mt-8">
                    <button
                        type="button"
                        onClick={toggleAddSupplierForm}
                        className="flex items-center text-primary-500 border border-primary-500 px-4 py-2 rounded"
                    >
                        {isAddingSupplier ? (
                            <AiOutlineClose className="mr-2" />
                        ) : (
                            <AiOutlinePlus className="mr-2" />
                        )}
                        {isAddingSupplier ? "Cancel" : "Add New Supplier"}
                    </button>
                </div>
            </div>

            {isAddingSupplier && (
                <SupplierCreateFormForAdmin
                    setIsAddingSupplier={setIsAddingSupplier}
                    fetchSuppliers={fetchSuppliers}
                />
            )}

            <div className="flex justify-between mt-4 pt-20">
                <button
                    onClick={onBack}
                    className="border px-4 py-2 bg-gray-500 text-white"
                >
                    Back
                </button>
                <button
                    type="submit"
                    onClick={handleSubmit}
                    className="border px-4 py-2 bg-primary-500 text-white"
                >
                    Next
                </button>
            </div>
        </div>
    );
};

export default SupplierInformationForPharmacistUser;
