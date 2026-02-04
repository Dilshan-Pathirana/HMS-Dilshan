import { useState, useEffect, useMemo } from "react";
import Spinner from "../../../assets/Common/Spinner.tsx";
import Pagination from "../../../components/pharmacyPOS/Common/Pagination.tsx";
import { IDoctorScheduleCancellation } from "../../../utils/types/DoctorSceduleCancel/IDoctorScheduleCancellation.ts";
import { getAllCancelSchedules } from "../../../utils/api/DoctorSceduleCancel/GetAllCancelSchedules.ts";
import { approveCancelSchedule } from "../../../utils/api/DoctorSceduleCancel/ApproveCancelSchedule.ts";
import { rejectCancelSchedule } from "../../../utils/api/DoctorSceduleCancel/RejectCancelSchedule.ts";
import { RejectScheduleCancellationModal } from "./RejectScheduleCancellationModal.tsx";

import alert from "../../../utils/alert";
import { FiCheck, FiXCircle } from "react-icons/fi";
import { getStatusBadge } from "./statusMapper.tsx";

const DoctorScheduleCancellationTable: React.FC = () => {
    const [cancellations, setCancellations] = useState<
        IDoctorScheduleCancellation[]
    >([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [rejectModalContent, setRejectModalContent] =
        useState<IDoctorScheduleCancellation | null>(null);

    const rowsPerPage = 10;

    useEffect(() => {
        fetchCancellations();
    }, []);

    const fetchCancellations = async () => {
        try {
            setIsLoading(true);
            const response = await getAllCancelSchedules();
            if (response.status === 200) {
                const fetchedCancellations =
                    response.data.doctor_schedule_cancellations || [];
                setCancellations(fetchedCancellations);
            } else {
                alert.warn("Failed to fetch schedule cancellation requests.");
                setCancellations([]);
            }
        } catch (error) {
            alert.error(
                "An error occurred while fetching cancellation requests.",
            );
            setCancellations([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleApprove = async (id: string) => {
        try {
            const response = await approveCancelSchedule(id);
            if (response.status === 200) {
                alert.success("Schedule cancellation approved successfully!");
                fetchCancellations();
            } else {
                alert.error("Failed to approve the cancellation request.");
            }
        } catch (error) {
            alert.error(
                "An unexpected error occurred. Please try again later.",
            );
        }
    };

    const handleReject = async (id: string, reason: string) => {
        try {
            const response = await rejectCancelSchedule(id, reason);
            if (response.status === 200) {
                alert.success("Schedule cancellation rejected successfully!");
                fetchCancellations();
            } else {
                alert.error("Failed to reject the cancellation request.");
            }
        } catch (error) {
            alert.error(
                "An unexpected error occurred. Please try again later.",
            );
        }
    };

    const filteredCancellations = useMemo(() => {
        return cancellations.filter((cancellation) => {
            const matchesSearch =
                cancellation.doctor_first_name
                    ?.toLowerCase()
                    .includes(searchTerm.toLowerCase()) ||
                cancellation.doctor_last_name
                    ?.toLowerCase()
                    .includes(searchTerm.toLowerCase()) ||
                cancellation.center_name
                    ?.toLowerCase()
                    .includes(searchTerm.toLowerCase());

            const matchesStatus =
                statusFilter === "all" ||
                cancellation.status.toString() === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [cancellations, searchTerm, statusFilter]);

    const totalPages = useMemo(() => {
        return Math.ceil(filteredCancellations.length / rowsPerPage);
    }, [filteredCancellations.length, rowsPerPage]);

    const paginatedCancellations = useMemo(() => {
        return filteredCancellations.slice(
            (currentPage - 1) * rowsPerPage,
            currentPage * rowsPerPage,
        );
    }, [filteredCancellations, currentPage, rowsPerPage]);

    const handlePageChange = (newPage: number) => setCurrentPage(newPage);

    const openRejectModal = (cancellation: IDoctorScheduleCancellation) => {
        setRejectModalContent(cancellation);
    };

    const closeRejectModal = () => {
        setRejectModalContent(null);
    };

    return (
        <div className="bg-white shadow rounded-lg p-4">
            <Spinner isLoading={isLoading} />
            {!isLoading && (
                <>
                    <div className="flex items-center space-x-4 mb-4">
                        <div className="relative flex-1">
                            <input
                                type="text"
                                placeholder="Search by doctor name or branch..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="border border-gray-300 rounded pl-3 pr-4 py-2 w-full"
                            />
                        </div>
                        <div className="relative">
                            <select
                                value={statusFilter}
                                onChange={(e) =>
                                    setStatusFilter(e.target.value)
                                }
                                className="border border-gray-300 rounded px-3 py-2 bg-white"
                            >
                                <option value="all">All Statuses</option>
                                <option value="0">Pending</option>
                                <option value="1">Approved</option>
                                <option value="2">Rejected</option>
                            </select>
                        </div>
                    </div>

                    {paginatedCancellations.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        {[
                                            "Doctor Name",
                                            "Branch",
                                            "Schedule Day",
                                            "Time",
                                            "Date",
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
                                    {paginatedCancellations.map(
                                        (cancellation) => (
                                            <tr
                                                key={cancellation.id}
                                                className="hover:bg-gray-50"
                                            >
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {
                                                        cancellation.doctor_first_name
                                                    }{" "}
                                                    {
                                                        cancellation.doctor_last_name
                                                    }
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {cancellation.center_name}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {cancellation.schedule_day}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {cancellation.start_time}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {new Date(
                                                        cancellation.date,
                                                    ).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                                                    <span
                                                        title={
                                                            cancellation.reason
                                                        }
                                                    >
                                                        {cancellation.reason}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {getStatusBadge(
                                                        cancellation.status,
                                                    )}
                                                    {cancellation.status ===
                                                        2 &&
                                                        cancellation.reject_reason && (
                                                            <div
                                                                className="mt-1 text-xs text-red-600"
                                                                title={
                                                                    cancellation.reject_reason
                                                                }
                                                            >
                                                                Reason:{" "}
                                                                {cancellation.reject_reason.substring(
                                                                    0,
                                                                    30,
                                                                )}
                                                                ...
                                                            </div>
                                                        )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    <div className="flex items-center space-x-2">
                                                        {cancellation.status ===
                                                            0 && (
                                                            <>
                                                                <button
                                                                    onClick={() =>
                                                                        handleApprove(
                                                                            cancellation.id,
                                                                        )
                                                                    }
                                                                    className="text-green-600 hover:text-green-800 flex items-center"
                                                                    title="Approve"
                                                                >
                                                                    <FiCheck
                                                                        size={
                                                                            16
                                                                        }
                                                                    />
                                                                </button>
                                                                <button
                                                                    onClick={() =>
                                                                        openRejectModal(
                                                                            cancellation,
                                                                        )
                                                                    }
                                                                    className="text-red-600 hover:text-red-800 flex items-center"
                                                                    title="Reject"
                                                                >
                                                                    <FiXCircle
                                                                        size={
                                                                            16
                                                                        }
                                                                    />
                                                                </button>
                                                            </>
                                                        )}
                                                        {cancellation.status !==
                                                            0 && (
                                                            <span className="text-gray-400">
                                                                No actions
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ),
                                    )}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-600">
                            No schedule cancellation requests found.
                        </div>
                    )}

                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                    />
                </>
            )}

            <RejectScheduleCancellationModal
                isOpen={!!rejectModalContent}
                cancellation={rejectModalContent}
                onClose={closeRejectModal}
                onReject={handleReject}
            />
        </div>
    );
};

export default DoctorScheduleCancellationTable;
