import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiEdit, FiArrowLeft, FiUsers, FiInfo } from "react-icons/fi";
import Spinner from "../../../../assets/Common/Spinner.tsx";
import api from "../../../../utils/api/axios";
import { IBranchData } from "../../../../utils/types/Branch/IBranchData.ts";
import { IUserData } from "../../../../utils/types/users/Iuser.ts";
import UserTableStructure from "../../Users/UserManagement/UserView/UserTableStructure.tsx";
import BranchEditModal from "../BranchUpdate/BranchEditModal.tsx";
import Pagination from "../../../../components/pharmacyPOS/Common/Pagination.tsx";

const BranchManage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [branch, setBranch] = useState<IBranchData | null>(null);
    const [staff, setStaff] = useState<IUserData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("overview");
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // Pagination/Search for Staff
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 10;

    useEffect(() => {
        if (id) {
            fetchBranchDetails();
            fetchBranchStaff();
        }
    }, [id]);

    const fetchBranchDetails = async () => {
        try {
            setIsLoading(true);
            const data = await api.get<IBranchData>(`/branches/${id}`);
            setBranch(data || null);
        } catch (error) {
            console.error("Failed to fetch branch details", error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchBranchStaff = async () => {
        try {
            const data = await api.get<IUserData[]>(`/users/?branch_id=${id}`);
            setStaff(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Failed to fetch staff", error);
        }
    };

    const handleBack = () => {
        navigate(-1);
    };

    // Filter and Paginate Staff
    const safeStaff = Array.isArray(staff) ? staff : [];

    const filteredStaff = safeStaff.filter(user =>
        (user.first_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (user.last_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (user.email?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(filteredStaff.length / rowsPerPage);
    const paginatedStaff = filteredStaff.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage
    );

    if (isLoading) return <Spinner isLoading={true} />;
    if (!branch) return <div className="p-4 text-center">Branch not found</div>;

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex items-center mb-6 gap-4">
                <button onClick={handleBack} className="p-2 rounded hover:bg-neutral-100">
                    <FiArrowLeft className="w-6 h-6 text-neutral-600" />
                </button>
                <h1 className="text-2xl font-bold text-neutral-800">Manage: {branch.center_name}</h1>
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                    {branch.center_type}
                </span>
                <div className="ml-auto">
                    <button
                        onClick={() => setIsEditModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
                    >
                        <FiEdit /> Edit Branch Details
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-neutral-200 mb-6">
                <button
                    className={`px-6 py-3 font-medium flex items-center gap-2 ${activeTab === 'overview' ? 'border-b-2 border-primary-500 text-primary-600' : 'text-neutral-500 hover:text-neutral-700'}`}
                    onClick={() => setActiveTab('overview')}
                >
                    <FiInfo /> Overview
                </button>
                <button
                    className={`px-6 py-3 font-medium flex items-center gap-2 ${activeTab === 'staff' ? 'border-b-2 border-primary-500 text-primary-600' : 'text-neutral-500 hover:text-neutral-700'}`}
                    onClick={() => setActiveTab('staff')}
                >
                    <FiUsers /> Staff ({staff.length})
                </button>
            </div>

            {/* Tab Content */}
            <div className="bg-white rounded-lg shadow min-h-[400px]">
                {activeTab === 'overview' && (
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <h3 className="text-lg font-medium border-b pb-2 mb-4">Center Details</h3>
                            <div className="space-y-4">
                                <div className="grid grid-cols-3 gap-4">
                                    <span className="text-neutral-500">Register Number:</span>
                                    <span className="col-span-2 font-medium">{branch.register_number}</span>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <span className="text-neutral-500">Division:</span>
                                    <span className="col-span-2 font-medium">{branch.division} ({branch.division_number})</span>
                                </div>
                            </div>
                        </div>
                        <div>
                            <h3 className="text-lg font-medium border-b pb-2 mb-4">Owner/Contact Information</h3>
                            <div className="space-y-4">
                                <div className="grid grid-cols-3 gap-4">
                                    <span className="text-neutral-500">Owner Name:</span>
                                    <span className="col-span-2 font-medium">{branch.owner_full_name}</span>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <span className="text-neutral-500">Owner Type:</span>
                                    <span className="col-span-2 font-medium">{branch.owner_type}</span>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <span className="text-neutral-500">Contact Number:</span>
                                    <span className="col-span-2 font-medium">{branch.owner_contact_number}</span>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <span className="text-neutral-500">Owner ID:</span>
                                    <span className="col-span-2 font-medium">{branch.owner_id_number}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'staff' && (
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-4">
                            <input
                                type="text"
                                placeholder="Search staff..."
                                className="border border-neutral-300 rounded px-4 py-2 w-64"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <UserTableStructure
                            isLoading={false}
                            filteredUsers={paginatedStaff}
                            paginatedUsers={paginatedStaff}
                            refreshUsers={fetchBranchStaff}
                            readOnly={false}
                        />
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                        />
                    </div>
                )}
            </div>

            <BranchEditModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                branchData={branch}
                triggerRefresh={() => { fetchBranchDetails(); setIsEditModalOpen(false); }}
            />
        </div>
    );
};

export default BranchManage;
