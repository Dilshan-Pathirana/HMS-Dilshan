import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { FiEye, FiEdit, FiTrash } from "react-icons/fi";
import alert from "../../../../../utils/alert.ts";
import Spinner from "../../../../../assets/Common/Spinner.tsx";
import Pagination from "../../../../../components/pharmacyPOS/Common/Pagination.tsx";
import axios from "axios";
import { getAllShifts } from "../../../../../utils/api/dashboard/StaffAndUsers/GetAllShifts.ts";
import {
    dayMap,
    IShift,
} from "../../../../../utils/types/Dashboard/StaffAndUser/IShift.ts";
import ShiftViewModal from "./ShiftViewModal.tsx";
import EditShiftModal from "../ShiftUpdate/EditShiftModal.tsx";
import { ShiftDeleteConfirmationAlert } from "../../../../../assets/Common/Alert/StaffAndUser/ShiftManagementDeleteConfirmation.tsx";
import { deleteShifts } from "../../../../../utils/api/dashboard/StaffAndUsers/DeleteShifts.ts";

export default function ShiftTable({
    refreshShifts,
    triggerRefresh,
}: {
    refreshShifts: boolean;
    triggerRefresh: () => void;
}) {
    const [shifts, setShifts] = useState<IShift[]>([]);
    const [editModalContent, setEditModalContent] = useState<any | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [modalContent, setModalContent] = useState<{
        notes: string;
        days: string[];
    } | null>(null);

    const rowsPerPage = 10;

    useEffect(() => {
        const fetchShifts = async () => {
            try {
                setIsLoading(true);
                const response = await getAllShifts();
                if (response.data.status === 200) {
                    setShifts(response.data.shifts);
                } else {
                    alert.warn("Failed to fetch shifts.");
                }
            } catch (error) {
                if (axios.isAxiosError(error)) {
                    alert.error(`Failed to fetch shifts: ${error.message}`);
                } else {
                    alert.error("An unexpected error occurred.");
                }
            } finally {
                setIsLoading(false);
            }
        };
        fetchShifts();
    }, [refreshShifts]);

    const filteredShifts = shifts.filter(
        (shift) =>
            shift.user_first_name
                .toLowerCase()
                .includes(searchTerm.toLowerCase()) ||
            shift.user_last_name
                .toLowerCase()
                .includes(searchTerm.toLowerCase()),
    );

    const totalPages = Math.ceil(filteredShifts.length / rowsPerPage);
    const paginatedShifts = filteredShifts.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage,
    );

    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage);
    };

    const openModal = (notes: string, days: string[]) =>
        setModalContent({ notes, days });
    const closeModal = () => setModalContent(null);

    const handleDelete = async (shiftId: string) => {
        const isConfirmed = await ShiftDeleteConfirmationAlert();
        if (isConfirmed) {
            try {
                const response = await deleteShifts(shiftId);
                if (response.status === 200) {
                    const message =
                        response.data.message || "The shift has been deleted!";
                    alert.success(message);
                    triggerRefresh();
                } else {
                    alert.error("Failed to delete the shift.");
                }
            } catch (error) {
                alert.error(
                    "An unexpected error occurred. Please try again later.",
                );
            }
        }
    };

    return (
        <div className="bg-white shadow rounded-lg p-4">
            <Spinner isLoading={isLoading} />
            {!isLoading && (
                <>
                    <div className="flex items-center space-x-2 mb-4">
                        <div className="relative w-1/2">
                            <Search className="absolute w-5 h-5 text-gray-500 left-3 top-1/2 transform -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Search by User Name..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="border border-gray-300 rounded pl-10 pr-4 py-2 w-full"
                            />
                        </div>
                    </div>

                    <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                {[
                                    "First Name",
                                    "Last Name",
                                    "Branch",
                                    "Shift Type",
                                    "Start Time",
                                    "End Time",
                                    "Actions",
                                ].map((header) => (
                                    <th
                                        key={header}
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                    >
                                        {header}
                                    </th>
                                ))}
                            </tr>
                        </thead>

                        <tbody className="bg-white divide-y divide-gray-200">
                            {paginatedShifts.map((shift) => (
                                <tr
                                    key={shift.id}
                                    className="hover:bg-gray-50 cursor-pointer"
                                >
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {shift.user_first_name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {shift.user_last_name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {shift.branch_center_name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {shift.shift_type}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {shift.start_time}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {shift.end_time}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        <div className="flex items-center space-x-2">
                                            <FiEye
                                                className="text-blue-500 cursor-pointer hover:text-blue-700"
                                                onClick={() =>
                                                    openModal(
                                                        shift.notes ||
                                                            "No Notes",
                                                        JSON.parse(
                                                            shift.days_of_week,
                                                        ).map(
                                                            (day: string) =>
                                                                dayMap[day],
                                                        ),
                                                    )
                                                }
                                            />
                                            <FiEdit
                                                className="text-yellow-500 cursor-pointer hover:text-yellow-700"
                                                onClick={() =>
                                                    setEditModalContent(shift)
                                                }
                                            />
                                            <FiTrash
                                                className="text-red-500 cursor-pointer hover:text-red-700"
                                                onClick={() =>
                                                    handleDelete(
                                                        shift.id.toString(),
                                                    )
                                                }
                                            />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                    />
                </>
            )}

            <EditShiftModal
                isOpen={!!editModalContent}
                shift={editModalContent}
                onClose={() => setEditModalContent(null)}
                onShiftUpdated={triggerRefresh}
            />

            <ShiftViewModal
                isOpen={!!modalContent}
                notes={modalContent?.notes || ""}
                days={modalContent?.days || []}
                onClose={closeModal}
            />
        </div>
    );
}
