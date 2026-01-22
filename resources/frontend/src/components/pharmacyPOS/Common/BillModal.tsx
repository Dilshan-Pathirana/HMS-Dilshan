import { X, Printer } from "lucide-react";
import { BillModalProps } from "../../../utils/types/pos/IBillModalprops.ts";
import { jsPDF } from "jspdf";
import { clearCart } from "../../../utils/slices/cart/cartSlice.ts";
import ReactDOM from "react-dom";
import BillPrint from "../DocumentGenarate/BillPrint.tsx";
import { customerDetailsFiledAttributes } from "../../../utils/form/formFieldsAttributes/POS.ts";

export default function BillModal({
    isOpen,
    cart,
    total,
    totalDiscount,
    netTotal,
    amountReceived,
    change,
    customerName,
    setCustomerDetails,
    closeModal,
    dispatch,
}: BillModalProps) {
    if (!isOpen) return null;

    const generatePDF = () => {
        const doc = new jsPDF("p", "pt", "a4");
        const billContainer = document.createElement("div");
        ReactDOM.render(
            <BillPrint
                orderId="010900269558"
                soldTo={customerName}
                date={new Date().toLocaleDateString()}
                time={new Date().toLocaleTimeString()}
                salesPerson="Admin"
                register="1"
                orderType="Sale"
                cart={cart}
                total={total}
                totalDiscount={totalDiscount}
                netTotal={netTotal}
                amountReceived={parseFloat(amountReceived)}
                change={change}
            />,
            billContainer,
        );
        doc.html(billContainer, {
            callback: () => {
                doc.autoPrint();
                window.open(doc.output('bloburl'), '_blank');
                ReactDOM.unmountComponentAtNode(billContainer);
                dispatch(clearCart());
            },
            x: 10,
            y: 10,
        });

        setCustomerDetails(customerDetailsFiledAttributes);
    };

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full relative">
                <button onClick={closeModal} className="absolute top-2 right-2">
                    <X className="h-5 w-5 text-gray-500" />
                </button>
                <h2 className="text-lg font-medium">Payment Successful</h2>
                <p className="text-2xl font-bold text-center mb-4">
                    Change: LKR {change.toFixed(2)}
                </p>
                <button
                    onClick={generatePDF}
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg w-full flex items-center justify-center"
                >
                    <Printer className="mr-2 h-4 w-4" />
                    Print Bill
                </button>
            </div>
        </div>
    );
}
