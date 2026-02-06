import React, { useState, useEffect } from 'react';
import {
    FileText, Search, Filter, Calendar, Clock,
    User, Pill, Download, ChevronRight, Eye,
    RefreshCw, CheckCircle, AlertTriangle, Package, DollarSign
} from 'lucide-react';

interface AuditLogEntry {
    id: string;
    timestamp: string;
    action_type: 'dispensing' | 'inventory' | 'controlled' | 'adjustment' | 'login' | 'report' | 'billing';
    action: string;
    description: string;
    user: string;
    user_role: string;
    ip_address: string;
    related_entity?: string;
    old_value?: string;
    new_value?: string;
    status: 'success' | 'warning' | 'error';
}

export const PharmacistAuditLogs: React.FC = () => {
    const [logs, setLogs] = useState<AuditLogEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [filterDate, setFilterDate] = useState('today');
    const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

    useEffect(() => {
        fetchLogs();
    }, [filterType, filterDate]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const mockLogs: AuditLogEntry[] = [
                {
                    id: '1',
                    timestamp: '2025-12-18T11:30:00',
                    action_type: 'dispensing',
                    action: 'MEDICINE_DISPENSED',
                    description: 'Dispensed Amoxicillin 500mg x 21 to patient PAT-001',
                    user: 'Pharmacist N. Silva',
                    user_role: 'Pharmacist',
                    ip_address: '192.168.1.45',
                    related_entity: 'RX-2025-001234',
                    status: 'success'
                },
                {
                    id: '2',
                    timestamp: '2025-12-18T11:15:00',
                    action_type: 'controlled',
                    action: 'CONTROLLED_DRUG_DISPENSED',
                    description: 'Dispensed Morphine Sulfate 10mg x 10 - Controlled Drug Register updated',
                    user: 'Pharmacist N. Silva',
                    user_role: 'Pharmacist',
                    ip_address: '192.168.1.45',
                    related_entity: 'CD-REG-2025-0456',
                    status: 'success'
                },
                {
                    id: '3',
                    timestamp: '2025-12-18T10:45:00',
                    action_type: 'inventory',
                    action: 'STOCK_RECEIVED',
                    description: 'Received Paracetamol 500mg x 5000 from Supplier: Medical Supplies Ltd',
                    user: 'Pharmacist K. Jayawardena',
                    user_role: 'Pharmacist',
                    ip_address: '192.168.1.46',
                    related_entity: 'GRN-2025-0089',
                    old_value: '2500',
                    new_value: '7500',
                    status: 'success'
                },
                {
                    id: '4',
                    timestamp: '2025-12-18T10:30:00',
                    action_type: 'adjustment',
                    action: 'STOCK_ADJUSTED',
                    description: 'Stock adjustment for Omeprazole 20mg - Reason: Damaged during transport',
                    user: 'Pharmacist N. Silva',
                    user_role: 'Pharmacist',
                    ip_address: '192.168.1.45',
                    related_entity: 'ADJ-2025-0034',
                    old_value: '500',
                    new_value: '485',
                    status: 'warning'
                },
                {
                    id: '5',
                    timestamp: '2025-12-18T09:00:00',
                    action_type: 'login',
                    action: 'USER_LOGIN',
                    description: 'User login successful',
                    user: 'Pharmacist N. Silva',
                    user_role: 'Pharmacist',
                    ip_address: '192.168.1.45',
                    status: 'success'
                },
                {
                    id: '6',
                    timestamp: '2025-12-18T08:45:00',
                    action_type: 'report',
                    action: 'REPORT_GENERATED',
                    description: 'Generated Daily Dispensing Report for 2025-12-17',
                    user: 'Pharmacist K. Jayawardena',
                    user_role: 'Pharmacist',
                    ip_address: '192.168.1.46',
                    status: 'success'
                },
                {
                    id: '7',
                    timestamp: '2025-12-18T08:30:00',
                    action_type: 'billing',
                    action: 'BILL_VOIDED',
                    description: 'Bill INV-2025-0456 voided - Reason: Duplicate entry',
                    user: 'Pharmacist N. Silva',
                    user_role: 'Pharmacist',
                    ip_address: '192.168.1.45',
                    related_entity: 'INV-2025-0456',
                    status: 'warning'
                },
                {
                    id: '8',
                    timestamp: '2025-12-17T17:30:00',
                    action_type: 'dispensing',
                    action: 'DISPENSING_FAILED',
                    description: 'Dispensing failed - Insufficient stock for Metformin 500mg',
                    user: 'Pharmacist N. Silva',
                    user_role: 'Pharmacist',
                    ip_address: '192.168.1.45',
                    related_entity: 'RX-2025-001230',
                    status: 'error'
                }
            ];
            setLogs(mockLogs);
        } catch (error) {
            console.error('Error fetching logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const getActionTypeIcon = (type: string) => {
        switch (type) {
            case 'dispensing': return <Pill className="w-4 h-4" />;
            case 'inventory': return <Package className="w-4 h-4" />;
            case 'controlled': return <AlertTriangle className="w-4 h-4" />;
            case 'adjustment': return <RefreshCw className="w-4 h-4" />;
            case 'login': return <User className="w-4 h-4" />;
            case 'report': return <FileText className="w-4 h-4" />;
            case 'billing': return <DollarSign className="w-4 h-4" />;
            default: return <FileText className="w-4 h-4" />;
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />;
            case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
            case 'error': return <AlertTriangle className="w-4 h-4 text-error-500" />;
            default: return <CheckCircle className="w-4 h-4 text-neutral-500" />;
        }
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            'success': 'bg-green-100 text-green-800',
            'warning': 'bg-yellow-100 text-yellow-800',
            'error': 'bg-error-100 text-red-800'
        };
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
                {status.toUpperCase()}
            </span>
        );
    };

    const getActionTypeBadge = (type: string) => {
        const styles: Record<string, string> = {
            'dispensing': 'bg-blue-100 text-blue-800',
            'inventory': 'bg-purple-100 text-purple-800',
            'controlled': 'bg-error-100 text-red-800',
            'adjustment': 'bg-orange-100 text-orange-800',
            'login': 'bg-neutral-100 text-neutral-800',
            'report': 'bg-green-100 text-green-800',
            'billing': 'bg-cyan-100 text-cyan-800'
        };
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${styles[type]}`}>
                {getActionTypeIcon(type)}
                {type.toUpperCase()}
            </span>
        );
    };

    const filteredLogs = logs.filter(log => {
        const matchesSearch = log.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             log.user.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = filterType === 'all' || log.action_type === filterType;
        return matchesSearch && matchesType;
    });

    const stats = {
        total: logs.length,
        dispensing: logs.filter(l => l.action_type === 'dispensing').length,
        controlled: logs.filter(l => l.action_type === 'controlled').length,
        adjustments: logs.filter(l => l.action_type === 'adjustment').length
    };

    return (
        <div className="ml-0 md:ml-64 pt-24 min-h-screen bg-neutral-50">
            <div className="p-6">
                {/* Header */}
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
                            <FileText className="w-7 h-7 text-neutral-600" />
                            Audit Logs & Activity
                        </h1>
                        <p className="text-neutral-600">View immutable audit trail of all pharmacy activities</p>
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 bg-neutral-800 text-white rounded-lg hover:bg-neutral-900">
                        <Download className="w-4 h-4" />
                        Export Logs
                    </button>
                </div>

                {/* Important Notice */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-start gap-3">
                    <FileText className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-medium text-blue-800">Immutable Audit Trail</h4>
                        <p className="text-sm text-blue-700">
                            All log entries are permanent and cannot be modified or deleted. This ensures complete compliance with regulatory requirements and maintains chain of custody for all pharmacy activities.
                        </p>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-lg shadow p-4 border-l-4 border-gray-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-neutral-600">Total Actions</p>
                                <p className="text-2xl font-bold text-neutral-900">{stats.total}</p>
                            </div>
                            <FileText className="w-10 h-10 text-neutral-500" />
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-4 border-l-4 border-primary-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-neutral-600">Dispensing</p>
                                <p className="text-2xl font-bold text-neutral-900">{stats.dispensing}</p>
                            </div>
                            <Pill className="w-10 h-10 text-primary-500" />
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-4 border-l-4 border-error-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-neutral-600">Controlled Drugs</p>
                                <p className="text-2xl font-bold text-neutral-900">{stats.controlled}</p>
                            </div>
                            <AlertTriangle className="w-10 h-10 text-error-500" />
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-4 border-l-4 border-orange-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-neutral-600">Adjustments</p>
                                <p className="text-2xl font-bold text-neutral-900">{stats.adjustments}</p>
                            </div>
                            <RefreshCw className="w-10 h-10 text-orange-500" />
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-lg shadow p-4 mb-6">
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="relative flex-1 min-w-[200px] max-w-md">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
                            <input
                                type="text"
                                placeholder="Search logs..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-gray-500"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Filter className="w-5 h-5 text-neutral-400" />
                            <select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                                className="px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-gray-500"
                            >
                                <option value="all">All Types</option>
                                <option value="dispensing">Dispensing</option>
                                <option value="inventory">Inventory</option>
                                <option value="controlled">Controlled Drugs</option>
                                <option value="adjustment">Adjustments</option>
                                <option value="login">Login Activity</option>
                                <option value="report">Reports</option>
                                <option value="billing">Billing</option>
                            </select>
                        </div>
                        <div className="flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-neutral-400" />
                            <select
                                value={filterDate}
                                onChange={(e) => setFilterDate(e.target.value)}
                                className="px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-gray-500"
                            >
                                <option value="today">Today</option>
                                <option value="yesterday">Yesterday</option>
                                <option value="week">Last 7 Days</option>
                                <option value="month">Last 30 Days</option>
                                <option value="custom">Custom Range</option>
                            </select>
                        </div>
                        <button
                            onClick={fetchLogs}
                            className="flex items-center gap-2 px-4 py-2 bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Refresh
                        </button>
                    </div>
                </div>

                {/* Logs Table */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    {loading ? (
                        <div className="p-12 text-center">
                            <RefreshCw className="w-8 h-8 animate-spin text-neutral-600 mx-auto mb-2" />
                            Loading audit logs...
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-neutral-50 border-b">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                                            Timestamp
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                                            Type
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                                            Description
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                                            User
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {filteredLogs.map((log) => (
                                        <tr key={log.id} className="hover:bg-neutral-50">
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Clock className="w-4 h-4 text-neutral-400" />
                                                    <div>
                                                        <div className="text-neutral-900">
                                                            {new Date(log.timestamp).toLocaleTimeString()}
                                                        </div>
                                                        <div className="text-neutral-500 text-xs">
                                                            {new Date(log.timestamp).toLocaleDateString()}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                {getActionTypeBadge(log.action_type)}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="text-sm text-neutral-900 max-w-md">
                                                    {log.description}
                                                </div>
                                                {log.related_entity && (
                                                    <div className="text-xs text-primary-500 mt-1">
                                                        Ref: {log.related_entity}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 bg-neutral-100 rounded-full flex items-center justify-center">
                                                        <User className="w-4 h-4 text-neutral-600" />
                                                    </div>
                                                    <div>
                                                        <div className="text-sm text-neutral-900">{log.user}</div>
                                                        <div className="text-xs text-neutral-500">{log.ip_address}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    {getStatusIcon(log.status)}
                                                    {getStatusBadge(log.status)}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <button
                                                    onClick={() => setSelectedLog(log)}
                                                    className="p-2 text-neutral-400 hover:text-primary-500 hover:bg-blue-50 rounded"
                                                    title="View Details"
                                                >
                                                    <Eye className="w-5 h-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Pagination */}
                <div className="mt-4 flex items-center justify-between">
                    <div className="text-sm text-neutral-500">
                        Showing {filteredLogs.length} of {logs.length} entries
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="px-3 py-1 border border-neutral-300 rounded hover:bg-neutral-50 disabled:opacity-50" disabled>
                            Previous
                        </button>
                        <button className="px-3 py-1 bg-neutral-800 text-white rounded">1</button>
                        <button className="px-3 py-1 border border-neutral-300 rounded hover:bg-neutral-50">2</button>
                        <button className="px-3 py-1 border border-neutral-300 rounded hover:bg-neutral-50">3</button>
                        <button className="px-3 py-1 border border-neutral-300 rounded hover:bg-neutral-50">
                            Next
                        </button>
                    </div>
                </div>

                {/* Log Detail Modal */}
                {selectedLog && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
                            <div className="p-4 border-b flex items-center justify-between sticky top-0 bg-white">
                                <h3 className="font-semibold text-neutral-900 flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-neutral-600" />
                                    Audit Log Details
                                </h3>
                                <button
                                    onClick={() => setSelectedLog(null)}
                                    className="text-neutral-400 hover:text-neutral-600 text-2xl"
                                >
                                    &times;
                                </button>
                            </div>
                            <div className="p-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="text-xs text-neutral-500 uppercase">Timestamp</label>
                                        <p className="text-neutral-900 font-medium">
                                            {new Date(selectedLog.timestamp).toLocaleString()}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-xs text-neutral-500 uppercase">Action Type</label>
                                        <div className="mt-1">{getActionTypeBadge(selectedLog.action_type)}</div>
                                    </div>
                                    <div>
                                        <label className="text-xs text-neutral-500 uppercase">Action</label>
                                        <p className="text-neutral-900 font-mono text-sm">{selectedLog.action}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs text-neutral-500 uppercase">Status</label>
                                        <div className="mt-1">{getStatusBadge(selectedLog.status)}</div>
                                    </div>
                                    <div className="col-span-2">
                                        <label className="text-xs text-neutral-500 uppercase">Description</label>
                                        <p className="text-neutral-900">{selectedLog.description}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs text-neutral-500 uppercase">User</label>
                                        <p className="text-neutral-900">{selectedLog.user}</p>
                                        <p className="text-sm text-neutral-500">{selectedLog.user_role}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs text-neutral-500 uppercase">IP Address</label>
                                        <p className="text-neutral-900 font-mono text-sm">{selectedLog.ip_address}</p>
                                    </div>
                                    {selectedLog.related_entity && (
                                        <div>
                                            <label className="text-xs text-neutral-500 uppercase">Related Entity</label>
                                            <p className="text-primary-500">{selectedLog.related_entity}</p>
                                        </div>
                                    )}
                                    {selectedLog.old_value && (
                                        <div>
                                            <label className="text-xs text-neutral-500 uppercase">Old Value</label>
                                            <p className="text-neutral-900">{selectedLog.old_value}</p>
                                        </div>
                                    )}
                                    {selectedLog.new_value && (
                                        <div>
                                            <label className="text-xs text-neutral-500 uppercase">New Value</label>
                                            <p className="text-neutral-900">{selectedLog.new_value}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="p-4 border-t flex justify-end">
                                <button
                                    onClick={() => setSelectedLog(null)}
                                    className="px-4 py-2 text-neutral-600 border border-neutral-300 rounded-lg hover:bg-neutral-50"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PharmacistAuditLogs;
