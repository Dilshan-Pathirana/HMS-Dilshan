import React, { useState } from "react";
import {
    productSupplierInformationDetails,
    SupplierCreateFormProps,
} from "../../../../../../utils/form/formFieldsAttributes/ProductCreateFormFields.ts";
import { SupplierInfo } from "../../../../../../utils/types/pharmacy/Product/ProdcutCreateForm.ts";
import { validateForm } from "../../../../Common/forms/supplier/SupplierFormValidation.ts";
import { createPharmacistSupplier } from "../../../../../../utils/api/pharmacy/SuperAdminUser/SupperAdminCreateSupplier.ts";
import alert from "../../../../../../utils/alert.ts";
import axios from "axios";
import { AiOutlineLoading } from "react-icons/ai";

const SupplierCreateFormForPharmacistUser: React.FC<
    SupplierCreateFormProps
> = ({ setIsAddingSupplier, fetchSuppliers }) => {
    const [supplierInfo, setSupplierInfo] = useState<SupplierInfo>(
        productSupplierInformationDetails,
    );
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (
        event: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>,
    ) => {
        const { name, value } = event.target;
        setSupplierInfo((prev) => ({ ...prev, [name]: value }));
        setErrors((prevErrors) => ({ ...prevErrors, [name]: "" }));
    };

    const handleSupplierInsert = async (
        event: React.MouseEvent<HTMLButtonElement>,
    ) => {
        event.preventDefault();
        if (!validateForm(supplierInfo, setErrors)) return;

        setIsLoading(true);

        try {
            const response = await createPharmacistSupplier(supplierInfo);

            if (response.data.status === 200) {
                if (fetchSuppliers) {
                    await fetchSuppliers();
                }
                setIsAddingSupplier(false);
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
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="md:col-span-2 border p-4 mt-2 rounded grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label htmlFor="name" className="block mb-2">
                    Supplier Name
                </label>
                <input
                    id="supplier_name"
                    name="supplier_name"
                    value={supplierInfo.supplier_name}
                    onChange={handleChange}
                    placeholder="Full name of the supplier company"
                    className={`border p-2 w-full mb-1 ${
                        errors.supplier_name ? "border-red-500" : ""
                    }`}
                />
                {errors.supplier_name && (
                    <p className="text-red-500 text-sm">
                        {errors.supplier_name}
                    </p>
                )}
            </div>
            <div>
                <label htmlFor="contactPerson" className="block mb-2">
                    Contact Person
                </label>
                <input
                    id="contact_person"
                    name="contact_person"
                    value={supplierInfo.contact_person}
                    onChange={handleChange}
                    placeholder="Name of primary contact person"
                    className="border p-2 w-full mb-4"
                />
            </div>
            <div>
                <label htmlFor="contactNumber" className="block mb-2">
                    Contact Number
                </label>
                <input
                    type="number"
                    id="contact_number"
                    name="contact_number"
                    value={supplierInfo.contact_number}
                    onChange={handleChange}
                    placeholder="Phone number for reaching the supplier"
                    className={`border p-2 w-full mb-1 ${
                        errors.contact_number ? "border-red-500" : ""
                    }`}
                />
                {errors.contact_number && (
                    <p className="text-red-500 text-sm">
                        {errors.contact_number}
                    </p>
                )}
            </div>
            <div>
                <label htmlFor="emailAddress" className="block mb-2">
                    Email Address
                </label>
                <input
                    type="email"
                    id="contact_email"
                    name="contact_email"
                    value={supplierInfo.contact_email}
                    onChange={handleChange}
                    placeholder="Contact email for communication"
                    className={`border p-2 w-full mb-1 ${
                        errors.contact_email ? "border-red-500" : ""
                    }`}
                />
                {errors.contact_email && (
                    <p className="text-red-500 text-sm">
                        {errors.contact_email}
                    </p>
                )}
            </div>
            <div>
                <label htmlFor="address" className="block mb-2">
                    Address
                </label>
                <input
                    id="supplier_address"
                    name="supplier_address"
                    value={supplierInfo.supplier_address}
                    onChange={handleChange}
                    placeholder="Full address of the supplier’s main office"
                    className="border p-2 w-full mb-4"
                />
            </div>
            <div>
                <label htmlFor="cityRegion" className="block mb-2">
                    City/Region
                </label>
                <input
                    id="supplier_city"
                    name="supplier_city"
                    value={supplierInfo.supplier_city}
                    onChange={handleChange}
                    placeholder="City or region"
                    className="border p-2 w-full mb-4"
                />
            </div>
            <div>
                <label htmlFor="country" className="block mb-2">
                    Country
                </label>
                <input
                    id="supplier_country"
                    name="supplier_country"
                    value={supplierInfo.supplier_country}
                    onChange={handleChange}
                    placeholder="Supplier’s country of origin"
                    className="border p-2 w-full mb-4"
                />
            </div>
            <div>
                <label htmlFor="supplierType" className="block mb-2">
                    Supplier Type
                </label>
                <input
                    id="supplier_type"
                    name="supplier_type"
                    value={supplierInfo.supplier_type}
                    onChange={handleChange}
                    placeholder="Type of supplier"
                    className="border p-2 w-full mb-4"
                />
            </div>
            <div>
                <label htmlFor="productsSupplied" className="block mb-2">
                    Products Supplied
                </label>
                <input
                    id="products_supplied"
                    name="products_supplied"
                    value={supplierInfo.products_supplied}
                    onChange={handleChange}
                    placeholder="List or reference to products supplied"
                    className={`border p-2 w-full mb-1 ${
                        errors.products_supplied ? "border-red-500" : ""
                    }`}
                />
                {errors.products_supplied && (
                    <p className="text-red-500 text-sm">
                        {errors.products_supplied}
                    </p>
                )}
            </div>
            <div>
                <label htmlFor="deliveryTime" className="block mb-2">
                    Delivery Time
                </label>
                <input
                    id="delivery_time"
                    name="delivery_time"
                    value={supplierInfo.delivery_time}
                    onChange={handleChange}
                    placeholder="Average delivery time (e.g., 3 days)"
                    className="border p-2 w-full mb-4"
                />
            </div>
            <div>
                <label htmlFor="paymentTerms" className="block mb-2">
                    Payment Terms
                </label>
                <input
                    id="payment_terms"
                    name="payment_terms"
                    value={supplierInfo.payment_terms}
                    onChange={handleChange}
                    placeholder="Terms for payments (e.g., Net 30)"
                    className="border p-2 w-full mb-4"
                />
            </div>
            <div>
                <label htmlFor="bankDetails" className="block mb-2">
                    Bank Details
                </label>
                <input
                    id="bank_details"
                    name="bank_details"
                    value={supplierInfo.bank_details}
                    onChange={handleChange}
                    placeholder="Optional account details for payments"
                    className="border p-2 w-full mb-4"
                />
            </div>
            <div>
                <label htmlFor="rating" className="block mb-2">
                    Rating
                </label>
                <input
                    id="rating"
                    name="rating"
                    value={supplierInfo.rating}
                    onChange={handleChange}
                    placeholder="Supplier rating based on performance"
                    className="border p-2 w-full mb-4"
                />
            </div>
            <div>
                <label htmlFor="discountsAgreements" className="block mb-2">
                    Discounts/Agreements
                </label>
                <input
                    id="discounts_agreements"
                    name="discounts_agreements"
                    value={supplierInfo.discounts_agreements}
                    onChange={handleChange}
                    placeholder="Discounts/Agreements"
                    className="border p-2 w-full mb-4"
                />
            </div>
            <div>
                <label htmlFor="returnPolicy" className="block mb-2">
                    Return Policy
                </label>
                <input
                    id="return_policy"
                    name="return_policy"
                    value={supplierInfo.return_policy}
                    onChange={handleChange}
                    placeholder="Policy regarding returns of products"
                    className="border p-2 w-full mb-4"
                />
            </div>
            <div className="col-span-2">
                {" "}
                <label htmlFor="notes" className="block mb-2">
                    Notes
                </label>
                <textarea
                    id="note"
                    name="note"
                    value={supplierInfo.note}
                    onChange={handleChange}
                    placeholder="Any additional notes or comments"
                    className="border p-2 w-full mb-4 h-24"
                />
            </div>
            <div className="col-span-2">
                <button
                    type="submit"
                    onClick={handleSupplierInsert}
                    disabled={isLoading}
                    className="bg-blue-500 text-white px-4 py-2 rounded flex items-center justify-center"
                >
                    {isLoading ? (
                        <>
                            <AiOutlineLoading className="animate-spin mr-2" />
                            Loading...
                        </>
                    ) : (
                        "Add Supplier"
                    )}
                </button>
            </div>
        </div>
    );
};

export default SupplierCreateFormForPharmacistUser;
