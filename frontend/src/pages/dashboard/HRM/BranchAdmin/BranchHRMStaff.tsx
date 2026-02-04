import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Users, ArrowLeft, Search, Eye, Edit, Mail, Phone, Loader2, RefreshCw, User, AlertCircle,
    Download, DollarSign, Calendar, Building2, Briefcase, Clock, CheckCircle,
    X, Save, UserCog, BadgeCheck, Heart, GraduationCap
} from 'lucide-react';
import api from "../../../../utils/api/axios";
import { toast } from 'react-toastify';

interface StaffMember {
    id: number;
    name: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    role: string;
    roleId: number;
    department: string;
    designation: string;
    branch: string;
    status: string;
    joiningDate: string;
    basic_salary: number;
    employment_status: string;
    employment_type: string;
    employee_id: string;
    epf_number: string;
    epf_applicable: boolean;
    contract_end_date: string;
    confirmation_date: string;
    emergency_contact_name: string;
    emergency_contact_phone: string;
    emergency_contact_relationship: string;
    qualifications: string;
    certifications: string;
    weekly_hours: number;
    shift_eligible: boolean;
    nic: string;
    date_of_birth: string;
    gender: string;
    address: string;
}

interface StaffStats {
    total: number;
    active: number;
    onLeave: number;
    byRole: Record<string, number>;
    byDepartment: Record<string, number>;
}

const BranchHRMStaff: React.FC = () => {
    const navigate = useNavigate();
    const [staffList, setStaffList] = useState<StaffMember[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [employmentTypeFilter, setEmploymentTypeFilter] = useState('');
    const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingStaff, setEditingStaff] = useState<Partial<StaffMember>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [stats, setStats] = useState<StaffStats | null>(null);
    const [activeTab, setActiveTab] = useState<'personal' | 'employment' | 'emergency' | 'qualifications'>('personal');
    const [pagination, setPagination] = useState({ total: 0, perPage: 20, currentPage: 1, lastPage: 1 });

    const roles = [
        { value: '3', label: 'Doctor' },
        { value: '5', label: 'Nurse' },
        { value: '4', label: 'Pharmacist' },
        { value: '7', label: 'Cashier' },
        { value: '9', label: 'IT Support' },
        { value: '10', label: 'Center Aid' },
        { value: '11', label: 'Auditor' }
    ];

    const departments = [
        'General Medicine', 'Emergency', 'Pediatrics', 'Cardiology', 'Neurology',
        'Orthopedics', 'Pharmacy', 'Laboratory', 'Radiology', 'Administration'
    ];

    const employmentTypes = [
        { value: 'full_time', label: 'Full Time' },
        { value: 'part_time', label: 'Part Time' },
        { value: 'contract', label: 'Contract' },
        { value: 'probation', label: 'Probation' },
        { value: 'intern', label: 'Intern' }
    ];

    useEffect(() => {
        fetchStaff();
    }, [roleFilter, statusFilter, employmentTypeFilter, pagination.currentPage]);

    const fetchStaff = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('authToken');
            const params: Record<string, string | number> = {
                page: pagination.currentPage
            };
            if (roleFilter) params.role = roleFilter;
            if (statusFilter) params.status = statusFilter;
            if (employmentTypeFilter) params.employment_type = employmentTypeFilter;
            if (searchTerm) params.search = searchTerm;
            
            const response = await api.get('/hrm/branch-admin/staff', {
                headers: { Authorization: `Bearer ${token}` },
                params
            });
            
            if (response.data.status === 200) {
                setStaffList(response.data.staff || []);
                if (response.data.pagination) {
                    setPagination(response.data.pagination);
                }
                if (response.data.stats) {
                    setStats(response.data.stats);
                }
            } else {
                setError(response.data.message || 'Failed to fetch staff');
            }
        } catch (err: any) {
            console.error('Error fetching staff:', err);
            setError(err.response?.data?.message || 'Failed to fetch staff data');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = () => {
        setPagination(prev => ({ ...prev, currentPage: 1 }));
        fetchStaff();
    };

    const handleViewProfile = async (staff: StaffMember) => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await api.get(`/hrm/branch-admin/staff/${staff.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (response.data.status === 200) {
                setSelectedStaff(response.data.staff);
            } else {
                setSelectedStaff(staff);
            }
        } catch (err) {
            setSelectedStaff(staff);
        }
        setShowProfileModal(true);
        setActiveTab('personal');
    };

    const handleEditProfile = (staff: StaffMember) => {
        setEditingStaff({
            id: staff.id,
            department: staff.department || '',
            designation: staff.designation || '',
            basic_salary: staff.basic_salary || 0,
            employment_type: staff.employment_type || 'full_time',
            employment_status: staff.employment_status || 'active',
            epf_number: staff.epf_number || '',
            epf_applicable: staff.epf_applicable ?? true,
            weekly_hours: staff.weekly_hours || 40,
            shift_eligible: staff.shift_eligible ?? true,
            emergency_contact_name: staff.emergency_contact_name || '',
            emergency_contact_phone: staff.emergency_contact_phone || '',
            emergency_contact_relationship: staff.emergency_contact_relationship || '',
            qualifications: staff.qualifications || '',
            certifications: staff.certifications || ''
        });
        setShowEditModal(true);
    };

    const handleSaveProfile = async () => {
        if (!editingStaff.id) return;
        
        setIsSaving(true);
        try {
            const token = localStorage.getItem('authToken');
            const response = await api.put(`/hrm/branch-admin/staff/${editingStaff.id}`, editingStaff, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (response.data.status === 200) {
                toast.success('Staff profile updated successfully');
                setShowEditModal(false);
                fetchStaff();
            } else {
                toast.error(response.data.message || 'Failed to update profile');
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to update staff profile');
        } finally {
            setIsSaving(false);
        }
    };

    const handleExport = async () => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await api.get('/hrm/branch-admin/staff/export', {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob'
            });
            
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `staff_hr_profiles_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success('Export downloaded successfully');
        } catch (err) {
            toast.error('Failed to export staff data');
        }
    };

    const filteredStaff = staffList.filter(staff => {
        const matchesSearch = !searchTerm || 
            staff.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            staff.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            staff.employee_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            staff.department?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
    });

    const formatRole = (role: string) => {
        if (!role) return 'N/A';
        return role.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' }).format(amount || 0);
    };

    const getStatusBadge = (status: string) => {
        const statusClasses: Record<string, string> = {
            'active': 'bg-emerald-100 text-emerald-700',
            'Active': 'bg-emerald-100 text-emerald-700',
            'on_leave': 'bg-orange-100 text-orange-700',
            'on-leave': 'bg-orange-100 text-orange-700',
            'inactive': 'bg-gray-100 text-gray-700',
            'Inactive': 'bg-gray-100 text-gray-700',
            'suspended': 'bg-red-100 text-red-700',
            'probation': 'bg-blue-100 text-blue-700'
        };
        return statusClasses[status] || 'bg-gray-100 text-gray-700';
    };

    const getEmploymentTypeBadge = (type: string) => {
        const typeClasses: Record<string, string> = {
            'full_time': 'bg-green-100 text-green-700',
            'part_time': 'bg-yellow-100 text-yellow-700',
            'contract': 'bg-purple-100 text-purple-700',
            'probation': 'bg-blue-100 text-blue-700',
            'intern': 'bg-pink-100 text-pink-700'
        };
        return typeClasses[type] || 'bg-gray-100 text-gray-700';
    };

    const getInitials = (name: string) => {
        if (!name) return 'NA';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/branch-admin/hrm')}
                            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">Staff HR Profiles</h1>
                            <p className="text-gray-500">Manage HR profiles and employment details ({pagination.total} staff members)</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={handleExport}
                            className="flex items-center gap-2 px-4 py-2 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <Download className="w-4 h-4" />
                            Export
                        </button>
                        <button 
                            onClick={() => {
                                setPagination(prev => ({ ...prev, currentPage: 1 }));
                                fetchStaff();
                            }}
                            className="flex items-center gap-2 px-4 py-2 text-emerald-600 border border-emerald-200 rounded-lg hover:bg-emerald-50 transition-colors"
                        >
                            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-blue-100 rounded-lg">
                                    <Users className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
                                    <p className="text-sm text-gray-500">Total Staff</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-emerald-100 rounded-lg">
                                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-gray-800">{stats.active}</p>
                                    <p className="text-sm text-gray-500">Active</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-orange-100 rounded-lg">
                                    <Calendar className="w-5 h-5 text-orange-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-gray-800">{stats.onLeave}</p>
                                    <p className="text-sm text-gray-500">On Leave</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-purple-100 rounded-lg">
                                    <Building2 className="w-5 h-5 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-gray-800">
                                        {Object.keys(stats.byDepartment || {}).length}
                                    </p>
                                    <p className="text-sm text-gray-500">Departments</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Search & Filters */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex-1 min-w-[300px]">
                            <div className="relative">
                                <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search by name, email, employee ID, or department..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                />
                            </div>
                        </div>
                        <select 
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                        >
                            <option value="">All Roles</option>
                            {roles.map(role => (
                                <option key={role.value} value={role.value}>{role.label}</option>
                            ))}
                        </select>
                        <select 
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                            value={employmentTypeFilter}
                            onChange={(e) => setEmploymentTypeFilter(e.target.value)}
                        >
                            <option value="">All Employment Types</option>
                            {employmentTypes.map(type => (
                                <option key={type.value} value={type.value}>{type.label}</option>
                            ))}
                        </select>
                        <select 
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="">All Status</option>
                            <option value="active">Active</option>
                            <option value="on_leave">On Leave</option>
                            <option value="inactive">Inactive</option>
                        </select>
                        <button
                            onClick={handleSearch}
                            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                        >
                            Search
                        </button>
                    </div>
                </div>

                {/* Error State */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-red-500" />
                        <span className="text-red-700">{error}</span>
                    </div>
                )}

                {/* Loading State */}
                {isLoading ? (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                        <span className="ml-3 text-gray-600">Loading staff...</span>
                    </div>
                ) : (
                    /* Staff List */
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Employee</th>
                                        <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Role</th>
                                        <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Department</th>
                                        <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Employment</th>
                                        <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Join Date</th>
                                        <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Status</th>
                                        <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredStaff.length > 0 ? (
                                        filteredStaff.map((staff) => (
                                            <tr key={staff.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                                <td className="py-4 px-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                                                            {getInitials(staff.name)}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-gray-800">{staff.name}</p>
                                                            <p className="text-sm text-gray-500">{staff.email}</p>
                                                            {staff.employee_id && (
                                                                <p className="text-xs text-gray-400">ID: {staff.employee_id}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6 text-gray-600">{formatRole(staff.role)}</td>
                                                <td className="py-4 px-6">
                                                    <div>
                                                        <p className="text-gray-600">{staff.department || 'Not Assigned'}</p>
                                                        {staff.designation && (
                                                            <p className="text-xs text-gray-400">{staff.designation}</p>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6">
                                                    {staff.employment_type && (
                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEmploymentTypeBadge(staff.employment_type)}`}>
                                                            {staff.employment_type?.replace('_', ' ').charAt(0).toUpperCase() + staff.employment_type?.replace('_', ' ').slice(1)}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-4 px-6 text-gray-600">{staff.joiningDate || 'N/A'}</td>
                                                <td className="py-4 px-6">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(staff.status)}`}>
                                                        {staff.status || 'Unknown'}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <div className="flex items-center gap-2">
                                                        <button 
                                                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                            onClick={() => handleViewProfile(staff)}
                                                            title="View Profile"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </button>
                                                        <button 
                                                            className="p-2 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                                            onClick={() => handleEditProfile(staff)}
                                                            title="Edit HR Profile"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={7} className="py-12 text-center">
                                                <User className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                                                <p className="text-gray-500">No staff members found</p>
                                                <p className="text-sm text-gray-400 mt-1">Try adjusting your search or filters</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {pagination.lastPage > 1 && (
                            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                                <p className="text-sm text-gray-600">
                                    Showing page {pagination.currentPage} of {pagination.lastPage} ({pagination.total} total)
                                </p>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
                                        disabled={pagination.currentPage === 1}
                                        className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                                    >
                                        Previous
                                    </button>
                                    <button
                                        onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
                                        disabled={pagination.currentPage === pagination.lastPage}
                                        className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* View Profile Modal */}
            {showProfileModal && selectedStaff && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                        {/* Modal Header */}
                        <div className="bg-gradient-to-r from-emerald-500 to-blue-500 p-6 text-white">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-2xl font-bold">
                                        {getInitials(selectedStaff.name)}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold">{selectedStaff.name}</h3>
                                        <p className="opacity-90">{formatRole(selectedStaff.role)}</p>
                                        {selectedStaff.employee_id && (
                                            <p className="text-sm opacity-75">ID: {selectedStaff.employee_id}</p>
                                        )}
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setShowProfileModal(false)}
                                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="border-b border-gray-200 px-6">
                            <nav className="flex gap-6 -mb-px">
                                {[
                                    { id: 'personal', label: 'Personal', icon: User },
                                    { id: 'employment', label: 'Employment', icon: Briefcase },
                                    { id: 'emergency', label: 'Emergency', icon: Heart },
                                    { id: 'qualifications', label: 'Qualifications', icon: GraduationCap }
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id as typeof activeTab)}
                                        className={`flex items-center gap-2 py-3 px-1 border-b-2 text-sm font-medium transition-colors ${
                                            activeTab === tab.id
                                                ? 'border-emerald-500 text-emerald-600'
                                                : 'border-transparent text-gray-500 hover:text-gray-700'
                                        }`}
                                    >
                                        <tab.icon className="w-4 h-4" />
                                        {tab.label}
                                    </button>
                                ))}
                            </nav>
                        </div>

                        {/* Tab Content */}
                        <div className="p-6 overflow-y-auto flex-1">
                            {activeTab === 'personal' && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-500">Email</p>
                                        <p className="font-medium flex items-center gap-2">
                                            <Mail className="w-4 h-4 text-gray-400" />
                                            {selectedStaff.email}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Phone</p>
                                        <p className="font-medium flex items-center gap-2">
                                            <Phone className="w-4 h-4 text-gray-400" />
                                            {selectedStaff.phone || 'N/A'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">NIC</p>
                                        <p className="font-medium">{selectedStaff.nic || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Date of Birth</p>
                                        <p className="font-medium">{selectedStaff.date_of_birth || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Gender</p>
                                        <p className="font-medium capitalize">{selectedStaff.gender || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Status</p>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(selectedStaff.status)}`}>
                                            {selectedStaff.status || 'Unknown'}
                                        </span>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-sm text-gray-500">Address</p>
                                        <p className="font-medium">{selectedStaff.address || 'N/A'}</p>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'employment' && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-500">Department</p>
                                        <p className="font-medium flex items-center gap-2">
                                            <Building2 className="w-4 h-4 text-gray-400" />
                                            {selectedStaff.department || 'Not Assigned'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Designation</p>
                                        <p className="font-medium">{selectedStaff.designation || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Employment Type</p>
                                        {selectedStaff.employment_type && (
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEmploymentTypeBadge(selectedStaff.employment_type)}`}>
                                                {selectedStaff.employment_type?.replace('_', ' ').toUpperCase()}
                                            </span>
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Join Date</p>
                                        <p className="font-medium flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-gray-400" />
                                            {selectedStaff.joiningDate || 'N/A'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Basic Salary</p>
                                        <p className="font-medium flex items-center gap-2">
                                            <DollarSign className="w-4 h-4 text-gray-400" />
                                            {formatCurrency(selectedStaff.basic_salary)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Weekly Hours</p>
                                        <p className="font-medium flex items-center gap-2">
                                            <Clock className="w-4 h-4 text-gray-400" />
                                            {selectedStaff.weekly_hours || 40} hours
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">EPF Number</p>
                                        <p className="font-medium">{selectedStaff.epf_number || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">EPF Applicable</p>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                            selectedStaff.epf_applicable ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                                        }`}>
                                            {selectedStaff.epf_applicable ? 'Yes' : 'No'}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Shift Eligible</p>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                            selectedStaff.shift_eligible ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                                        }`}>
                                            {selectedStaff.shift_eligible ? 'Yes' : 'No'}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Contract End Date</p>
                                        <p className="font-medium">{selectedStaff.contract_end_date || 'N/A'}</p>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'emergency' && (
                                <div className="space-y-4">
                                    <div className="bg-red-50 border border-red-100 rounded-lg p-4">
                                        <h4 className="text-sm font-medium text-red-800 mb-3 flex items-center gap-2">
                                            <Heart className="w-4 h-4" />
                                            Emergency Contact
                                        </h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-sm text-gray-500">Name</p>
                                                <p className="font-medium">{selectedStaff.emergency_contact_name || 'Not provided'}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Relationship</p>
                                                <p className="font-medium capitalize">{selectedStaff.emergency_contact_relationship || 'N/A'}</p>
                                            </div>
                                            <div className="col-span-2">
                                                <p className="text-sm text-gray-500">Phone</p>
                                                <p className="font-medium flex items-center gap-2">
                                                    <Phone className="w-4 h-4 text-gray-400" />
                                                    {selectedStaff.emergency_contact_phone || 'Not provided'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'qualifications' && (
                                <div className="space-y-4">
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                            <GraduationCap className="w-4 h-4" />
                                            Qualifications
                                        </h4>
                                        <div className="bg-gray-50 rounded-lg p-4">
                                            <p className="text-gray-600 whitespace-pre-wrap">
                                                {selectedStaff.qualifications || 'No qualifications recorded'}
                                            </p>
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                            <BadgeCheck className="w-4 h-4" />
                                            Certifications
                                        </h4>
                                        <div className="bg-gray-50 rounded-lg p-4">
                                            <p className="text-gray-600 whitespace-pre-wrap">
                                                {selectedStaff.certifications || 'No certifications recorded'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t border-gray-200">
                            <button 
                                onClick={() => {
                                    setShowProfileModal(false);
                                    handleEditProfile(selectedStaff);
                                }}
                                className="px-4 py-2 text-emerald-700 border border-emerald-300 rounded-lg hover:bg-emerald-50 flex items-center gap-2"
                            >
                                <Edit className="w-4 h-4" />
                                Edit Profile
                            </button>
                            <button 
                                onClick={() => {
                                    setShowProfileModal(false);
                                    setSelectedStaff(null);
                                }}
                                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Profile Modal */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                        {/* Modal Header */}
                        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-6 text-white">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <UserCog className="w-6 h-6" />
                                    <h3 className="text-xl font-bold">Edit HR Profile</h3>
                                </div>
                                <button 
                                    onClick={() => setShowEditModal(false)}
                                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Form Content */}
                        <div className="p-6 overflow-y-auto flex-1 space-y-6">
                            {/* Employment Details */}
                            <div>
                                <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                                    <Briefcase className="w-4 h-4" />
                                    Employment Details
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">Department</label>
                                        <select
                                            value={editingStaff.department || ''}
                                            onChange={(e) => setEditingStaff({ ...editingStaff, department: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                        >
                                            <option value="">Select Department</option>
                                            {departments.map(dept => (
                                                <option key={dept} value={dept}>{dept}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">Designation</label>
                                        <input
                                            type="text"
                                            value={editingStaff.designation || ''}
                                            onChange={(e) => setEditingStaff({ ...editingStaff, designation: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                            placeholder="e.g., Senior Nurse"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">Employment Type</label>
                                        <select
                                            value={editingStaff.employment_type || ''}
                                            onChange={(e) => setEditingStaff({ ...editingStaff, employment_type: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                        >
                                            {employmentTypes.map(type => (
                                                <option key={type.value} value={type.value}>{type.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">Employment Status</label>
                                        <select
                                            value={editingStaff.employment_status || 'active'}
                                            onChange={(e) => setEditingStaff({ ...editingStaff, employment_status: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                        >
                                            <option value="active">Active</option>
                                            <option value="on_leave">On Leave</option>
                                            <option value="inactive">Inactive</option>
                                            <option value="suspended">Suspended</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Salary & Benefits */}
                            <div>
                                <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                                    <DollarSign className="w-4 h-4" />
                                    Salary & Benefits
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">Basic Salary (LKR)</label>
                                        <input
                                            type="number"
                                            value={editingStaff.basic_salary || ''}
                                            onChange={(e) => setEditingStaff({ ...editingStaff, basic_salary: parseFloat(e.target.value) })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">Weekly Hours</label>
                                        <input
                                            type="number"
                                            value={editingStaff.weekly_hours || 40}
                                            onChange={(e) => setEditingStaff({ ...editingStaff, weekly_hours: parseInt(e.target.value) })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">EPF Number</label>
                                        <input
                                            type="text"
                                            value={editingStaff.epf_number || ''}
                                            onChange={(e) => setEditingStaff({ ...editingStaff, epf_number: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                            placeholder="EPF Number"
                                        />
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <label className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={editingStaff.epf_applicable ?? true}
                                                onChange={(e) => setEditingStaff({ ...editingStaff, epf_applicable: e.target.checked })}
                                                className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                                            />
                                            <span className="text-sm text-gray-600">EPF Applicable</span>
                                        </label>
                                        <label className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={editingStaff.shift_eligible ?? true}
                                                onChange={(e) => setEditingStaff({ ...editingStaff, shift_eligible: e.target.checked })}
                                                className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                                            />
                                            <span className="text-sm text-gray-600">Shift Eligible</span>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* Emergency Contact */}
                            <div>
                                <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                                    <Heart className="w-4 h-4" />
                                    Emergency Contact
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">Contact Name</label>
                                        <input
                                            type="text"
                                            value={editingStaff.emergency_contact_name || ''}
                                            onChange={(e) => setEditingStaff({ ...editingStaff, emergency_contact_name: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                            placeholder="Emergency contact name"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">Relationship</label>
                                        <select
                                            value={editingStaff.emergency_contact_relationship || ''}
                                            onChange={(e) => setEditingStaff({ ...editingStaff, emergency_contact_relationship: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                        >
                                            <option value="">Select Relationship</option>
                                            <option value="spouse">Spouse</option>
                                            <option value="parent">Parent</option>
                                            <option value="sibling">Sibling</option>
                                            <option value="child">Child</option>
                                            <option value="friend">Friend</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-sm text-gray-600 mb-1">Contact Phone</label>
                                        <input
                                            type="tel"
                                            value={editingStaff.emergency_contact_phone || ''}
                                            onChange={(e) => setEditingStaff({ ...editingStaff, emergency_contact_phone: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                            placeholder="Emergency contact phone"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Qualifications & Certifications */}
                            <div>
                                <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                                    <GraduationCap className="w-4 h-4" />
                                    Qualifications & Certifications
                                </h4>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">Qualifications</label>
                                        <textarea
                                            value={editingStaff.qualifications || ''}
                                            onChange={(e) => setEditingStaff({ ...editingStaff, qualifications: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                            rows={3}
                                            placeholder="e.g., MBBS, MD Cardiology"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">Certifications</label>
                                        <textarea
                                            value={editingStaff.certifications || ''}
                                            onChange={(e) => setEditingStaff({ ...editingStaff, certifications: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                            rows={3}
                                            placeholder="e.g., BLS, ACLS, First Aid"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t border-gray-200">
                            <button 
                                onClick={() => setShowEditModal(false)}
                                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleSaveProfile}
                                disabled={isSaving}
                                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
                            >
                                {isSaving ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4" />
                                        Save Changes
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BranchHRMStaff;
