import React, { useState } from "react";
import { X, AlertTriangle, Loader } from "lucide-react";
import { CancelModalProps } from "../../../../utils/types/DoctorScheduleCalendar/IDoctorScheduleCalendar";

const CancelModal: React.FC<CancelModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    schedule,
    selectedDate,
    isLoading,
    isCancelingEntireDay = false,
    schedulesCount = 0,
}) => {
    const [reason, setReason] = useState("");

    const handleSubmit = async () => {
        if (!reason.trim()) return;
        await onConfirm(reason);
        setReason("");
    };

    const handleClose = () => {
        setReason("");
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                <div className="flex items-center justify-between p-4 border-b">
                    <h3 className="text-lg font-semibold text-neutral-900">
                        {isCancelingEntireDay
                            ? "Cancel Entire Day"
                            : "Cancel Schedule"}
                    </h3>
                    <button
                        onClick={handleClose}
                        className="p-1 hover:bg-neutral-100 rounded-full"
                        disabled={isLoading}
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-4">
                    <div className="mb-4">
                        <div className="flex items-center text-yellow-600 mb-2">
                            <AlertTriangle className="h-5 w-5 mr-2" />
                            <span className="font-medium">Warning</span>
                        </div>
                        {isCancelingEntireDay ? (
                            <p className="text-sm text-neutral-600 mb-4">
                                You are about to cancel{" "}
                                <strong>all appointments</strong> for{" "}
                                <strong>
                                    {selectedDate?.toLocaleDateString()}
                                </strong>
                                .
                                {schedulesCount > 0 && (
                                    <span>
                                        {" "}
                                        This will cancel{" "}
                                        <strong>
                                            {schedulesCount} schedule(s)
                                        </strong>
                                        .
                                    </span>
                                )}
                            </p>
                        ) : (
                            <p className="text-sm text-neutral-600 mb-4">
                                You are about to cancel the schedule for{" "}
                                <strong>
                                    {selectedDate?.toLocaleDateString()}
                                </strong>{" "}
                                at{" "}
                                <strong>{schedule?.branch_center_name}</strong>.
                            </p>
                        )}
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                            Reason for cancellation *
                        </label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Please provide a reason for cancelling this schedule..."
                            className="w-full p-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                            rows={4}
                            required
                            disabled={isLoading}
                        />
                    </div>
                </div>

                <div className="flex gap-3 p-4 border-t bg-neutral-50">
                    <button
                        onClick={handleClose}
                        className="flex-1 px-4 py-2 text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50"
                        disabled={isLoading}
                    >
                        {isCancelingEntireDay ? "Keep Day" : "Keep Schedule"}
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!reason.trim() || isLoading}
                        className="flex-1 px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                        {isLoading ? (
                            <>
                                <Loader className="h-4 w-4 mr-2 animate-spin" />
                                Cancelling...
                            </>
                        ) : isCancelingEntireDay ? (
                            "Cancel Entire Day"
                        ) : (
                            "Cancel Schedule"
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CancelModal;
