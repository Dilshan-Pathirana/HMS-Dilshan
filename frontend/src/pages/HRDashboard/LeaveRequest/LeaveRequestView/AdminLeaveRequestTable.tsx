import React, { useState, useEffect } from "react";
import { Search } from "lucide-react";
import Pagination from "../../../../components/pharmacyPOS/Common/Pagination";
import Spinner from "../../../../assets/Common/Spinner";
import alert from "../../../../utils/alert";
import { FiEye } from "react-icons/fi";
import { Leave } from "../../../../utils/types/leave/IleaveRequest.ts";
import { getAllSuperAdminLeaveRequest } from "../../../../utils/api/leave/LeaveRequest/SuperAdminGetAllLeaveRequest.ts";
import AdminLeaveDetailsModal from "./AdminLeaveDetailsModal";

const AdminLeaveRequestTable: React.FC = () => {
    const [leaves, setLeaves] = useState<Leave[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedLeave, setSelectedLeave] = useState<Leave | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);
    const [filterRejected, setFilterRejected] = useState(false);
    const rowsPerPage = 10;

    useEffect(() => {
        const fetchLeaves = async () => {
            try {
                setIsLoading(true);
                const response = await getAllSuperAdminLeaveRequest();

                if (response.status === 200 && response.data.leaves) {
                    setLeaves(response.data.leaves);
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
    }, [refreshKey]);

    const filteredLeaves = leaves.filter((leave) => {
        if (filterRejected) {
            return (
                leave.admin_status === "Rejected" &&
                leave.comments &&
                leave.comments.trim() !== ""
            );
        }
        return (
            `${leave.user_first_name} ${leave.user_last_name}`
                .toLowerCase()
                .includes(searchTerm.toLowerCase()) ||
            leave.leaves_start_date
                .toLowerCase()
                .includes(searchTerm.toLowerCase()) ||
            leave.leaves_end_date
                .toLowerCase()
                .includes(searchTerm.toLowerCase()) ||
            leave.admin_status.toLowerCase().includes(searchTerm.toLowerCase())
        );
    });

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
                <div className="flex space-x-4 items-center">
                    <div className="relative">
                        <Search className="absolute w-5 h-5 text-neutral-500 left-3 top-1/2 transform -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={handleSearchChange}
                            className="border border-neutral-300 rounded pl-10 pr-4 py-2 w-full"
                        />
                    </div>
                    <button
                        className={`px-4 py-2 rounded ${
                            filterRejected
                                ? "bg-primary-500 text-white"
                                : "bg-neutral-300 text-black"
                        }`}
                        onClick={() => setFilterRejected(!filterRejected)}
                    >
                        {filterRejected
                            ? "Show All Leaves"
                            : "View Assigner Rejected"}
                    </button>
                </div>
            </div>
            <Spinner isLoading={isLoading} />
            {!isLoading && filteredLeaves.length === 0 && (
                <p className="text-center text-neutral-500">
                    {filterRejected
                        ? "No rejected leave requests with comments found."
                        : "No leave requests available."}
                </p>
            )}
            {!isLoading && filteredLeaves.length > 0 && (
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
                                            leave.admin_status === "Approved"
                                                ? "text-green-600"
                                                : leave.admin_status ===
                                                    "Rejected"
                                                  ? "text-error-600"
                                                  : "text-neutral-900"
                                        }`}
                                    >
                                        {leave.admin_status}
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
                <AdminLeaveDetailsModal
                    leave={selectedLeave}
                    onClose={(refresh) => closeModal(refresh)}
                />
            )}
        </div>
    );
};

export default AdminLeaveRequestTable;
