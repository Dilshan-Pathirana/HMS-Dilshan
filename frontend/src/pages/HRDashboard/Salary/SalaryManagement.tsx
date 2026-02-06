import { useState } from "react";
import StaffSalaryTable from "./SalaryView/StaffSalaryTable.tsx";
import AddSalaryModal from "./SalaryCreate/AddSalaryModal.tsx";

const SalaryManagement: React.FC = () => {
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
        <div className="p-2 mt-20 ml-[16rem] mr-[30px]">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold">Salary Management</h1>
                <button
                    onClick={openModal}
                    className="px-6 py-2 bg-primary-500 rounded-lg hover:bg-primary-600 text-white"
                >
                    Add Salary
                </button>
            </div>
            <div className="overflow-x-auto max-h-[calc(100vh-200px)]">
                <StaffSalaryTable
                    refreshSalaries={refreshSalaries}
                    triggerRefresh={triggerRefresh}
                />
            </div>
            {isModalOpen && (
                <AddSalaryModal
                    closeModal={closeModal}
                    onSalaryAdded={triggerRefresh}
                />
            )}
        </div>
    );
};

export default SalaryManagement;
