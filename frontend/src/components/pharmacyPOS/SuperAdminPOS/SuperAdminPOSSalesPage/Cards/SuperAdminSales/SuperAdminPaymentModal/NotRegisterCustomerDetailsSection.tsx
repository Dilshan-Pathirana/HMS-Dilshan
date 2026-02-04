import React from "react";
import { NotRegisterCustomerDetailsSectionProps } from "../../../../../../../utils/types/pos/IBillModalprops.ts";

const NotRegisterCustomerDetailsSection: React.FC<
    NotRegisterCustomerDetailsSectionProps
> = ({
    customerDetails,
    isShowCustomerAddFields,
    handleNotRegisterCustomerChanges,
}) => {
    return (
        <div
            className={
                isShowCustomerAddFields ? "mt-0 mb-2 border p-2" : "hidden"
            }
        >
            <p className="text-sm text-gray-600 mb-3">Customer Name:</p>
            <input
                type="text"
                value={customerDetails.customer_name || ""}
                name="customer_name"
                onChange={handleNotRegisterCustomerChanges}
                className="w-full px-3 py-2 border rounded-lg text-base mb-3"
                placeholder="Customer Name"
            />
            <p className="text-sm text-gray-600 mb-3">
                Customer Contact Number:
            </p>
            <input
                type="number"
                value={customerDetails.contact_number || ""}
                name="contact_number"
                onChange={handleNotRegisterCustomerChanges}
                className="w-full px-3 py-2 border rounded-lg text-base mb-3"
                placeholder="Contact Number"
            />
        </div>
    );
};

export default NotRegisterCustomerDetailsSection;
