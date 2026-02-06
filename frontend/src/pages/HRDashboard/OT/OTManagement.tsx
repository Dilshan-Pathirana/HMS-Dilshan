import { useState } from "react";
import CreateEmployeeOT from "./OTCreate/CreateOT.tsx";
import OTTable from "./OTView/OTTable.tsx";

const OTManagement = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [refreshShifts, setRefreshShifts] = useState(false);

    const openModal = () => {
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
    };

    const triggerRefresh = () => {
        setRefreshShifts((prev) => !prev);
    };

    return (
        <div className="p-2 mt-20 ml-[16rem] mr-[30px]">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold">OT Management</h1>
                <button
                    onClick={openModal}
                    className="px-6 py-2 bg-primary-500 rounded-lg hover:bg-primary-600 text-white"
                >
                    Add OT
                </button>
            </div>

            <div className="overflow-x-auto max-h-[calc(100vh-200px)]">
                <OTTable
                    refreshOTs={refreshShifts}
                    triggerRefresh={triggerRefresh}
                />
            </div>

            {isModalOpen && (
                <CreateEmployeeOT
                    closeModal={closeModal}
                    onOtAdded={triggerRefresh}
                />
            )}
        </div>
    );
};

export default OTManagement;
