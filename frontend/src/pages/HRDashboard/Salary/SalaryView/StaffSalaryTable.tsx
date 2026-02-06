import { useState, useEffect } from "react";
import { FiEdit, FiEye, FiTrash } from "react-icons/fi";
import Spinner from "../../../../assets/Common/Spinner.tsx";
import Pagination from "../../../../components/pharmacyPOS/Common/Pagination.tsx";
import { getAllStaffSalaries } from "../../../../utils/api/Sallary/GetAllStaffSalaries.ts";
import { deleteStaffSalary } from "../../../../utils/api/Sallary/DeleteStaffSalary.ts";
import alert from "../../../../utils/alert";
import StaffSalaryViewModal from "./StaffSalaryViewModal.tsx";
import { SalaryDeleteConfirmationAlert } from "../../../../assets/Common/Alert/StaffSalary/SalaryDeleteConfirmationAlert.tsx";
import EditStaffSalaryModal from "../SalaryUpdate/EditStaffSalaryModal.tsx";
import { IStaffSalary } from "../../../../utils/types/Salary/ISalary.ts";

const StaffSalaryTable = ({
    refreshSalaries,
    triggerRefresh,
}: {
    refreshSalaries: boolean;
    triggerRefresh: () => void;
}) => {
    const [salaries, setSalaries] = useState<IStaffSalary[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");
    const [viewModalContent, setViewModalContent] =
        useState<IStaffSalary | null>(null);
    const [editModalContent, setEditModalContent] =
        useState<IStaffSalary | null>(null);

    const rowsPerPage = 10;

    useEffect(() => {
        const fetchSalaries = async () => {
            try {
                setIsLoading(true);
                const response = await getAllStaffSalaries();
                if (response.status === 200) {
                    const fetchedSalaries = response.data.staffSalary || [];
                    setSalaries(fetchedSalaries);
                } else {
                    alert.warn("Failed to fetch salaries.");
                    setSalaries([]);
                }
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
            } catch (error) {
                alert.error("An error occurred while fetching salaries.");
                setSalaries([]);
            } finally {
                setIsLoading(false);
            }
        };
        fetchSalaries();
    }, [refreshSalaries]);

    const filteredSalaries = (salaries || []).filter(
        (salary) =>
            salary.user_first_name
                .toLowerCase()
                .includes(searchTerm.toLowerCase()) ||
            salary.user_last_name
                .toLowerCase()
                .includes(searchTerm.toLowerCase()),
    );

    const totalPages = Math.ceil(filteredSalaries.length / rowsPerPage);
    const paginatedSalaries = filteredSalaries.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage,
    );

    const handleDelete = async (id: string) => {
        const isConfirmed = await SalaryDeleteConfirmationAlert();
        if (isConfirmed) {
            try {
                const response = await deleteStaffSalary(id);
                if (response.status === 200) {
                    const message =
                        response.data.message || "The salary has been deleted!";
                    alert.success(message);
                    triggerRefresh();
                } else {
                    alert.error("Failed to delete the salary.");
                }
            } catch {
                alert.error(
                    "An unexpected error occurred. Please try again later.",
                );
            }
        }
    };

    const handlePageChange = (newPage: number) => setCurrentPage(newPage);

    const openViewModal = (salary: IStaffSalary) => setViewModalContent(salary);
    const closeViewModal = () => setViewModalContent(null);

    const openEditModal = (salary: IStaffSalary) => setEditModalContent(salary);
    const closeEditModal = () => setEditModalContent(null);

    return (
        <div className="bg-white shadow rounded-lg p-4">
            <Spinner isLoading={isLoading} />
            {!isLoading && (
                <>
                    <div className="flex items-center space-x-2 mb-4">
                        <div className="relative w-1/2">
                            <input
                                type="text"
                                placeholder="Search by User Name..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="border border-neutral-300 rounded pl-3 pr-4 py-2 w-full"
                            />
                        </div>
                    </div>
                    <table className="min-w-full divide-y divide-gray-200 border border-neutral-200">
                        <thead className="bg-neutral-50">
                            <tr>
                                {[
                                    "First Name",
                                    "Last Name",
                                    "Branch",
                                    "Basic Salary",
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
                            {paginatedSalaries.map((salary) => (
                                <tr
                                    key={salary.id}
                                    className="hover:bg-neutral-50 cursor-pointer"
                                >
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                                        {salary.user_first_name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                                        {salary.user_last_name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                                        {salary.branch_center_name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                                        {salary.basic_salary_amount}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                                        <div className="flex items-center space-x-2">
                                            <FiEye
                                                className="text-primary-500 cursor-pointer hover:text-blue-700"
                                                onClick={() =>
                                                    openViewModal(salary)
                                                }
                                            />
                                            <FiEdit
                                                className="text-yellow-500 cursor-pointer hover:text-yellow-700"
                                                onClick={() =>
                                                    openEditModal(salary)
                                                }
                                            />
                                            <FiTrash
                                                className="text-error-500 cursor-pointer hover:text-red-700"
                                                onClick={() =>
                                                    handleDelete(salary.id)
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

            <StaffSalaryViewModal
                isOpen={!!viewModalContent}
                salary={viewModalContent}
                onClose={closeViewModal}
            />

            <EditStaffSalaryModal
                isOpen={!!editModalContent}
                salary={editModalContent}
                onClose={closeEditModal}
                onSalaryUpdated={triggerRefresh}
            />
        </div>
    );
};

export default StaffSalaryTable;
