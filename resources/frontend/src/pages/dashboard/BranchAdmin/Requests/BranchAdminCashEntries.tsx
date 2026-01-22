import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../../../components/common/Layout/DashboardLayout';
import {
    ArrowLeft, DollarSign, Search, RefreshCw, Eye, CheckCircle,
    XCircle, User, Calendar, TrendingUp, ArrowUpCircle,
    ArrowDownCircle
} from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { BranchAdminMenuItems } from '../../../../config/branchAdminNavigation';

interface CashEntry {
    id: string;
    cashier_id: string;
    cashier_name: string;
    entry_type: 'CASH_IN' | 'CASH_OUT';
    category: string;
    amount: number;
    description: string;
    reference_number: string;
    remarks: string;
    approval_status: 'PENDING' | 'APPROVED' | 'REJECTED';
    entry_date: string;
    created_at: string;
    approved_by: string | null;
    approved_at: string | null;
}

interface CashEntryStats {
    total_entries: number;
    pending_approval: number;
    cash_in_total: number;
    cash_out_total: number;
    net_amount: number;
}

export const BranchAdminCashEntries: React.FC = () => {
    const [entries, setEntries] = useState<CashEntry[]>([]);
    const [stats, setStats] = useState<CashEntryStats>({
        total_entries: 0,
        pending_approval: 0,
        cash_in_total: 0,
        cash_out_total: 0,
        net_amount: 0
    });
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [dateFrom, setDateFrom] = useState(new Date().toISOString().split('T')[0]);
    const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);
    const [selectedEntry, setSelectedEntry] = useState<CashEntry | null>(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);

    const [userName, setUserName] = useState('Branch Admin');
    const [profileImage, setProfileImage] = useState('');
    const [branchName, setBranchName] = useState('');
    const [branchLogo, setBranchLogo] = useState('');
    const [userGender, setUserGender] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
        setUserName(`${userInfo.first_name || ''} ${userInfo.last_name || ''}`);
        setProfileImage(userInfo.profile_picture || '');
        setBranchName(userInfo.branch_name || userInfo.branch?.name || 'Branch');
        setBranchLogo(userInfo.branch_logo || userInfo.branch?.logo || '');
        setUserGender(userInfo.gender || '');
        
        fetchEntries();
    }, [dateFrom, dateTo, typeFilter, statusFilter]);

    const fetchEntries = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/branch-admin/requests/cash-entries', {
                params: { 
                    date_from: dateFrom, 
                    date_to: dateTo, 
                    type: typeFilter,
                    status: statusFilter 
                }
            });
            
            if (response.data.success) {
                setEntries(response.data.data.entries || []);
                setStats(response.data.data.stats || {
                    total_entries: 0,
                    pending_approval: 0,
                    cash_in_total: 0,
                    cash_out_total: 0,
                    net_amount: 0
                });
            }
        } catch (error) {
            console.error('Failed to fetch cash entries:', error);
            setEntries([]);
        } finally {
            setLoading(false);
        }
    };

    const handleApproveEntry = async (entryId: string) => {
        try {
            await axios.post(`/api/branch-admin/requests/cash-entries/${entryId}/approve`);
            fetchEntries();
        } catch (error) {
            console.error('Failed to approve entry:', error);
        }
    };

    const handleRejectEntry = async (entryId: string, reason: string) => {
        try {
            await axios.post(`/api/branch-admin/requests/cash-entries/${entryId}/reject`, { reason });
            fetchEntries();
        } catch (error) {
            console.error('Failed to reject entry:', error);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PENDING': return 'bg-yellow-100 text-yellow-800';
            case 'APPROVED': return 'bg-green-100 text-green-800';
            case 'REJECTED': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getTypeColor = (type: string) => {
        return type === 'CASH_IN' 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800';
    };

    const filteredEntries = entries.filter(entry => {
        const matchesSearch = 
            entry.cashier_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            entry.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            entry.reference_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            entry.category?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
    });

    const SidebarMenu = () => (
        <nav className="py-4">
            <div className="px-4 mb-4">
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Navigation</h2>
            </div>
            <ul className="space-y-1 px-2">
                {BranchAdminMenuItems.map((item, index) => (
                    <li key={index}>
                        <button
                            onClick={() => navigate(item.path)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                                item.path.includes('/requests') 
                                    ? 'bg-gradient-to-r from-emerald-50 to-blue-50 text-emerald-700'
                                    : 'text-gray-700 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-blue-50'
                            }`}
                        >
                            <span className="flex-shrink-0">{item.icon}</span>
                            <span className="flex-1 font-medium text-left">{item.label}</span>
                        </button>
                    </li>
                ))}
            </ul>
        </nav>
    );

    return (
        <DashboardLayout
            userName={userName}
            userRole="Branch Admin"
            profileImage={profileImage}
            sidebarContent={<SidebarMenu />}
            branchName={branchName}
            branchLogo={branchLogo}
            userGender={userGender}
        >
            <div className="space-y-6">
                {/* Header Banner */}
                <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl shadow-lg p-6 text-white">
                    <div className="flex items-start justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate('/branch-admin/requests')}
                                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                            >
                                <ArrowLeft className="w-6 h-6" />
                            </button>
                            <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                                <DollarSign className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold">Cash Entries</h2>
                                <p className="text-emerald-100 mt-1">
                                    Review and approve cash in/out entries from cashiers
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-emerald-100 text-sm">
                                {new Date().toLocaleDateString('en-US', { 
                                    weekday: 'long', 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric' 
                                })}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <DollarSign className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">{stats.total_entries}</p>
                                <p className="text-xs text-gray-500">Total Entries</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-yellow-100 rounded-lg">
                                <TrendingUp className="w-5 h-5 text-yellow-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">{stats.pending_approval}</p>
                                <p className="text-xs text-gray-500">Pending</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <ArrowUpCircle className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-green-600">Rs. {stats.cash_in_total?.toLocaleString() || 0}</p>
                                <p className="text-xs text-gray-500">Cash In</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-100 rounded-lg">
                                <ArrowDownCircle className="w-5 h-5 text-red-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-red-600">Rs. {stats.cash_out_total?.toLocaleString() || 0}</p>
                                <p className="text-xs text-gray-500">Cash Out</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <TrendingUp className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                                <p className={`text-2xl font-bold ${stats.net_amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    Rs. {stats.net_amount?.toLocaleString() || 0}
                                </p>
                                <p className="text-xs text-gray-500">Net Amount</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Search by cashier, reason, or reference..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-gray-400" />
                            <input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                                className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                            />
                            <span className="text-gray-400">to</span>
                            <input
                                type="date"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                                className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                            />
                        </div>
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                        >
                            <option value="all">All Types</option>
                            <option value="CASH_IN">Cash In</option>
                            <option value="CASH_OUT">Cash Out</option>
                        </select>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                        >
                            <option value="all">All Status</option>
                            <option value="PENDING">Pending</option>
                            <option value="APPROVED">Approved</option>
                            <option value="REJECTED">Rejected</option>
                        </select>
                        <button
                            onClick={fetchEntries}
                            className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50"
                        >
                            <RefreshCw className={`w-5 h-5 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>

                {/* Entries Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    {loading ? (
                        <div className="flex items-center justify-center p-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                        </div>
                    ) : filteredEntries.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-12 text-gray-500">
                            <DollarSign className="w-12 h-12 mb-4 text-gray-300" />
                            <p className="text-lg font-medium">No cash entries found</p>
                            <p className="text-sm mt-1">Cash entries will appear here when cashiers submit them</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Cashier</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Type</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Category</th>
                                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Amount</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Description</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                                        <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Status</th>
                                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {filteredEntries.map((entry) => (
                                        <tr key={entry.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-gray-100 rounded-full">
                                                        <User className="w-4 h-4 text-gray-600" />
                                                    </div>
                                                    <span className="font-medium text-gray-900">{entry.cashier_name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(entry.entry_type)}`}>
                                                    {entry.entry_type === 'CASH_IN' ? (
                                                        <ArrowUpCircle className="w-3 h-3" />
                                                    ) : (
                                                        <ArrowDownCircle className="w-3 h-3" />
                                                    )}
                                                    {entry.entry_type === 'CASH_IN' ? 'Cash In' : 'Cash Out'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">
                                                <span className="px-2 py-1 bg-gray-100 rounded text-xs font-medium">
                                                    {entry.category?.replace(/_/g, ' ')}
                                                </span>
                                            </td>
                                            <td className={`px-6 py-4 text-right font-medium ${entry.entry_type === 'CASH_IN' ? 'text-green-600' : 'text-red-600'}`}>
                                                {entry.entry_type === 'CASH_IN' ? '+' : '-'} Rs. {entry.amount?.toLocaleString() || 0}
                                            </td>
                                            <td className="px-6 py-4 text-gray-600 max-w-xs truncate">
                                                {entry.description}
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">
                                                {entry.entry_date ? new Date(entry.entry_date).toLocaleDateString() : new Date(entry.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(entry.approval_status)}`}>
                                                    {entry.approval_status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => { setSelectedEntry(entry); setShowDetailsModal(true); }}
                                                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                                                        title="View Details"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    {entry.approval_status === 'PENDING' && (
                                                        <>
                                                            <button
                                                                onClick={() => handleApproveEntry(entry.id)}
                                                                className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg"
                                                                title="Approve"
                                                            >
                                                                <CheckCircle className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleRejectEntry(entry.id, 'Rejected by admin')}
                                                                className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                                                title="Reject"
                                                            >
                                                                <XCircle className="w-4 h-4" />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Details Modal */}
            {showDetailsModal && selectedEntry && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-900">Cash Entry Details</h3>
                                <button
                                    onClick={() => setShowDetailsModal(false)}
                                    className="p-2 hover:bg-gray-100 rounded-lg"
                                >
                                    <XCircle className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <p className="text-sm text-gray-500">Cashier</p>
                                    <p className="text-lg font-semibold">{selectedEntry.cashier_name}</p>
                                </div>
                                <div className={`rounded-lg p-4 ${selectedEntry.entry_type === 'CASH_IN' ? 'bg-green-50' : 'bg-red-50'}`}>
                                    <p className="text-sm text-gray-500">Type</p>
                                    <p className={`text-lg font-semibold ${selectedEntry.entry_type === 'CASH_IN' ? 'text-green-700' : 'text-red-700'}`}>
                                        {selectedEntry.entry_type === 'CASH_IN' ? 'Cash In' : 'Cash Out'}
                                    </p>
                                </div>
                            </div>
                            <div className={`rounded-lg p-4 ${selectedEntry.entry_type === 'CASH_IN' ? 'bg-green-50' : 'bg-red-50'}`}>
                                <p className="text-sm text-gray-500">Amount</p>
                                <p className={`text-2xl font-bold ${selectedEntry.entry_type === 'CASH_IN' ? 'text-green-700' : 'text-red-700'}`}>
                                    {selectedEntry.entry_type === 'CASH_IN' ? '+' : '-'} Rs. {selectedEntry.amount?.toLocaleString() || 0}
                                </p>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-4">
                                <p className="text-sm text-gray-500">Category</p>
                                <p className="text-gray-700 font-medium">{selectedEntry.category?.replace(/_/g, ' ')}</p>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-4">
                                <p className="text-sm text-gray-500">Description</p>
                                <p className="text-gray-700">{selectedEntry.description}</p>
                            </div>
                            {selectedEntry.reference_number && (
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <p className="text-sm text-gray-500">Reference Number</p>
                                    <p className="text-gray-700">{selectedEntry.reference_number}</p>
                                </div>
                            )}
                            {selectedEntry.remarks && (
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <p className="text-sm text-gray-500">Remarks</p>
                                    <p className="text-gray-700">{selectedEntry.remarks}</p>
                                </div>
                            )}
                            <div className="bg-gray-50 rounded-lg p-4">
                                <p className="text-sm text-gray-500">Created At</p>
                                <p className="text-gray-700">{new Date(selectedEntry.created_at).toLocaleString()}</p>
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-200 flex gap-3 justify-end">
                            <button
                                onClick={() => setShowDetailsModal(false)}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                            >
                                Close
                            </button>
                            {selectedEntry.approval_status === 'PENDING' && (
                                <>
                                    <button
                                        onClick={() => { handleRejectEntry(selectedEntry.id, 'Rejected'); setShowDetailsModal(false); }}
                                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                                    >
                                        Reject
                                    </button>
                                    <button
                                        onClick={() => { handleApproveEntry(selectedEntry.id); setShowDetailsModal(false); }}
                                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                    >
                                        Approve
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
};

export default BranchAdminCashEntries;
