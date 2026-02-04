import React, { useState, useEffect } from 'react';
import {
    Bell, AlertTriangle, Package, Clock, CheckCircle,
    X, Eye, Filter, RefreshCw, Settings, Volume2, VolumeX
} from 'lucide-react';

interface Alert {
    id: string;
    type: 'low_stock' | 'expiry' | 'clarification' | 'controlled' | 'system';
    title: string;
    message: string;
    severity: 'critical' | 'warning' | 'info';
    timestamp: string;
    is_read: boolean;
    action_required: boolean;
    related_item?: string;
}

interface AlertStats {
    total: number;
    unread: number;
    critical: number;
    action_required: number;
}

export const PharmacistAlerts: React.FC = () => {
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [stats, setStats] = useState<AlertStats>({
        total: 0,
        unread: 0,
        critical: 0,
        action_required: 0
    });
    const [loading, setLoading] = useState(false);
    const [filterType, setFilterType] = useState('all');
    const [filterSeverity, setFilterSeverity] = useState('all');
    const [showReadAlerts, setShowReadAlerts] = useState(true);
    const [soundEnabled, setSoundEnabled] = useState(true);

    useEffect(() => {
        fetchAlerts();
    }, []);

    const fetchAlerts = async () => {
        setLoading(true);
        try {
            const mockAlerts: Alert[] = [
                {
                    id: '1',
                    type: 'low_stock',
                    title: 'Critical Low Stock',
                    message: 'Paracetamol 500mg stock is below minimum level (Current: 50, Min: 100)',
                    severity: 'critical',
                    timestamp: '2025-12-18T10:30:00',
                    is_read: false,
                    action_required: true,
                    related_item: 'Paracetamol 500mg'
                },
                {
                    id: '2',
                    type: 'expiry',
                    title: 'Near Expiry Alert',
                    message: 'Amoxicillin 250mg Batch AMX-2025-001 expires in 30 days',
                    severity: 'warning',
                    timestamp: '2025-12-18T09:15:00',
                    is_read: false,
                    action_required: true,
                    related_item: 'Amoxicillin 250mg'
                },
                {
                    id: '3',
                    type: 'clarification',
                    title: 'Prescription Clarification',
                    message: 'Dr. Silva has responded to clarification request for RX-2025-001234',
                    severity: 'info',
                    timestamp: '2025-12-18T08:45:00',
                    is_read: true,
                    action_required: false
                },
                {
                    id: '4',
                    type: 'controlled',
                    title: 'Controlled Drug Threshold',
                    message: 'Morphine Sulfate 10mg stock approaching reorder level',
                    severity: 'warning',
                    timestamp: '2025-12-18T07:30:00',
                    is_read: false,
                    action_required: true,
                    related_item: 'Morphine Sulfate 10mg'
                },
                {
                    id: '5',
                    type: 'system',
                    title: 'System Notification',
                    message: 'Scheduled maintenance window: Tonight 11 PM - 2 AM',
                    severity: 'info',
                    timestamp: '2025-12-18T06:00:00',
                    is_read: true,
                    action_required: false
                },
                {
                    id: '6',
                    type: 'low_stock',
                    title: 'Out of Stock',
                    message: 'Metformin 500mg is completely out of stock',
                    severity: 'critical',
                    timestamp: '2025-12-18T11:00:00',
                    is_read: false,
                    action_required: true,
                    related_item: 'Metformin 500mg'
                }
            ];
            setAlerts(mockAlerts);
            setStats({
                total: mockAlerts.length,
                unread: mockAlerts.filter(a => !a.is_read).length,
                critical: mockAlerts.filter(a => a.severity === 'critical').length,
                action_required: mockAlerts.filter(a => a.action_required).length
            });
        } catch (error) {
            console.error('Error fetching alerts:', error);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = (alertId: string) => {
        setAlerts(prev => prev.map(alert => 
            alert.id === alertId ? { ...alert, is_read: true } : alert
        ));
        setStats(prev => ({
            ...prev,
            unread: prev.unread - 1
        }));
    };

    const markAllAsRead = () => {
        setAlerts(prev => prev.map(alert => ({ ...alert, is_read: true })));
        setStats(prev => ({ ...prev, unread: 0 }));
    };

    const dismissAlert = (alertId: string) => {
        setAlerts(prev => prev.filter(alert => alert.id !== alertId));
    };

    const getSeverityIcon = (severity: string) => {
        switch (severity) {
            case 'critical': return <AlertTriangle className="w-5 h-5 text-red-500" />;
            case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
            default: return <Bell className="w-5 h-5 text-blue-500" />;
        }
    };

    const getSeverityStyles = (severity: string) => {
        switch (severity) {
            case 'critical': return 'border-l-4 border-red-500 bg-red-50';
            case 'warning': return 'border-l-4 border-yellow-500 bg-yellow-50';
            default: return 'border-l-4 border-blue-500 bg-blue-50';
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'low_stock': return <Package className="w-4 h-4" />;
            case 'expiry': return <Clock className="w-4 h-4" />;
            case 'controlled': return <AlertTriangle className="w-4 h-4" />;
            default: return <Bell className="w-4 h-4" />;
        }
    };

    const filteredAlerts = alerts.filter(alert => {
        const matchesType = filterType === 'all' || alert.type === filterType;
        const matchesSeverity = filterSeverity === 'all' || alert.severity === filterSeverity;
        const matchesRead = showReadAlerts || !alert.is_read;
        return matchesType && matchesSeverity && matchesRead;
    });

    return (
        <div className="ml-0 md:ml-64 pt-24 min-h-screen bg-gray-50">
            <div className="p-6">
                {/* Header */}
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <Bell className="w-7 h-7 text-orange-600" />
                            Alerts & Notifications
                        </h1>
                        <p className="text-gray-600">Monitor stock, expiry, and system alerts</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setSoundEnabled(!soundEnabled)}
                            className={`p-2 rounded-lg ${soundEnabled ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}
                            title={soundEnabled ? 'Sound On' : 'Sound Off'}
                        >
                            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                        </button>
                        <button
                            onClick={() => {}}
                            className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200"
                            title="Alert Settings"
                        >
                            <Settings className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Total Alerts</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                            </div>
                            <Bell className="w-10 h-10 text-blue-500" />
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-4 border-l-4 border-orange-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Unread</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.unread}</p>
                            </div>
                            <Eye className="w-10 h-10 text-orange-500" />
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Critical</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.critical}</p>
                            </div>
                            <AlertTriangle className="w-10 h-10 text-red-500" />
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-4 border-l-4 border-purple-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Action Required</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.action_required}</p>
                            </div>
                            <CheckCircle className="w-10 h-10 text-purple-500" />
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-lg shadow p-4 mb-6">
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Filter className="w-5 h-5 text-gray-400" />
                            <span className="text-sm font-medium text-gray-700">Filter:</span>
                        </div>
                        <select
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                        >
                            <option value="all">All Types</option>
                            <option value="low_stock">Low Stock</option>
                            <option value="expiry">Expiry</option>
                            <option value="clarification">Clarification</option>
                            <option value="controlled">Controlled Drugs</option>
                            <option value="system">System</option>
                        </select>
                        <select
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                            value={filterSeverity}
                            onChange={(e) => setFilterSeverity(e.target.value)}
                        >
                            <option value="all">All Severity</option>
                            <option value="critical">Critical</option>
                            <option value="warning">Warning</option>
                            <option value="info">Info</option>
                        </select>
                        <label className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={showReadAlerts}
                                onChange={(e) => setShowReadAlerts(e.target.checked)}
                                className="rounded text-orange-500 focus:ring-orange-500"
                            />
                            <span className="text-sm text-gray-600">Show read alerts</span>
                        </label>
                        <div className="flex-1" />
                        <button
                            onClick={markAllAsRead}
                            className="text-sm text-blue-600 hover:text-blue-800"
                        >
                            Mark all as read
                        </button>
                        <button
                            onClick={fetchAlerts}
                            className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Refresh
                        </button>
                    </div>
                </div>

                {/* Alerts List */}
                <div className="space-y-3">
                    {loading ? (
                        <div className="bg-white rounded-lg shadow p-12 text-center">
                            <RefreshCw className="w-8 h-8 animate-spin text-orange-600 mx-auto mb-2" />
                            Loading alerts...
                        </div>
                    ) : filteredAlerts.length === 0 ? (
                        <div className="bg-white rounded-lg shadow p-12 text-center">
                            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                            <p className="text-gray-500">No alerts found</p>
                        </div>
                    ) : (
                        filteredAlerts.map((alert) => (
                            <div
                                key={alert.id}
                                className={`bg-white rounded-lg shadow p-4 ${getSeverityStyles(alert.severity)} ${
                                    !alert.is_read ? 'ring-2 ring-offset-2 ring-orange-200' : ''
                                }`}
                            >
                                <div className="flex items-start gap-4">
                                    <div className="flex-shrink-0 mt-1">
                                        {getSeverityIcon(alert.severity)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                                                    {alert.title}
                                                    {!alert.is_read && (
                                                        <span className="px-2 py-0.5 bg-orange-500 text-white text-xs rounded-full">
                                                            New
                                                        </span>
                                                    )}
                                                    {alert.action_required && (
                                                        <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                                                            Action Required
                                                        </span>
                                                    )}
                                                </h4>
                                                <p className="text-gray-600 mt-1">{alert.message}</p>
                                                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                                    <span className="flex items-center gap-1">
                                                        {getTypeIcon(alert.type)}
                                                        {alert.type.replace('_', ' ').toUpperCase()}
                                                    </span>
                                                    <span>{new Date(alert.timestamp).toLocaleString()}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {!alert.is_read && (
                                                    <button
                                                        onClick={() => markAsRead(alert.id)}
                                                        className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                                                        title="Mark as read"
                                                    >
                                                        <CheckCircle className="w-5 h-5" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => dismissAlert(alert.id)}
                                                    className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                                                    title="Dismiss"
                                                >
                                                    <X className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default PharmacistAlerts;
