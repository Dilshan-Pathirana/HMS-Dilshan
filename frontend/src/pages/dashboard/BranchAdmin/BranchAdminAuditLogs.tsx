import { useState, useEffect } from 'react';
import api from "../../../utils/api/axios";
import { 
    ClipboardList, Search, Filter, Calendar, User, 
    Building2, FileText, AlertTriangle, RefreshCw,
    ChevronLeft, ChevronRight, Eye, Clock, Shield
} from 'lucide-react';

interface AuditLog {
    id: number;
    user_id: number;
    branch_id: number | null;
    entity_type: string;
    entity_id: number | null;
    transaction_id: number | null;
    action: string;
    module: string;
    severity: 'info' | 'warning' | 'critical';
    before_data: any;
    after_data: any;
    changes: any;
    ip_address: string;
    user_agent: string;
    created_at: string;
    user?: {
        id: number;
        first_name: string;
        last_name: string;
        email: string;
        role: string;
    };
    branch?: {
        id: number;
        center_name: string;
    };
}

interface Pagination {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

interface AuditStats {
    today: number;
    this_week: number;
    this_month: number;
    by_module: Record<string, number>;
    by_severity: Record<string, number>;
}

const BranchAdminAuditLogs = () => {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [stats, setStats] = useState<AuditStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
    const [showDetails, setShowDetails] = useState(false);

    // Filters
    const [filters, setFilters] = useState({
        module: '',
        action: '',
        severity: '',
        entity_type: '',
        start_date: '',
        end_date: '',
        search: '',
    });

    const modules = ['pos', 'eod', 'inventory', 'cashier', 'pharmacy', 'reports'];
    const actions = ['create', 'update', 'delete', 'void', 'approve', 'reject', 'flag', 'eod_submit', 'eod_approve', 'eod_reject'];
    const severities = ['info', 'warning', 'critical'];
    const entityTypes = ['billing_transaction', 'eod_report', 'product_stock', 'cash_drawer', 'report'];

    useEffect(() => {
        loadLogs();
        loadStats();
    }, []);

    const loadLogs = async (page = 1) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const params = new URLSearchParams();
            params.append('page', page.toString());
            
            if (filters.module) params.append('module', filters.module);
            if (filters.action) params.append('action', filters.action);
            if (filters.severity) params.append('severity', filters.severity);
            if (filters.entity_type) params.append('entity_type', filters.entity_type);
            if (filters.start_date) params.append('start_date', filters.start_date);
            if (filters.end_date) params.append('end_date', filters.end_date);
            if (filters.search) params.append('search', filters.search);

            const response = await api.get(`/branch-admin/audit/logs?${params.toString()}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.status === 200) {
                setLogs(response.data.data);
                setPagination(response.data.pagination);
            }
        } catch (error) {
            console.error('Failed to load audit logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadStats = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await api.get('/branch-admin/audit/stats', {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.status === 200) {
                setStats(response.data.data);
            }
        } catch (error) {
            console.error('Failed to load audit stats:', error);
        }
    };

    const handleFilter = () => {
        loadLogs(1);
    };

    const handleClearFilters = () => {
        setFilters({
            module: '',
            action: '',
            severity: '',
            entity_type: '',
            start_date: '',
            end_date: '',
            search: '',
        });
        loadLogs(1);
    };

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'critical': return 'bg-red-100 text-red-800';
            case 'warning': return 'bg-amber-100 text-amber-800';
            default: return 'bg-blue-100 text-blue-800';
        }
    };

    const getActionColor = (action: string) => {
        if (action.includes('create') || action.includes('approve')) return 'text-green-600';
        if (action.includes('delete') || action.includes('reject') || action.includes('void')) return 'text-red-600';
        if (action.includes('flag') || action.includes('warning')) return 'text-amber-600';
        return 'text-blue-600';
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    const formatAction = (action: string) => {
        return action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800 flex items-center">
                    <ClipboardList className="w-8 h-8 mr-3 text-blue-600" />
                    Audit Logs
                </h1>
                <p className="text-gray-600 mt-1">Track all system actions and changes</p>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-xl shadow-sm p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Today</p>
                                <p className="text-2xl font-bold text-gray-800">{stats.today}</p>
                            </div>
                            <Clock className="w-8 h-8 text-blue-500" />
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">This Week</p>
                                <p className="text-2xl font-bold text-gray-800">{stats.this_week}</p>
                            </div>
                            <Calendar className="w-8 h-8 text-green-500" />
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">This Month</p>
                                <p className="text-2xl font-bold text-gray-800">{stats.this_month}</p>
                            </div>
                            <FileText className="w-8 h-8 text-purple-500" />
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Critical Events</p>
                                <p className="text-2xl font-bold text-red-600">{stats.by_severity?.critical || 0}</p>
                            </div>
                            <AlertTriangle className="w-8 h-8 text-red-500" />
                        </div>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
                <div className="flex items-center mb-4">
                    <Filter className="w-5 h-5 text-gray-500 mr-2" />
                    <h3 className="font-semibold text-gray-700">Filters</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">Search</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search logs..."
                                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                value={filters.search}
                                onChange={(e) => setFilters({...filters, search: e.target.value})}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">Module</label>
                        <select
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            value={filters.module}
                            onChange={(e) => setFilters({...filters, module: e.target.value})}
                        >
                            <option value="">All Modules</option>
                            {modules.map(m => (
                                <option key={m} value={m}>{m.toUpperCase()}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">Action</label>
                        <select
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            value={filters.action}
                            onChange={(e) => setFilters({...filters, action: e.target.value})}
                        >
                            <option value="">All Actions</option>
                            {actions.map(a => (
                                <option key={a} value={a}>{formatAction(a)}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">Severity</label>
                        <select
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            value={filters.severity}
                            onChange={(e) => setFilters({...filters, severity: e.target.value})}
                        >
                            <option value="">All Severities</option>
                            {severities.map(s => (
                                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">Entity Type</label>
                        <select
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            value={filters.entity_type}
                            onChange={(e) => setFilters({...filters, entity_type: e.target.value})}
                        >
                            <option value="">All Types</option>
                            {entityTypes.map(t => (
                                <option key={t} value={t}>{t.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">Start Date</label>
                        <input
                            type="date"
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            value={filters.start_date}
                            onChange={(e) => setFilters({...filters, start_date: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">End Date</label>
                        <input
                            type="date"
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            value={filters.end_date}
                            onChange={(e) => setFilters({...filters, end_date: e.target.value})}
                        />
                    </div>
                    <div className="flex items-end gap-2">
                        <button
                            onClick={handleFilter}
                            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center"
                        >
                            <Search className="w-4 h-4 mr-2" />
                            Apply
                        </button>
                        <button
                            onClick={handleClearFilters}
                            className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Logs Table */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center">
                        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-500" />
                        <p className="mt-2 text-gray-500">Loading audit logs...</p>
                    </div>
                ) : logs.length === 0 ? (
                    <div className="p-8 text-center">
                        <ClipboardList className="w-12 h-12 mx-auto text-gray-300" />
                        <p className="mt-2 text-gray-500">No audit logs found</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entity</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Module</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Severity</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transaction</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {logs.map((log) => (
                                        <tr key={log.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 text-sm text-gray-600">
                                                {formatDate(log.created_at)}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center">
                                                    <User className="w-4 h-4 text-gray-400 mr-2" />
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-800">
                                                            {log.user ? `${log.user.first_name} ${log.user.last_name}` : `User #${log.user_id}`}
                                                        </p>
                                                        <p className="text-xs text-gray-500">{log.user?.role || 'Unknown'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`font-medium ${getActionColor(log.action)}`}>
                                                    {formatAction(log.action)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div>
                                                    <p className="text-sm text-gray-800">{log.entity_type?.replace(/_/g, ' ')}</p>
                                                    {log.entity_id && (
                                                        <p className="text-xs text-gray-500">ID: {log.entity_id}</p>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                                                    {log.module?.toUpperCase() || 'N/A'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-1 text-xs rounded-full ${getSeverityColor(log.severity)}`}>
                                                    {log.severity || 'info'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600">
                                                {log.transaction_id ? `#${log.transaction_id}` : '-'}
                                            </td>
                                            <td className="px-4 py-3">
                                                <button
                                                    onClick={() => { setSelectedLog(log); setShowDetails(true); }}
                                                    className="p-1 text-blue-600 hover:bg-blue-50 rounded"
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
                        {pagination && pagination.last_page > 1 && (
                            <div className="px-4 py-3 border-t flex items-center justify-between">
                                <p className="text-sm text-gray-500">
                                    Showing {((pagination.current_page - 1) * pagination.per_page) + 1} to {Math.min(pagination.current_page * pagination.per_page, pagination.total)} of {pagination.total}
                                </p>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => loadLogs(pagination.current_page - 1)}
                                        disabled={pagination.current_page === 1}
                                        className="p-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    <span className="text-sm text-gray-600">
                                        Page {pagination.current_page} of {pagination.last_page}
                                    </span>
                                    <button
                                        onClick={() => loadLogs(pagination.current_page + 1)}
                                        disabled={pagination.current_page === pagination.last_page}
                                        className="p-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Details Modal */}
            {showDetails && selectedLog && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
                        <div className="p-6 border-b">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                                    <Shield className="w-5 h-5 mr-2 text-blue-600" />
                                    Audit Log Details
                                </h3>
                                <button
                                    onClick={() => setShowDetails(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-gray-500 uppercase">Log ID</label>
                                    <p className="font-medium">{selectedLog.id}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 uppercase">Timestamp</label>
                                    <p className="font-medium">{formatDate(selectedLog.created_at)}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 uppercase">User</label>
                                    <p className="font-medium">
                                        {selectedLog.user ? `${selectedLog.user.first_name} ${selectedLog.user.last_name}` : `User #${selectedLog.user_id}`}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 uppercase">Role</label>
                                    <p className="font-medium">{selectedLog.user?.role || 'Unknown'}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 uppercase">Action</label>
                                    <p className={`font-medium ${getActionColor(selectedLog.action)}`}>
                                        {formatAction(selectedLog.action)}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 uppercase">Severity</label>
                                    <span className={`px-2 py-1 text-xs rounded-full ${getSeverityColor(selectedLog.severity)}`}>
                                        {selectedLog.severity}
                                    </span>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 uppercase">Module</label>
                                    <p className="font-medium">{selectedLog.module?.toUpperCase() || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 uppercase">Entity</label>
                                    <p className="font-medium">{selectedLog.entity_type} #{selectedLog.entity_id || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 uppercase">Transaction ID</label>
                                    <p className="font-medium">{selectedLog.transaction_id || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 uppercase">IP Address</label>
                                    <p className="font-medium">{selectedLog.ip_address || 'Unknown'}</p>
                                </div>
                            </div>

                            {selectedLog.before_data && (
                                <div>
                                    <label className="text-xs text-gray-500 uppercase block mb-2">Before Data</label>
                                    <pre className="bg-gray-100 p-3 rounded-lg text-sm overflow-x-auto">
                                        {JSON.stringify(selectedLog.before_data, null, 2)}
                                    </pre>
                                </div>
                            )}

                            {selectedLog.after_data && (
                                <div>
                                    <label className="text-xs text-gray-500 uppercase block mb-2">After Data</label>
                                    <pre className="bg-green-50 p-3 rounded-lg text-sm overflow-x-auto">
                                        {JSON.stringify(selectedLog.after_data, null, 2)}
                                    </pre>
                                </div>
                            )}

                            {selectedLog.changes && (
                                <div>
                                    <label className="text-xs text-gray-500 uppercase block mb-2">Changes</label>
                                    <pre className="bg-amber-50 p-3 rounded-lg text-sm overflow-x-auto">
                                        {JSON.stringify(selectedLog.changes, null, 2)}
                                    </pre>
                                </div>
                            )}

                            {selectedLog.user_agent && (
                                <div>
                                    <label className="text-xs text-gray-500 uppercase block mb-2">User Agent</label>
                                    <p className="text-sm text-gray-600 break-all">{selectedLog.user_agent}</p>
                                </div>
                            )}
                        </div>
                        <div className="p-6 border-t bg-gray-50">
                            <button
                                onClick={() => setShowDetails(false)}
                                className="w-full bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
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

export default BranchAdminAuditLogs;
