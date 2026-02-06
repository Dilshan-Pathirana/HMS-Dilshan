import { useState } from "react";
import BranchTable from "./BranchView/BranchTable.tsx";
import BranchCreateModal from "./BranchCreate/BranchCreateModal.tsx";

const BranchManagement: React.FC = () => {
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [refreshSalaries, setRefreshSalaries] = useState(false);

    const openModal = () => {
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
    };

    const triggerRefresh = () => {
        setRefreshSalaries((prev) => !prev);
    };

    return (
        <div className="p-4">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold">Branch Management</h1>
                <button
                    onClick={openModal}
                    className="px-6 py-2 bg-primary-500 rounded-lg hover:bg-primary-600 text-white"
                >
                    Add Branch
                </button>
            </div>
            <div className="overflow-x-auto max-h-[calc(100vh-200px)]">
                <BranchTable
                    refreshSalaries={refreshSalaries}
                    triggerRefresh={triggerRefresh}
                />
            </div>
            {isModalOpen && (
                <BranchCreateModal
                    isOpen={isModalOpen}
                    closeModal={closeModal}
                    onBranchCreated={triggerRefresh}
                />
            )}
        </div>
    );
};

export default BranchManagement;
