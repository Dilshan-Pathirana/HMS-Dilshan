import { useState } from "react";
import DoctorScheduleTable from "./ScheduleView/DoctorScheduleTable.tsx";
import AddDoctorScheduleModal from "./ScheduleCreate/AddScheduleModal.tsx";

const DoctorScheduleManagement: React.FC = () => {
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [refreshSchedules, setRefreshSchedules] = useState(false);

    const openModal = () => {
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
    };

    const triggerRefresh = () => {
        setRefreshSchedules((prev) => !prev);
    };

    return (
        <div className="p-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                <h1 className="text-xl md:text-2xl font-bold">Doctor Schedule</h1>
                <button
                    onClick={openModal}
                    className="w-full sm:w-auto px-4 md:px-6 py-2 bg-primary-500 rounded-lg hover:bg-primary-600 active:bg-blue-800 text-white text-sm md:text-base transition-colors"
                >
                    Add Schedule
                </button>
            </div>
            <div className="overflow-x-auto max-h-[calc(100vh-200px)] rounded-lg border border-neutral-200">
                <DoctorScheduleTable
                    refreshSchedules={refreshSchedules}
                    triggerRefresh={triggerRefresh}
                />
            </div>
            {isModalOpen && (
                <AddDoctorScheduleModal
                    closeModal={closeModal}
                    onScheduleAdded={triggerRefresh}
                />
            )}
        </div>
    );
};

export default DoctorScheduleManagement;
