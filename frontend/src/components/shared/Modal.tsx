import React from "react";
import { FaTimes } from "react-icons/fa";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    actions?: React.ReactNode; // Optional action buttons (e.g., "Close")
}

const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    title,
    children,
    actions,
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-neutral-800 bg-opacity-75 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 w-96 relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-neutral-600 hover:text-neutral-800"
                >
                    <FaTimes size={20} />
                </button>
                <h2 className="text-xl font-semibold mb-4">{title}</h2>
                <div className="mb-4">{children}</div>
                <div className="flex justify-end space-x-2">
                    {actions ? (
                        actions
                    ) : (
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-primary-500 text-white rounded hover:bg-primary-500"
                        >
                            Close
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Modal;
