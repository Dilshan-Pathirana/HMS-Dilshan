import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from "../../utils/api/axios";
import {
    Calendar,
    ArrowLeft,
    Plus,
    Edit2,
    Trash2,
    Search,
    Filter,
    CheckCircle,
    XCircle,
    AlertCircle,
    Building2,
    Copy,
    RefreshCw,
    Clock,
    HeartPulse,
    Baby,
    Briefcase,
    CalendarX,
    Heart,
    X,
    Save,
    Info
} from 'lucide-react';

interface Branch {
    id: string;
    center_name: string;
}

interface LeaveType {
    id: string;
    branch_id: string | null;
    name: string;
    code: string;
    description: string | null;
    default_days: number;
    is_paid: boolean;
    carry_forward: boolean;
    max_carry_forward_days: number;
    requires_approval: boolean;
    min_days_notice: number;
    max_consecutive_days: number | null;
    eligibility: string | null;
    min_service_months: number;
    requires_document: boolean;
    document_type: string | null;
    deduction_rate: number;
    affects_attendance: boolean;
    color: string;
    icon: string | null;
    sort_order: number;
    is_active: boolean;
    branch?: {
        id: string;
        center_name: string;
    };
    created_at?: string;
    updated_at?: string;
}

interface LeaveTypeFormData {
    name: string;
    code: string;
    description: string;
    default_days: number;
    is_paid: boolean;
    carry_forward: boolean;
    max_carry_forward_days: number;
    requires_approval: boolean;
    min_days_notice: number;
    max_consecutive_days: number | null;
    eligibility: string;
    min_service_months: number;
    requires_document: boolean;
    document_type: string;
    deduction_rate: number;
    affects_attendance: boolean;
    color: string;
    icon: string;
    sort_order: number;
    is_active: boolean;
}

const defaultFormData: LeaveTypeFormData = {
    name: '',
    code: '',
    description: '',
    default_days: 0,
    is_paid: true,
    carry_forward: false,
    max_carry_forward_days: 0,
    requires_approval: true,
    min_days_notice: 0,
    max_consecutive_days: null,
    eligibility: 'all',
    min_service_months: 0,
    requires_document: false,
    document_type: '',
    deduction_rate: 0,
    affects_attendance: true,
    color: '#3B82F6',
    icon: 'calendar',
    sort_order: 0,
    is_active: true,
};

const colorOptions = [
    { value: '#3B82F6', label: 'Blue' },
    { value: '#10B981', label: 'Green' },
    { value: '#EF4444', label: 'Red' },
    { value: '#F59E0B', label: 'Amber' },
    { value: '#8B5CF6', label: 'Purple' },
    { value: '#EC4899', label: 'Pink' },
    { value: '#6B7280', label: 'Gray' },
    { value: '#374151', label: 'Dark Gray' },
];

const iconOptions = [
    { value: 'calendar', label: 'Calendar' },
    { value: 'clock', label: 'Clock' },
    { value: 'heart-pulse', label: 'Health' },
    { value: 'baby', label: 'Baby' },
    { value: 'briefcase', label: 'Briefcase' },
    { value: 'calendar-x', label: 'Calendar X' },
    { value: 'heart', label: 'Heart' },
];

const eligibilityOptions = [
    { value: 'all', label: 'All Employees' },
    { value: 'male', label: 'Male Only' },
    { value: 'female', label: 'Female Only' },
    { value: 'permanent', label: 'Permanent Staff' },
    { value: 'probation', label: 'Probation Staff' },
];

const LeaveTypes: React.FC = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [selectedBranch, setSelectedBranch] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterPaid, setFilterPaid] = useState<string>('all');
    const [filterActive, setFilterActive] = useState<string>('all');
    
    // Modal states
    const [showModal, setShowModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showCopyModal, setShowCopyModal] = useState(false);
    const [showInitializeModal, setShowInitializeModal] = useState(false);
    const [editingLeaveType, setEditingLeaveType] = useState<LeaveType | null>(null);
    const [deletingLeaveType, setDeletingLeaveType] = useState<LeaveType | null>(null);
    const [formData, setFormData] = useState<LeaveTypeFormData>(defaultFormData);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Copy to branch
    const [copySourceBranch, setCopySourceBranch] = useState<string>('global');
    const [copyTargetBranch, setCopyTargetBranch] = useState<string>('');

    useEffect(() => {
        fetchBranches();
        fetchLeaveTypes();
    }, []);

    useEffect(() => {
        fetchLeaveTypes();
    }, [selectedBranch]);

    const fetchBranches = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await api.get('/hrm/super-admin/salary-structures/branches', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.status === 200) {
                setBranches(response.data.branches || []);
            }
        } catch (error) {
            console.error('Error fetching branches:', error);
        }
    };

    const fetchLeaveTypes = async () => {
        try {
            setIsLoading(true);
            const token = localStorage.getItem('token');
            const branchParam = selectedBranch !== 'all' ? `?branch_id=${selectedBranch === 'global' ? '' : selectedBranch}` : '';
            const response = await api.get(`/hrm/super-admin/leave-types${branchParam}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.status === 200) {
                setLeaveTypes(response.data.leaveTypes || []);
            }
        } catch (error) {
            console.error('Error fetching leave types:', error);
            setError('Failed to load leave types');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreate = () => {
        setEditingLeaveType(null);
        setFormData(defaultFormData);
        setShowModal(true);
    };

    const handleEdit = (leaveType: LeaveType) => {
        setEditingLeaveType(leaveType);
        setFormData({
            name: leaveType.name,
            code: leaveType.code,
            description: leaveType.description || '',
            default_days: leaveType.default_days,
            is_paid: leaveType.is_paid,
            carry_forward: leaveType.carry_forward,
            max_carry_forward_days: leaveType.max_carry_forward_days,
            requires_approval: leaveType.requires_approval,
            min_days_notice: leaveType.min_days_notice,
            max_consecutive_days: leaveType.max_consecutive_days,
            eligibility: leaveType.eligibility || 'all',
            min_service_months: leaveType.min_service_months,
            requires_document: leaveType.requires_document,
            document_type: leaveType.document_type || '',
            deduction_rate: leaveType.deduction_rate,
            affects_attendance: leaveType.affects_attendance,
            color: leaveType.color,
            icon: leaveType.icon || 'calendar',
            sort_order: leaveType.sort_order,
            is_active: leaveType.is_active,
        });
        setShowModal(true);
    };

    const handleDelete = (leaveType: LeaveType) => {
        setDeletingLeaveType(leaveType);
        setShowDeleteModal(true);
    };

    const handleSave = async () => {
        setIsSaving(true);
        setError(null);

        try {
            const token = localStorage.getItem('token');
            const payload = {
                ...formData,
                branch_id: selectedBranch === 'all' || selectedBranch === 'global' ? null : selectedBranch,
            };

            let response;
            if (editingLeaveType) {
                response = await api.put(`/hrm/super-admin/leave-types/${editingLeaveType.id}`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } else {
                response = await api.post('/hrm/super-admin/leave-types', payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }

            if (response.data.status === 200 || response.data.status === 201) {
                setSuccess(editingLeaveType ? 'Leave type updated successfully!' : 'Leave type created successfully!');
                setShowModal(false);
                fetchLeaveTypes();
            }
        } catch (error: any) {
            console.error('Error saving leave type:', error);
            setError(error.response?.data?.message || 'Failed to save leave type');
        } finally {
            setIsSaving(false);
        }
    };

    const confirmDelete = async () => {
        if (!deletingLeaveType) return;

        try {
            const token = localStorage.getItem('token');
            const response = await api.delete(`/hrm/super-admin/leave-types/${deletingLeaveType.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.status === 200) {
                setSuccess('Leave type deleted successfully!');
                setShowDeleteModal(false);
                setDeletingLeaveType(null);
                fetchLeaveTypes();
            }
        } catch (error: any) {
            console.error('Error deleting leave type:', error);
            setError(error.response?.data?.message || 'Failed to delete leave type');
        }
    };

    const handleInitialize = async () => {
        try {
            setIsSaving(true);
            const token = localStorage.getItem('token');
            const response = await api.post('/hrm/super-admin/leave-types/initialize', {
                branch_id: selectedBranch === 'all' || selectedBranch === 'global' ? null : selectedBranch
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.status === 201) {
                setSuccess(`${response.data.count} Sri Lanka default leave types created successfully!`);
                setShowInitializeModal(false);
                fetchLeaveTypes();
            }
        } catch (error: any) {
            console.error('Error initializing leave types:', error);
            setError(error.response?.data?.message || 'Failed to initialize leave types');
        } finally {
            setIsSaving(false);
        }
    };

    const handleCopyToBranch = async () => {
        if (!copyTargetBranch) {
            setError('Please select a target branch');
            return;
        }

        try {
            setIsSaving(true);
            const token = localStorage.getItem('token');
            const response = await api.post('/hrm/super-admin/leave-types/copy-to-branch', {
                source_branch_id: copySourceBranch === 'global' ? null : copySourceBranch,
                target_branch_id: copyTargetBranch
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.status === 200) {
                setSuccess(response.data.message);
                setShowCopyModal(false);
                setCopyTargetBranch('');
                fetchLeaveTypes();
            }
        } catch (error: any) {
            console.error('Error copying leave types:', error);
            setError(error.response?.data?.message || 'Failed to copy leave types');
        } finally {
            setIsSaving(false);
        }
    };

    const getIconComponent = (iconName: string | null) => {
        switch (iconName) {
            case 'clock': return <Clock className="w-5 h-5" />;
            case 'heart-pulse': return <HeartPulse className="w-5 h-5" />;
            case 'baby': return <Baby className="w-5 h-5" />;
            case 'briefcase': return <Briefcase className="w-5 h-5" />;
            case 'calendar-x': return <CalendarX className="w-5 h-5" />;
            case 'heart': return <Heart className="w-5 h-5" />;
            default: return <Calendar className="w-5 h-5" />;
        }
    };

    // Filter leave types
    const filteredLeaveTypes = leaveTypes.filter(lt => {
        const matchesSearch = lt.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            lt.code.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesPaid = filterPaid === 'all' || 
                          (filterPaid === 'paid' && lt.is_paid) || 
                          (filterPaid === 'unpaid' && !lt.is_paid);
        const matchesActive = filterActive === 'all' || 
                            (filterActive === 'active' && lt.is_active) || 
                            (filterActive === 'inactive' && !lt.is_active);
        return matchesSearch && matchesPaid && matchesActive;
    });

    // Auto-dismiss alerts
    useEffect(() => {
        if (success) {
            const timer = setTimeout(() => setSuccess(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [success]);

    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => setError(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [error]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-gray-500">Loading leave types...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/super-admin/hrm')}
                            className="p-2 hover:bg-gray-200 rounded-lg"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">Leave Types Configuration</h1>
                            <p className="text-gray-500">Configure leave policies as per Sri Lanka labor law</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowCopyModal(true)}
                            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                        >
                            <Copy className="w-4 h-4" />
                            Copy to Branch
                        </button>
                        <button
                            onClick={() => setShowInitializeModal(true)}
                            className="flex items-center gap-2 px-4 py-2 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Initialize Defaults
                        </button>
                        <button
                            onClick={handleCreate}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            <Plus className="w-4 h-4" />
                            Add Leave Type
                        </button>
                    </div>
                </div>

                {/* Alerts */}
                {error && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
                        <AlertCircle className="w-5 h-5" />
                        {error}
                        <button onClick={() => setError(null)} className="ml-auto">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}
                {success && (
                    <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
                        <CheckCircle className="w-5 h-5" />
                        {success}
                        <button onClick={() => setSuccess(null)} className="ml-auto">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {/* Branch Selector & Filters */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-blue-600" />
                            <select
                                value={selectedBranch}
                                onChange={(e) => setSelectedBranch(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="all">📋 All Leave Types</option>
                                <option value="global">🌐 Global Only</option>
                                {branches.map((branch) => (
                                    <option key={branch.id} value={branch.id}>
                                        🏥 {branch.center_name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search leave types..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <Filter className="w-4 h-4 text-gray-400" />
                            <select
                                value={filterPaid}
                                onChange={(e) => setFilterPaid(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="all">All Types</option>
                                <option value="paid">Paid Leave</option>
                                <option value="unpaid">Unpaid Leave</option>
                            </select>
                            <select
                                value={filterActive}
                                onChange={(e) => setFilterActive(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="all">All Status</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Leave Types Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredLeaveTypes.map((leaveType) => (
                        <div
                            key={leaveType.id}
                            className={`bg-white rounded-xl shadow-sm border border-gray-200 p-4 ${!leaveType.is_active ? 'opacity-60' : ''}`}
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                                        style={{ backgroundColor: leaveType.color }}
                                    >
                                        {getIconComponent(leaveType.icon)}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-800">{leaveType.name}</h3>
                                        <span className="text-xs text-gray-500 uppercase">{leaveType.code}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => handleEdit(leaveType)}
                                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(leaveType)}
                                        className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {leaveType.description && (
                                <p className="text-sm text-gray-500 mb-3 line-clamp-2">{leaveType.description}</p>
                            )}

                            <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                                <div className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4 text-gray-400" />
                                    <span className="text-gray-600">{leaveType.default_days} days/year</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    {leaveType.is_paid ? (
                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                    ) : (
                                        <XCircle className="w-4 h-4 text-red-500" />
                                    )}
                                    <span className="text-gray-600">{leaveType.is_paid ? 'Paid' : 'Unpaid'}</span>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-1.5">
                                {leaveType.carry_forward && (
                                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                                        Carry Forward
                                    </span>
                                )}
                                {leaveType.requires_document && (
                                    <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded">
                                        Doc Required
                                    </span>
                                )}
                                {leaveType.requires_approval && (
                                    <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded">
                                        Approval Needed
                                    </span>
                                )}
                                {leaveType.eligibility && leaveType.eligibility !== 'all' && (
                                    <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded capitalize">
                                        {leaveType.eligibility}
                                    </span>
                                )}
                                {!leaveType.branch_id && (
                                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded">
                                        Global
                                    </span>
                                )}
                                {leaveType.branch && (
                                    <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded">
                                        {leaveType.branch.center_name}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {filteredLeaveTypes.length === 0 && (
                    <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
                        <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-600 mb-2">No Leave Types Found</h3>
                        <p className="text-gray-500 mb-4">
                            {searchQuery || filterPaid !== 'all' || filterActive !== 'all'
                                ? 'Try adjusting your filters'
                                : 'Click "Initialize Defaults" to create Sri Lanka standard leave types'}
                        </p>
                        {!searchQuery && filterPaid === 'all' && filterActive === 'all' && (
                            <button
                                onClick={() => setShowInitializeModal(true)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                Initialize Sri Lanka Defaults
                            </button>
                        )}
                    </div>
                )}

                {/* Create/Edit Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                            <div className="p-6 border-b border-gray-200">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-xl font-semibold">
                                        {editingLeaveType ? 'Edit Leave Type' : 'Create Leave Type'}
                                    </h2>
                                    <button
                                        onClick={() => setShowModal(false)}
                                        className="p-2 hover:bg-gray-100 rounded-lg"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            <div className="p-6 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Name *
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            placeholder="e.g., Annual Leave"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Code *
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.code}
                                            onChange={(e) => setFormData({ ...formData, code: e.target.value.toLowerCase() })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            placeholder="e.g., annual"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Description
                                    </label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        rows={2}
                                        placeholder="Brief description of this leave type..."
                                    />
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Default Days/Year *
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.default_days}
                                            onChange={(e) => setFormData({ ...formData, default_days: parseInt(e.target.value) || 0 })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            min="0"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Min Days Notice
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.min_days_notice}
                                            onChange={(e) => setFormData({ ...formData, min_days_notice: parseInt(e.target.value) || 0 })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            min="0"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Max Consecutive Days
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.max_consecutive_days || ''}
                                            onChange={(e) => setFormData({ ...formData, max_consecutive_days: e.target.value ? parseInt(e.target.value) : null })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            min="1"
                                            placeholder="No limit"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Eligibility
                                        </label>
                                        <select
                                            value={formData.eligibility}
                                            onChange={(e) => setFormData({ ...formData, eligibility: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        >
                                            {eligibilityOptions.map(opt => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Min Service (Months)
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.min_service_months}
                                            onChange={(e) => setFormData({ ...formData, min_service_months: parseInt(e.target.value) || 0 })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            min="0"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Sort Order
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.sort_order}
                                            onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            min="0"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Color
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="color"
                                                value={formData.color}
                                                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                                className="w-10 h-10 border border-gray-300 rounded cursor-pointer"
                                            />
                                            <select
                                                value={formData.color}
                                                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            >
                                                {colorOptions.map(opt => (
                                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Icon
                                        </label>
                                        <select
                                            value={formData.icon}
                                            onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        >
                                            {iconOptions.map(opt => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Carry Forward Settings */}
                                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                                    <h4 className="font-medium text-gray-700">Carry Forward Settings</h4>
                                    <div className="flex items-center gap-4">
                                        <label className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={formData.carry_forward}
                                                onChange={(e) => setFormData({ ...formData, carry_forward: e.target.checked })}
                                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                            />
                                            <span className="text-sm text-gray-700">Allow Carry Forward</span>
                                        </label>
                                        {formData.carry_forward && (
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm text-gray-600">Max Days:</span>
                                                <input
                                                    type="number"
                                                    value={formData.max_carry_forward_days}
                                                    onChange={(e) => setFormData({ ...formData, max_carry_forward_days: parseInt(e.target.value) || 0 })}
                                                    className="w-20 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                                    min="0"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Toggle Options */}
                                <div className="grid grid-cols-2 gap-4">
                                    <label className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                                        <input
                                            type="checkbox"
                                            checked={formData.is_paid}
                                            onChange={(e) => setFormData({ ...formData, is_paid: e.target.checked })}
                                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                        />
                                        <span className="text-sm text-gray-700">Paid Leave</span>
                                    </label>
                                    <label className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                                        <input
                                            type="checkbox"
                                            checked={formData.requires_approval}
                                            onChange={(e) => setFormData({ ...formData, requires_approval: e.target.checked })}
                                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                        />
                                        <span className="text-sm text-gray-700">Requires Approval</span>
                                    </label>
                                    <label className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                                        <input
                                            type="checkbox"
                                            checked={formData.requires_document}
                                            onChange={(e) => setFormData({ ...formData, requires_document: e.target.checked })}
                                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                        />
                                        <span className="text-sm text-gray-700">Requires Document</span>
                                    </label>
                                    <label className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                                        <input
                                            type="checkbox"
                                            checked={formData.is_active}
                                            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                        />
                                        <span className="text-sm text-gray-700">Active</span>
                                    </label>
                                </div>

                                {formData.requires_document && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Document Type
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.document_type}
                                            onChange={(e) => setFormData({ ...formData, document_type: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            placeholder="e.g., medical_certificate"
                                        />
                                    </div>
                                )}

                                {!formData.is_paid && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Deduction Rate (%)
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.deduction_rate}
                                            onChange={(e) => setFormData({ ...formData, deduction_rate: parseFloat(e.target.value) || 0 })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            min="0"
                                            max="100"
                                            step="0.01"
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving || !formData.name || !formData.code}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {isSaving ? (
                                        <>
                                            <RefreshCw className="w-4 h-4 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4" />
                                            {editingLeaveType ? 'Update' : 'Create'}
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Delete Confirmation Modal */}
                {showDeleteModal && deletingLeaveType && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                                    <Trash2 className="w-6 h-6 text-red-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold">Delete Leave Type</h3>
                                    <p className="text-gray-500 text-sm">This action cannot be undone</p>
                                </div>
                            </div>
                            <p className="text-gray-600 mb-6">
                                Are you sure you want to delete <strong>{deletingLeaveType.name}</strong>?
                            </p>
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => {
                                        setShowDeleteModal(false);
                                        setDeletingLeaveType(null);
                                    }}
                                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Initialize Confirmation Modal */}
                {showInitializeModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                    <RefreshCw className="w-6 h-6 text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold">Initialize Sri Lanka Defaults</h3>
                                    <p className="text-gray-500 text-sm">Create standard leave types</p>
                                </div>
                            </div>
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                                <div className="flex items-start gap-2">
                                    <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                                    <div className="text-sm text-blue-700">
                                        <p className="font-medium mb-1">This will create:</p>
                                        <ul className="list-disc list-inside space-y-1">
                                            <li>Annual Leave (14 days)</li>
                                            <li>Casual Leave (7 days)</li>
                                            <li>Sick Leave (7 days)</li>
                                            <li>Maternity Leave (84 days)</li>
                                            <li>Paternity Leave (3 days)</li>
                                            <li>No Pay Leave (30 days)</li>
                                            <li>Bereavement Leave (3 days)</li>
                                            <li>Duty Leave (10 days)</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                            <p className="text-gray-600 mb-6">
                                Leave types will be created for: <strong>
                                    {selectedBranch === 'all' || selectedBranch === 'global' 
                                        ? 'Global (All Branches)' 
                                        : branches.find(b => b.id === selectedBranch)?.center_name || 'Selected Branch'}
                                </strong>
                            </p>
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setShowInitializeModal(false)}
                                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleInitialize}
                                    disabled={isSaving}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {isSaving ? (
                                        <>
                                            <RefreshCw className="w-4 h-4 animate-spin" />
                                            Creating...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className="w-4 h-4" />
                                            Initialize
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Copy to Branch Modal */}
                {showCopyModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                                    <Copy className="w-6 h-6 text-purple-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold">Copy Leave Types</h3>
                                    <p className="text-gray-500 text-sm">Copy from one branch to another</p>
                                </div>
                            </div>
                            
                            <div className="space-y-4 mb-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Source
                                    </label>
                                    <select
                                        value={copySourceBranch}
                                        onChange={(e) => setCopySourceBranch(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="global">🌐 Global</option>
                                        {branches.map((branch) => (
                                            <option key={branch.id} value={branch.id}>
                                                🏥 {branch.center_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Target Branch *
                                    </label>
                                    <select
                                        value={copyTargetBranch}
                                        onChange={(e) => setCopyTargetBranch(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Select target branch...</option>
                                        {branches
                                            .filter(b => b.id !== copySourceBranch)
                                            .map((branch) => (
                                                <option key={branch.id} value={branch.id}>
                                                    🏥 {branch.center_name}
                                                </option>
                                            ))}
                                    </select>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => {
                                        setShowCopyModal(false);
                                        setCopyTargetBranch('');
                                    }}
                                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCopyToBranch}
                                    disabled={isSaving || !copyTargetBranch}
                                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                                >
                                    {isSaving ? (
                                        <>
                                            <RefreshCw className="w-4 h-4 animate-spin" />
                                            Copying...
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="w-4 h-4" />
                                            Copy
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LeaveTypes;
