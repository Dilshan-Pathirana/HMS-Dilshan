import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { FiEdit, FiTrash } from "react-icons/fi";
import alert from "../../../../utils/alert";
import Spinner from "../../../../assets/Common/Spinner.tsx";
import Pagination from "../../../../components/pharmacyPOS/Common/Pagination.tsx";
import { getAllOTRecords } from "../../../../utils/api/OT/GetAllOT.ts";
import EditOTModal from "../OTUpdate/EditOTModal.tsx";
import { deleteOTRecord } from "../../../../utils/api/OT/DeleteOT.ts";
import { OTDeleteConfirmationAlert } from "../../../../assets/Common/Alert/OT/OTDeleteConfirmationAlert.tsx";
import { OTRecord, OTTableProps } from "../../../../utils/types/OT/Iot.ts";

const OTTable: React.FC<OTTableProps> = ({ refreshOTs, triggerRefresh }) => {
    const [otRecords, setOtRecords] = useState<OTRecord[]>([]);
    const [editModalContent, setEditModalContent] = useState<OTRecord | null>(
        null,
    );
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [isLoading, setIsLoading] = useState(true);

    const rowsPerPage = 10;

    useEffect(() => {
        const fetchOTRecords = async () => {
            try {
                setIsLoading(true);
                const response = await getAllOTRecords();
                if (
                    response.data?.status === 200 &&
                    Array.isArray(response.data.employeeOT)
                ) {
                    setOtRecords(response.data.employeeOT as OTRecord[]);
                } else {
                    alert.warn("Failed to fetch OT records.");
                }
            } catch (error) {
                console.error(error);
                alert.error("An unexpected error occurred.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchOTRecords();
    }, [refreshOTs]);

    const filteredOTRecords = otRecords.filter(
        (record) =>
            record?.user_first_name
                ?.toLowerCase()
                ?.includes(searchTerm.toLowerCase()) ||
            record?.user_last_name
                ?.toLowerCase()
                ?.includes(searchTerm.toLowerCase()),
    );

    const totalPages = Math.ceil(filteredOTRecords.length / rowsPerPage);

    const paginatedOTRecords = filteredOTRecords.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage,
    );

    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage);
    };

    const handleDelete = async (recordId: string) => {
        const isConfirmed = await OTDeleteConfirmationAlert();
        if (isConfirmed) {
            try {
                const response = await deleteOTRecord(recordId);
                if (response.status === 200) {
                    alert.success("The OT record has been deleted!");
                    triggerRefresh(true);
                } else {
                    alert.error("Failed to delete the OT record.");
                }
            } catch (error) {
                console.error(error);
                alert.error(
                    "An unexpected error occurred. Please try again later.",
                );
            }
        }
    };

    const openEditModal = (record: OTRecord) => {
        setEditModalContent(record);
        setIsModalOpen(true);
    };

    const closeEditModal = () => {
        setIsModalOpen(false);
        setEditModalContent(null);
    };

    return (
        <div className="bg-white shadow rounded-lg p-4">
            <Spinner isLoading={isLoading} />
            {!isLoading && otRecords.length === 0 && (
                <div className="text-center text-neutral-500 mt-4">
                    No records found.
                </div>
            )}
            {!isLoading && otRecords.length > 0 && (
                <>
                    <div className="flex items-center space-x-2 mb-4">
                        <div className="relative w-1/2">
                            <Search className="absolute w-5 h-5 text-neutral-500 left-3 top-1/2 transform -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Search by Employee Name..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="border border-neutral-300 rounded pl-10 pr-4 py-2 w-full"
                            />
                        </div>
                    </div>

                    <table className="min-w-full divide-y divide-gray-200 border border-neutral-200">
                        <thead className="bg-neutral-50">
                            <tr>
                                {[
                                    "First Name",
                                    "Last Name",
                                    "Date",
                                    "Hours Worked",
                                    "OT Rate",
                                    "Total OT Amount",
                                    "Actions",
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
                            {paginatedOTRecords.map((record) => (
                                <tr
                                    key={record.id}
                                    className="hover:bg-neutral-50 cursor-pointer"
                                >
                                    <td className="px-6 py-4 text-sm">
                                        {record.user_first_name}
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        {record.user_last_name}
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        {record.date}
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        {record.hours_worked}
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        {record.ot_rate}
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        {record.total_ot_amount}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center space-x-2">
                                            <FiEdit
                                                className="text-yellow-500 cursor-pointer hover:text-yellow-700"
                                                onClick={() =>
                                                    openEditModal(record)
                                                }
                                            />
                                            <FiTrash
                                                className="text-error-500 cursor-pointer hover:text-red-700"
                                                onClick={() =>
                                                    handleDelete(record.id)
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

            {isModalOpen && editModalContent && (
                <EditOTModal
                    isOpen={isModalOpen}
                    otData={editModalContent}
                    closeModal={closeEditModal}
                    onOTUpdated={() => triggerRefresh(true)}
                />
            )}
        </div>
    );
};

export default OTTable;
