import React from "react";
import { X } from "lucide-react";
import { DamageStockReasonModalProps } from "../../../../../../utils/types/pos/IProduct.ts";

const SuperAdminDamageReasonModal: React.FC<DamageStockReasonModalProps> = ({
    modalContent,
    closeModal,
}) => {
    if (!modalContent) return null;

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full relative">
                <button
                    onClick={closeModal}
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                >
                    <X className="w-5 h-5" />
                </button>
                <h2 className="text-lg font-medium mb-4">Event Reason</h2>
                <p className="text-sm text-gray-700">{modalContent}</p>
                <div className="flex justify-end mt-4">
                    <button
                        onClick={closeModal}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SuperAdminDamageReasonModal;
