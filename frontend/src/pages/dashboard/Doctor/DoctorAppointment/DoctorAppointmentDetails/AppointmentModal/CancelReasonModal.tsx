import React, { useState, useEffect } from "react";
import { CancelReasonModalProps } from "../../../../../../utils/types/users/IDoctorData.ts";
const CancelReasonModal: React.FC<CancelReasonModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    date,
    isLoading,
}) => {
    const [reason, setReason] = useState<string>("");
    useEffect(() => {
        if (isOpen) {
            setReason("");
        }
    }, [isOpen]);

    const handleConfirm = () => {
        if (reason.trim()) {
            onConfirm(reason.trim());
        }
    };

    const isConfirmDisabled = !reason.trim() || isLoading;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-96 max-w-md mx-4">
                <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                    Cancel Schedule for {date}
                </h3>

                <div className="mb-4">
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Reason for cancellation:
                    </label>
                    <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Enter cancellation reason..."
                        className="w-full p-3 border border-neutral-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-error-500 resize-none"
                        rows={4}
                        maxLength={500}
                        autoFocus
                    />
                    <div className="text-xs text-neutral-500 mt-1">
                        {reason.length}/500 characters
                    </div>
                </div>

                <div className="flex justify-end space-x-3">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="px-4 py-2 text-sm font-medium text-neutral-700 bg-neutral-100 border border-neutral-300 rounded-md hover:bg-neutral-200 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={isConfirmDisabled}
                        className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? "Cancelling..." : "Confirm Cancel"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CancelReasonModal;
