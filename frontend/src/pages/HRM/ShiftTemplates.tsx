import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from "../../utils/api/axios";
import {
    Clock,
    ArrowLeft,
    Plus,
    Edit2,
    Trash2,
    Search,
    CheckCircle,
    AlertCircle,
    Building2,
    Copy,
    RefreshCw,
    Moon,
    Sun,
    Sunrise,
    Sunset,
    X,
    Save,
    Info,
    Users,
    Calendar
} from 'lucide-react';

interface Branch {
    id: string;
    center_name: string;
}

interface ShiftTemplate {
    id: string;
    branch_id: string | null;
    shift_name: string;
    shift_code: string | null;
    start_time: string;
    end_time: string;
    standard_hours: number;
    break_duration: number;
    overnight_shift: boolean;
    is_active: boolean;
    description: string | null;
    applicable_roles: string[] | null;
    applicable_days: string[] | null;
    branch?: {
        id: string;
        center_name: string;
    };
    created_at?: string;
    updated_at?: string;
}

interface ShiftTemplateFormData {
    shift_name: string;
    shift_code: string;
    start_time: string;
    end_time: string;
    standard_hours: number;
    break_duration: number;
    overnight_shift: boolean;
    is_active: boolean;
    description: string;
    applicable_roles: string[];
    applicable_days: string[];
}

const defaultFormData: ShiftTemplateFormData = {
    shift_name: '',
    shift_code: '',
    start_time: '08:00',
    end_time: '17:00',
    standard_hours: 8,
    break_duration: 1,
    overnight_shift: false,
    is_active: true,
    description: '',
    applicable_roles: [],
    applicable_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
};

const availableRoles = [
    { value: 'doctor', label: 'Doctor' },
    { value: 'nurse', label: 'Nurse' },
    { value: 'pharmacist', label: 'Pharmacist' },
    { value: 'cashier', label: 'Cashier' },
    { value: 'receptionist', label: 'Receptionist' },
    { value: 'lab_technician', label: 'Lab Technician' },
    { value: 'radiologist', label: 'Radiologist' },
    { value: 'center_aid', label: 'Center Aid' },
    { value: 'it_support', label: 'IT Support' },
    { value: 'branch_admin', label: 'Branch Admin' },
];

const daysOfWeek = [
    { value: 'monday', label: 'Mon' },
    { value: 'tuesday', label: 'Tue' },
    { value: 'wednesday', label: 'Wed' },
    { value: 'thursday', label: 'Thu' },
    { value: 'friday', label: 'Fri' },
    { value: 'saturday', label: 'Sat' },
    { value: 'sunday', label: 'Sun' },
];

const ShiftTemplates: React.FC = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [shiftTemplates, setShiftTemplates] = useState<ShiftTemplate[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [selectedBranch, setSelectedBranch] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterActive, setFilterActive] = useState<string>('all');
    const [filterOvernight, setFilterOvernight] = useState<string>('all');
    
    // Modal states
    const [showModal, setShowModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showCopyModal, setShowCopyModal] = useState(false);
    const [showInitializeModal, setShowInitializeModal] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<ShiftTemplate | null>(null);
    const [deletingTemplate, setDeletingTemplate] = useState<ShiftTemplate | null>(null);
    const [formData, setFormData] = useState<ShiftTemplateFormData>(defaultFormData);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Copy to branch
    const [copySourceBranch, setCopySourceBranch] = useState<string>('global');
    const [copyTargetBranch, setCopyTargetBranch] = useState<string>('');

    useEffect(() => {
        fetchBranches();
        fetchShiftTemplates();
    }, []);

    useEffect(() => {
        fetchShiftTemplates();
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

    const fetchShiftTemplates = async () => {
        try {
            setIsLoading(true);
            const token = localStorage.getItem('token');
            const branchParam = selectedBranch !== 'all' ? `?branch_id=${selectedBranch === 'global' ? '' : selectedBranch}` : '';
            const response = await api.get(`/hrm/super-admin/shift-templates${branchParam}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.status === 200) {
                setShiftTemplates(response.data.shiftTemplates || []);
            }
        } catch (error) {
            console.error('Error fetching shift templates:', error);
            setError('Failed to fetch shift templates');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreate = () => {
        setEditingTemplate(null);
        setFormData(defaultFormData);
        setShowModal(true);
        setError(null);
    };

    const handleEdit = (template: ShiftTemplate) => {
        setEditingTemplate(template);
        setFormData({
            shift_name: template.shift_name || '',
            shift_code: template.shift_code || '',
            start_time: template.start_time?.substring(0, 5) || '08:00',
            end_time: template.end_time?.substring(0, 5) || '17:00',
            standard_hours: template.standard_hours || 8,
            break_duration: template.break_duration || 0,
            overnight_shift: template.overnight_shift || false,
            is_active: template.is_active ?? true,
            description: template.description || '',
            applicable_roles: template.applicable_roles || [],
            applicable_days: template.applicable_days || [],
        });
        setShowModal(true);
        setError(null);
    };

    const handleDelete = (template: ShiftTemplate) => {
        setDeletingTemplate(template);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!deletingTemplate) return;
        
        try {
            setIsSaving(true);
            const token = localStorage.getItem('token');
            await api.delete(`/hrm/super-admin/shift-templates/${deletingTemplate.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSuccess('Shift template deleted successfully');
            setShowDeleteModal(false);
            setDeletingTemplate(null);
            fetchShiftTemplates();
        } catch (error: any) {
            setError(error.response?.data?.message || 'Failed to delete shift template');
        } finally {
            setIsSaving(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        try {
            setIsSaving(true);
            setError(null);
            const token = localStorage.getItem('token');
            
            const payload = {
                ...formData,
                branch_id: selectedBranch === 'all' ? 'global' : selectedBranch,
            };

            if (editingTemplate) {
                await api.put(`/hrm/super-admin/shift-templates/${editingTemplate.id}`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setSuccess('Shift template updated successfully');
            } else {
                await api.post('/hrm/super-admin/shift-templates', payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setSuccess('Shift template created successfully');
            }
            
            setShowModal(false);
            fetchShiftTemplates();
        } catch (error: any) {
            setError(error.response?.data?.message || 'Failed to save shift template');
        } finally {
            setIsSaving(false);
        }
    };

    const handleInitialize = async () => {
        try {
            setIsSaving(true);
            const token = localStorage.getItem('token');
            const branchId = selectedBranch === 'all' ? 'global' : selectedBranch;
            
            await api.post('/hrm/super-admin/shift-templates/initialize', 
                { branch_id: branchId },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            setSuccess('Sri Lanka default shift templates initialized successfully');
            setShowInitializeModal(false);
            fetchShiftTemplates();
        } catch (error: any) {
            setError(error.response?.data?.message || 'Failed to initialize shift templates');
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
            
            await api.post('/hrm/super-admin/shift-templates/copy-to-branch', 
                { 
                    source_branch_id: copySourceBranch,
                    target_branch_id: copyTargetBranch 
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            setSuccess('Shift templates copied successfully');
            setShowCopyModal(false);
            setCopyTargetBranch('');
            fetchShiftTemplates();
        } catch (error: any) {
            setError(error.response?.data?.message || 'Failed to copy shift templates');
        } finally {
            setIsSaving(false);
        }
    };

    const toggleRole = (role: string) => {
        setFormData(prev => ({
            ...prev,
            applicable_roles: prev.applicable_roles.includes(role)
                ? prev.applicable_roles.filter(r => r !== role)
                : [...prev.applicable_roles, role]
        }));
    };

    const toggleDay = (day: string) => {
        setFormData(prev => ({
            ...prev,
            applicable_days: prev.applicable_days.includes(day)
                ? prev.applicable_days.filter(d => d !== day)
                : [...prev.applicable_days, day]
        }));
    };

    const formatTime = (time: string | null) => {
        if (!time) return '--:--';
        const [hours, minutes] = time.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
    };

    const getShiftIcon = (template: ShiftTemplate) => {
        if (template.overnight_shift) return <Moon className="w-5 h-5 text-indigo-500" />;
        const startHour = parseInt(template.start_time?.split(':')[0] || '0');
        if (startHour < 12) return <Sunrise className="w-5 h-5 text-amber-500" />;
        if (startHour < 18) return <Sun className="w-5 h-5 text-yellow-500" />;
        return <Sunset className="w-5 h-5 text-orange-500" />;
    };

    const getShiftColor = (template: ShiftTemplate) => {
        if (template.overnight_shift) return 'bg-indigo-50 border-indigo-200';
        const startHour = parseInt(template.start_time?.split(':')[0] || '0');
        if (startHour < 12) return 'bg-amber-50 border-amber-200';
        if (startHour < 18) return 'bg-yellow-50 border-yellow-200';
        return 'bg-orange-50 border-orange-200';
    };

    // Filter templates
    const filteredTemplates = shiftTemplates.filter(template => {
        const matchesSearch = !searchQuery || 
            template.shift_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            template.shift_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            template.description?.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesActive = filterActive === 'all' || 
            (filterActive === 'active' && template.is_active) ||
            (filterActive === 'inactive' && !template.is_active);
        
        const matchesOvernight = filterOvernight === 'all' ||
            (filterOvernight === 'overnight' && template.overnight_shift) ||
            (filterOvernight === 'day' && !template.overnight_shift);

        return matchesSearch && matchesActive && matchesOvernight;
    });

    // Clear messages after 5 seconds
    useEffect(() => {
        if (success || error) {
            const timer = setTimeout(() => {
                setSuccess(null);
                setError(null);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [success, error]);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => navigate('/super-admin/hrm')}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Shift Templates</h1>
                                <p className="text-sm text-gray-500">Configure shift schedules for staff</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            <button
                                onClick={() => setShowCopyModal(true)}
                                className="flex items-center px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                <Copy className="w-4 h-4 mr-2" />
                                Copy to Branch
                            </button>
                            <button
                                onClick={() => setShowInitializeModal(true)}
                                className="flex items-center px-4 py-2 text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors"
                            >
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Initialize Defaults
                            </button>
                            <button
                                onClick={handleCreate}
                                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Add Shift Template
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Alerts */}
            {(success || error) && (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
                    {success && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
                            <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                            <span className="text-green-700">{success}</span>
                        </div>
                    )}
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
                            <AlertCircle className="w-5 h-5 text-red-500 mr-3" />
                            <span className="text-red-700">{error}</span>
                        </div>
                    )}
                </div>
            )}

            {/* Filters */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        {/* Branch Select */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
                            <select
                                value={selectedBranch}
                                onChange={(e) => setSelectedBranch(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="all">All Branches</option>
                                <option value="global">Global (Default)</option>
                                {branches.map(branch => (
                                    <option key={branch.id} value={branch.id}>{branch.center_name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Search */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search shifts..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>

                        {/* Active Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                            <select
                                value={filterActive}
                                onChange={(e) => setFilterActive(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="all">All Status</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>

                        {/* Overnight Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Shift Type</label>
                            <select
                                value={filterOvernight}
                                onChange={(e) => setFilterOvernight(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="all">All Types</option>
                                <option value="day">Day Shifts</option>
                                <option value="overnight">Night Shifts</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
                    </div>
                ) : filteredTemplates.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
                        <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Shift Templates Found</h3>
                        <p className="text-gray-500 mb-6">
                            {searchQuery ? 'Try adjusting your search or filters' : 'Get started by adding shift templates or initializing defaults'}
                        </p>
                        <div className="flex justify-center space-x-4">
                            <button
                                onClick={() => setShowInitializeModal(true)}
                                className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                            >
                                Initialize Sri Lanka Defaults
                            </button>
                            <button
                                onClick={handleCreate}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Add Manually
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredTemplates.map(template => (
                            <div
                                key={template.id}
                                className={`bg-white rounded-xl shadow-sm border-2 p-5 hover:shadow-md transition-shadow ${getShiftColor(template)}`}
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center space-x-3">
                                        <div className="p-2 bg-white rounded-lg shadow-sm">
                                            {getShiftIcon(template)}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900">{template.shift_name}</h3>
                                            {template.shift_code && (
                                                <span className="text-sm text-gray-500">Code: {template.shift_code}</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                        <button
                                            onClick={() => handleEdit(template)}
                                            className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                                            title="Edit"
                                        >
                                            <Edit2 className="w-4 h-4 text-gray-600" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(template)}
                                            className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-4 h-4 text-red-500" />
                                        </button>
                                    </div>
                                </div>

                                {/* Time Display */}
                                <div className="bg-white/70 rounded-lg p-3 mb-4">
                                    <div className="flex items-center justify-between">
                                        <div className="text-center">
                                            <p className="text-xs text-gray-500 uppercase">Start</p>
                                            <p className="text-lg font-bold text-gray-900">{formatTime(template.start_time)}</p>
                                        </div>
                                        <div className="flex-1 px-4">
                                            <div className="h-0.5 bg-gray-300 relative">
                                                <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-white px-2 text-xs text-gray-500">
                                                    {template.standard_hours}h
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-xs text-gray-500 uppercase">End</p>
                                            <p className="text-lg font-bold text-gray-900">{formatTime(template.end_time)}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Details */}
                                <div className="space-y-2 text-sm">
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-500">Break Duration:</span>
                                        <span className="font-medium">{template.break_duration}h</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-500">Overnight:</span>
                                        {template.overnight_shift ? (
                                            <span className="flex items-center text-indigo-600">
                                                <Moon className="w-3 h-3 mr-1" /> Yes
                                            </span>
                                        ) : (
                                            <span className="text-gray-600">No</span>
                                        )}
                                    </div>
                                </div>

                                {/* Applicable Days */}
                                {template.applicable_days && template.applicable_days.length > 0 && (
                                    <div className="mt-4">
                                        <p className="text-xs text-gray-500 mb-2">Available Days:</p>
                                        <div className="flex flex-wrap gap-1">
                                            {daysOfWeek.map(day => (
                                                <span
                                                    key={day.value}
                                                    className={`px-2 py-0.5 text-xs rounded ${
                                                        template.applicable_days?.includes(day.value)
                                                            ? 'bg-blue-100 text-blue-700'
                                                            : 'bg-gray-100 text-gray-400'
                                                    }`}
                                                >
                                                    {day.label}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Footer */}
                                <div className="mt-4 pt-4 border-t border-gray-200/50 flex items-center justify-between">
                                    <div className="flex items-center text-xs text-gray-500">
                                        <Building2 className="w-3 h-3 mr-1" />
                                        {template.branch?.center_name || 'Global'}
                                    </div>
                                    <span className={`px-2 py-1 text-xs rounded-full ${
                                        template.is_active 
                                            ? 'bg-green-100 text-green-700' 
                                            : 'bg-gray-100 text-gray-600'
                                    }`}>
                                        {template.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b sticky top-0 bg-white z-10">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold text-gray-900">
                                    {editingTemplate ? 'Edit Shift Template' : 'Add Shift Template'}
                                </h2>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            {/* Basic Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Shift Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.shift_name}
                                        onChange={(e) => setFormData({ ...formData, shift_name: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="e.g., Morning Shift"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Shift Code
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.shift_code}
                                        onChange={(e) => setFormData({ ...formData, shift_code: e.target.value.toUpperCase() })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="e.g., M, A, N"
                                        maxLength={10}
                                    />
                                </div>
                            </div>

                            {/* Time */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Start Time <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="time"
                                        value={formData.start_time}
                                        onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        End Time <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="time"
                                        value={formData.end_time}
                                        onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Hours */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Standard Hours
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.standard_hours}
                                        onChange={(e) => setFormData({ ...formData, standard_hours: parseFloat(e.target.value) || 0 })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        min="0"
                                        max="24"
                                        step="0.5"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Break Duration (hours)
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.break_duration}
                                        onChange={(e) => setFormData({ ...formData, break_duration: parseFloat(e.target.value) || 0 })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        min="0"
                                        max="4"
                                        step="0.25"
                                    />
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    rows={2}
                                    placeholder="Optional description..."
                                />
                            </div>

                            {/* Applicable Days */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <Calendar className="w-4 h-4 inline mr-1" />
                                    Applicable Days
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {daysOfWeek.map(day => (
                                        <button
                                            key={day.value}
                                            type="button"
                                            onClick={() => toggleDay(day.value)}
                                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                                formData.applicable_days.includes(day.value)
                                                    ? 'bg-blue-600 text-white'
                                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                        >
                                            {day.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Applicable Roles */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <Users className="w-4 h-4 inline mr-1" />
                                    Applicable Roles
                                </label>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                    {availableRoles.map(role => (
                                        <button
                                            key={role.value}
                                            type="button"
                                            onClick={() => toggleRole(role.value)}
                                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left ${
                                                formData.applicable_roles.includes(role.value)
                                                    ? 'bg-green-100 text-green-700 border-2 border-green-300'
                                                    : 'bg-gray-50 text-gray-600 border-2 border-gray-200 hover:bg-gray-100'
                                            }`}
                                        >
                                            {formData.applicable_roles.includes(role.value) && (
                                                <CheckCircle className="w-3 h-3 inline mr-1" />
                                            )}
                                            {role.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Toggles */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                    <div className="flex items-center space-x-3">
                                        <Moon className="w-5 h-5 text-indigo-500" />
                                        <div>
                                            <p className="font-medium text-gray-900">Overnight Shift</p>
                                            <p className="text-xs text-gray-500">Crosses midnight</p>
                                        </div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.overnight_shift}
                                            onChange={(e) => setFormData({ ...formData, overnight_shift: e.target.checked })}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                    </label>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                    <div className="flex items-center space-x-3">
                                        <CheckCircle className="w-5 h-5 text-green-500" />
                                        <div>
                                            <p className="font-medium text-gray-900">Active</p>
                                            <p className="text-xs text-gray-500">Available for assignment</p>
                                        </div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.is_active}
                                            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                                    </label>
                                </div>
                            </div>

                            {/* Error */}
                            {error && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
                                    <AlertCircle className="w-5 h-5 text-red-500 mr-3" />
                                    <span className="text-red-700">{error}</span>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex justify-end space-x-3 pt-4 border-t">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                                >
                                    {isSaving ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4 mr-2" />
                                            {editingTemplate ? 'Update' : 'Create'}
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && deletingTemplate && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                        <div className="flex items-center space-x-4 mb-4">
                            <div className="p-3 bg-red-100 rounded-full">
                                <Trash2 className="w-6 h-6 text-red-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Delete Shift Template</h3>
                                <p className="text-sm text-gray-500">This action cannot be undone</p>
                            </div>
                        </div>
                        <p className="text-gray-600 mb-6">
                            Are you sure you want to delete <strong>{deletingTemplate.shift_name}</strong>?
                        </p>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => {
                                    setShowDeleteModal(false);
                                    setDeletingTemplate(null);
                                }}
                                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                disabled={isSaving}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                            >
                                {isSaving ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Initialize Modal */}
            {showInitializeModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                        <div className="flex items-center space-x-4 mb-4">
                            <div className="p-3 bg-blue-100 rounded-full">
                                <RefreshCw className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Initialize Default Shifts</h3>
                                <p className="text-sm text-gray-500">Sri Lanka hospital shift standards</p>
                            </div>
                        </div>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                            <div className="flex items-start space-x-3">
                                <Info className="w-5 h-5 text-blue-500 mt-0.5" />
                                <div className="text-sm text-blue-700">
                                    <p className="font-medium mb-1">This will create:</p>
                                    <ul className="list-disc list-inside space-y-1">
                                        <li>Morning Shift (6:00 AM - 2:00 PM)</li>
                                        <li>Afternoon Shift (2:00 PM - 10:00 PM)</li>
                                        <li>Night Shift (10:00 PM - 6:00 AM)</li>
                                        <li>Day Shift (8:00 AM - 5:00 PM)</li>
                                        <li>Half Day Morning/Evening</li>
                                        <li>OPD Morning/Evening</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                        <p className="text-gray-600 mb-6">
                            Initialize for: <strong>{selectedBranch === 'all' || selectedBranch === 'global' ? 'Global (All Branches)' : branches.find(b => b.id === selectedBranch)?.center_name}</strong>
                        </p>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setShowInitializeModal(false)}
                                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleInitialize}
                                disabled={isSaving}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                            >
                                {isSaving ? 'Initializing...' : 'Initialize'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Copy to Branch Modal */}
            {showCopyModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                        <div className="flex items-center space-x-4 mb-4">
                            <div className="p-3 bg-purple-100 rounded-full">
                                <Copy className="w-6 h-6 text-purple-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Copy to Branch</h3>
                                <p className="text-sm text-gray-500">Duplicate shift templates</p>
                            </div>
                        </div>
                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
                                <select
                                    value={copySourceBranch}
                                    onChange={(e) => setCopySourceBranch(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="global">Global (Default)</option>
                                    {branches.map(branch => (
                                        <option key={branch.id} value={branch.id}>{branch.center_name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Target Branch</label>
                                <select
                                    value={copyTargetBranch}
                                    onChange={(e) => setCopyTargetBranch(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="">Select target branch...</option>
                                    {branches.filter(b => b.id !== copySourceBranch).map(branch => (
                                        <option key={branch.id} value={branch.id}>{branch.center_name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex items-center">
                                <AlertCircle className="w-4 h-4 text-red-500 mr-2" />
                                <span className="text-sm text-red-700">{error}</span>
                            </div>
                        )}
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => {
                                    setShowCopyModal(false);
                                    setCopyTargetBranch('');
                                    setError(null);
                                }}
                                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCopyToBranch}
                                disabled={isSaving || !copyTargetBranch}
                                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                            >
                                {isSaving ? 'Copying...' : 'Copy'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ShiftTemplates;
