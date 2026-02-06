import React, { useState, useEffect } from "react";
import { Search } from "lucide-react";
import Pagination from "../../../../components/pharmacyPOS/Common/Pagination";
import Spinner from "../../../../assets/Common/Spinner";
import alert from "../../../../utils/alert";
import { useSelector } from "react-redux";
import { AuthState } from "../../../../utils/types/leave/Ileave.ts";
import { FiEye } from "react-icons/fi";
import LeaveDetailsModal from "./LeaveDetailsModal";
import {
    Leave,
    LeaveRequestTableProps,
} from "../../../../utils/types/leave/IleaveRequest.ts";
import { getAllCashierLeaveRequest } from "../../../../utils/api/leave/LeaveRequest/CashierGetAllLeaveRequest.ts";
import { getAllPharmacistLeaveRequest } from "../../../../utils/api/leave/LeaveRequest/PharmacistGetAllLeaveRequest.ts";

const LeaveRequestTable: React.FC<LeaveRequestTableProps> = ({
    assignerId,
}) => {
    const [leaves, setLeaves] = useState<Leave[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedLeave, setSelectedLeave] = useState<Leave | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);
    const rowsPerPage = 10;

    const userRole = useSelector(
        (state: { auth: AuthState }) => state.auth.userRole,
    );

    useEffect(() => {
        const fetchLeaves = async () => {
            try {
                setIsLoading(true);
                let response;
                if (userRole === 6) {
                    response = await getAllCashierLeaveRequest(assignerId);
                } else {
                    response = await getAllPharmacistLeaveRequest(assignerId);
                }

                if (
                    response.status === 200 &&
                    Array.isArray(response.data["Leaves fetched successfully."])
                ) {
                    setLeaves(response.data["Leaves fetched successfully."]);
                } else {
                    setLeaves([]);
                    alert.warn(
                        response.data.message || "Failed to fetch leaves.",
                    );
                }
            } catch (error) {
                alert.error("An error occurred while fetching leave requests.");
                console.error(error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchLeaves();
    }, [assignerId, userRole, refreshKey]);

    const filteredLeaves = leaves.filter(
        (leave) =>
            `${leave.user_first_name} ${leave.user_last_name}`
                .toLowerCase()
                .includes(searchTerm.toLowerCase()) ||
            leave.leaves_start_date
                .toLowerCase()
                .includes(searchTerm.toLowerCase()) ||
            leave.leaves_end_date
                .toLowerCase()
                .includes(searchTerm.toLowerCase()) ||
            leave.status.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    const totalPages = Math.ceil(filteredLeaves.length / rowsPerPage);
    const paginatedLeaves = filteredLeaves.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage,
    );

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };

    const openModal = (leave: Leave) => {
        setSelectedLeave(leave);
    };

    const closeModal = (refresh = false) => {
        setSelectedLeave(null);
        if (refresh) {
            setRefreshKey((prev) => prev + 1);
        }
    };

    return (
        <div className="bg-white shadow rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold">Leave Requests</h1>
                <div className="relative w-1/3">
                    <Search className="absolute w-5 h-5 text-neutral-500 left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={handleSearchChange}
                        className="border border-neutral-300 rounded pl-10 pr-4 py-2 w-full"
                    />
                </div>
            </div>
            <Spinner isLoading={isLoading} />
            {!isLoading && (
                <>
                    <table className="min-w-full divide-y divide-gray-200 border border-neutral-200">
                        <thead className="bg-neutral-50">
                            <tr>
                                {[
                                    "Full Name",
                                    "Start Date",
                                    "End Date",
                                    "Status",
                                    "Leave Days",
                                    "Action",
                                ].map((header) => (
                                    <th
                                        key={header}
                                        className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider"
                                    >
                                        {header}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {paginatedLeaves.map((leave) => (
                                <tr key={leave.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                                        {`${leave.user_first_name} ${leave.user_last_name}`}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                                        {leave.leaves_start_date}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                                        {leave.leaves_end_date}
                                    </td>
                                    <td
                                        className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${
                                            leave.status === "Approved"
                                                ? "text-green-600"
                                                : leave.status === "Rejected"
                                                    ? "text-error-600"
                                                    : "text-neutral-900"
                                        }`}
                                    >
                                        {leave.status === "Approved"
                                            ? "Accept"
                                            : leave.status === "Rejected"
                                                ? "Not Accept"
                                                : leave.status}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                                        {leave.leaves_days}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                                        <div className="flex items-center space-x-2">
                                            <FiEye
                                                className="text-primary-500 cursor-pointer hover:text-blue-700"
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

            {selectedLeave && (
                <LeaveDetailsModal
                    leave={selectedLeave}
                    onClose={(refresh) => closeModal(refresh)}
                />
            )}
        </div>
    );
};

export default LeaveRequestTable;
