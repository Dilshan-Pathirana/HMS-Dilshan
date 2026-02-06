import React from "react";
import { FaTimes, FaExclamationCircle, FaPhone, FaIdCard, FaEnvelope, FaKey } from "react-icons/fa";

interface ConflictItem {
    field: string;
    label: string;
    message: string;
}

interface CredentialConflictModalProps {
    isOpen: boolean;
    onClose: () => void;
    conflicts: ConflictItem[];
}

const CredentialConflictModal: React.FC<CredentialConflictModalProps> = ({
    isOpen,
    onClose,
    conflicts,
}) => {
    if (!isOpen) return null;

    const getIconForField = (field: string) => {
        switch (field.toLowerCase()) {
            case 'phone':
                return <FaPhone className="text-error-500" />;
            case 'nic':
                return <FaIdCard className="text-error-500" />;
            case 'email':
                return <FaEnvelope className="text-error-500" />;
            default:
                return <FaExclamationCircle className="text-error-500" />;
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            ></div>

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-in fade-in zoom-in duration-300">
                {/* Header */}
                <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                                <FaExclamationCircle className="text-white text-2xl" />
                            </div>
                            <div>
                                <h2 className="text-white font-bold text-lg">Account Already Exists</h2>
                                <p className="text-red-100 text-sm">Some information is already registered</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                        >
                            <FaTimes className="text-white" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    <div className="mb-4">
                        <p className="text-neutral-600 text-sm text-center">
                            The following information is already registered in our system:
                        </p>
                    </div>

                    {/* Conflict List */}
                    <div className="space-y-3 mb-6">
                        {conflicts.map((conflict, index) => (
                            <div 
                                key={index}
                                className="flex items-start gap-3 p-4 bg-error-50 border border-red-200 rounded-xl"
                            >
                                <div className="flex-shrink-0 w-10 h-10 bg-error-100 rounded-full flex items-center justify-center">
                                    {getIconForField(conflict.field)}
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-semibold text-red-700 text-sm">
                                        {conflict.label}
                                    </h4>
                                    <p className="text-error-600 text-xs mt-0.5">
                                        {conflict.message}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Forgot Credentials Section */}
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <FaKey className="text-primary-500" />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-semibold text-blue-700 text-sm mb-1">
                                    Forgot your login credentials?
                                </h4>
                                <p className="text-primary-500 text-xs mb-2">
                                    If you already have an account but forgot your password, you can recover it easily.
                                </p>
                                <a 
                                    href="/forgot-password"
                                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary-500 text-white text-sm font-medium rounded-lg hover:bg-primary-500 transition-colors"
                                >
                                    <FaKey className="text-xs" />
                                    Recover Password
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                        <a 
                            href="/login"
                            className="w-full py-3 bg-green-500 text-white text-center font-semibold rounded-xl hover:bg-green-600 transition-colors"
                        >
                            Login to Existing Account
                        </a>
                        <button
                            onClick={onClose}
                            className="w-full py-3 bg-neutral-100 text-neutral-700 text-center font-semibold rounded-xl hover:bg-neutral-200 transition-colors"
                        >
                            Update My Information
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 pb-6">
                    <p className="text-center text-xs text-neutral-400">
                        Need help? Contact our support team at support@cure.lk
                    </p>
                </div>
            </div>
        </div>
    );
};

export default CredentialConflictModal;
