import { useState } from "react";
import { FiX } from "react-icons/fi";
import { RejectScheduleCancellationModalProps } from "../../../utils/types/DoctorSceduleCancel/IDoctorScheduleCancellation.ts";

export const RejectScheduleCancellationModal: React.FC<
    RejectScheduleCancellationModalProps
> = ({ isOpen, cancellation, onClose, onReject }) => {
    const [rejectReason, setRejectReason] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!cancellation || !rejectReason.trim()) return;

        setIsSubmitting(true);
        try {
            await onReject(cancellation.id, rejectReason.trim());
            setRejectReason("");
            onClose();
        } catch (error) {
            console.error("Error rejecting cancellation:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setRejectReason("");
        onClose();
    };

    if (!isOpen || !cancellation) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-neutral-800">
                        Reject Cancellation Request
                    </h2>
                    <button
                        onClick={handleClose}
                        className="text-neutral-500 hover:text-neutral-700"
                    >
                        <FiX size={24} />
                    </button>
                </div>

                <div className="mb-4 p-3 bg-neutral-50 rounded">
                    <p className="text-sm text-neutral-600">
                        <strong>Doctor:</strong>{" "}
                        {cancellation.doctor_first_name}{" "}
                        {cancellation.doctor_last_name}
                    </p>
                    <p className="text-sm text-neutral-600">
                        <strong>Date:</strong>{" "}
                        {new Date(cancellation.date).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-neutral-600">
                        <strong>Reason:</strong> {cancellation.reason}
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label
                            htmlFor="rejectReason"
                            className="block text-sm font-medium text-neutral-700 mb-2"
                        >
                            Reason for Rejection *
                        </label>
                        <textarea
                            id="rejectReason"
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="Please provide a reason for rejecting this cancellation request..."
                            className="w-full border border-neutral-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                            rows={4}
                            required
                        />
                    </div>

                    <div className="flex space-x-3">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="flex-1 px-4 py-2 text-neutral-700 bg-neutral-200 rounded hover:bg-neutral-300"
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!rejectReason.trim() || isSubmitting}
                            className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? "Rejecting..." : "Reject Request"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
