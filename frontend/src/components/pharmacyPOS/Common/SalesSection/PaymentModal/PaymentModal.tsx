import { X } from "lucide-react";
import { PaymentModalProps } from "../../../../../utils/types/pos/IPaymentModal.ts";
import numpadValues from "../../../../../utils/staticData/pos/numpadValues.ts";
import React from "react";
import SalesBillTotalAmountDetails from "../ShoppingCart/SalesBillTotalAmountDetails.tsx";

const PaymentModal: React.FC<PaymentModalProps> = ({
    isOpen,
    total,
    totalDiscount,
    netTotal,
    amountReceived,
    setAmountReceived,
    handleNumpadClick,
    processPayment,
    closeModal,
}) => {
    if (!isOpen) return null;

    const receivedAmount = parseFloat(amountReceived) || 0;
    const balance = receivedAmount - netTotal;

    return (
        <div className="fixed inset-0 bg-neutral-900 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-4 rounded-lg shadow-lg max-w-lg w-full relative">
                <button onClick={closeModal} className="absolute top-2 right-2">
                    <X className="h-5 w-5 text-neutral-500" />
                </button>
                <h2 className="text-lg font-semibold mb-3">Process Payment</h2>
                <SalesBillTotalAmountDetails
                    total={total}
                    totalDiscount={totalDiscount}
                    netTotal={netTotal}
                />

                <p className="text-sm text-neutral-600 mb-3">
                    Enter the amount received from the customer.
                </p>
                <input
                    type="text"
                    value={amountReceived}
                    onChange={(e) => setAmountReceived(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-base mb-3"
                    placeholder="Amount received"
                />
                <p
                    className={`text-base font-medium mb-3 ${
                        balance < 0 ? "text-error-500" : "text-green-500"
                    }`}
                >
                    {balance < 0 ? "Remaining Amount: " : "Change: "}
                    LKR {Math.abs(balance).toFixed(2)}
                </p>
                <div className="grid grid-cols-3 gap-2 mb-3">
                    {numpadValues.map((value) => (
                        <button
                            key={value}
                            onClick={() => handleNumpadClick(value.toString())}
                            className="bg-neutral-200 text-lg p-3 rounded-lg"
                        >
                            {value === "backspace" ? "←" : value}
                        </button>
                    ))}
                </div>
                <div className="flex justify-end space-x-3">
                    <button
                        onClick={closeModal}
                        className="bg-neutral-200 text-base px-3 py-2 rounded-lg"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={processPayment}
                        className="bg-primary-500 text-white text-base px-3 py-2 rounded-lg"
                    >
                        Pay
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PaymentModal;
