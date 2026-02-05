import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from "../../utils/api/axios";
import { 
    ArrowLeft, 
    FileText, 
    Search, 
    Filter, 
    Download, 
    RefreshCw,
    Calendar,
    User,
    Building2,
    Clock,
    Eye,
    ChevronLeft,
    ChevronRight,
    Activity,
    TrendingUp,
    Users,
    Shield,
    AlertCircle,
    X,
    Info
} from 'lucide-react';

interface AuditLog {
    id: string;
    user_id: string;
    user_name: string;
    user_email: string;
    user_role: string;
    target_user_id: string | null;
    target_user_name: string | null;
    target_user_email: string | null;
    branch_id: string | null;
    branch_name: string | null;
    action_type: string;
    entity_type: string;
    entity_id: string | null;
    old_values: Record<string, unknown> | null;
    new_values: Record<string, unknown> | null;
    description: string | null;
    ip_address: string | null;
    user_agent: string | null;
    created_at: string;
}

interface AuditStats {
    total_logs: number;
    today_count: number;
    this_week_count: number;
    this_month_count: number;
    by_action_type: { action_type: string; count: number }[];
    by_entity_type: { entity_type: string; count: number }[];
    by_branch: { branch_name: string; count: number }[];
    recent_activity: { id: string; action_type: string; entity_type: string; description: string; user_name: string; created_at: string }[];
    top_users: { name: string; email: string; count: number }[];
}

interface FilterOptions {
    action_types: string[];
    entity_types: string[];
    users: { id: string; name: string; email: string }[];
    branches: { id: string; center_name: string }[];
    action_type_labels: Record<string, string>;
    entity_type_labels: Record<string, string>;
}

interface PaginationMeta {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

const API_BASE = '/api/hrm/super-admin';

const HRMAuditLogs: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [stats, setStats] = useState<AuditStats | null>(null);
    const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
    const [meta, setMeta] = useState<PaginationMeta>({ current_page: 1, last_page: 1, per_page: 20, total: 0 });
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
    const [showFilters, setShowFilters] = useState(false);
    const [activeTab, setActiveTab] = useState<'logs' | 'stats'>('logs');

    // Filters
    const [search, setSearch] = useState('');
    const [actionType, setActionType] = useState('');
    const [entityType, setEntityType] = useState('');
    const [branchId, setBranchId] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [page, setPage] = useState(1);

    const getAuthHeaders = () => {
        const token = localStorage.getItem('token');
        return { Authorization: `Bearer ${token}` };
    };

    useEffect(() => {
        fetchFilterOptions();
        fetchStats();
    }, []);

    useEffect(() => {
        fetchLogs();
    }, [page, actionType, entityType, branchId, startDate, endDate]);

    useEffect(() => {
        const debounce = setTimeout(() => {
            if (page !== 1) setPage(1);
            else fetchLogs();
        }, 300);
        return () => clearTimeout(debounce);
    }, [search]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.append('page', page.toString());
            params.append('per_page', '20');
            if (search) params.append('search', search);
            if (actionType) params.append('action_type', actionType);
            if (entityType) params.append('entity_type', entityType);
            if (branchId) params.append('branch_id', branchId);
            if (startDate) params.append('start_date', startDate);
            if (endDate) params.append('end_date', endDate);

            const response = await api.get(`${API_BASE}/audit-logs?${params.toString()}`, {
                headers: getAuthHeaders()
            });

            if (response.data.status === 'success') {
                setLogs(response.data.data);
                setMeta(response.data.meta);
            }
        } catch (error) {
            console.error('Error fetching audit logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await api.get(`${API_BASE}/audit-logs/stats`, {
                headers: getAuthHeaders()
            });
            if (response.data.status === 'success') {
                setStats(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching audit stats:', error);
        }
    };

    const fetchFilterOptions = async () => {
        try {
            const response = await api.get(`${API_BASE}/audit-logs/filters`, {
                headers: getAuthHeaders()
            });
            if (response.data.status === 'success') {
                setFilterOptions(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching filter options:', error);
        }
    };

    const handleExport = async () => {
        setExporting(true);
        try {
            const params = new URLSearchParams();
            if (actionType) params.append('action_type', actionType);
            if (entityType) params.append('entity_type', entityType);
            if (branchId) params.append('branch_id', branchId);
            if (startDate) params.append('start_date', startDate);
            if (endDate) params.append('end_date', endDate);

            const response = await api.get(`${API_BASE}/audit-logs/export?${params.toString()}`, {
                headers: getAuthHeaders()
            });

            if (response.data.status === 'success') {
                const data = response.data.data;
                const csv = convertToCSV(data);
                downloadCSV(csv, `hrm_audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
            }
        } catch (error) {
            console.error('Error exporting audit logs:', error);
        } finally {
            setExporting(false);
        }
    };

    const convertToCSV = (data: unknown[]) => {
        if (data.length === 0) return '';
        const headers = Object.keys(data[0] as object).join(',');
        const rows = data.map(row => 
            Object.values(row as object).map(v => 
                typeof v === 'string' ? `"${v.replace(/"/g, '""')}"` : v
            ).join(',')
        );
        return [headers, ...rows].join('\n');
    };

    const downloadCSV = (csv: string, filename: string) => {
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
    };

    const formatActionType = (action: string): string => {
        if (!action) return 'N/A';
        if (filterOptions?.action_type_labels?.[action]) {
            return filterOptions.action_type_labels[action];
        }
        return action.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    };

    const formatEntityType = (entity: string): string => {
        if (!entity) return 'N/A';
        if (filterOptions?.entity_type_labels?.[entity]) {
            return filterOptions.entity_type_labels[entity];
        }
        return entity.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    };

    const formatRole = (role: string | null | undefined): string => {
        if (!role || typeof role !== 'string') return 'N/A';
        return role.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    };

    const formatDate = (date: string): string => {
        return new Date(date).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getActionColor = (action: string): string => {
        const colors: Record<string, string> = {
            salary_change: 'bg-purple-100 text-purple-800',
            salary_increment: 'bg-green-100 text-green-800',
            leave_approved: 'bg-green-100 text-green-800',
            leave_rejected: 'bg-red-100 text-red-800',
            payroll_generated: 'bg-blue-100 text-blue-800',
            employee_created: 'bg-emerald-100 text-emerald-800',
            employee_terminated: 'bg-red-100 text-red-800',
            config_changed: 'bg-yellow-100 text-yellow-800',
            data_export: 'bg-indigo-100 text-indigo-800',
        };
        return colors[action] || 'bg-gray-100 text-gray-800';
    };

    const clearFilters = () => {
        setSearch('');
        setActionType('');
        setEntityType('');
        setBranchId('');
        setStartDate('');
        setEndDate('');
        setPage(1);
    };

    const renderLogDetails = () => {
        if (!selectedLog) return null;

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                    <div className="flex items-center justify-between p-6 border-b">
                        <h3 className="text-xl font-semibold text-gray-900">Audit Log Details</h3>
                        <button onClick={() => setSelectedLog(null)} className="text-gray-400 hover:text-gray-600">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                    <div className="p-6 space-y-6">
                        {/* Action Info */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm text-gray-500">Action Type</label>
                                <p className="font-medium">{formatActionType(selectedLog.action_type)}</p>
                            </div>
                            <div>
                                <label className="text-sm text-gray-500">Entity Type</label>
                                <p className="font-medium">{formatEntityType(selectedLog.entity_type)}</p>
                            </div>
                            <div>
                                <label className="text-sm text-gray-500">Date & Time</label>
                                <p className="font-medium">{formatDate(selectedLog.created_at)}</p>
                            </div>
                            <div>
                                <label className="text-sm text-gray-500">Branch</label>
                                <p className="font-medium">{selectedLog.branch_name || 'N/A'}</p>
                            </div>
                        </div>

                        {/* Performed By */}
                        <div className="bg-blue-50 p-4 rounded-lg">
                            <h4 className="font-medium text-blue-900 mb-2">Performed By</h4>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <p><span className="text-blue-700">Name:</span> {selectedLog.user_name}</p>
                                <p><span className="text-blue-700">Email:</span> {selectedLog.user_email}</p>
                                <p><span className="text-blue-700">Role:</span> {formatRole(selectedLog.user_role)}</p>
                                <p><span className="text-blue-700">IP:</span> {selectedLog.ip_address || 'N/A'}</p>
                            </div>
                        </div>

                        {/* Affected Employee */}
                        {selectedLog.target_user_name && (
                            <div className="bg-amber-50 p-4 rounded-lg">
                                <h4 className="font-medium text-amber-900 mb-2">Affected Employee</h4>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <p><span className="text-amber-700">Name:</span> {selectedLog.target_user_name}</p>
                                    <p><span className="text-amber-700">Email:</span> {selectedLog.target_user_email}</p>
                                </div>
                            </div>
                        )}

                        {/* Description */}
                        {selectedLog.description && (
                            <div>
                                <label className="text-sm text-gray-500">Description</label>
                                <p className="mt-1 text-gray-900">{selectedLog.description}</p>
                            </div>
                        )}

                        {/* Old vs New Values */}
                        {(selectedLog.old_values || selectedLog.new_values) && (
                            <div className="grid grid-cols-2 gap-4">
                                {selectedLog.old_values && (
                                    <div className="bg-red-50 p-4 rounded-lg">
                                        <h4 className="font-medium text-red-900 mb-2">Previous Values</h4>
                                        <pre className="text-xs text-red-800 overflow-auto max-h-48">
                                            {JSON.stringify(selectedLog.old_values, null, 2)}
                                        </pre>
                                    </div>
                                )}
                                {selectedLog.new_values && (
                                    <div className="bg-green-50 p-4 rounded-lg">
                                        <h4 className="font-medium text-green-900 mb-2">New Values</h4>
                                        <pre className="text-xs text-green-800 overflow-auto max-h-48">
                                            {JSON.stringify(selectedLog.new_values, null, 2)}
                                        </pre>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            {/* Header */}
            <div className="mb-6">
                <button
                    onClick={() => navigate('/super-admin/hrm')}
                    className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to HRM Dashboard
                </button>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <Shield className="w-7 h-7 text-purple-600" />
                            HRM Audit Logs
                        </h1>
                        <p className="text-gray-600 mt-1">Track all HR activities and changes for compliance</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleExport}
                            disabled={exporting}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                        >
                            <Download className="w-4 h-4" />
                            {exporting ? 'Exporting...' : 'Export CSV'}
                        </button>
                        <button
                            onClick={() => { fetchLogs(); fetchStats(); }}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Refresh
                        </button>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6">
                <button
                    onClick={() => setActiveTab('logs')}
                    className={`px-4 py-2 rounded-lg font-medium transition ${
                        activeTab === 'logs' 
                            ? 'bg-purple-600 text-white' 
                            : 'bg-white text-gray-600 hover:bg-gray-100'
                    }`}
                >
                    <FileText className="w-4 h-4 inline mr-2" />
                    Audit Logs
                </button>
                <button
                    onClick={() => setActiveTab('stats')}
                    className={`px-4 py-2 rounded-lg font-medium transition ${
                        activeTab === 'stats' 
                            ? 'bg-purple-600 text-white' 
                            : 'bg-white text-gray-600 hover:bg-gray-100'
                    }`}
                >
                    <Activity className="w-4 h-4 inline mr-2" />
                    Statistics
                </button>
            </div>

            {activeTab === 'stats' && stats && (
                <div className="space-y-6">
                    {/* Quick Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">Total Logs</p>
                                    <p className="text-2xl font-bold text-gray-900">{stats.total_logs.toLocaleString()}</p>
                                </div>
                                <div className="bg-purple-100 p-3 rounded-full">
                                    <FileText className="w-6 h-6 text-purple-600" />
                                </div>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">Today</p>
                                    <p className="text-2xl font-bold text-blue-600">{stats.today_count}</p>
                                </div>
                                <div className="bg-blue-100 p-3 rounded-full">
                                    <Calendar className="w-6 h-6 text-blue-600" />
                                </div>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">This Week</p>
                                    <p className="text-2xl font-bold text-green-600">{stats.this_week_count}</p>
                                </div>
                                <div className="bg-green-100 p-3 rounded-full">
                                    <TrendingUp className="w-6 h-6 text-green-600" />
                                </div>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">This Month</p>
                                    <p className="text-2xl font-bold text-amber-600">{stats.this_month_count}</p>
                                </div>
                                <div className="bg-amber-100 p-3 rounded-full">
                                    <Activity className="w-6 h-6 text-amber-600" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Charts/Lists Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* By Action Type */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">By Action Type</h3>
                            <div className="space-y-3">
                                {stats.by_action_type.slice(0, 8).map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between">
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${getActionColor(item.action_type)}`}>
                                            {formatActionType(item.action_type)}
                                        </span>
                                        <span className="text-gray-900 font-medium">{item.count}</span>
                                    </div>
                                ))}
                                {stats.by_action_type.length === 0 && (
                                    <p className="text-gray-500 text-sm">No data available</p>
                                )}
                            </div>
                        </div>

                        {/* By Entity Type */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">By Entity Type</h3>
                            <div className="space-y-3">
                                {stats.by_entity_type.map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between">
                                        <span className="text-gray-700">{formatEntityType(item.entity_type)}</span>
                                        <div className="flex items-center gap-2">
                                            <div className="w-32 bg-gray-200 rounded-full h-2">
                                                <div 
                                                    className="bg-purple-600 h-2 rounded-full" 
                                                    style={{ width: `${Math.min((item.count / stats.total_logs) * 100, 100)}%` }}
                                                />
                                            </div>
                                            <span className="text-gray-900 font-medium w-12 text-right">{item.count}</span>
                                        </div>
                                    </div>
                                ))}
                                {stats.by_entity_type.length === 0 && (
                                    <p className="text-gray-500 text-sm">No data available</p>
                                )}
                            </div>
                        </div>

                        {/* Top Active Users */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <Users className="w-5 h-5" />
                                Top Active Users
                            </h3>
                            <div className="space-y-3">
                                {stats.top_users?.map((user, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                                        <div>
                                            <p className="font-medium text-gray-900">{user.name}</p>
                                            <p className="text-xs text-gray-500">{user.email}</p>
                                        </div>
                                        <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                                            {user.count} actions
                                        </span>
                                    </div>
                                ))}
                                {(!stats.top_users || stats.top_users.length === 0) && (
                                    <p className="text-gray-500 text-sm">No data available</p>
                                )}
                            </div>
                        </div>

                        {/* By Branch */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <Building2 className="w-5 h-5" />
                                Activity by Branch
                            </h3>
                            <div className="space-y-3">
                                {stats.by_branch?.map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                                        <span className="text-gray-700">{item.branch_name || 'Unknown'}</span>
                                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                                            {item.count}
                                        </span>
                                    </div>
                                ))}
                                {(!stats.by_branch || stats.by_branch.length === 0) && (
                                    <p className="text-gray-500 text-sm">No branch data available</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Clock className="w-5 h-5" />
                            Recent Activity
                        </h3>
                        <div className="space-y-2">
                            {stats.recent_activity?.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                                    <div className="flex items-center gap-3">
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${getActionColor(item.action_type)}`}>
                                            {formatActionType(item.action_type)}
                                        </span>
                                        <span className="text-gray-600 text-sm">
                                            {item.description || `${formatEntityType(item.entity_type)} activity`}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-sm text-gray-500">{item.user_name}</span>
                                        <span className="text-xs text-gray-400">{formatDate(item.created_at)}</span>
                                    </div>
                                </div>
                            ))}
                            {(!stats.recent_activity || stats.recent_activity.length === 0) && (
                                <p className="text-gray-500 text-sm text-center py-4">No recent activity</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'logs' && (
                <div className="space-y-4">
                    {/* Search and Filters */}
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex flex-wrap gap-4 items-center">
                            <div className="flex-1 min-w-[200px]">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <input
                                        type="text"
                                        placeholder="Search logs..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    />
                                </div>
                            </div>
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${
                                    showFilters ? 'bg-purple-50 border-purple-200 text-purple-700' : 'border-gray-200 text-gray-600'
                                }`}
                            >
                                <Filter className="w-4 h-4" />
                                Filters
                                {(actionType || entityType || branchId || startDate || endDate) && (
                                    <span className="bg-purple-600 text-white text-xs px-2 py-0.5 rounded-full">Active</span>
                                )}
                            </button>
                            {(actionType || entityType || branchId || startDate || endDate) && (
                                <button
                                    onClick={clearFilters}
                                    className="text-sm text-red-600 hover:text-red-800"
                                >
                                    Clear All
                                </button>
                            )}
                        </div>

                        {/* Filter Panel */}
                        {showFilters && (
                            <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Action Type</label>
                                    <select
                                        value={actionType}
                                        onChange={(e) => { setActionType(e.target.value); setPage(1); }}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500"
                                    >
                                        <option value="">All Actions</option>
                                        {filterOptions?.action_types.map(type => (
                                            <option key={type} value={type}>{formatActionType(type)}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Entity Type</label>
                                    <select
                                        value={entityType}
                                        onChange={(e) => { setEntityType(e.target.value); setPage(1); }}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500"
                                    >
                                        <option value="">All Entities</option>
                                        {filterOptions?.entity_types.map(type => (
                                            <option key={type} value={type}>{formatEntityType(type)}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
                                    <select
                                        value={branchId}
                                        onChange={(e) => { setBranchId(e.target.value); setPage(1); }}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500"
                                    >
                                        <option value="">All Branches</option>
                                        {filterOptions?.branches.map(branch => (
                                            <option key={branch.id} value={branch.id}>{branch.center_name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Logs Table */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <RefreshCw className="w-8 h-8 animate-spin text-purple-600" />
                            </div>
                        ) : logs.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                                <AlertCircle className="w-12 h-12 mb-4" />
                                <p className="text-lg font-medium">No audit logs found</p>
                                <p className="text-sm">Try adjusting your filters or search criteria</p>
                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50 border-b border-gray-100">
                                            <tr>
                                                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Date/Time</th>
                                                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Action</th>
                                                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Entity</th>
                                                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Performed By</th>
                                                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Affected</th>
                                                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Branch</th>
                                                <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Details</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {logs.map((log) => (
                                                <tr key={log.id} className="hover:bg-gray-50 transition">
                                                    <td className="py-3 px-4">
                                                        <div className="flex items-center gap-2">
                                                            <Clock className="w-4 h-4 text-gray-400" />
                                                            <span className="text-sm text-gray-900">{formatDate(log.created_at)}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${getActionColor(log.action_type)}`}>
                                                            {formatActionType(log.action_type)}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <span className="text-sm text-gray-700">{formatEntityType(log.entity_type)}</span>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <div className="flex items-center gap-2">
                                                            <User className="w-4 h-4 text-gray-400" />
                                                            <div>
                                                                <p className="text-sm font-medium text-gray-900">{log.user_name}</p>
                                                                <p className="text-xs text-gray-500">{formatRole(log.user_role)}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        {log.target_user_name ? (
                                                            <span className="text-sm text-gray-700">{log.target_user_name}</span>
                                                        ) : (
                                                            <span className="text-sm text-gray-400">-</span>
                                                        )}
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        {log.branch_name ? (
                                                            <div className="flex items-center gap-1">
                                                                <Building2 className="w-3 h-3 text-gray-400" />
                                                                <span className="text-sm text-gray-700">{log.branch_name}</span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-sm text-gray-400">-</span>
                                                        )}
                                                    </td>
                                                    <td className="py-3 px-4 text-center">
                                                        <button
                                                            onClick={() => setSelectedLog(log)}
                                                            className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition"
                                                            title="View Details"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination */}
                                <div className="flex items-center justify-between p-4 border-t border-gray-100">
                                    <p className="text-sm text-gray-500">
                                        Showing {((meta.current_page - 1) * meta.per_page) + 1} to {Math.min(meta.current_page * meta.per_page, meta.total)} of {meta.total} entries
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setPage(p => Math.max(1, p - 1))}
                                            disabled={meta.current_page <= 1}
                                            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                        </button>
                                        <span className="text-sm text-gray-600">
                                            Page {meta.current_page} of {meta.last_page}
                                        </span>
                                        <button
                                            onClick={() => setPage(p => Math.min(meta.last_page, p + 1))}
                                            disabled={meta.current_page >= meta.last_page}
                                            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Info Box */}
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
                        <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                        <div className="text-sm text-blue-800">
                            <p className="font-medium">About Audit Logs</p>
                            <p className="mt-1">
                                Audit logs automatically track all HR-related activities including salary changes, leave approvals, 
                                payroll generation, and configuration updates. This ensures compliance and provides a complete 
                                trail of all HR operations.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Log Details Modal */}
            {selectedLog && renderLogDetails()}
        </div>
    );
};

export default HRMAuditLogs;
