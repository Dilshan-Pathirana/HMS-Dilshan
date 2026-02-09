import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiArrowLeft, FiSave, FiUser, FiCheckCircle, FiSearch } from "react-icons/fi";
import Spinner from "../../../assets/Common/Spinner.tsx";
import api from "../../../utils/api/axios";
import { IBranchData } from "../../../utils/types/Branch/IBranchData.ts";
import { centerTypes, ownerTypes } from "../../../utils/api/branch/BranchesData.ts";
import alert from "../../../utils/alert.ts";
import { IUserData } from "../../../utils/types/users/Iuser.ts";

const BranchManage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [branch, setBranch] = useState<IBranchData | null>(null);

    // Admin Assignment State
    const [availableAdmins, setAvailableAdmins] = useState<IUserData[]>([]);
    const [selectedAdminId, setSelectedAdminId] = useState<string>("");
    const [currentAdmin, setCurrentAdmin] = useState<IUserData | null>(null);
    const [searchAdmin, setSearchAdmin] = useState("");

    // Form Data
    const [formData, setFormData] = useState<Partial<IBranchData>>({});

    useEffect(() => {
        fetchBranchData();
        fetchAvailableAdmins();
    }, [id]);

    const fetchBranchData = async () => {
        if (!id || id === 'assign' || id.length < 30) {
            return;
        }
        try {
            setIsLoading(true);
            const bData = await api.get<IBranchData>(`/branches/${id}/details`);
            if (!bData) return;
            setBranch(bData);
            setFormData(bData);
            if ((bData as any).branch_admin) {
                setCurrentAdmin((bData as any).branch_admin);
                setSelectedAdminId((bData as any).branch_admin.id);
            }
        } catch (error: any) {
            console.error("Failed to fetch branch", error);
            if (error.response && error.response.status === 401) {
                alert.error("Session expired.");
            } else {
                alert.error("Failed to load branch details");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const fetchAvailableAdmins = async () => {
        try {
            const data = await api.get<IUserData[]>("/users/available-branch-admins");
            setAvailableAdmins(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Failed to fetch available admins", error);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleUpdateBranch = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            // 1. Update Metadata using existing PUT logic (multipart optional but using JSON for simplicity if no file changed,
            // but backend expects form-data. Let's use FormData object similar to EditModal)
            const form = new FormData();
            // Populate fields
            if (formData.center_name) form.append("center_name", formData.center_name);
            if (formData.register_number) form.append("register_number", formData.register_number);
            if (formData.center_type) form.append("center_type", formData.center_type);
            if (formData.division) form.append("division", formData.division);
            if (formData.division_number) form.append("division_number", formData.division_number);
            if (formData.owner_type) form.append("owner_type", formData.owner_type);
            if (formData.owner_full_name) form.append("owner_full_name", formData.owner_full_name);
            if (formData.owner_id_number) form.append("owner_id_number", formData.owner_id_number);
            if (formData.owner_contact_number) form.append("owner_contact_number", formData.owner_contact_number);

            // Note: File upload skipped for this simplified view, assume EditModal handles complex docs or add here if critical

            await api.put(`/branches/${id}`, form, {
                headers: { "Content-Type": "multipart/form-data" }
            });

            // 2. Assign/Update Admin if changed and a valid admin is selected
            const adminId = (selectedAdminId || "").trim();
            if (adminId && (!currentAdmin || adminId !== currentAdmin.id)) {
                const adminForm = new FormData();
                adminForm.append("admin_id", adminId);
                await api.put(`/branches/${id}/assign-admin`, adminForm, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
            }

            alert.success("Branch updated successfully");
            fetchBranchData(); // Refresh
            fetchAvailableAdmins();
        } catch (error: any) {
            console.error("Update failed", error);
            alert.error(error.response?.data?.detail || "Update failed");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <Spinner isLoading={true} />;
    if (!branch) return <div>Branch not found</div>;

    const adminSearch = (searchAdmin || "").toLowerCase();
    const safeAdmins = Array.isArray(availableAdmins) ? availableAdmins : [];
    const filteredAdmins = safeAdmins.filter(admin => {
        const first = (admin?.first_name || "").toLowerCase();
        const email = (admin?.email || "").toLowerCase();
        return first.includes(adminSearch) || email.includes(adminSearch);
    });

    return (
        <div className="p-8 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
                >
                    <FiArrowLeft className="w-6 h-6 text-neutral-600" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-neutral-800">Manage Branch</h1>
                    <p className="text-neutral-500">Update details and assign administration</p>
                </div>
            </div>

            <form onSubmit={handleUpdateBranch} className="space-y-8">

                {/* Branch Details Section */}
                <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
                    <h3 className="text-lg font-semibold border-b border-neutral-100 pb-4 mb-6 text-neutral-800">Branch Information</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-neutral-700">Center Name</label>
                            <input
                                name="center_name"
                                value={formData.center_name || ""}
                                onChange={handleChange}
                                className="w-full p-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-neutral-700">Register Number</label>
                            <input
                                name="register_number"
                                value={formData.register_number || ""}
                                onChange={handleChange}
                                className="w-full p-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-neutral-700">Center Type</label>
                            <select
                                name="center_type"
                                value={formData.center_type || ""}
                                onChange={handleChange}
                                className="w-full p-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                            >
                                <option value="">Select Type</option>
                                {centerTypes.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-neutral-700">Division</label>
                            <input
                                name="division"
                                value={formData.division || ""}
                                onChange={handleChange}
                                className="w-full p-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-neutral-700">Owner Name</label>
                            <input
                                name="owner_full_name"
                                value={formData.owner_full_name || ""}
                                onChange={handleChange}
                                className="w-full p-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-neutral-700">Contact Number</label>
                            <input
                                name="owner_contact_number"
                                value={formData.owner_contact_number || ""}
                                onChange={handleChange}
                                className="w-full p-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Branch Admin Section */}
                <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
                    <h3 className="text-lg font-semibold border-b border-neutral-100 pb-4 mb-6 text-neutral-800 flex items-center gap-2">
                        <FiUser className="text-primary-600" /> Branch Administrator
                    </h3>

                    {currentAdmin ? (
                        <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg flex justify-between items-center mb-6">
                            <div>
                                <p className="text-sm text-blue-600 font-bold uppercase tracking-wider mb-1">Current Admin</p>
                                <p className="font-semibold text-neutral-800 text-lg">{currentAdmin.first_name} {currentAdmin.last_name}</p>
                                <p className="text-neutral-500 text-sm">{currentAdmin.email}</p>
                            </div>
                            <div className="text-green-600 bg-green-100 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                <FiCheckCircle /> Active
                            </div>
                        </div>
                    ) : (
                        <div className="bg-yellow-50 border border-yellow-100 p-4 rounded-lg mb-6 text-yellow-800">
                            No Branch Admin assigned. Please select one below.
                        </div>
                    )}

                    <div className="space-y-4">
                        <label className="text-sm font-medium text-neutral-700 block">Change / Assign Admin</label>

                        {/* Search Box for Admins */}
                        <div className="relative">
                            <FiSearch className="absolute left-3 top-3 text-neutral-400" />
                            <input
                                type="text"
                                placeholder="Search available admins..."
                                className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                value={searchAdmin}
                                onChange={(e) => setSearchAdmin(e.target.value)}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-60 overflow-y-auto pt-2">
                            {/* Option to keep current */}
                            {currentAdmin && (
                                <div
                                    onClick={() => setSelectedAdminId(currentAdmin.id)}
                                    className={`p-3 rounded-lg border cursor-pointer transition-all ${selectedAdminId === currentAdmin.id ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-500' : 'border-neutral-200 hover:border-neutral-300'}`}
                                >
                                    <p className="font-medium text-sm">{currentAdmin.first_name} {currentAdmin.last_name} (Current)</p>
                                    <p className="text-xs text-neutral-500 truncate">{currentAdmin.email}</p>
                                </div>
                            )}

                            {filteredAdmins.map(admin => (
                                <div
                                    key={admin.id}
                                    onClick={() => setSelectedAdminId(admin.id)}
                                    className={`p-3 rounded-lg border cursor-pointer transition-all ${selectedAdminId === admin.id ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-500' : 'border-neutral-200 hover:border-neutral-300'}`}
                                >
                                    <p className="font-medium text-sm">{admin.first_name} {admin.last_name}</p>
                                    <p className="text-xs text-neutral-500 truncate">{admin.email}</p>
                                </div>
                            ))}

                            {filteredAdmins.length === 0 && !currentAdmin && (
                                <div className="col-span-full text-center py-4 text-neutral-500 italic">
                                    No available branch admins found. Create one in User Management first.
                                </div>
                            )}
                        </div>
                        {selectedAdminId && selectedAdminId !== currentAdmin?.id && (
                            <p className="text-sm text-primary-600 mt-2 font-medium">
                                Selected new admin will be assigned on save.
                            </p>
                        )}
                    </div>
                </div>

                {/* Footer Save Actions */}
                <div className="flex justify-end pt-4 pb-12">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="px-6 py-2.5 mr-4 text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-lg font-medium transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isSaving}
                        className="px-8 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium shadow-lg shadow-primary-500/30 flex items-center gap-2 transition-all disabled:opacity-70"
                    >
                        {isSaving ? <Spinner isLoading={true} /> : <FiSave />}
                        Save Changes
                    </button>
                </div>

            </form>
        </div>
    );
};

export default BranchManage;
