import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from "../../utils/api/axios";
import axios from "axios";
import {
    FileText,
    Plus,
    Search,
    Filter,
    Edit,
    Trash2,
    Eye,
    Calendar,
    AlertCircle,
    CheckCircle,
    Clock,
    X,
    Save,
    ArrowLeft,
    Briefcase,
    Building2,
    Copy
} from 'lucide-react';

interface Branch {
    id: string;
    center_name: string;
}

interface HRPolicy {
    id: string;
    branch_id?: string;
    policy_name: string;
    policy_category: string;
    description: string;
    policy_content?: string;
    effective_date: string;
    expiry_date?: string;
    status: 'Active' | 'Inactive' | 'Draft';
    created_by?: string;
    updated_by?: string;
    created_at: string;
    updated_at: string;
    branch?: {
        id: string;
        center_name: string;
    };
    creator?: {
        first_name: string;
        last_name: string;
        email: string;
    };
}

interface PolicyStats {
    total: number;
    active: number;
    draft: number;
    expiring_soon: number;
}

const HRPolicies: React.FC = () => {
    const navigate = useNavigate();
    const [policies, setPolicies] = useState<HRPolicy[]>([]);
    const [filteredPolicies, setFilteredPolicies] = useState<HRPolicy[]>([]);
    const [stats, setStats] = useState<PolicyStats>({ total: 0, active: 0, draft: 0, expiring_soon: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [showModal, setShowModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [selectedPolicy, setSelectedPolicy] = useState<HRPolicy | null>(null);
    const [isEditMode, setIsEditMode] = useState(false);

    // Branch support
    const [branches, setBranches] = useState<Branch[]>([]);
    const [selectedBranch, setSelectedBranch] = useState<string>('all');
    const [showCopyModal, setShowCopyModal] = useState(false);
    const [copyTargetBranch, setCopyTargetBranch] = useState<string>('');
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        branch_id: '',
        policy_name: '',
        policy_category: 'Leave',
        description: '',
        policy_content: '',
        effective_date: '',
        expiry_date: '',
        status: 'Draft'
    });

    const categories = [
        'Leave',
        'Attendance',
        'Salary & Compensation',
        'Benefits',
        'Working Hours',
        'Code of Conduct',
        'Health & Safety',
        'Disciplinary',
        'Training & Development',
        'Resignation & Termination',
        'Other'
    ];

    useEffect(() => {
        fetchBranches();
    }, []);

    useEffect(() => {
        fetchPolicies();
        fetchStats();
    }, [selectedBranch]);

    useEffect(() => {
        filterPolicies();
    }, [policies, searchTerm, selectedCategory, selectedStatus]);

    const fetchBranches = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await api.get('/hrm/super-admin/salary-structures/branches', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.status === 200) {
                setBranches(response.data.branches);
            }
        } catch (error) {
            console.error('Error fetching branches:', error);
        }
    };

    const fetchPolicies = async () => {
        try {
            setIsLoading(true);
            const token = localStorage.getItem('token');
            const params: any = {};
            if (selectedBranch !== 'all') {
                params.branch_id = selectedBranch;
            }
            const response = await api.get('/hrm/super-admin/policies', {
                headers: { Authorization: `Bearer ${token}` },
                params
            });
            if (response.data.status === 200) {
                setPolicies(response.data.policies);
            }
        } catch (error) {
            console.error('Error fetching policies:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const token = localStorage.getItem('token');
            const params: any = {};
            if (selectedBranch !== 'all') {
                params.branch_id = selectedBranch;
            }
            const response = await api.get('/hrm/super-admin/policies/stats', {
                headers: { Authorization: `Bearer ${token}` },
                params
            });
            if (response.data.status === 200) {
                setStats(response.data.stats);
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const filterPolicies = () => {
        let filtered = [...policies];

        if (searchTerm) {
            filtered = filtered.filter(p =>
                p.policy_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.description.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (selectedCategory !== 'all') {
            filtered = filtered.filter(p => p.policy_category === selectedCategory);
        }

        if (selectedStatus !== 'all') {
            filtered = filtered.filter(p => p.status === selectedStatus);
        }

        setFilteredPolicies(filtered);
    };

    const handleCreatePolicy = () => {
        console.log('Create Policy button clicked');
        setIsEditMode(false);
        setFormData({
            branch_id: selectedBranch !== 'all' ? selectedBranch : '',
            policy_name: '',
            policy_category: 'Leave',
            description: '',
            policy_content: '',
            effective_date: '',
            expiry_date: '',
            status: 'Draft'
        });
        setShowModal(true);
        console.log('Modal should be showing now, showModal:', true);
    };

    const handleEditPolicy = (policy: HRPolicy) => {
        setIsEditMode(true);
        setSelectedPolicy(policy);
        setFormData({
            branch_id: policy.branch_id || '',
            policy_name: policy.policy_name,
            policy_category: policy.policy_category,
            description: policy.description,
            policy_content: policy.policy_content || '',
            effective_date: policy.effective_date,
            expiry_date: policy.expiry_date || '',
            status: policy.status
        });
        setShowModal(true);
    };

    const handleViewPolicy = (policy: HRPolicy) => {
        setSelectedPolicy(policy);
        setShowViewModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        try {
            const token = localStorage.getItem('token');
            const url = isEditMode
                ? `/hrm/super-admin/policies/${selectedPolicy?.id}`
                : '/hrm/super-admin/policies';

            const method = isEditMode ? 'put' : 'post';

            const payload = {
                ...formData,
                branch_id: formData.branch_id || null,
            };

            const response = await axios[method](url, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.status === 200 || response.data.status === 201) {
                setShowModal(false);
                fetchPolicies();
                fetchStats();
            }
        } catch (error: any) {
            console.error('Error saving policy:', error);
            if (error.response?.data?.errors) {
                const errors = Object.values(error.response.data.errors).flat();
                setError((errors as string[]).join(', '));
            } else {
                setError('Failed to save policy');
            }
        }
    };

    const handleCopyToBranch = async () => {
        if (!copyTargetBranch) {
            setError('Please select a target branch');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            // Determine source_branch_id - null for 'all' or 'global', otherwise the UUID
            const sourceBranchId = (selectedBranch === 'all' || selectedBranch === 'global') ? null : selectedBranch;

            const response = await api.post('/hrm/super-admin/policies/copy-to-branch', {
                source_branch_id: sourceBranchId,
                target_branch_id: copyTargetBranch
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.status === 200) {
                setShowCopyModal(false);
                setCopyTargetBranch('');
                alert(`Successfully copied ${response.data.copied_count} policies!`);
            }
        } catch (error: any) {
            console.error('Error copying policies:', error);
            setError(error.response?.data?.message || 'Failed to copy policies');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this policy?')) return;

        try {
            const token = localStorage.getItem('token');
            await api.delete(`/hrm/super-admin/policies/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchPolicies();
            fetchStats();
        } catch (error) {
            console.error('Error deleting policy:', error);
        }
    };

    const getStatusBadge = (status: string) => {
        const colors = {
            Active: 'bg-green-100 text-green-800',
            Inactive: 'bg-neutral-100 text-neutral-800',
            Draft: 'bg-yellow-100 text-yellow-800'
        };
        return (
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[status as keyof typeof colors]}`}>
                {status}
            </span>
        );
    };

    const getCategoryColor = (category: string) => {
        const colors: { [key: string]: string } = {
            'Leave': 'bg-blue-100 text-blue-800',
            'Attendance': 'bg-purple-100 text-purple-800',
            'Salary & Compensation': 'bg-green-100 text-green-800',
            'Benefits': 'bg-pink-100 text-pink-800',
            'Working Hours': 'bg-orange-100 text-orange-800',
            'Code of Conduct': 'bg-error-100 text-red-800',
            'Health & Safety': 'bg-emerald-100 text-emerald-800'
        };
        return colors[category] || 'bg-neutral-100 text-neutral-800';
    };

    return (
        <div className="min-h-screen bg-neutral-50 p-6">
            {/* Header */}
            <div className="mb-6">
                <button
                    onClick={() => navigate('/hr-dashboard')}
                    className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 mb-4"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Dashboard
                </button>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
                            <FileText className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-neutral-800">HR Policies</h1>
                            <p className="text-sm text-neutral-500">Manage organizational policies and guidelines</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowCopyModal(true)}
                            className="flex items-center gap-2 px-4 py-2 border border-primary-500 text-primary-500 rounded-lg hover:bg-blue-50 transition-all"
                        >
                            <Copy className="w-5 h-5" />
                            Copy to Branch
                        </button>
                        <button
                            onClick={handleCreatePolicy}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-primary-500 hover:to-blue-700 transition-all"
                        >
                            <Plus className="w-5 h-5" />
                            Create Policy
                        </button>
                    </div>
                </div>
            </div>

            {/* Branch Selector */}
            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4 mb-6">
                <div className="flex items-center gap-4">
                    <Building2 className="w-5 h-5 text-purple-500" />
                    <span className="text-sm font-medium text-neutral-700">Branch:</span>
                    <select
                        value={selectedBranch}
                        onChange={(e) => setSelectedBranch(e.target.value)}
                        className="flex-1 max-w-xs px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                        <option value="all">All Branches</option>
                        <option value="global">Global (All Branches)</option>
                        {branches.map(branch => (
                            <option key={branch.id} value={branch.id}>{branch.center_name}</option>
                        ))}
                    </select>
                    <span className="text-sm text-neutral-500">
                        {selectedBranch === 'all' ? 'Showing policies from all branches' :
                         selectedBranch === 'global' ? 'Showing global policies only' :
                         `Showing policies for selected branch`}
                    </span>
                </div>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-error-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
                    <AlertCircle className="w-5 h-5" />
                    {error}
                    <button onClick={() => setError(null)} className="ml-auto">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-neutral-500">Total Policies</p>
                            <p className="text-2xl font-bold text-neutral-800 mt-1">{stats.total}</p>
                        </div>
                        <FileText className="w-8 h-8 text-primary-500" />
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-neutral-500">Active</p>
                            <p className="text-2xl font-bold text-green-600 mt-1">{stats.active}</p>
                        </div>
                        <CheckCircle className="w-8 h-8 text-green-500" />
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-neutral-500">Draft</p>
                            <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.draft}</p>
                        </div>
                        <Clock className="w-8 h-8 text-yellow-500" />
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-neutral-500">Expiring Soon</p>
                            <p className="text-2xl font-bold text-orange-600 mt-1">{stats.expiring_soon}</p>
                        </div>
                        <AlertCircle className="w-8 h-8 text-orange-500" />
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
                        <input
                            type="text"
                            placeholder="Search policies..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                    </div>
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                        <option value="all">All Categories</option>
                        {categories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                    <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className="px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                        <option value="all">All Status</option>
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                        <option value="Draft">Draft</option>
                    </select>
                </div>
            </div>

            {/* Policies Table */}
            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-neutral-50 border-b border-neutral-200">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                                Policy Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                                Branch
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                                Category
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                                Effective Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                                Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {isLoading ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-neutral-500">
                                    Loading policies...
                                </td>
                            </tr>
                        ) : filteredPolicies.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-neutral-500">
                                    No policies found
                                </td>
                            </tr>
                        ) : (
                            filteredPolicies.map((policy) => (
                                <tr key={policy.id} className="hover:bg-neutral-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div>
                                            <div className="font-medium text-neutral-900">{policy.policy_name}</div>
                                            <div className="text-sm text-neutral-500 line-clamp-1">{policy.description}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-700">
                                            {policy.branch?.center_name || 'Global'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(policy.policy_category)}`}>
                                            {policy.policy_category}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-neutral-600">
                                        {new Date(policy.effective_date).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        {getStatusBadge(policy.status)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleViewPolicy(policy)}
                                                className="p-2 text-primary-500 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="View"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleEditPolicy(policy)}
                                                className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                                title="Edit"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(policy.id)}
                                                className="p-2 text-error-600 hover:bg-error-50 rounded-lg transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
                    <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="sticky top-0 bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between">
                            <h2 className="text-xl font-semibold text-neutral-800">
                                {isEditMode ? 'Edit Policy' : 'Create New Policy'}
                            </h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {/* Branch Selector */}
                            <div className="bg-purple-50 rounded-lg p-4">
                                <label className="block text-sm font-medium text-neutral-700 mb-2">
                                    <Building2 className="w-4 h-4 inline mr-2" />
                                    Assign to Branch
                                </label>
                                <select
                                    value={formData.branch_id}
                                    onChange={(e) => setFormData({ ...formData, branch_id: e.target.value })}
                                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                >
                                    <option value="">Global (All Branches)</option>
                                    {branches.map(branch => (
                                        <option key={branch.id} value={branch.id}>{branch.center_name}</option>
                                    ))}
                                </select>
                                <p className="text-xs text-neutral-500 mt-1">
                                    Leave empty for global policies that apply to all branches
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">
                                    Policy Name *
                                </label>
                                <input
                                    type="text"
                                    value={formData.policy_name}
                                    onChange={(e) => setFormData({ ...formData, policy_name: e.target.value })}
                                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                                        Category *
                                    </label>
                                    <select
                                        value={formData.policy_category}
                                        onChange={(e) => setFormData({ ...formData, policy_category: e.target.value })}
                                        className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                        required
                                    >
                                        {categories.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                                        Status *
                                    </label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                        className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                        required
                                    >
                                        <option value="Draft">Draft</option>
                                        <option value="Active">Active</option>
                                        <option value="Inactive">Inactive</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">
                                    Description *
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={3}
                                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">
                                    Policy Content
                                </label>
                                <textarea
                                    value={formData.policy_content}
                                    onChange={(e) => setFormData({ ...formData, policy_content: e.target.value })}
                                    rows={6}
                                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    placeholder="Enter detailed policy content..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                                        Effective Date *
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.effective_date}
                                        onChange={(e) => setFormData({ ...formData, effective_date: e.target.value })}
                                        className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                                        Expiry Date (Optional)
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.expiry_date}
                                        onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                                        className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="submit"
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-primary-500 hover:to-blue-700 transition-all"
                                >
                                    <Save className="w-5 h-5" />
                                    {isEditMode ? 'Update Policy' : 'Create Policy'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* View Modal */}
            {showViewModal && selectedPolicy && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
                    <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="sticky top-0 bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between">
                            <h2 className="text-xl font-semibold text-neutral-800">{selectedPolicy.policy_name}</h2>
                            <button
                                onClick={() => setShowViewModal(false)}
                                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="flex items-center gap-3">
                                <span className={`px-3 py-1 text-sm font-medium rounded-full ${getCategoryColor(selectedPolicy.policy_category)}`}>
                                    {selectedPolicy.policy_category}
                                </span>
                                {getStatusBadge(selectedPolicy.status)}
                            </div>

                            <div>
                                <h3 className="text-sm font-medium text-neutral-500 mb-1">Description</h3>
                                <p className="text-neutral-700">{selectedPolicy.description}</p>
                            </div>

                            {selectedPolicy.policy_content && (
                                <div>
                                    <h3 className="text-sm font-medium text-neutral-500 mb-1">Policy Content</h3>
                                    <div className="bg-neutral-50 rounded-lg p-4 text-neutral-700 whitespace-pre-wrap">
                                        {selectedPolicy.policy_content}
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <h3 className="text-sm font-medium text-neutral-500 mb-1">Effective Date</h3>
                                    <p className="text-neutral-700">
                                        {new Date(selectedPolicy.effective_date).toLocaleDateString()}
                                    </p>
                                </div>
                                {selectedPolicy.expiry_date && (
                                    <div>
                                        <h3 className="text-sm font-medium text-neutral-500 mb-1">Expiry Date</h3>
                                        <p className="text-neutral-700">
                                            {new Date(selectedPolicy.expiry_date).toLocaleDateString()}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {selectedPolicy.creator && (
                                <div>
                                    <h3 className="text-sm font-medium text-neutral-500 mb-1">Created By</h3>
                                    <p className="text-neutral-700">
                                        {selectedPolicy.creator.first_name} {selectedPolicy.creator.last_name}
                                    </p>
                                    <p className="text-sm text-neutral-500">{selectedPolicy.creator.email}</p>
                                </div>
                            )}

                            <div className="flex gap-3 pt-4 border-t border-neutral-200">
                                <button
                                    onClick={() => {
                                        setShowViewModal(false);
                                        handleEditPolicy(selectedPolicy);
                                    }}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg hover:from-emerald-600 hover:to-emerald-700 transition-all"
                                >
                                    <Edit className="w-5 h-5" />
                                    Edit Policy
                                </button>
                                <button
                                    onClick={() => setShowViewModal(false)}
                                    className="px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Copy to Branch Modal */}
            {showCopyModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
                        <div className="border-b border-neutral-200 px-6 py-4 flex items-center justify-between">
                            <h2 className="text-xl font-semibold text-neutral-800 flex items-center gap-2">
                                <Copy className="w-5 h-5" />
                                Copy Policies to Branch
                            </h2>
                            <button
                                onClick={() => setShowCopyModal(false)}
                                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-2">
                                    Source Branch
                                </label>
                                <div className="px-4 py-2 bg-neutral-100 rounded-lg text-neutral-700">
                                    {selectedBranch === 'all' ? 'Global (All Branches)' :
                                     selectedBranch === 'global' ? 'Global Policies' :
                                     branches.find(b => b.id === selectedBranch)?.center_name || 'Unknown'}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-2">
                                    Target Branch *
                                </label>
                                <select
                                    value={copyTargetBranch}
                                    onChange={(e) => setCopyTargetBranch(e.target.value)}
                                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    required
                                >
                                    <option value="">Select target branch...</option>
                                    {branches
                                        .filter(b => b.id !== selectedBranch)
                                        .map(branch => (
                                            <option key={branch.id} value={branch.id}>{branch.center_name}</option>
                                        ))
                                    }
                                </select>
                            </div>
                            <p className="text-sm text-neutral-500">
                                This will copy all policies from the source branch to the target branch.
                                Existing policies with the same name will not be duplicated.
                            </p>
                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={handleCopyToBranch}
                                    disabled={!copyTargetBranch}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-primary-500 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Copy className="w-5 h-5" />
                                    Copy Policies
                                </button>
                                <button
                                    onClick={() => setShowCopyModal(false)}
                                    className="px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HRPolicies;
