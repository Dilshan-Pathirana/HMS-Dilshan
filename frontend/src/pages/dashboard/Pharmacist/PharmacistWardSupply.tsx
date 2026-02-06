import React, { useState, useEffect } from 'react';
import {
    Building2, Search, Package, Plus, CheckCircle, Clock,
    AlertTriangle, RefreshCw, Eye, Printer, Send, ArrowRight
} from 'lucide-react';

interface WardSupplyRequest {
    id: string;
    ward_name: string;
    ward_code: string;
    requested_by: string;
    request_date: string;
    items_count: number;
    status: 'pending' | 'processing' | 'issued' | 'received';
    priority: 'normal' | 'urgent' | 'emergency';
    notes?: string;
}

interface WardStock {
    id: string;
    ward_name: string;
    medicine_name: string;
    current_stock: number;
    min_stock: number;
    max_stock: number;
    last_issued: string;
}

interface WardSupplyStats {
    total_wards: number;
    pending_requests: number;
    issued_today: number;
    low_stock_wards: number;
}

export const PharmacistWardSupply: React.FC = () => {
    const [requests, setRequests] = useState<WardSupplyRequest[]>([]);
    const [wardStock, setWardStock] = useState<WardStock[]>([]);
    const [stats, setStats] = useState<WardSupplyStats>({
        total_wards: 8,
        pending_requests: 5,
        issued_today: 12,
        low_stock_wards: 2
    });
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'requests' | 'stock' | 'issue'>('requests');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const mockRequests: WardSupplyRequest[] = [
                {
                    id: '1',
                    ward_name: 'ICU Ward',
                    ward_code: 'ICU-01',
                    requested_by: 'Nurse Sarah',
                    request_date: '2025-12-18T08:30:00',
                    items_count: 15,
                    status: 'pending',
                    priority: 'urgent',
                    notes: 'Emergency stock replenishment needed'
                },
                {
                    id: '2',
                    ward_name: 'Surgical Ward',
                    ward_code: 'SUR-02',
                    requested_by: 'Nurse Michael',
                    request_date: '2025-12-18T09:15:00',
                    items_count: 8,
                    status: 'processing',
                    priority: 'normal'
                },
                {
                    id: '3',
                    ward_name: 'Pediatric Ward',
                    ward_code: 'PED-01',
                    requested_by: 'Nurse Emily',
                    request_date: '2025-12-18T07:45:00',
                    items_count: 12,
                    status: 'issued',
                    priority: 'normal'
                },
                {
                    id: '4',
                    ward_name: 'Emergency Department',
                    ward_code: 'ED-01',
                    requested_by: 'Nurse John',
                    request_date: '2025-12-18T10:00:00',
                    items_count: 20,
                    status: 'pending',
                    priority: 'emergency'
                }
            ];
            setRequests(mockRequests);

            const mockStock: WardStock[] = [
                { id: '1', ward_name: 'ICU Ward', medicine_name: 'Dopamine 200mg', current_stock: 5, min_stock: 10, max_stock: 50, last_issued: '2025-12-17' },
                { id: '2', ward_name: 'ICU Ward', medicine_name: 'Adrenaline 1mg', current_stock: 20, min_stock: 15, max_stock: 100, last_issued: '2025-12-18' },
                { id: '3', ward_name: 'Surgical Ward', medicine_name: 'Ketamine 500mg', current_stock: 8, min_stock: 5, max_stock: 30, last_issued: '2025-12-16' }
            ];
            setWardStock(mockStock);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            pending: 'bg-yellow-100 text-yellow-800',
            processing: 'bg-blue-100 text-blue-800',
            issued: 'bg-green-100 text-green-800',
            received: 'bg-neutral-100 text-neutral-800'
        };
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    const getPriorityBadge = (priority: string) => {
        const styles: Record<string, string> = {
            normal: 'bg-neutral-100 text-neutral-800',
            urgent: 'bg-orange-100 text-orange-800',
            emergency: 'bg-error-100 text-red-800'
        };
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[priority]}`}>
                {priority.toUpperCase()}
            </span>
        );
    };

    const filteredRequests = requests.filter(req => {
        const matchesSearch = req.ward_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            req.ward_code.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'all' || req.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="ml-0 md:ml-64 pt-24 min-h-screen bg-neutral-50">
            <div className="p-6">
                {/* Header */}
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
                            <Building2 className="w-7 h-7 text-purple-600" />
                            Ward Supply Management
                        </h1>
                        <p className="text-neutral-600">Issue medicines to wards and manage ward stock</p>
                    </div>
                    <button
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                    >
                        <Plus className="w-4 h-4" />
                        New Issue
                    </button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-lg shadow p-4 border-l-4 border-purple-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-neutral-600">Total Wards</p>
                                <p className="text-2xl font-bold text-neutral-900">{stats.total_wards}</p>
                            </div>
                            <Building2 className="w-10 h-10 text-purple-500" />
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-neutral-600">Pending Requests</p>
                                <p className="text-2xl font-bold text-neutral-900">{stats.pending_requests}</p>
                            </div>
                            <Clock className="w-10 h-10 text-yellow-500" />
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-neutral-600">Issued Today</p>
                                <p className="text-2xl font-bold text-neutral-900">{stats.issued_today}</p>
                            </div>
                            <CheckCircle className="w-10 h-10 text-green-500" />
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-4 border-l-4 border-error-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-neutral-600">Low Stock Wards</p>
                                <p className="text-2xl font-bold text-neutral-900">{stats.low_stock_wards}</p>
                            </div>
                            <AlertTriangle className="w-10 h-10 text-error-500" />
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-lg shadow mb-6">
                    <div className="border-b border-neutral-200">
                        <nav className="flex -mb-px">
                            {[
                                { id: 'requests', label: 'Ward Requests' },
                                { id: 'stock', label: 'Ward Stock Ledger' },
                                { id: 'issue', label: 'Quick Issue' }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                                        activeTab === tab.id
                                            ? 'border-purple-500 text-purple-600'
                                            : 'border-transparent text-neutral-500 hover:text-neutral-700'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </nav>
                    </div>

                    <div className="p-4">
                        {/* Search & Filters */}
                        <div className="flex flex-col md:flex-row gap-4 mb-4">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
                                <input
                                    type="text"
                                    placeholder="Search ward name or code..."
                                    className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <select
                                className="px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                            >
                                <option value="all">All Status</option>
                                <option value="pending">Pending</option>
                                <option value="processing">Processing</option>
                                <option value="issued">Issued</option>
                            </select>
                            <button
                                onClick={fetchData}
                                className="flex items-center gap-2 px-4 py-2 bg-neutral-100 rounded-lg hover:bg-neutral-200"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Refresh
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content based on active tab */}
                {activeTab === 'requests' && (
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-neutral-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Ward</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Requested By</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Date</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-neutral-500 uppercase">Items</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-neutral-500 uppercase">Priority</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-neutral-500 uppercase">Status</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-neutral-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {filteredRequests.map((request) => (
                                    <tr key={request.id} className="hover:bg-neutral-50">
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="font-medium text-neutral-900">{request.ward_name}</p>
                                                <p className="text-sm text-neutral-500">{request.ward_code}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-neutral-600">{request.requested_by}</td>
                                        <td className="px-6 py-4 text-sm text-neutral-600">
                                            {new Date(request.request_date).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-center font-medium">{request.items_count}</td>
                                        <td className="px-6 py-4 text-center">{getPriorityBadge(request.priority)}</td>
                                        <td className="px-6 py-4 text-center">{getStatusBadge(request.status)}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center gap-2">
                                                <button className="p-1 text-neutral-600 hover:text-primary-500 hover:bg-blue-50 rounded" title="View">
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                {request.status === 'pending' && (
                                                    <button className="p-1 text-neutral-600 hover:text-green-600 hover:bg-green-50 rounded" title="Process">
                                                        <Send className="w-4 h-4" />
                                                    </button>
                                                )}
                                                <button className="p-1 text-neutral-600 hover:text-purple-600 hover:bg-purple-50 rounded" title="Print">
                                                    <Printer className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'stock' && (
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-neutral-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Ward</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Medicine</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-neutral-500 uppercase">Current Stock</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-neutral-500 uppercase">Min</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-neutral-500 uppercase">Max</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Last Issued</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-neutral-500 uppercase">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {wardStock.map((item) => (
                                    <tr key={item.id} className="hover:bg-neutral-50">
                                        <td className="px-6 py-4 font-medium text-neutral-900">{item.ward_name}</td>
                                        <td className="px-6 py-4 text-neutral-600">{item.medicine_name}</td>
                                        <td className="px-6 py-4 text-center font-bold">{item.current_stock}</td>
                                        <td className="px-6 py-4 text-center text-neutral-500">{item.min_stock}</td>
                                        <td className="px-6 py-4 text-center text-neutral-500">{item.max_stock}</td>
                                        <td className="px-6 py-4 text-sm text-neutral-600">{item.last_issued}</td>
                                        <td className="px-6 py-4 text-center">
                                            {item.current_stock < item.min_stock ? (
                                                <span className="px-2 py-1 bg-error-100 text-red-800 rounded-full text-xs font-medium">
                                                    Low Stock
                                                </span>
                                            ) : (
                                                <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                                                    Adequate
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'issue' && (
                    <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-lg font-semibold text-neutral-900 mb-4">Quick Medicine Issue to Ward</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-2">Select Ward</label>
                                <select className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                                    <option value="">Choose a ward...</option>
                                    <option value="icu">ICU Ward</option>
                                    <option value="surgical">Surgical Ward</option>
                                    <option value="pediatric">Pediatric Ward</option>
                                    <option value="emergency">Emergency Department</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-2">Issue Type</label>
                                <select className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                                    <option value="regular">Regular Supply</option>
                                    <option value="emergency">Emergency Issue</option>
                                    <option value="topup">Top-up Stock</option>
                                </select>
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end">
                            <button className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                                Continue to Add Items
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PharmacistWardSupply;
