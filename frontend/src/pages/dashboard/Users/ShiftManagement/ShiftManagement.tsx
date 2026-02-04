import { useState } from "react";
import CreateShift from "./ShiftCreate/CreateShift.tsx";
import ShiftTable from "./ShiftView/ShiftTable.tsx";

const ShiftManagement = () => {
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
                <h1 className="text-2xl font-bold">Shift Management</h1>
                <button
                    onClick={openModal}
                    className="px-6 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 text-white"
                >
                    Add Shift
                </button>
            </div>

            <div className="overflow-x-auto max-h-[calc(100vh-200px)]">
                <ShiftTable refreshShifts={refreshShifts} triggerRefresh={triggerRefresh} />
            </div>

            {isModalOpen && (
                <CreateShift closeModal={closeModal} onShiftAdded={triggerRefresh} />
            )}
        </div>
    );
};

export default ShiftManagement;
