import React, { useState, useEffect } from "react";
import { Search } from "lucide-react";
import alert from "../../../../utils/alert";
import Spinner from "../../../../assets/Common/Spinner";
import Pagination from "../../../../components/pharmacyPOS/Common/Pagination";
import { useSelector } from "react-redux";
import { FiEye } from "react-icons/fi";
import { getAllCashierLeave } from "../../../../utils/api/leave/CashierGetAllLeave";
import { getAllPharmacistLeave } from "../../../../utils/api/leave/PharmasistGetAllLeave";
import api from "../../../../utils/api/axios";
import axios from "axios";
import {
    AuthState,
    Leave,
    LeaveManagementTableProps,
} from "../../../../utils/types/leave/Ileave";
import LeaveViewModal from "./LeaveViewModal";

const LeaveManagementTable: React.FC<LeaveManagementTableProps> = ({
    refreshLeaves,
}) => {
    const [leaves, setLeaves] = useState<Leave[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [modalContent, setModalContent] = useState<Leave | null>(null);
    const rowsPerPage = 10;

    const userId = useSelector(
        (state: { auth: AuthState }) => state.auth.userId,
    );
    const userRole = useSelector(
        (state: { auth: AuthState }) => state.auth.userRole,
    );

    useEffect(() => {
        const fetchLeaves = async () => {
            if (!userId) {
                alert.error("User ID is missing.");
                return;
            }

            try {
                setIsLoading(true);
                const response =
                    userRole === 6
                        ? await getAllCashierLeave(userId)
                        : await getAllPharmacistLeave(userId);

                if (response.data.status === 200) {
                    setLeaves(response.data.leaves);
                } else {
                    alert.warn(
                        response.data.message || "Failed to fetch leaves.",
                    );
                }
            } catch (error) {
                if (axios.isAxiosError(error)) {
                    alert.error(
                        error.response?.data?.message ||
                            "An error occurred while fetching leave data.",
                    );
                } else {
                    console.error("Unexpected error:", error);
                    alert.error("An unexpected error occurred.");
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchLeaves();
    }, [userId, userRole, refreshLeaves]);

    const filteredLeaves = leaves.filter(
        (leave) =>
            leave.leaves_start_date
                .toLowerCase()
                .includes(searchTerm.toLowerCase()) ||
            leave.leaves_end_date
                .toLowerCase()
                .includes(searchTerm.toLowerCase()) ||
            leave.reason?.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    const totalPages = Math.ceil(filteredLeaves.length / rowsPerPage);
    const paginatedLeaves = filteredLeaves.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage,
    );

    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage);
    };

    const openModal = (leave: Leave) => {
        setModalContent(leave);
    };

    const closeModal = () => {
        setModalContent(null);
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
                                placeholder="Search..."
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
                                    "Start Date",
                                    "End Date",
                                    "Reason",
                                    "Status",
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
                            {paginatedLeaves.map((leave) => (
                                <tr key={leave.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {leave.leaves_start_date}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {leave.leaves_end_date}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {leave.reason || "N/A"}
                                    </td>
                                    <td
                                        className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${
                                            leave.admin_status === "Approved"
                                                ? "text-green-600"
                                                : leave.admin_status === "Rejected"
                                                    ? "text-red-600"
                                                    : "text-gray-900"
                                        }`}
                                    >
                                        {leave.admin_status || "N/A"}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        <div className="flex items-center space-x-2">
                                            <FiEye
                                                className="text-blue-500 cursor-pointer hover:text-blue-700"
                                                onClick={() => openModal(leave)}
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

            {modalContent && (
                <LeaveViewModal leave={modalContent} onClose={closeModal}/>
            )}
        </div>
    );
};

export default LeaveManagementTable;
