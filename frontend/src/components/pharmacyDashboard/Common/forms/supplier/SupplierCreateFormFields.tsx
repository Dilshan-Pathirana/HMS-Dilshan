import React from "react";
import { ISupplierErrorFields } from "../../../../../utils/types/pharmacy/Product/ProdcutCreateForm.ts";
import FormFieldErrorDisplay from "../../../../shared/formFieldError/FormFieldErrorDisplay.tsx";

interface SupplierCreateFormStructureProps {
    formFieldError: ISupplierErrorFields;
    handleChange: (
        event: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>,
    ) => void;
    handleSupplierInsert: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

const SupplierCreateFormFields: React.FC<SupplierCreateFormStructureProps> = ({
    formFieldError,
    handleChange,
    handleSupplierInsert,
}) => {
    return (
        <main className="flex-1 overflow-x-hidden overflow-y-auto mt-20 ml-72 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                <div>
                    <div>
                        <label htmlFor="name" className="block">
                            Supplier Name
                        </label>
                        <input
                            id="supplier_name"
                            name="supplier_name"
                            onChange={handleChange}
                            placeholder="Full name of the supplier company"
                            className="border p-2 w-full mb-4"
                        />
                        <FormFieldErrorDisplay
                            formFieldError={formFieldError.supplier_name}
                        />
                    </div>
                    <div>
                        <label htmlFor="contactPerson" className="block">
                            Contact Person
                        </label>
                        <input
                            id="contact_person"
                            name="contact_person"
                            onChange={handleChange}
                            placeholder="Name of primary contact person"
                            className="border p-2 w-full mb-4"
                        />
                    </div>
                    <div>
                        <label htmlFor="contactNumber" className="block">
                            Contact Number
                        </label>
                        <input
                            type="number"
                            id="contact_number"
                            name="contact_number"
                            onChange={handleChange}
                            placeholder="Phone number for reaching the supplier"
                            className="border p-2 w-full mb-4"
                        />
                        <FormFieldErrorDisplay formFieldError={formFieldError.contact_number} />
                    </div>
                    <div>
                        <label htmlFor="emailAddress" className="block">
                            Email Address
                        </label>
                        <input
                            id="contact_email"
                            name="contact_email"
                            onChange={handleChange}
                            placeholder="Contact email for communication"
                            className="border p-2 w-full mb-4"
                        />
                    </div>
                    <div>
                        <label htmlFor="address" className="block">
                            Address
                        </label>
                        <input
                            id="supplier_address"
                            name="supplier_address"
                            onChange={handleChange}
                            placeholder="Full address of the supplier’s main office"
                            className="border p-2 w-full mb-4"
                        />
                    </div>
                    <div>
                        <label htmlFor="cityRegion" className="block">
                            City/Region
                        </label>
                        <input
                            id="supplier_city"
                            name="supplier_city"
                            onChange={handleChange}
                            placeholder="City or region"
                            className="border p-2 w-full mb-4"
                        />
                    </div>
                    <div>
                        <label htmlFor="country" className="block">
                            Country
                        </label>
                        <input
                            id="supplier_country"
                            name="supplier_country"
                            onChange={handleChange}
                            placeholder="Supplier’s country of origin"
                            className="border p-2 w-full mb-4"
                        />
                    </div>
                    <div>
                        <label htmlFor="supplierType" className="block">
                            Supplier Type
                        </label>
                        <input
                            id="supplier_type"
                            name="supplier_type"
                            onChange={handleChange}
                            placeholder="Type of supplier"
                            className="border p-2 w-full mb-4"
                        />
                    </div>
                    <div>
                        <label htmlFor="productsSupplied" className="block">
                            Products Supplied
                        </label>
                        <input
                            id="products_supplied"
                            name="products_supplied"
                            onChange={handleChange}
                            placeholder="List or reference to products supplied"
                            className="border p-2 w-full mb-4"
                        />
                    </div>
                </div>
                <div>
                    <div>
                        <label htmlFor="deliveryTime" className="block">
                            Delivery Time
                        </label>
                        <input
                            id="delivery_time"
                            name="delivery_time"
                            onChange={handleChange}
                            placeholder="Average delivery time (e.g., 3 days)"
                            className="border p-2 w-full mb-4"
                        />
                    </div>
                    <div>
                        <label htmlFor="paymentTerms" className="block">
                            Payment Terms
                        </label>
                        <input
                            id="payment_terms"
                            name="payment_terms"
                            onChange={handleChange}
                            placeholder="Terms for payments (e.g., Net 30)"
                            className="border p-2 w-full mb-4"
                        />
                    </div>
                    <div>
                        <label htmlFor="bankDetails" className="block">
                            Bank Details
                        </label>
                        <input
                            id="bank_details"
                            name="bank_details"
                            onChange={handleChange}
                            placeholder="Optional account details for payments"
                            className="border p-2 w-full mb-4"
                        />
                    </div>
                    <div>
                        <label htmlFor="rating" className="block">
                            Rating
                        </label>
                        <input
                            id="rating"
                            name="rating"
                            onChange={handleChange}
                            placeholder="Supplier rating based on performance"
                            className="border p-2 w-full mb-4"
                        />
                    </div>
                    <div>
                        <label htmlFor="discountsAgreements" className="block">
                            Discounts/Agreements
                        </label>
                        <input
                            id="discounts_agreements"
                            name="discounts_agreements"
                            onChange={handleChange}
                            placeholder="Discounts/Agreements"
                            className="border p-2 w-full mb-4"
                        />
                    </div>
                    <div>
                        <label htmlFor="returnPolicy" className="block">
                            Return Policy
                        </label>
                        <input
                            id="return_policy"
                            name="return_policy"
                            onChange={handleChange}
                            placeholder="Policy regarding returns of products"
                            className="border p-2 w-full mb-4"
                        />
                    </div>
                    <div className="col-span-2">
                        {" "}
                        <label htmlFor="notes" className="block">
                            Notes
                        </label>
                        <textarea
                            id="note"
                            name="note"
                            onChange={handleChange}
                            placeholder="Any additional notes or comments"
                            className="border p-2 w-full mb-4 h-24"
                        />
                    </div>
                    <div className="col-span-2">
                        <button
                            type="submit"
                            onClick={handleSupplierInsert}
                            className="bg-primary-500 text-white px-4 py-2 rounded"
                        >
                            Add Supplier
                        </button>
                    </div>
                </div>
            </div>
        </main>
    );
};

export default SupplierCreateFormFields;
