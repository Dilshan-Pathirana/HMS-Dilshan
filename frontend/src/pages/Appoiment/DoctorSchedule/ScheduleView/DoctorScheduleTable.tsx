import { useState, useEffect } from "react";
import { FiEdit, FiTrash } from "react-icons/fi";
import Spinner from "../../../../assets/Common/Spinner.tsx";
import Pagination from "../../../../components/pharmacyPOS/Common/Pagination.tsx";
import alert from "../../../../utils/alert";
import EditDoctorScheduleModal from "../ScheduleUpdate/EditDoctorScheduleModal.tsx";
import { IDoctorSchedule } from "../../../../utils/types/Appointment/IDoctorSchedule.ts";
import { getAllDoctorSchedules } from "../../../../utils/api/Appointment/GetAllDoctorSchedules.ts";
import { deleteDoctorSchedule } from "../../../../utils/api/Appointment/DeleteDoctorSchedule.ts";
import {
    DoctorScheduleDeleteConfirmationAlert
} from "../../../../assets/Common/Alert/DooctorSchedule/DoctorScheduleDeleteConfirmationAlert.tsx";

const DoctorScheduleTable = ({
    refreshSchedules,
    triggerRefresh,
}: {
    refreshSchedules: boolean;
    triggerRefresh: () => void;
}) => {
    const [schedules, setSchedules] = useState<IDoctorSchedule[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");
    const [editModalContent, setEditModalContent] =
        useState<IDoctorSchedule | null>(null);
    const [windowWidth, setWindowWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 1024);

    // Determine rows per page based on screen size
    const rowsPerPage = windowWidth < 640 ? 1 : windowWidth < 1024 ? 2 : 10;

    useEffect(() => {
        const handleResize = () => {
            setWindowWidth(window.innerWidth);
            setCurrentPage(1); // Reset to page 1 when screen size changes
        };
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    useEffect(() => {
        const fetchSchedules = async () => {
            try {
                setIsLoading(true);
                const response = await getAllDoctorSchedules();
                if (response.status === 200) {
                    const fetchedSchedules =
                        response.data.doctorSchedule || [];
                    setSchedules(fetchedSchedules);
                } else {
                    alert.warn("Failed to fetch doctor schedules.");
                    setSchedules([]);
                }
            } catch {
                alert.error("An error occurred while fetching schedules.");
                setSchedules([]);
            } finally {
                setIsLoading(false);
            }
        };
        fetchSchedules();
    }, [refreshSchedules]);


    const filteredSchedules = schedules.filter(
        (schedule) =>
            schedule.user_first_name
                ?.toLowerCase()
                .includes(searchTerm.toLowerCase()) ||
            schedule.user_last_name
                ?.toLowerCase()
                .includes(searchTerm.toLowerCase()),
    );

    const totalPages = Math.ceil(filteredSchedules.length / rowsPerPage);
    const paginatedSchedules = filteredSchedules.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage,
    );

    const handleDelete = async (id: string) => {
        const isConfirmed = await DoctorScheduleDeleteConfirmationAlert();
        if (isConfirmed) {
            try {
                const response = await deleteDoctorSchedule(id);
                if (response.status === 200) {
                    alert.success("Doctor schedule deleted successfully!");
                    triggerRefresh();
                } else {
                    alert.error("Failed to delete the schedule.");
                }
            } catch {
                alert.error(
                    "An unexpected error occurred. Please try again later.",
                );
            }
        }
    };

    const handlePageChange = (newPage: number) => setCurrentPage(newPage);

    const openEditModal = (schedule: IDoctorSchedule) =>
        setEditModalContent(schedule);
    const closeEditModal = () => setEditModalContent(null);

    return (
        <div className="bg-white shadow rounded-lg p-2 md:p-4 w-full">
            <Spinner isLoading={isLoading} />
            {!isLoading && (
                <>
                    <div className="flex flex-col gap-2 mb-4">
                        <div className="relative w-full">
                            <input
                                type="text"
                                placeholder="Search by doctor name..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="border border-neutral-300 rounded pl-3 pr-4 py-2 w-full text-sm md:text-base"
                            />
                        </div>
                    </div>
                    {paginatedSchedules.length > 0 ? (
                        <>
                            {/* Mobile Card View - One card at a time */}
                            <div className="lg:hidden">
                                {paginatedSchedules.map((schedule) => (
                                    <div
                                        key={schedule.id}
                                        className="bg-neutral-50 border border-neutral-200 rounded-lg p-4 space-y-2 mb-4"
                                    >
                                        <div className="flex flex-col xs:flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                                            <div className="flex-1">
                                                <p className="text-xs text-neutral-500 uppercase font-semibold">
                                                    Doctor
                                                </p>
                                                <p className="text-sm md:text-base font-semibold text-neutral-900">
                                                    {schedule.user_first_name}{" "}
                                                    {schedule.user_last_name}
                                                </p>
                                            </div>
                                            <div className="flex flex-col xs:flex-col sm:flex-row gap-2 w-full sm:w-auto">
                                                <button
                                                    onClick={() =>
                                                        openEditModal(schedule)
                                                    }
                                                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-yellow-50 text-yellow-600 rounded hover:bg-yellow-100 active:bg-yellow-200 text-xs md:text-sm font-medium transition-colors min-h-[44px] flex-1 sm:flex-none"
                                                >
                                                    <FiEdit size={18} />
                                                    <span>Edit</span>
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        handleDelete(
                                                            schedule.id || ""
                                                        )
                                                    }
                                                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-error-50 text-error-600 rounded hover:bg-error-100 active:bg-red-200 text-xs md:text-sm font-medium transition-colors min-h-[44px] flex-1 sm:flex-none"
                                                >
                                                    <FiTrash size={18} />
                                                    <span>Delete</span>
                                                </button>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 pt-2 border-t border-neutral-200">
                                            <div>
                                                <p className="text-xs text-neutral-500 uppercase font-semibold">
                                                    Branch
                                                </p>
                                                <p className="text-sm text-neutral-900">
                                                    {schedule.branch_center_name ||
                                                        "-"}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-neutral-500 uppercase font-semibold">
                                                    Day
                                                </p>
                                                <p className="text-sm text-neutral-900">
                                                    {schedule.schedule_day}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-neutral-500 uppercase font-semibold">
                                                    Time
                                                </p>
                                                <p className="text-sm text-neutral-900">
                                                    {schedule.start_time}
                                                </p>
                                            </div>
                                            <div className="col-span-2 md:col-span-1">
                                                <p className="text-xs text-neutral-500 uppercase font-semibold">
                                                    Max Patients
                                                </p>
                                                <p className="text-sm text-neutral-900">
                                                    {schedule.max_patients}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Desktop Table View */}
                            <div className="hidden lg:block overflow-x-auto">
                                <table className="w-full divide-y divide-gray-200 border border-neutral-200">
                                    <thead className="bg-neutral-50 sticky top-0">
                                        <tr>
                                            {[
                                                "First Name",
                                                "Last Name",
                                                "Branch",
                                                "Schedule Day",
                                                "Start Time",
                                                "Max Patients",
                                                "Actions",
                                            ].map((header) => (
                                                <th
                                                    key={header}
                                                    className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider whitespace-nowrap"
                                                >
                                                    {header}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {paginatedSchedules.map((schedule) => (
                                            <tr
                                                key={schedule.id}
                                                className="hover:bg-neutral-50 active:bg-neutral-100 transition-colors"
                                            >
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-900">
                                                    {schedule.user_first_name ||
                                                        "-"}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-900">
                                                    {schedule.user_last_name ||
                                                        "-"}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-900">
                                                    {schedule.branch_center_name ||
                                                        "-"}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-900">
                                                    {schedule.schedule_day}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-900">
                                                    {schedule.start_time}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-900">
                                                    {schedule.max_patients}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-900">
                                                    <div className="flex items-center gap-4 justify-center">
                                                        <button
                                                            onClick={() =>
                                                                openEditModal(
                                                                    schedule
                                                                )
                                                            }
                                                            className="text-yellow-500 hover:text-yellow-700 active:text-yellow-800 transition-colors p-1"
                                                            title="Edit"
                                                        >
                                                            <FiEdit size={20} />
                                                        </button>
                                                        <button
                                                            onClick={() =>
                                                                handleDelete(
                                                                    schedule.id ||
                                                                        ""
                                                                )
                                                            }
                                                            className="text-error-500 hover:text-red-700 active:text-red-800 transition-colors p-1"
                                                            title="Delete"
                                                        >
                                                            <FiTrash size={20} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-8 text-neutral-600 text-sm md:text-base">
                            No doctor schedules found.
                        </div>
                    )}
                    <div className="mt-6">
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={handlePageChange}
                        />
                    </div>
                </>
            )}

            <EditDoctorScheduleModal
                isOpen={!!editModalContent}
                schedule={editModalContent}
                onClose={closeEditModal}
                onScheduleUpdated={triggerRefresh}
            />
        </div>
    );
};

export default DoctorScheduleTable;
