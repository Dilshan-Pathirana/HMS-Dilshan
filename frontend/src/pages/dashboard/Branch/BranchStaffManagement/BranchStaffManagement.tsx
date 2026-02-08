import React, { useEffect, useState } from 'react';
import { Users, Building2, UserPlus, X } from 'lucide-react';
import api from '../../../../utils/api/axios';
import alert from '../../../../utils/alert';

interface Branch {
    id: string;
    center_name: string;
    division: string;
}

interface StaffMember {
    id: string;
    username: string;
    email: string;
    role_as: number;
    first_name?: string;
    last_name?: string;
}

const BranchStaffManagement: React.FC = () => {
    const [branches, setBranches] = useState<Branch[]>([]);
    const [selectedBranch, setSelectedBranch] = useState<string>('');
    const [branchStaff, setBranchStaff] = useState<StaffMember[]>([]);
    const [availableUsers, setAvailableUsers] = useState<StaffMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [assignModalOpen, setAssignModalOpen] = useState(false);

    useEffect(() => {
        fetchBranches();
    }, []);

    useEffect(() => {
        if (selectedBranch) {
            fetchBranchStaff(selectedBranch);
        }
    }, [selectedBranch]);

    const fetchBranches = async () => {
        try {
            const response = await api.get('/branches');
            if (response.data) {
                setBranches(Array.isArray(response.data) ? response.data : response.data.data || []);
            }
        } catch (error) {
            console.error('Error fetching branches:', error);
            alert.error('Failed to fetch branches');
        } finally {
            setLoading(false);
        }
    };

    const fetchBranchStaff = async (branchId: string) => {
        try {
            const response = await api.get(`/branches/${branchId}/staff`);
            setBranchStaff(response.data || []);
        } catch (error) {
            console.error('Error fetching branch staff:', error);
            alert.error('Failed to fetch branch staff list');
        }
    };

    const fetchAvailableUsers = async () => {
        try {
            const response = await api.get('/users');
            setAvailableUsers(response.data?.data || response.data || []);
            setAssignModalOpen(true);
        } catch (error) {
            console.error('Error fetching users:', error);
            alert.error('Failed to fetch available users');
        }
    };

    const assignStaff = async (userId: string, role: string) => {
        if (!selectedBranch) return;

        try {
            await api.post(`/branches/${selectedBranch}/assign-staff`, {
                user_id: userId,
                role: role
            });
            alert.success('Staff member assigned successfully');
            fetchBranchStaff(selectedBranch);
            setAssignModalOpen(false);
        } catch (error: any) {
            console.error('Error assigning staff:', error);
            alert.error(error.response?.data?.detail || 'Failed to assign staff member');
        }
    };

    const removeStaff = async (userId: string) => {
        if (!selectedBranch) return;

        try {
            await api.delete(`/branches/${selectedBranch}/staff/${userId}`);
            alert.success('Staff member removed successfully');
            fetchBranchStaff(selectedBranch);
        } catch (error: any) {
            console.error('Error removing staff:', error);
            alert.error(error.response?.data?.detail || 'Failed to remove staff member');
        }
    };

    const getRoleName = (roleId: number) => {
        const roles: { [key: number]: string } = {
            1: 'Super Admin',
            2: 'Branch Admin',
            3: 'Doctor',
            4: 'Nurse',
            5: 'Patient',
            6: 'Cashier',
            7: 'Pharmacist',
            8: 'IT Support',
            9: 'Center Aid',
            10: 'Auditor',
        };
        return roles[roleId] || 'Unknown';
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Branch Staff Management</h1>
                <p className="text-gray-600">Assign and manage staff members for each branch</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Branch Selection */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Building2 className="w-5 h-5 text-primary-500" />
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900">Select Branch</h2>
                    </div>

                    {loading ? (
                        <div className="space-y-2">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {branches.map(branch => (
                                <button
                                    key={branch.id}
                                    onClick={() => setSelectedBranch(branch.id)}
                                    className={`w-full text-left p-4 rounded-lg border-2 transition-all $  {
                                        selectedBranch === branch.id
                                            ? 'border-primary-500 bg-blue-50'
                                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                    }`}
                                >
                                    <p className="font-semibold text-gray-900">{branch.center_name}</p>
                                    <p className="text-sm text-gray-500">{branch.division || 'No division'}</p>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Staff List */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-teal-100 rounded-lg">
                                <Users className="w-5 h-5 text-teal-600" />
                            </div>
                            <h2 className="text-xl font-semibold text-gray-900">Assigned Staff</h2>
                        </div>
                        {selectedBranch && (
                            <button
                                onClick={fetchAvailableUsers}
                                className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                <UserPlus className="w-4 h-4" />
                                Assign Staff
                            </button>
                        )}
                    </div>

                    {!selectedBranch ? (
                        <div className="text-center py-12">
                            <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500">Select a branch to view assigned staff</p>
                        </div>
                    ) : branchStaff.length === 0 ? (
                        <div className="text-center py-12">
                            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500">No staff assigned to this branch yet</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {branchStaff.map(staff => (
                                <div
                                    key={staff.id}
                                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-primary-500 rounded-full flex items-center justify-center text-white font-bold">
                                            {(staff.first_name?.[0] || staff.username[0]).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900">
                                                {staff.first_name && staff.last_name
                                                    ? `${staff.first_name} ${staff.last_name}`
                                                    : staff.username}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-sm text-gray-600">{staff.email}</span>
                                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                                                    {getRoleName(staff.role_as)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => removeStaff(staff.id)}
                                        className="p-2 text-error-500 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Remove staff"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Assign Staff Modal */}
            {assignModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-semibold text-gray-900">Assign Staff Member</h3>
                            <button
                                onClick={() => setAssignModalOpen(false)}
                                className="p-2 hover:bg-gray-100 rounded-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-2">
                            {availableUsers.filter(user => !branchStaff.find(s => s.id === user.id)).map(user => (
                                <div
                                    key={user.id}
                                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                                            {(user.first_name?.[0] || user.username[0]).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900">
                                                {user.first_name && user.last_name
                                                    ? `${user.first_name} ${user.last_name}`
                                                    : user.username}
                                            </p>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm text-gray-600">{user.email}</span>
                                                <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
                                                    {getRoleName(user.role_as)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => assignStaff(user.id, getRoleName(user.role_as).toLowerCase().replace(' ', '_'))}
                                        className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        Assign
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BranchStaffManagement;
