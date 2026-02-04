import { useState, useEffect } from "react";
import { FiEdit, FiEye, FiTrash } from "react-icons/fi";
import { Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Spinner from "../../../../assets/Common/Spinner.tsx";
import Pagination from "../../../../components/pharmacyPOS/Common/Pagination.tsx";
import { getAllBranches } from "../../../../utils/api/branch/GetAllBranches.ts";
import alert from "../../../../utils/alert";
import BranchViewModal from "./BranchViewModal.tsx";
import BranchEditModal from "../BranchUpdate/BranchEditModal.tsx";
import { IBranchData } from "../../../../utils/types/Branch/IBranchData.ts";
import { ConfirmAlert } from "../../../../assets/Common/Alert/ConfirmAlert.tsx";
import api from "../../../../utils/api/axios";

const BranchTable = ({
    refreshSalaries,
    triggerRefresh,
}: {
    refreshSalaries: boolean;
    triggerRefresh: () => void;
}) => {
    const navigate = useNavigate();
    const [branches, setBranches] = useState<IBranchData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");
    const [viewModalContent, setViewModalContent] =
        useState<IBranchData | null>(null);
    const [editModalContent, setEditModalContent] =
        useState<IBranchData | null>(null);

    const rowsPerPage = 10;

    const handleManageBranch = (branchId: string) => {
        navigate(`/branch/${branchId}`);
    };

    useEffect(() => {
        const fetchBranches = async () => {
            try {
                setIsLoading(true);
                const response = await getAllBranches();
                // Check if response data is an array (the list of branches) or has branches property
                const responseData = response?.data;
                let fetchedBranches: IBranchData[] = [];
                if (Array.isArray(responseData)) {
                    fetchedBranches = responseData;
                } else if (responseData && responseData.branches) {
                    fetchedBranches = responseData.branches;
                }

                setBranches(fetchedBranches);
            } catch (error) {
                console.error("Fetch branches error:", error);
                alert.error("An error occurred while fetching branches.");
                setBranches([]);
            } finally {
                setIsLoading(false);
            }
        };
        fetchBranches();
    }, [refreshSalaries]);

    const filteredBranches = branches.filter(
        (branch) =>
            branch.center_name
                .toLowerCase()
                .includes(searchTerm.toLowerCase()) ||
            branch.owner_full_name
                .toLowerCase()
                .includes(searchTerm.toLowerCase()),
    );

    const totalPages = Math.ceil(filteredBranches.length / rowsPerPage);
    const paginatedBranches = filteredBranches.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage,
    );

    const handlePageChange = (newPage: number) => setCurrentPage(newPage);

    const openViewModal = (branch: IBranchData) => setViewModalContent(branch);
    const closeViewModal = () => setViewModalContent(null);

    const openEditModal = (branch: IBranchData) => setEditModalContent(branch);
    const closeEditModal = () => setEditModalContent(null);

    const handleDelete = async (branchId: string) => {
        const isConfirm = await ConfirmAlert(
            "Are you need delete this branch?",
            "Do you really want to delete the branch?",
        );

        if (isConfirm) {
            try {
                const response = await api.delete(
                    `/api/v1/branches/${branchId}`,
                ) as any;

                if (response) {
                    const message =
                        response.message || "The branch has been deleted!";
                    alert.success(message);
                    triggerRefresh();
                } else {
                    alert.error("Failed to delete the branch.");
                }
            } catch (error) {
                alert.error("An error occurred while deleting the branch.");
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
                            <input
                                type="text"
                                placeholder="Search by Center or Owner Name..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="border border-gray-300 rounded pl-3 pr-4 py-2 w-full"
                            />
                        </div>
                    </div>
                    <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                {[
                                    "Center Name",
                                    "Reg No",
                                    "Type",
                                    "Owner Name",
                                    "Contact No",
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
                            {paginatedBranches.map((branch) => (
                                <tr
                                    key={branch.id}
                                    className="hover:bg-gray-50 cursor-pointer"
                                >
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {branch.center_name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {branch.register_number}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {branch.center_type}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {branch.owner_full_name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {branch.owner_contact_number}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        <div className="flex items-center space-x-2">
                                            <div title="Manage Branch">
                                                <Settings
                                                    className="h-5 w-5 text-green-500 cursor-pointer hover:text-green-700"
                                                    onClick={() =>
                                                        handleManageBranch(branch.id)
                                                    }
                                                />
                                            </div>
                                            <FiEye
                                                className="text-blue-500 cursor-pointer hover:text-blue-700"
                                                onClick={() =>
                                                    openViewModal(branch)
                                                }
                                                title="View Details"
                                            />
                                            <FiEdit
                                                className="text-yellow-500 cursor-pointer hover:text-yellow-700"
                                                onClick={() =>
                                                    openEditModal(branch)
                                                }
                                                title="Edit Branch"
                                            />
                                            <FiTrash
                                                className="text-red-500 cursor-pointer hover:text-red-700"
                                                onClick={() =>
                                                    handleDelete(branch.id)
                                                }
                                                title="Delete Branch"
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

            <BranchViewModal
                isOpen={!!viewModalContent}
                branch={viewModalContent}
                onClose={closeViewModal}
            />

            <BranchEditModal
                isOpen={!!editModalContent}
                branchData={editModalContent}
                onClose={closeEditModal}
                triggerRefresh={triggerRefresh}
            />
        </div>
    );
};

export default BranchTable;
