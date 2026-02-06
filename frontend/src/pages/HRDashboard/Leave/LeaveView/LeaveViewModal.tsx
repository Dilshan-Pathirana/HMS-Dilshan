import React from "react";
import { Leave } from "../../../../utils/types/leave/Ileave";

interface LeaveViewModalProps {
    leave: Leave;
    onClose: () => void;
}

const LeaveViewModal: React.FC<LeaveViewModalProps> = ({ leave, onClose }) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-1/2">
                <h2 className="text-lg font-semibold mb-4">Leave Details</h2>
                <p>
                    <strong>Full Name:</strong>{" "}
                    {`${leave.user_first_name} ${leave.user_last_name}`}
                </p>
                <p>
                    <strong>Assigner:</strong>{" "}
                    {leave.assigner_first_name && leave.assigner_last_name
                        ? `${leave.assigner_first_name} ${leave.assigner_last_name}`
                        : "N/A"}
                </p>
                <p>
                    <strong>Approval Date:</strong>{" "}
                    {leave.approval_date
                        ? new Date(leave.approval_date).toDateString()
                        : "N/A"}
                </p>
                <p>
                    <strong>Assignor Comments:</strong> {leave.comments || "N/A"}
                </p>
                <p>
                    <strong>Admin Comments:</strong> {leave.admin_comments || "N/A"}
                </p>
                <p>
                    <strong>Leave Days:</strong> {leave.leaves_days}
                </p>
                <button
                    className="mt-4 px-4 py-2 bg-primary-500 text-white rounded hover:bg-primary-600"
                    onClick={onClose}
                >
                    Close
                </button>
            </div>
        </div>
    );
};

export default LeaveViewModal;
