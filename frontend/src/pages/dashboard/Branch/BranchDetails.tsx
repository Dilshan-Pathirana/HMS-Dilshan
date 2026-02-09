import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiEdit, FiArrowLeft, FiUsers, FiInfo, FiSettings } from "react-icons/fi";
import { Building2, User } from "lucide-react";
import Spinner from "../../../assets/Common/Spinner.tsx";
import api from "../../../utils/api/axios";
import { IBranchData } from "../../../utils/types/Branch/IBranchData.ts";
import { IUserData } from "../../../utils/types/users/Iuser.ts";
import UserTableStructure from "../Users/UserManagement/UserView/UserTableStructure.tsx";
import BranchEditModal from "./BranchUpdate/BranchEditModal.tsx";
import Pagination from "../../../components/pharmacyPOS/Common/Pagination.tsx";

const BranchDetails = () => {
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

    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const fetchBranchDetails = async () => {
        if (!id || id === 'assign' || id.length < 30) {
            return; // Don't even try to fetch
        }
        try {
            setErrorMsg(null);
            setIsLoading(true);
            console.log(`[BranchDetails] Requesting: /branches/${id}/details`);
            const data = await api.get<IBranchData>(`/branches/${id}/details`);
            console.log("[BranchDetails] Response Data:", data);

            if (data) {
                console.log("[BranchDetails] Valid data received, setting state.");
                setBranch(data);
            } else {
                console.warn("[BranchDetails] Data is null or undefined.");
                setErrorMsg("Server returned empty data.");
            }
        } catch (error: any) {
            console.error("Failed to fetch branch details", error);
            if (error.response) {
                if (error.response.status === 401) {
                    alert("Your session has expired. Please login again.");
                    localStorage.clear();
                    window.location.href = '/login';
                    return;
                }
                if (error.response.status === 403) {
                    setErrorMsg("You are not authorized to view this branch.");
                } else if (error.response.status === 404) {
                    setErrorMsg("Branch not found in the database.");
                } else {
                    setErrorMsg(error.response.data?.detail || "An error occurred while loading the branch.");
                }
            } else {
                setErrorMsg("Network error. Please check your connection.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const fetchBranchStaff = async () => {
        try {
            // Updated endpoint with branch_id filter
            const data = await api.get<IUserData[]>(`/users/?branch_id=${id}`);
            const staffList = Array.isArray(data) ? data : [];
            setStaff(staffList);
        } catch (error: any) {
            console.error("Failed to fetch staff", error);
            // 401 handling is already done in fetchBranchDetails generally,
            // but redundancy helps if parallel requests fail
            if (error.response && error.response.status === 401) {
                // Do nothing, let the other handler redirect to avoid double alert
            }
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
    if (isLoading) return <Spinner isLoading={true} />;

    if (!branch) {
        return (
            <div className="p-8 text-center bg-white rounded-lg shadow-sm border border-neutral-200 m-6">
                <div className="text-neutral-400 mb-2">
                    <Building2 className="w-12 h-12 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-neutral-900">Unable to Load Branch</h3>
                {errorMsg && (
                    <div className="mt-2 text-error-600 bg-error-50 p-2 rounded inline-block">
                        {errorMsg}
                    </div>
                )}
                <p className="text-neutral-500 mt-4 mb-4">
                    Please check your permissions or try again.
                </p>
                <button
                    onClick={() => navigate('/dashboard/branches')}
                    className="text-primary-600 font-medium hover:text-primary-700 hover:underline"
                >
                    Back to Branches
                </button>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex items-center mb-6 gap-4">
                <button onClick={handleBack} className="p-2 rounded hover:bg-neutral-100">
                    <FiArrowLeft className="w-6 h-6 text-neutral-600" />
                </button>
                <h1 className="text-2xl font-bold text-neutral-800">{branch.center_name}</h1>
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                    {branch.center_type}
                </span>
                <div className="ml-auto">
                    {/* Edit button removed for View Only mode */}
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
                <button
                    className={`px-6 py-3 font-medium flex items-center gap-2 ${activeTab === 'pharmacies' ? 'border-b-2 border-primary-500 text-primary-600' : 'text-neutral-500 hover:text-neutral-700'}`}
                    onClick={() => setActiveTab('pharmacies')}
                >
                    <Building2 /> Pharmacies ({branch.pharmacies?.length || 0})
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
                                <div className="grid grid-cols-3 gap-4">
                                    <span className="text-neutral-500">Branch Admin:</span>
                                    <span className="col-span-2 font-medium text-primary-600">
                                        {branch.branch_admin ? (
                                            <div className="flex items-center gap-2">
                                                <User className="w-4 h-4" />
                                                <span>{branch.branch_admin.first_name} {branch.branch_admin.last_name}</span>
                                            </div>
                                        ) : (
                                            <span className="text-yellow-600 flex items-center gap-1"><FiInfo className="w-3 h-3" /> Not Assigned</span>
                                        )}
                                    </span>
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
                            {/* Add Staff Button removed for View Only mode */}
                        </div>
                        <UserTableStructure
                            isLoading={false}
                            filteredUsers={paginatedStaff}
                            paginatedUsers={paginatedStaff}
                            refreshUsers={fetchBranchStaff}
                            readOnly={true}
                        />
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                        />
                    </div>
                )}

                {activeTab === 'pharmacies' && (
                    <div className="p-6">
                        {branch.pharmacies && branch.pharmacies.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {branch.pharmacies.map((pharmacy) => (
                                            <tr key={pharmacy.id}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{pharmacy.name}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{pharmacy.pharmacy_code}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${pharmacy.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                        {pharmacy.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-8 text-neutral-500">
                                No pharmacies assigned to this branch.
                            </div>
                        )}
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

export default BranchDetails;
