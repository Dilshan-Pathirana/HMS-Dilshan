
import React, { useEffect, useState } from "react";
import BranchCardList from "../components/BranchCardList.tsx";
import { getAllBranches } from "../../../../utils/api/branch/GetAllBranches.ts";
import { IBranchData } from "../../../../utils/types/Branch/IBranchData.ts";
import Spinner from "../../../../assets/Common/Spinner.tsx";
import { UserPlus, Search } from "lucide-react";
import api from "../../../../utils/api/axios";
import { toast } from "react-toastify";

// Minimal Modal for assigning staff
interface AssignStaffModalProps {
    isOpen: boolean;
    onClose: () => void;
    branch: IBranchData | null;
}

const AssignStaffModal: React.FC<AssignStaffModalProps> = ({ isOpen, onClose, branch }) => {
    const [users, setUsers] = useState<any[]>([]);
    const [selectedUser, setSelectedUser] = useState("");
    const [role, setRole] = useState("5"); // Default to Doctor or similar?
    // User requested "Select Position" and "User"
    // We should probably list users who can be assigned.
    // For simplicity, let's load all users and filter? Or just Search?
    // Let's assume we want to assign an EXISTING user to this branch.

    // Better approach:
    // 1. Select Position (Role) - Branch Admin, Pharmacist, Doctor, etc.
    // 2. Select User (List of users with that role)

    // BUT the user object has the branch_id. So we are basically updating the user's branch_id.

    const [loadingUsers, setLoadingUsers] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchUsersByRole();
        }
    }, [isOpen, role]);

    const fetchUsersByRole = async () => {
        setLoadingUsers(true);
        try {
            // Need a way to get users by role if possible, or get all and filter
            // Using existing read_users?
            const data = await api.get('/users/');
            const allUsers = Array.isArray(data) ? data : [];
            // Filter by role
            const filtered = allUsers.filter((u: any) => u.role_as === parseInt(role));
            setUsers(filtered);
        } catch (error) {
            console.error("Failed to fetch users", error);
        } finally {
            setLoadingUsers(false);
        }
    };

    const handleAssign = async () => {
        if (!selectedUser || !branch) return;

        // Validation for Branch Admin (if role is Branch Admin)
        if (role === "2") { // Assuming 2 is Branch Admin
            // Check if branch already has an admin?
            // This check should ideally be server side or we check existing staff of branch
            // For now, let's proceed with assignment
        }

        try {
            await api.put(`/users/${selectedUser}`, { branch_id: branch.id });
            toast.success("User assigned to branch successfully");
            onClose();
        } catch (error) {
            toast.error("Failed to assign user");
        }
    };

    if (!isOpen || !branch) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
            <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md border border-neutral-100">
                <h2 className="text-xl font-bold mb-1 text-neutral-800">Assign Staff</h2>
                <p className="text-sm text-neutral-500 mb-6">Assign a new staff member to <span className="font-semibold text-primary-600">{branch.center_name}</span></p>

                <div className="mb-4 space-y-1">
                    <label className="block text-sm font-medium text-neutral-700">Position</label>
                    <select
                        className="w-full border border-neutral-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                    >
                        {/* Manual mapping based on UserRolesMapper or similar */}
                        <option value="2">Branch Admin</option>
                        <option value="5">Doctor</option>
                        <option value="3">Pharmacist</option>
                        <option value="4">Nurse</option>
                        {/* Add others as needed */}
                    </select>
                </div>

                <div className="mb-6 space-y-1">
                    <label className="block text-sm font-medium text-neutral-700">User</label>
                    {loadingUsers ? <Spinner isLoading={true} /> : (
                        <select
                            className="w-full border border-neutral-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                            value={selectedUser}
                            onChange={(e) => setSelectedUser(e.target.value)}
                        >
                            <option value="">Select User...</option>
                            {users.map(u => (
                                <option key={u.id} value={u.id}>
                                    {u.first_name} {u.last_name} ({u.email})
                                </option>
                            ))}
                        </select>
                    )}
                </div>

                <div className="flex justify-end gap-3 pt-2">
                    <button onClick={onClose} className="px-4 py-2 text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors font-medium">Cancel</button>
                    <button
                        onClick={handleAssign}
                        disabled={!selectedUser}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm font-medium"
                    >
                        Assign Staff
                    </button>
                </div>
            </div>
        </div>
    );
};


const BranchAssignStaff = () => {
    const [branches, setBranches] = useState<IBranchData[]>([]);
    const [filteredBranches, setFilteredBranches] = useState<IBranchData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedBranch, setSelectedBranch] = useState<IBranchData | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const fetchBranches = async () => {
            try {
                const data = await getAllBranches();
                setBranches(data || []);
                setFilteredBranches(data || []);
            } catch (error) {
                console.error("Failed to fetch branches", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchBranches();
    }, []);

    useEffect(() => {
        const results = branches.filter(branch =>
            branch.center_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            branch.register_number.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredBranches(results);
    }, [searchTerm, branches]);

    const handleBranchClick = (branch: IBranchData) => {
        setSelectedBranch(branch);
        setIsModalOpen(true);
    };

    if (isLoading) return <Spinner isLoading={true} />;

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-neutral-800 tracking-tight">Assign Staff</h1>
                    <p className="text-neutral-500 mt-1">Deploy personnel to specific branches</p>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input
                        type="text"
                        placeholder="Search branches..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none w-full md:w-64 transition-all"
                    />
                </div>
            </div>

            <BranchCardList
                branches={filteredBranches}
                onViewDetails={() => {}}
                onManageBranch={() => {}}
                onAssignStaff={handleBranchClick}
            />
            <AssignStaffModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                branch={selectedBranch}
            />
        </div>
    );
};

export default BranchAssignStaff;
