import { useState } from "react";
import AddLeaveModal from "./LeaveCreate/AddLeaveModal";
import LeaveManagementTable from "./LeaveView/LeaveManagementTable.tsx";

const LeaveManagement = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [refreshLeaves, setRefreshLeaves] = useState(false);

    const openModal = () => {
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
    };

    const handleLeaveAdded = () => {
        setRefreshLeaves((prev) => !prev);
    };

    return (
        <div className="p-2 mt-20 ml-[16rem] mr-[30px]">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold">Leave Management</h1>
                <button
                    onClick={openModal}
                    className="px-6 py-2 bg-primary-500 rounded-lg hover:bg-primary-600 text-white"
                >
                    Add Leave
                </button>
            </div>
            <div className="overflow-x-auto max-h-[calc(100vh-200px)]">
                <LeaveManagementTable refreshLeaves={refreshLeaves} />
            </div>
            {isModalOpen && (
                <AddLeaveModal
                    closeModal={closeModal}
                    onLeaveAdded={handleLeaveAdded}
                />
            )}
        </div>
    );
};

export default LeaveManagement;
