import { PurchasingModalProps } from "../../../../utils/types/pos/IPurchasing.ts";
import InvoicePDF from "../../DocumentGenarate/PurchasingInvoiceDocument.tsx";
import React from "react";

const PurchasingDetailsModal: React.FC<PurchasingModalProps> = ({
    purchasing,
    onClose,
}) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-lg p-6 w-11/12 max-w-3xl relative">
                <h3 className="text-xl font-semibold mb-4">
                    Purchasing Details
                </h3>
                <div className="space-y-2">
                    <p>
                        <strong>Invoice ID:</strong> {purchasing.invoice_id}
                    </p>
                    <p>
                        <strong>Discount Amount:</strong> LKR{" "}
                        {purchasing.discount_amount}
                    </p>
                    <p>
                        <strong>Total Amount:</strong> LKR{" "}
                        {purchasing.total_amount}
                    </p>
                    <p>
                        <strong>Net Total Amount:</strong> LKR{" "}
                        {purchasing.net_total}
                    </p>
                    <p>
                        <strong>Amount Received:</strong> LKR{" "}
                        {purchasing.amount_received}
                    </p>
                    <p>
                        <strong>Remaining Amount:</strong> LKR{" "}
                        {purchasing.remain_amount}
                    </p>
                    <p>
                        <strong>Products:</strong>
                    </p>
                    <ul className="pl-5 list-disc">
                        {purchasing.products.map((product) => (
                            <li key={product.purchase_product_id}>
                                {product.item_name} (SKU: {product.item_code}) -{" "}
                                {product.qty} x LKR {product.price}
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="absolute bottom-4 right-4 flex space-x-2">
                    <InvoicePDF purchasing={purchasing} />
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-error-500 text-white rounded hover:bg-red-600"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PurchasingDetailsModal;
