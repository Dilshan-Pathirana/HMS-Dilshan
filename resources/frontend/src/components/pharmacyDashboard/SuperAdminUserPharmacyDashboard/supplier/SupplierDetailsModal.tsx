import React from "react";
import { FaTimes } from "react-icons/fa";
import { SupplierDetailsModalProps } from "../../../../utils/types/pharmacy/Supplier/ISupplier.ts";

const SupplierDetailsModal: React.FC<SupplierDetailsModalProps> = ({
    isOpen,
    supplier,
    onClose,
}) => {
    if (!isOpen || !supplier) return null;

    return (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg shadow-lg w-[90%] max-w-3xl relative p-6">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-600 hover:text-gray-800"
                >
                    <FaTimes size={20} />
                </button>

                <h2 className="text-xl font-semibold mb-4">{`Details for ${supplier.supplier_name || "Supplier"}`}</h2>

                <div className="grid grid-cols-2 gap-4">
                    {Object.entries(supplier).map(([key, value]) =>
                        key !== "id" ? (
                            <p key={key}>
                                <strong>
                                    {key
                                        .split("_")
                                        .map(
                                            (word) =>
                                                word.charAt(0).toUpperCase() +
                                                word.slice(1),
                                        )
                                        .join(" ")}
                                    :
                                </strong>{" "}
                                {value?.toString() || "N/A"}
                            </p>
                        ) : null,
                    )}
                </div>

                <div className="mt-6 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SupplierDetailsModal;
