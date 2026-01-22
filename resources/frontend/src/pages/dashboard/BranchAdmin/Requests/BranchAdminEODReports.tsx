import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../../../components/common/Layout/DashboardLayout';
import { BranchAdminSidebar } from '../../../../components/common/Layout/BranchAdminSidebar';
import {
    ArrowLeft, Clock, Search, RefreshCw, Eye, CheckCircle,
    XCircle, DollarSign, User, Calendar, RotateCcw, Flag, AlertTriangle
} from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

interface EODReport {
    id: string;
    cashier_id: string;
    cashier_name: string;
    report_date: string;
    total_sales: number;
    total_transactions: number;
    cash_total: number;
    card_total: number;
    online_total: number;
    qr_total: number;
    cash_in_total: number;
    cash_out_total: number;
    opening_balance: number;
    expected_balance: number;
    actual_balance: number;
    variance: number;
    status: 'OPEN' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'FLAGGED';
    submitted_at: string;
    notes: string;
}

interface EODStats {
    total_reports: number;
    pending_review: number;
    approved_today: number;
    total_sales_today: number;
}

export const BranchAdminEODReports: React.FC = () => {
    const [reports, setReports] = useState<EODReport[]>([]);
    const [stats, setStats] = useState<EODStats>({
        total_reports: 0,
        pending_review: 0,
        approved_today: 0,
        total_sales_today: 0
    });
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [dateFrom, setDateFrom] = useState(new Date().toISOString().split('T')[0]);
    const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);
    const [selectedReport, setSelectedReport] = useState<EODReport | null>(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showFlagModal, setShowFlagModal] = useState(false);
    const [flagReason, setFlagReason] = useState('');
    const [flagSeverity, setFlagSeverity] = useState<'low' | 'medium' | 'high'>('medium');
    const [reportToFlag, setReportToFlag] = useState<string | null>(null);
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
        
        fetchReports();
    }, [dateFrom, dateTo, statusFilter]);

    const fetchReports = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/branch-admin/requests/eod-reports', {
                params: { date_from: dateFrom, date_to: dateTo, status: statusFilter }
            });
            
            if (response.data.success) {
                setReports(response.data.data.reports || []);
                setStats(response.data.data.stats || {
                    total_reports: 0,
                    pending_review: 0,
                    approved_today: 0,
                    total_sales_today: 0
                });
            }
        } catch (error) {
            console.error('Failed to fetch EOD reports:', error);
            // Set mock data for now
            setReports([]);
        } finally {
            setLoading(false);
        }
    };

    const handleApproveReport = async (reportId: string) => {
        try {
            await axios.post(`/api/branch-admin/requests/eod-reports/${reportId}/approve`);
            fetchReports();
        } catch (error) {
            console.error('Failed to approve report:', error);
        }
    };

    const handleRejectReport = async (reportId: string, reason: string) => {
        try {
            await axios.post(`/api/branch-admin/requests/eod-reports/${reportId}/reject`, { reason });
            fetchReports();
        } catch (error) {
            console.error('Failed to reject report:', error);
        }
    };

    const handleResetReport = async (reportId: string) => {
        if (!window.confirm('Are you sure you want to reset this EOD report?\n\nThis will reopen the day for the cashier to make corrections and resubmit.')) {
            return;
        }
        try {
            await axios.post(`/api/branch-admin/requests/eod-reports/${reportId}/reset`);
            fetchReports();
        } catch (error) {
            console.error('Failed to reset report:', error);
        }
    };

    const handleFlagDiscrepancy = async (reportId: string, reason: string, severity: string) => {
        try {
            await axios.post(`/api/branch-admin/requests/eod-reports/${reportId}/flag`, { reason, severity });
            fetchReports();
            setShowFlagModal(false);
            setFlagReason('');
            setFlagSeverity('medium');
        } catch (error) {
            console.error('Failed to flag report:', error);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'SUBMITTED': return 'bg-yellow-100 text-yellow-800';
            case 'APPROVED': return 'bg-green-100 text-green-800';
            case 'REJECTED': return 'bg-red-100 text-red-800';
            case 'FLAGGED': return 'bg-orange-100 text-orange-800';
            case 'OPEN': return 'bg-blue-100 text-blue-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getVarianceColor = (variance: number) => {
        if (variance === 0) return 'text-green-600';
        if (Math.abs(variance) < 100) return 'text-yellow-600';
        return 'text-red-600';
    };

    const filteredReports = reports.filter(report => {
        const matchesSearch = report.cashier_name?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
    });

    return (
        <DashboardLayout
            userName={userName}
            userRole="Branch Admin"
            profileImage={profileImage}
            sidebarContent={<BranchAdminSidebar />}
            branchName={branchName}
            branchLogo={branchLogo}
            userGender={userGender}
        >
            <div className="space-y-6">
                {/* Header Banner */}
                <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-xl shadow-lg p-6 text-white">
                    <div className="flex items-start justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate('/branch-admin/requests')}
                                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                            >
                                <ArrowLeft className="w-6 h-6" />
                            </button>
                            <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                                <Clock className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold">End of Day Reports</h2>
                                <p className="text-orange-100 mt-1">
                                    Review cashier EOD submissions
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-orange-100 text-sm">
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
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Clock className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">{stats.total_reports}</p>
                                <p className="text-xs text-gray-500">Total Reports</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-yellow-100 rounded-lg">
                                <Clock className="w-5 h-5 text-yellow-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">{stats.pending_review}</p>
                                <p className="text-xs text-gray-500">Pending Review</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <CheckCircle className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">{stats.approved_today}</p>
                                <p className="text-xs text-gray-500">Approved Today</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-100 rounded-lg">
                                <DollarSign className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">Rs. {stats.total_sales_today?.toLocaleString() || 0}</p>
                                <p className="text-xs text-gray-500">Today's Sales</p>
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
                                placeholder="Search by cashier name..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-gray-400" />
                            <input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                                className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500"
                            />
                            <span className="text-gray-400">to</span>
                            <input
                                type="date"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                                className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500"
                            />
                        </div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500"
                        >
                            <option value="all">All Status</option>
                            <option value="SUBMITTED">Submitted</option>
                            <option value="APPROVED">Approved</option>
                            <option value="FLAGGED">Flagged</option>
                            <option value="REJECTED">Rejected</option>
                        </select>
                        <button
                            onClick={fetchReports}
                            className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50"
                        >
                            <RefreshCw className={`w-5 h-5 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>

                {/* Reports Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    {loading ? (
                        <div className="flex items-center justify-center p-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
                        </div>
                    ) : filteredReports.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-12 text-gray-500">
                            <Clock className="w-12 h-12 mb-4 text-gray-300" />
                            <p className="text-lg font-medium">No EOD reports found</p>
                            <p className="text-sm mt-1">EOD reports will appear here when cashiers submit them</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Cashier</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Total Sales</th>
                                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Transactions</th>
                                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Variance</th>
                                        <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Status</th>
                                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {filteredReports.map((report) => (
                                        <tr key={report.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-gray-100 rounded-full">
                                                        <User className="w-4 h-4 text-gray-600" />
                                                    </div>
                                                    <span className="font-medium text-gray-900">{report.cashier_name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">
                                                {new Date(report.report_date).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-right font-medium text-gray-900">
                                                Rs. {report.total_sales?.toLocaleString() || 0}
                                            </td>
                                            <td className="px-6 py-4 text-right text-gray-600">
                                                {report.total_transactions || 0}
                                            </td>
                                            <td className={`px-6 py-4 text-right font-medium ${getVarianceColor(report.variance || 0)}`}>
                                                Rs. {report.variance?.toLocaleString() || 0}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                                                    {report.status === 'FLAGGED' && <Flag className="w-3 h-3" />}
                                                    {report.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => { setSelectedReport(report); setShowDetailsModal(true); }}
                                                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                                                        title="View Details"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    {report.status === 'SUBMITTED' && (
                                                        <>
                                                            <button
                                                                onClick={() => handleApproveReport(report.id)}
                                                                className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg"
                                                                title="Approve"
                                                            >
                                                                <CheckCircle className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleRejectReport(report.id, 'Rejected by admin')}
                                                                className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                                                title="Reject"
                                                            >
                                                                <XCircle className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => { setReportToFlag(report.id); setShowFlagModal(true); }}
                                                                className="p-1.5 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg"
                                                                title="Flag Discrepancy"
                                                            >
                                                                <Flag className="w-4 h-4" />
                                                            </button>
                                                        </>
                                                    )}
                                                    {(report.status === 'SUBMITTED' || report.status === 'APPROVED' || report.status === 'FLAGGED') && (
                                                        <button
                                                            onClick={() => handleResetReport(report.id)}
                                                            className="p-1.5 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg"
                                                            title="Reset to OPEN (Allow corrections)"
                                                        >
                                                            <RotateCcw className="w-4 h-4" />
                                                        </button>
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
            {showDetailsModal && selectedReport && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-900">EOD Report Details</h3>
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
                                    <p className="text-lg font-semibold">{selectedReport.cashier_name}</p>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <p className="text-sm text-gray-500">Report Date</p>
                                    <p className="text-lg font-semibold">{new Date(selectedReport.report_date).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-emerald-50 rounded-lg p-4">
                                    <p className="text-sm text-emerald-600">Total Sales</p>
                                    <p className="text-xl font-bold text-emerald-700">Rs. {selectedReport.total_sales?.toLocaleString() || 0}</p>
                                </div>
                                <div className="bg-blue-50 rounded-lg p-4">
                                    <p className="text-sm text-blue-600">Transactions</p>
                                    <p className="text-xl font-bold text-blue-700">{selectedReport.total_transactions || 0}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-4 gap-4">
                                <div className="bg-gray-50 rounded-lg p-3">
                                    <p className="text-xs text-gray-500">Cash</p>
                                    <p className="text-sm font-semibold">Rs. {selectedReport.cash_total?.toLocaleString() || 0}</p>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-3">
                                    <p className="text-xs text-gray-500">Card</p>
                                    <p className="text-sm font-semibold">Rs. {selectedReport.card_total?.toLocaleString() || 0}</p>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-3">
                                    <p className="text-xs text-gray-500">Online</p>
                                    <p className="text-sm font-semibold">Rs. {selectedReport.online_total?.toLocaleString() || 0}</p>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-3">
                                    <p className="text-xs text-gray-500">QR</p>
                                    <p className="text-sm font-semibold">Rs. {selectedReport.qr_total?.toLocaleString() || 0}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <p className="text-sm text-gray-500">Expected Balance</p>
                                    <p className="text-lg font-semibold">Rs. {selectedReport.expected_balance?.toLocaleString() || 0}</p>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <p className="text-sm text-gray-500">Actual Balance</p>
                                    <p className="text-lg font-semibold">Rs. {selectedReport.actual_balance?.toLocaleString() || 0}</p>
                                </div>
                                <div className={`rounded-lg p-4 ${selectedReport.variance === 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                                    <p className="text-sm text-gray-500">Variance</p>
                                    <p className={`text-lg font-semibold ${getVarianceColor(selectedReport.variance || 0)}`}>
                                        Rs. {selectedReport.variance?.toLocaleString() || 0}
                                    </p>
                                </div>
                            </div>
                            {selectedReport.notes && (
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <p className="text-sm text-gray-500">Notes</p>
                                    <p className="text-gray-700 whitespace-pre-wrap">{selectedReport.notes}</p>
                                </div>
                            )}
                        </div>
                        <div className="p-6 border-t border-gray-200 flex gap-3 justify-end">
                            <button
                                onClick={() => setShowDetailsModal(false)}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                            >
                                Close
                            </button>
                            {selectedReport.status === 'SUBMITTED' && (
                                <>
                                    <button
                                        onClick={() => { setReportToFlag(selectedReport.id); setShowFlagModal(true); setShowDetailsModal(false); }}
                                        className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                                    >
                                        Flag Discrepancy
                                    </button>
                                    <button
                                        onClick={() => { handleRejectReport(selectedReport.id, 'Rejected'); setShowDetailsModal(false); }}
                                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                                    >
                                        Reject
                                    </button>
                                    <button
                                        onClick={() => { handleApproveReport(selectedReport.id); setShowDetailsModal(false); }}
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

            {/* Flag Discrepancy Modal */}
            {showFlagModal && reportToFlag && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-orange-100 rounded-lg">
                                    <AlertTriangle className="w-5 h-5 text-orange-600" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900">Flag Discrepancy</h3>
                            </div>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Severity Level
                                </label>
                                <div className="flex gap-3">
                                    {(['low', 'medium', 'high'] as const).map((level) => (
                                        <button
                                            key={level}
                                            onClick={() => setFlagSeverity(level)}
                                            className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium capitalize transition ${
                                                flagSeverity === level
                                                    ? level === 'low' ? 'bg-yellow-100 border-yellow-400 text-yellow-800'
                                                    : level === 'medium' ? 'bg-orange-100 border-orange-400 text-orange-800'
                                                    : 'bg-red-100 border-red-400 text-red-800'
                                                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                                            }`}
                                        >
                                            {level}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Discrepancy Details *
                                </label>
                                <textarea
                                    value={flagReason}
                                    onChange={(e) => setFlagReason(e.target.value)}
                                    rows={4}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                    placeholder="Describe the discrepancy and what action is required..."
                                />
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-200 flex gap-3 justify-end">
                            <button
                                onClick={() => { setShowFlagModal(false); setFlagReason(''); setFlagSeverity('medium'); setReportToFlag(null); }}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => reportToFlag && handleFlagDiscrepancy(reportToFlag, flagReason, flagSeverity)}
                                disabled={!flagReason.trim()}
                                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                <Flag className="w-4 h-4" />
                                Flag Report
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
};

export default BranchAdminEODReports;
