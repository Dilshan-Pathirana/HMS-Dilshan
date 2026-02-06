import React from "react";
import { IBranchData } from "../../../../utils/types/Branch/IBranchData.ts";

interface BranchViewModalProps {
    isOpen: boolean;
    branch: IBranchData | null;
    onClose: () => void;
}

const BranchViewModal: React.FC<BranchViewModalProps> = ({
    isOpen,
    branch,
    onClose,
}) => {
    if (!isOpen || !branch) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full">
                <h2 className="text-xl font-semibold mb-4 text-center">
                    Center Details
                </h2>
                <div className="space-y-4">
                    <p className="text-sm">
                        <strong>Center Name:</strong> {branch.center_name}
                    </p>
                    <p className="text-sm">
                        <strong>Reg No:</strong> {branch.register_number}
                    </p>
                    <p className="text-sm">
                        <strong>Type:</strong> {branch.center_type}
                    </p>
                    <p className="text-sm">
                        <strong>Owner Type:</strong> {branch.owner_type}
                    </p>
                    <p className="text-sm">
                        <strong>Owner Name:</strong> {branch.owner_full_name}
                    </p>
                    <p className="text-sm">
                        <strong>Owner ID:</strong> {branch.owner_id_number}
                    </p>
                    <p className="text-sm">
                        <strong>Contact No:</strong>{" "}
                        {branch.owner_contact_number}
                    </p>
                </div>
                <button
                    onClick={onClose}
                    className="mt-4 px-4 py-2 bg-neutral-300 text-neutral-700 rounded-md hover:bg-gray-400"
                >
                    Close
                </button>
            </div>
        </div>
    );
};

export default BranchViewModal;
