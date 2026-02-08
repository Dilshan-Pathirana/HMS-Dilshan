import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiArrowLeft, FiPlus, FiTrash2, FiUsers } from "react-icons/fi";
import { Building2 } from "lucide-react";
import Spinner from "../../../assets/Common/Spinner.tsx";
import api from "../../../utils/api/axios";
import { IBranchData, IPharmacyData } from "../../../utils/types/Branch/IBranchData.ts";
import { IUserData } from "../../../utils/types/users/Iuser.ts";
import alert from "../../../utils/alert.ts";

type StaffRoleTab = {
    key: string;
    label: string;
    role_as: number;
    assign_role: string;
};

const STAFF_ROLE_TABS: StaffRoleTab[] = [
    { key: "branch_admin", label: "Branch Admin", role_as: 2, assign_role: "branch_admin" },
    { key: "doctor", label: "Doctor", role_as: 3, assign_role: "doctor" },
    { key: "nurse", label: "Nurse", role_as: 4, assign_role: "nurse" },
    { key: "cashier", label: "Cashier", role_as: 6, assign_role: "cashier" },
    { key: "pharmacist", label: "Pharmacist", role_as: 7, assign_role: "pharmacist" },
    { key: "it_support", label: "IT Support", role_as: 8, assign_role: "it_support" },
    { key: "center_aid", label: "Center Aid", role_as: 9, assign_role: "center_aid" },
    { key: "auditor", label: "Auditor", role_as: 10, assign_role: "auditor" },
];

const BranchAssign: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [branch, setBranch] = useState<IBranchData | null>(null);
    const [activeTab, setActiveTab] = useState<'staff' | 'pharmacies'>('staff');

    const [activeStaffRoleKey, setActiveStaffRoleKey] = useState<string>("doctor");

    // Data States
    const [assignedStaff, setAssignedStaff] = useState<IUserData[]>([]);
    const [assignedPharmacies, setAssignedPharmacies] = useState<IPharmacyData[]>([]);

    // Modal States
    const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
    const [isPharmacyModalOpen, setIsPharmacyModalOpen] = useState(false);

    // Available Data States
    const [availableStaff, setAvailableStaff] = useState<IUserData[]>([]);
    const [availablePharmacies, setAvailablePharmacies] = useState<IPharmacyData[]>([]);
    const [isFetchingAvailable, setIsFetchingAvailable] = useState(false);

    const [selectedStaffUserId, setSelectedStaffUserId] = useState<string>("");

    const activeStaffTab: StaffRoleTab =
        STAFF_ROLE_TABS.find((t) => t.key === activeStaffRoleKey) || STAFF_ROLE_TABS[1];

    useEffect(() => {
        fetchBranchData();
    }, [id]);

    useEffect(() => {
        if (!id || id === 'assign' || id.length < 30) return;
        if (activeTab !== 'staff') return;
        fetchAssignedStaffByRole(activeStaffTab.role_as);
        // Reset selection when switching roles
        setSelectedStaffUserId("");
    }, [id, activeTab, activeStaffRoleKey]);

    const fetchBranchData = async () => {
        // Validate ID is a UUID (basic check)
        if (!id || id === 'assign' || id.length < 30) {
            console.error("Invalid Branch ID:", id);
            alert.error("Invalid Branch ID");
            navigate('/dashboard/branches');
            return;
        }

        try {
            setIsLoading(true);
            const data = await api.get<IBranchData>(`/branches/${id}/details`);
            if (data) {
                const bData = data as unknown as IBranchData;
                setBranch(bData);
                setAssignedPharmacies(bData.pharmacies || []);
            }
            // Assigned staff is fetched per-role via tabs
        } catch (error: any) {
            console.error("Failed to load branch data", error);
            if (error.response && error.response.status === 401) {
                alert.error("Session expired. Please login again.");
                // Let the interceptor handle redirect if it exists, or do it here
            } else {
                alert.error("Failed to load branch data");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const fetchAssignedStaffByRole = async (roleAs: number) => {
        try {
            setIsFetchingAvailable(true);
            const staffData = await api.get<IUserData[]>(`/users/?branch_id=${id}&role_as=${roleAs}`);
            setAssignedStaff((staffData as unknown as IUserData[]) || []);
        } catch (error) {
            console.error("Failed to load assigned staff", error);
            setAssignedStaff([]);
        } finally {
            setIsFetchingAvailable(false);
        }
    };

    const fetchAvailableStaff = async () => {
        setIsFetchingAvailable(true);
        try {
            const data = await api.get<IUserData[]>(`/users/available-by-role?role_as=${activeStaffTab.role_as}`);
            setAvailableStaff(data as unknown as IUserData[]);
        } catch (error) {
            console.error("Failed to load available staff", error);
            setAvailableStaff([]);
        } finally {
            setIsFetchingAvailable(false);
        }
    };

    const fetchAvailablePharmacies = async () => {
        setIsFetchingAvailable(true);
        try {
            const response = await api.get<{ data: IPharmacyData[] }>("/pharmacies/available/for-assignment");
            if (response.data) {
                setAvailablePharmacies(response.data);
            }
        } catch (error) {
            console.error("Failed to load available pharmacies", error);
        } finally {
            setIsFetchingAvailable(false);
        }
    };

    const handleAssignStaff = async (userId: string) => {
        try {
            // For staff, we usually update the user's branch_id directly or use a specific endpoint
            // The backend has /branches/{id}/assign-staff
            await api.post(`/branches/${id}/assign-staff`, { user_id: userId, role: activeStaffTab.assign_role });
            alert.success(`${activeStaffTab.label} assigned successfully`);
            setIsStaffModalOpen(false);
            fetchAssignedStaffByRole(activeStaffTab.role_as);
            fetchAvailableStaff();
        } catch (error: any) {
            alert.error(error.response?.data?.detail || "Failed to assign staff");
        }
    };

    const handleRemoveStaff = async (userId: string) => {
        if (!window.confirm("Are you sure you want to remove this staff member from the branch?")) return;
        try {
            await api.delete(`/branches/${id}/staff/${userId}`);
            alert.success("Staff removed successfully");
            fetchAssignedStaffByRole(activeStaffTab.role_as);
            fetchAvailableStaff();
        } catch (error: any) {
            alert.error(error.response?.data?.detail || "Failed to remove staff");
        }
    };

    const handleAssignPharmacy = async (pharmacyId: number) => {
        try {
            await api.put(`/branches/${id}/pharmacies/${pharmacyId}`);
            alert.success("Pharmacy linked successfully");
            setIsPharmacyModalOpen(false);
            fetchBranchData();
        } catch (error: any) {
            alert.error(error.response?.data?.detail || "Failed to link pharmacy");
        }
    };

    const handleUnlinkPharmacy = async (pharmacyId: number) => {
        if (!window.confirm("Are you sure you want to unlink this pharmacy?")) return;
        try {
            await api.delete(`/branches/${id}/pharmacies/${pharmacyId}`);
            alert.success("Pharmacy unlinked successfully");
            fetchBranchData();
        } catch (error: any) {
            alert.error(error.response?.data?.detail || "Failed to unlink pharmacy");
        }
    };

    if (isLoading) return <Spinner isLoading={true} />;
    if (!branch) return <div>Branch not found</div>;

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
                >
                    <FiArrowLeft className="w-6 h-6 text-neutral-600" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-neutral-800">Assign Staff & Resources</h1>
                    <p className="text-neutral-500">Manage staff and pharmacy allocations for <span className="font-semibold text-primary-600">{branch.center_name}</span></p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-neutral-200 mb-6 w-full">
                <button
                    className={`px-8 py-3 font-medium flex items-center gap-2 transition-all ${activeTab === 'staff' ? 'border-b-2 border-primary-500 text-primary-600 bg-primary-50/50' : 'text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50'}`}
                    onClick={() => setActiveTab('staff')}
                >
                    <FiUsers /> Staff Management
                </button>
                <button
                    className={`px-8 py-3 font-medium flex items-center gap-2 transition-all ${activeTab === 'pharmacies' ? 'border-b-2 border-primary-500 text-primary-600 bg-primary-50/50' : 'text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50'}`}
                    onClick={() => setActiveTab('pharmacies')}
                >
                    <Building2 className="w-4 h-4" /> Pharmacy Management
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 min-h-[500px]">

                {/* STAFF TAB */}
                {activeTab === 'staff' && (
                    <div className="p-6">
                        {/* Role Tabs */}
                        <div className="flex flex-wrap gap-2 mb-5">
                            {STAFF_ROLE_TABS.map((t) => (
                                <button
                                    key={t.key}
                                    type="button"
                                    className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                                        activeStaffRoleKey === t.key
                                            ? 'bg-primary-50 border-primary-200 text-primary-700'
                                            : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                                    }`}
                                    onClick={() => setActiveStaffRoleKey(t.key)}
                                >
                                    {t.label}
                                </button>
                            ))}
                        </div>

                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-semibold text-neutral-800">Assigned {activeStaffTab.label} ({assignedStaff.length})</h3>
                            <button
                                onClick={() => {
                                    fetchAvailableStaff();
                                    setSelectedStaffUserId("");
                                    setIsStaffModalOpen(true);
                                }}
                                className="px-4 py-2 bg-primary-600 text-white rounded-lg flex items-center gap-2 hover:bg-primary-700 transition-colors shadow-sm"
                            >
                                <FiPlus /> Add {activeStaffTab.label}
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {assignedStaff.map((user) => (
                                        <tr key={user.id}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold mr-3">
                                                        {user.first_name?.[0]}{user.last_name?.[0]}
                                                    </div>
                                                    <div className="text-sm font-medium text-gray-900">{user.first_name} {user.last_name}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{activeStaffTab.label}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button onClick={() => handleRemoveStaff(user.id)} className="text-red-600 hover:text-red-900 bg-red-50 p-2 rounded-lg transition-colors">
                                                    <FiTrash2 />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {assignedStaff.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-8 text-center text-neutral-500 italic">No {activeStaffTab.label.toLowerCase()} assigned to this branch yet.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* PHARMACY TAB */}
                {activeTab === 'pharmacies' && (
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-semibold text-neutral-800">Linked Pharmacies ({assignedPharmacies.length})</h3>
                            <button
                                onClick={() => {
                                    fetchAvailablePharmacies();
                                    setIsPharmacyModalOpen(true);
                                }}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg flex items-center gap-2 hover:bg-green-700 transition-colors shadow-sm"
                            >
                                <FiPlus /> Link Pharmacy
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {assignedPharmacies.map(pharmacy => (
                                <div key={pharmacy.id} className="border border-neutral-200 rounded-xl p-5 hover:border-green-200 hover:shadow-md transition-all bg-white group relative">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="bg-green-50 p-2 rounded-lg">
                                            <Building2 className="w-5 h-5 text-green-600" />
                                        </div>
                                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${pharmacy.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                            {pharmacy.status}
                                        </span>
                                    </div>
                                    <h4 className="font-bold text-neutral-800 text-lg mb-1">{pharmacy.name}</h4>
                                    <p className="text-sm text-neutral-500 font-mono mb-4">{pharmacy.pharmacy_code}</p>

                                    <button
                                        onClick={() => handleUnlinkPharmacy(pharmacy.id)}
                                        className="w-full py-2 flex items-center justify-center gap-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg text-sm font-medium transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <FiTrash2 className="w-4 h-4" /> Unlink
                                    </button>
                                </div>
                            ))}
                            {assignedPharmacies.length === 0 && (
                                <div className="col-span-full flex flex-col items-center justify-center py-12 text-neutral-400 border-2 border-dashed border-neutral-200 rounded-xl">
                                    <Building2 className="w-12 h-12 mb-3 opacity-20" />
                                    <p>No pharmacies linked to this branch.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Simple Inline Modals (for speed, ideally use a reusable component) */}
            {isStaffModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col">
                        <div className="p-6 border-b flex justify-between items-center">
                            <h3 className="text-lg font-bold">Assign {activeStaffTab.label}</h3>
                            <button onClick={() => setIsStaffModalOpen(false)} className="text-gray-400 hover:text-gray-600">&times;</button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1">
                            {isFetchingAvailable ? (
                                <Spinner isLoading={true} />
                            ) : (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-neutral-700 mb-1">Select {activeStaffTab.label}</label>
                                        <select
                                            className="w-full border border-neutral-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                                            value={selectedStaffUserId}
                                            onChange={(e) => setSelectedStaffUserId(e.target.value)}
                                        >
                                            <option value="">Select...</option>
                                            {availableStaff.map((u) => (
                                                <option key={u.id} value={u.id}>
                                                    {u.first_name} {u.last_name} ({u.email})
                                                </option>
                                            ))}
                                        </select>
                                        {availableStaff.length === 0 && (
                                            <p className="text-sm text-neutral-500 mt-2">No available {activeStaffTab.label.toLowerCase()} found.</p>
                                        )}
                                    </div>

                                    <div className="flex justify-end gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setIsStaffModalOpen(false)}
                                            className="px-4 py-2 rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleAssignStaff(selectedStaffUserId)}
                                            disabled={!selectedStaffUserId}
                                            className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50"
                                        >
                                            Assign
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {isPharmacyModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col">
                        <div className="p-6 border-b flex justify-between items-center">
                            <h3 className="text-lg font-bold">Link Pharmacy</h3>
                            <button onClick={() => setIsPharmacyModalOpen(false)} className="text-gray-400 hover:text-gray-600">&times;</button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1">
                            {isFetchingAvailable ? <Spinner isLoading={true} /> : (
                                <ul className="space-y-2">
                                    {availablePharmacies.map(pharma => (
                                        <li key={pharma.id} className="flex justify-between items-center p-3 border rounded hover:bg-gray-50">
                                            <div>
                                                <p className="font-medium">{pharma.name}</p>
                                                <p className="text-xs text-gray-500">{pharma.pharmacy_code}</p>
                                            </div>
                                            <button
                                                onClick={() => handleAssignPharmacy(pharma.id)}
                                                className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                                            >
                                                Link
                                            </button>
                                        </li>
                                    ))}
                                    {availablePharmacies.length === 0 && <p className="text-center text-gray-500">No available pharmacies found.</p>}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BranchAssign;
