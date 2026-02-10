import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from "../../utils/api/axios";
import { Plus, Trash2, ArrowLeft, Users, Search } from 'lucide-react';

interface StaffAssignment {
  id: string;
  branch_id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  branch_name: string;
  role: string;
  is_primary_branch: boolean;
  assigned_date: string;
  end_date: string | null;
  is_active: boolean;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  branch_id?: number | string;
  branch_name?: string;
}

const BranchStaff: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [staffAssignments, setStaffAssignments] = useState<StaffAssignment[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [branchName, setBranchName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    user_id: '',
    role: 'staff',
    is_active: true
  });

  useEffect(() => {
    fetchBranchDetails();
    fetchStaffAssignments();
    fetchAllUsers();
  }, [id]);

  const fetchBranchDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.get(`/branches/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Branch response:', response.data);
      if (response.data.success && response.data.data?.branch) {
        setBranchName(response.data.data.branch.center_name || 'Branch');
      }
    } catch (err: any) {
      console.error('Error fetching branch details:', err);
      setBranchName('Branch');
    }
  };

  const fetchStaffAssignments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await api.get(`/branch-staff?branch_id=${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStaffAssignments(response.data.data?.staff || response.data.data || []);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load staff assignments');
      console.error('Error fetching staff:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const response = await api.get('api/get-all-users');
      const users = response.data.users || [];

      // Transform users to have consistent structure with branch info
      const transformedUsers = users.map((user: any) => ({
        id: user.id,
        name: `${user.first_name} ${user.last_name}`,
        email: user.email,
        role: user.user_type || user.role_as,
        branch_id: user.branch_id,
        branch_name: user.center_name || 'Not Assigned'
      }));

      setAllUsers(transformedUsers);
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setAllUsers([]);
    }
  };

  // Map user roles to backend-expected role values
  const mapRoleToBranchRole = (userRole: string): string => {
    const roleMap: { [key: string]: string } = {
      'Doctor': 'doctor',
      'Nurse': 'nurse',
      'Pharmacist': 'pharmacist',
      'Cashier': 'cashier',
      'Receptionist': 'receptionist',
      'IT Assistant': 'it_support',
      'Center Aid': 'center_aid',
      'Auditor': 'auditor',
      'Branch Admin': 'branch_admin',
    };
    return roleMap[userRole] || 'receptionist'; // Default to receptionist if role not found
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if user is already assigned to another branch
    const selectedUser = allUsers.find(u => u.id === formData.user_id);
    const isDoctor = selectedUser?.role === 'Doctor' || String(selectedUser?.role) === '3';
    if (!isDoctor && selectedUser?.branch_id && String(selectedUser.branch_id) !== String(id)) {
      const confirmMessage = `This user is currently assigned to ${selectedUser.branch_name}.\n\nAre you sure you want to reassign them to ${branchName}?`;
      if (!confirm(confirmMessage)) {
        return;
      }
    }

    try {
      const token = localStorage.getItem('token');
      const mappedRole = mapRoleToBranchRole(formData.role);
      const payload = {
        user_id: formData.user_id,
        branch_id: id,
        role: mappedRole,
        is_primary_branch: true,
        assigned_date: new Date().toISOString().split('T')[0], // Current date in YYYY-MM-DD format
        is_active: formData.is_active
      };

      await api.post('/branch-staff', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Show success message
      setSuccessMessage('Staff assigned successfully!');
      resetForm();
      fetchStaffAssignments();
      fetchAllUsers();

      // Auto-close modal after 1.5 seconds
      setTimeout(() => {
        setSuccessMessage(null);
        setShowModal(false);
      }, 1500);
    } catch (err: any) {
      const errorMessage = err.response?.data?.errors
        ? Object.values(err.response.data.errors).flat().join(', ')
        : err.response?.data?.message || 'Failed to assign staff';
      alert(errorMessage);
    }
  };

  const handleRemove = async (assignmentId: string) => {
    if (!confirm('Are you sure you want to remove this staff assignment?')) return;

    try {
      const token = localStorage.getItem('token');
      await api.delete(`/branch-staff/${assignmentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchStaffAssignments();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to remove staff assignment');
    }
  };

  const handleToggleStatus = async (assignment: StaffAssignment) => {
    try {
      const token = localStorage.getItem('token');
      await api.put(
        `/branch-staff/${assignment.id}`,
        { is_active: !assignment.is_active },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchStaffAssignments();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update staff status');
    }
  };

  const resetForm = () => {
    setFormData({
      user_id: '',
      role: 'staff',
      is_active: true
    });
    setSearchTerm('');
  };

  const filteredUsers = allUsers.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const assignedUserIds = staffAssignments.map((assignment) => assignment.user_id);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading staff assignments...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <button
                onClick={() => navigate(`/branch/${id}`)}
                className="p-3 bg-neutral-100 hover:bg-neutral-200 rounded-full transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-neutral-600" />
              </button>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-3 h-3 bg-primary-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-primary-500 uppercase tracking-wide">Staff Management</span>
                </div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-500 to-indigo-600 bg-clip-text text-transparent">
                  {branchName || 'Loading...'}
                </h1>
                <p className="text-neutral-500 mt-1">Manage and assign staff members to this branch</p>
              </div>
            </div>
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl font-medium"
            >
              <Plus className="w-5 h-5" />
              Assign Staff
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-error-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Staff Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {staffAssignments.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-16 h-16 mx-auto text-neutral-400 mb-4" />
              <h3 className="text-lg font-medium text-neutral-900 mb-2">No staff assigned yet</h3>
              <p className="text-neutral-600 mb-4">Assign staff members to this branch to get started</p>
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
              >
                <Plus className="w-5 h-5" />
                Assign Staff
              </button>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Staff Member
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    System Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Branch Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Assignment Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {staffAssignments.map((assignment) => (
                  <tr key={assignment.id} className="hover:bg-neutral-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-neutral-900">
                        {assignment.user_name || 'Unknown User'}
                      </div>
                      <div className="text-sm text-neutral-500">
                        {assignment.user_email || assignment.user_id}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 capitalize">
                        {assignment.role || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700 capitalize">
                      {assignment.role}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">
                      {new Date(assignment.assigned_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleStatus(assignment)}
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full cursor-pointer ${assignment.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-neutral-100 text-neutral-800'
                          }`}
                      >
                        {assignment.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleRemove(assignment.id)}
                        className="text-error-600 hover:text-red-900"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Summary Stats */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-neutral-600">Total Staff</div>
            <div className="text-2xl font-bold text-neutral-900">{staffAssignments.length}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-neutral-600">Active</div>
            <div className="text-2xl font-bold text-green-600">
              {staffAssignments.filter((s) => s.is_active).length}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-neutral-600">Inactive</div>
            <div className="text-2xl font-bold text-neutral-600">
              {staffAssignments.filter((s) => !s.is_active).length}
            </div>
          </div>
        </div>
      </div>

      {/* Assign Staff Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-neutral-900 mb-6">Assign Staff to Branch</h2>

              {/* Success Message */}
              {successMessage && (
                <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">{successMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Search Users */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Search Staff Member *
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search by name or email..."
                      className="w-full pl-10 pr-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* User Selection */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Select User *
                  </label>
                  <div className="border border-neutral-300 rounded-lg max-h-48 overflow-y-auto">
                    {filteredUsers.length === 0 ? (
                      <div className="p-4 text-center text-neutral-500">
                        {searchTerm
                          ? 'No users found matching your search'
                          : 'No users available'}
                      </div>
                    ) : (
                      filteredUsers.map((user) => {
                        const isAssigned = assignedUserIds.includes(user.id);
                        const hasOtherBranch = user.branch_id && user.branch_id !== parseInt(id || '0');

                        return (
                          <div
                            key={user.id}
                            onClick={() => setFormData({ ...formData, user_id: user.id, role: user.role })}
                            className={`p-3 cursor-pointer hover:bg-neutral-50 border-b border-gray-100 ${formData.user_id === user.id ? 'bg-blue-50' : ''
                              }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="font-medium text-neutral-900">{user.name}</div>
                                <div className="text-sm text-neutral-500">{user.email}</div>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-xs px-2 py-1 bg-neutral-100 rounded-full">
                                    {user.role}
                                  </span>
                                  {isAssigned && (
                                    <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
                                      Assigned to this branch
                                    </span>
                                  )}
                                  {hasOtherBranch && (
                                    <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">
                                      Assigned to {user.branch_name}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Branch Role */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Branch Role * <span className="text-xs text-neutral-500">(Auto-filled from user role)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.role}
                    readOnly
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg bg-neutral-50 text-neutral-700 cursor-not-allowed"
                    placeholder="Select a user to auto-fill role"
                  />
                </div>

                {/* Active Status */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 text-primary-500 border-neutral-300 rounded focus:ring-primary-500"
                  />
                  <label htmlFor="is_active" className="text-sm font-medium text-neutral-700">
                    Active Status
                  </label>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="px-4 py-2 border border-neutral-300 rounded-lg text-neutral-700 hover:bg-neutral-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!formData.user_id}
                    className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Assign Staff
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BranchStaff;
