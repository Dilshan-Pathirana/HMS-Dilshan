import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    ArrowLeft, FileText, Search, Filter, Clock, User, Eye,
    Loader2, RefreshCw, AlertCircle, ChevronLeft, ChevronRight,
    X, Calendar, Activity, CheckCircle, XCircle, Edit, Trash2, Plus
} from 'lucide-react';
import api from "../../../../utils/api/axios";

interface AuditLog {
    id: number;
    user_id: number;
    user_name: string;
    user_role: string;
    action: string;
    entity_type: string;
    entity_id: number | null;
    entity_name: string | null;
    description: string;
    old_values: Record<string, any> | null;
    new_values: Record<string, any> | null;
    ip_address: string | null;
    created_at: string;
}

interface PaginationMeta {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

const BranchHRMAuditLogs: React.FC = () => {
    const navigate = useNavigate();
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [branchName, setBranchName] = useState<string>('');
    const [pagination, setPagination] = useState<PaginationMeta>({
        current_page: 1,
        last_page: 1,
        per_page: 20,
        total: 0
    });

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [actionFilter, setActionFilter] = useState('');
    const [entityFilter, setEntityFilter] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    // Modal
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

    const actions = ['create', 'update', 'delete', 'approve', 'reject', 'login', 'logout'];
    const entities = ['employee', 'leave', 'attendance', 'payslip', 'overtime', 'shift', 'deduction'];

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) {
            const user = JSON.parse(userData);
            setBranchName(user.branch?.name || 'Your Branch');
        }
    }, []);

    useEffect(() => {
        fetchLogs();
    }, [pagination.current_page, actionFilter, entityFilter, dateFrom, dateTo]);

    const fetchLogs = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('authToken');
            const params: Record<string, any> = {
                page: pagination.current_page,
                per_page: pagination.per_page
            };
            
            if (searchTerm) params.search = searchTerm;
            if (actionFilter) params.action = actionFilter;
            if (entityFilter) params.entity_type = entityFilter;
            if (dateFrom) params.date_from = dateFrom;
            if (dateTo) params.date_to = dateTo;

            const response = await api.get('/hrm/branch-admin/audit-logs', {
                headers: { Authorization: `Bearer ${token}` },
                params
            });

            if (response.data.status === 'success') {
                setLogs(response.data.data.data || response.data.data || []);
                if (response.data.data.meta) {
                    setPagination(response.data.data.meta);
                } else if (response.data.meta) {
                    setPagination(response.data.meta);
                }
            } else {
                setError(response.data.message || 'Failed to fetch audit logs');
            }
        } catch (err: any) {
            console.error('Error fetching audit logs:', err);
            setError(err.response?.data?.message || 'Failed to fetch audit logs');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = () => {
        setPagination(prev => ({ ...prev, current_page: 1 }));
        fetchLogs();
    };

    const clearFilters = () => {
        setSearchTerm('');
        setActionFilter('');
        setEntityFilter('');
        setDateFrom('');
        setDateTo('');
        setPagination(prev => ({ ...prev, current_page: 1 }));
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getActionIcon = (action: string) => {
        switch (action?.toLowerCase()) {
            case 'create': return <Plus className="w-4 h-4 text-emerald-500" />;
            case 'update': return <Edit className="w-4 h-4 text-blue-500" />;
            case 'delete': return <Trash2 className="w-4 h-4 text-red-500" />;
            case 'approve': return <CheckCircle className="w-4 h-4 text-emerald-500" />;
            case 'reject': return <XCircle className="w-4 h-4 text-red-500" />;
            default: return <Activity className="w-4 h-4 text-gray-500" />;
        }
    };

    const getActionBadge = (action: string) => {
        const badges: Record<string, string> = {
            'create': 'bg-emerald-100 text-emerald-700',
            'update': 'bg-blue-100 text-blue-700',
            'delete': 'bg-red-100 text-red-700',
            'approve': 'bg-green-100 text-green-700',
            'reject': 'bg-orange-100 text-orange-700',
            'login': 'bg-purple-100 text-purple-700',
            'logout': 'bg-gray-100 text-gray-700'
        };
        return badges[action?.toLowerCase()] || 'bg-gray-100 text-gray-700';
    };

    const formatRole = (role: string) => {
        if (!role) return 'Unknown';
        return role.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/branch-admin/hrm')}
                            className="p-2 hover:bg-gray-200 rounded-lg"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">HRM Audit Logs</h1>
                            <p className="text-gray-500">{branchName} - Activity Trail</p>
                        </div>
                    </div>
                    <button 
                        onClick={fetchLogs}
                        className="flex items-center gap-2 px-4 py-2 text-emerald-600 border border-emerald-200 rounded-lg hover:bg-emerald-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex-1 min-w-[250px]">
                            <div className="relative">
                                <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search by user, description..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>
                        </div>
                        <select 
                            className="px-4 py-2 border border-gray-300 rounded-lg"
                            value={actionFilter}
                            onChange={(e) => setActionFilter(e.target.value)}
                        >
                            <option value="">All Actions</option>
                            {actions.map(action => (
                                <option key={action} value={action}>{action.charAt(0).toUpperCase() + action.slice(1)}</option>
                            ))}
                        </select>
                        <select 
                            className="px-4 py-2 border border-gray-300 rounded-lg"
                            value={entityFilter}
                            onChange={(e) => setEntityFilter(e.target.value)}
                        >
                            <option value="">All Entities</option>
                            {entities.map(entity => (
                                <option key={entity} value={entity}>{entity.charAt(0).toUpperCase() + entity.slice(1)}</option>
                            ))}
                        </select>
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                placeholder="From"
                            />
                            <span className="text-gray-400">-</span>
                            <input
                                type="date"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                placeholder="To"
                            />
                        </div>
                        <button
                            onClick={clearFilters}
                            className="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                        >
                            Clear
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
                        <span className="ml-3 text-gray-600">Loading audit logs...</span>
                    </div>
                ) : (
                    <>
                        {/* Logs Table */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Timestamp</th>
                                        <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">User</th>
                                        <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Action</th>
                                        <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Entity</th>
                                        <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Description</th>
                                        <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Details</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {logs.length > 0 ? (
                                        logs.map((log) => (
                                            <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50">
                                                <td className="py-4 px-6">
                                                    <div className="flex items-center gap-2 text-gray-600">
                                                        <Clock className="w-4 h-4" />
                                                        <span className="text-sm">{formatDate(log.created_at)}</span>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                                                            {log.user_name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'NA'}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-800">{log.user_name || 'Unknown'}</p>
                                                            <p className="text-xs text-gray-500">{formatRole(log.user_role)}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <div className="flex items-center gap-2">
                                                        {getActionIcon(log.action)}
                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getActionBadge(log.action)}`}>
                                                            {log.action?.toUpperCase() || 'N/A'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <span className="text-gray-600 capitalize">{log.entity_type || 'N/A'}</span>
                                                    {log.entity_name && (
                                                        <p className="text-xs text-gray-400">{log.entity_name}</p>
                                                    )}
                                                </td>
                                                <td className="py-4 px-6">
                                                    <p className="text-sm text-gray-600 truncate max-w-xs">{log.description || 'N/A'}</p>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <button 
                                                        onClick={() => {
                                                            setSelectedLog(log);
                                                            setShowDetailModal(true);
                                                        }}
                                                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={6} className="py-12 text-center">
                                                <FileText className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                                                <p className="text-gray-500">No audit logs found</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {pagination.last_page > 1 && (
                            <div className="flex items-center justify-between mt-4">
                                <p className="text-sm text-gray-500">
                                    Showing {((pagination.current_page - 1) * pagination.per_page) + 1} to {Math.min(pagination.current_page * pagination.per_page, pagination.total)} of {pagination.total} logs
                                </p>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setPagination(prev => ({ ...prev, current_page: prev.current_page - 1 }))}
                                        disabled={pagination.current_page <= 1}
                                        className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    <span className="px-4 py-2 text-sm">
                                        Page {pagination.current_page} of {pagination.last_page}
                                    </span>
                                    <button
                                        onClick={() => setPagination(prev => ({ ...prev, current_page: prev.current_page + 1 }))}
                                        disabled={pagination.current_page >= pagination.last_page}
                                        className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Detail Modal */}
            {showDetailModal && selectedLog && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden">
                        <div className="bg-gradient-to-r from-emerald-500 to-blue-500 p-6 text-white flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-bold">Audit Log Details</h3>
                                <p className="opacity-90">ID: {selectedLog.id}</p>
                            </div>
                            <button 
                                onClick={() => {
                                    setShowDetailModal(false);
                                    setSelectedLog(null);
                                }}
                                className="p-2 hover:bg-white/20 rounded-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto max-h-[60vh] space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-500">Timestamp</p>
                                    <p className="font-medium">{formatDate(selectedLog.created_at)}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">User</p>
                                    <p className="font-medium">{selectedLog.user_name || 'Unknown'}</p>
                                    <p className="text-xs text-gray-400">{formatRole(selectedLog.user_role)}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Action</p>
                                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getActionBadge(selectedLog.action)}`}>
                                        {getActionIcon(selectedLog.action)}
                                        {selectedLog.action?.toUpperCase()}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Entity</p>
                                    <p className="font-medium capitalize">{selectedLog.entity_type}</p>
                                    {selectedLog.entity_name && (
                                        <p className="text-xs text-gray-400">{selectedLog.entity_name}</p>
                                    )}
                                </div>
                                <div className="col-span-2">
                                    <p className="text-sm text-gray-500">Description</p>
                                    <p className="font-medium">{selectedLog.description}</p>
                                </div>
                                {selectedLog.ip_address && (
                                    <div>
                                        <p className="text-sm text-gray-500">IP Address</p>
                                        <p className="font-medium font-mono text-sm">{selectedLog.ip_address}</p>
                                    </div>
                                )}
                            </div>

                            {(selectedLog.old_values || selectedLog.new_values) && (
                                <div className="pt-4 border-t">
                                    <h4 className="font-semibold text-gray-800 mb-3">Changes</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        {selectedLog.old_values && (
                                            <div>
                                                <p className="text-sm text-gray-500 mb-2">Old Values</p>
                                                <pre className="bg-red-50 p-3 rounded-lg text-xs overflow-x-auto text-red-800">
                                                    {JSON.stringify(selectedLog.old_values, null, 2)}
                                                </pre>
                                            </div>
                                        )}
                                        {selectedLog.new_values && (
                                            <div>
                                                <p className="text-sm text-gray-500 mb-2">New Values</p>
                                                <pre className="bg-emerald-50 p-3 rounded-lg text-xs overflow-x-auto text-emerald-800">
                                                    {JSON.stringify(selectedLog.new_values, null, 2)}
                                                </pre>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="bg-gray-50 px-6 py-4 flex justify-end">
                            <button 
                                onClick={() => {
                                    setShowDetailModal(false);
                                    setSelectedLog(null);
                                }}
                                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BranchHRMAuditLogs;
