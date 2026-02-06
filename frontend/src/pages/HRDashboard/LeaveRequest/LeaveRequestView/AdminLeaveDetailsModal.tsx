import React, { useState } from "react";
import alert from "../../../../utils/alert";
import { LeaveDetailsModalProps } from "../../../../utils/types/leave/IleaveRequest.ts";
import { AdminLeaveApprove } from "../../../../utils/api/leave/LeaveRequest/AdminleaveApprove.ts";
import { AdminLeaveReject } from "../../../../utils/api/leave/LeaveRequest/AdminLeaveReject.ts";

const AdminLeaveDetailsModal: React.FC<LeaveDetailsModalProps> = ({
    leave,
    onClose,
}) => {
    const [comments, setComments] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleAction = async (action: "approve" | "reject") => {
        if (action === "reject" && comments.trim() === "") {
            alert.warn("Please provide a reason for rejecting the leave.");
            return;
        }

        setIsSubmitting(true);

        try {
            const actionFn =
                action === "approve" ? AdminLeaveApprove : AdminLeaveReject;

            const response = await actionFn({
                id: leave.id,
                comments,
            });

            if (response.status === 200 && response.data.status === 200) {
                alert.success(
                    `Leave ${action === "approve" ? "approved" : "rejected"} successfully!`,
                );
                onClose(true);
            } else {
                alert.warn(response.data.message || "Action failed.");
            }
        } catch (error) {
            alert.error(
                `An error occurred while trying to ${
                    action === "approve" ? "approve" : "reject"
                } the leave.`,
            );
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-neutral-800 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg w-1/2 p-6">
                <h2 className="text-2xl font-bold mb-4">
                    Leave Details - {leave.user_first_name}{" "}
                    {leave.user_last_name}
                </h2>
                <div className="space-y-2">
                    <p>
                        <strong>Start Date:</strong> {leave.leaves_start_date}
                    </p>
                    <p>
                        <strong>End Date:</strong> {leave.leaves_end_date}
                    </p>

                    <p>
                        <strong>Assign Comment:</strong> {leave.comments}
                    </p>
                    <p>
                        <strong>Admin Comment:</strong> {leave.admin_comments}
                    </p>
                    <p>
                        <strong>Status:</strong>
                        {leave.admin_status}
                    </p>
                    <p>
                        <strong>Leave Days:</strong> {leave.leaves_days}
                    </p>
                    <p>
                        <strong>Reason:</strong> {leave.reason || "N/A"}
                    </p>
                </div>

                {leave.admin_status === "Pending" && (
                    <textarea
                        className="w-full border mt-4 p-2 rounded"
                        placeholder="Add comments..."
                        value={comments}
                        onChange={(e) => setComments(e.target.value)}
                        disabled={isSubmitting}
                    />
                )}

                <div className="mt-4 flex justify-end space-x-4">
                    {leave.admin_status === "Pending" && (
                        <>
                            <button
                                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                                onClick={() => handleAction("approve")}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? "Approving..." : "Approve"}
                            </button>
                            <button
                                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                                onClick={() => handleAction("reject")}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? "Rejecting..." : "Reject"}
                            </button>
                        </>
                    )}
                    <button
                        className="px-4 py-2 bg-neutral-300 text-black rounded hover:bg-gray-400"
                        onClick={() => onClose(false)}
                        disabled={isSubmitting}
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminLeaveDetailsModal;
