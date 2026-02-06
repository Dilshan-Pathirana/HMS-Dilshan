import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, ArrowLeft, CheckCircle, XCircle, Clock, Search, RefreshCw, Loader2, AlertCircle, Filter, MessageSquare, FileText, X } from 'lucide-react';
import api from "../../../../utils/api/axios";
import { toast } from 'react-toastify';

interface LeaveRequest {
    id: number;
    employee: string;
    employeeId: string;
    role: string;
    branch: string;
    startDate: string;
    endDate: string;
    days: number;
    reason: string;
    status: string;
    comments: string | null;
    requestedAt: string;
    leaveType?: string;
}

interface LeaveStats {
    pending: number;
    approved: number;
    rejected: number;
    total: number;
}

const BranchLeaveApprovals: React.FC = () => {
    const navigate = useNavigate();
    const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [processingId, setProcessingId] = useState<number | null>(null);
    const [filterStatus, setFilterStatus] = useState<string>('Pending');
    const [searchTerm, setSearchTerm] = useState('');
    const [stats, setStats] = useState<LeaveStats>({ pending: 0, approved: 0, rejected: 0, total: 0 });
    const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectComments, setRejectComments] = useState('');
    const [pagination, setPagination] = useState({ total: 0, currentPage: 1, lastPage: 1 });

    useEffect(() => {
        fetchLeaveRequests();
    }, [filterStatus, pagination.currentPage]);

    const fetchLeaveRequests = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('authToken');
            const params: Record<string, string | number> = {
                page: pagination.currentPage
            };
            if (filterStatus !== 'all') {
                params.status = filterStatus;
            }
            
            const response = await api.get('/hrm/branch-admin/pending-leaves', {
                headers: { Authorization: `Bearer ${token}` },
                params
            });
            
            if (response.data.status === 200) {
                setLeaveRequests(response.data.leaves || []);
                if (response.data.pagination) {
                    setPagination({
                        total: response.data.pagination.total,
                        currentPage: response.data.pagination.currentPage,
                        lastPage: response.data.pagination.lastPage
                    });
                }
                // Calculate stats from all statuses
                fetchStats();
            } else {
                setError(response.data.message || 'Failed to fetch leave requests');
            }
        } catch (err: any) {
            console.error('Error fetching leave requests:', err);
            setError(err.response?.data?.message || 'Failed to fetch leave requests');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const token = localStorage.getItem('authToken');
            const [pending, approved, rejected] = await Promise.all([
                api.get('/hrm/branch-admin/pending-leaves?status=Pending', { headers: { Authorization: `Bearer ${token}` }}),
                api.get('/hrm/branch-admin/pending-leaves?status=Approved', { headers: { Authorization: `Bearer ${token}` }}),
                api.get('/hrm/branch-admin/pending-leaves?status=Rejected', { headers: { Authorization: `Bearer ${token}` }})
            ]);
            setStats({
                pending: pending.data.pagination?.total || 0,
                approved: approved.data.pagination?.total || 0,
                rejected: rejected.data.pagination?.total || 0,
                total: (pending.data.pagination?.total || 0) + (approved.data.pagination?.total || 0) + (rejected.data.pagination?.total || 0)
            });
        } catch (err) {
            console.error('Error fetching stats:', err);
        }
    };

    const handleApprove = async (id: number) => {
        setProcessingId(id);
        try {
            const token = localStorage.getItem('authToken');
            const response = await api.put(`/hrm/branch-admin/leave/${id}/approve`, 
                { action: 'approve' },
                { headers: { Authorization: `Bearer ${token}` }}
            );
            
            if (response.data.status === 200) {
                toast.success('Leave request approved');
                fetchLeaveRequests();
            } else {
                toast.error(response.data.message || 'Failed to approve');
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to approve leave request');
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (id: number, comments: string = '') => {
        setProcessingId(id);
        try {
            const token = localStorage.getItem('authToken');
            const response = await api.put(`/hrm/branch-admin/leave/${id}/approve`, 
                { action: 'reject', comments },
                { headers: { Authorization: `Bearer ${token}` }}
            );
            
            if (response.data.status === 200) {
                toast.success('Leave request rejected');
                setShowRejectModal(false);
                setSelectedRequest(null);
                setRejectComments('');
                fetchLeaveRequests();
            } else {
                toast.error(response.data.message || 'Failed to reject');
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to reject leave request');
        } finally {
            setProcessingId(null);
        }
    };

    const openRejectModal = (request: LeaveRequest) => {
        setSelectedRequest(request);
        setShowRejectModal(true);
        setRejectComments('');
    };

    const filteredRequests = leaveRequests.filter(r => 
        r.employee?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.role?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.employeeId?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getLeaveTypeBadge = (type: string) => {
        const badges: Record<string, string> = {
            'annual': 'bg-blue-100 text-blue-700',
            'annual leave': 'bg-blue-100 text-blue-700',
            'Annual Leave': 'bg-blue-100 text-blue-700',
            'medical': 'bg-emerald-100 text-emerald-700',
            'medical leave': 'bg-emerald-100 text-emerald-700',
            'Medical Leave': 'bg-emerald-100 text-emerald-700',
            'sick': 'bg-error-100 text-red-700',
            'sick leave': 'bg-error-100 text-red-700',
            'Sick Leave': 'bg-error-100 text-red-700',
            'casual': 'bg-orange-100 text-orange-700',
            'casual leave': 'bg-orange-100 text-orange-700',
            'Casual Leave': 'bg-orange-100 text-orange-700',
            'maternity': 'bg-pink-100 text-pink-700',
            'Maternity Leave': 'bg-pink-100 text-pink-700',
            'paternity': 'bg-indigo-100 text-indigo-700',
            'Paternity Leave': 'bg-indigo-100 text-indigo-700',
        };
        return badges[type] || 'bg-neutral-100 text-neutral-700';
    };

    const getStatusBadge = (status: string) => {
        const badges: Record<string, string> = {
            'Pending': 'bg-yellow-100 text-yellow-700',
            'Approved': 'bg-emerald-100 text-emerald-700',
            'Rejected': 'bg-error-100 text-red-700',
        };
        return badges[status] || 'bg-neutral-100 text-neutral-700';
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric'
        });
    };

    const getInitials = (name: string) => {
        if (!name) return 'NA';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    return (
        <div className="min-h-screen bg-neutral-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate('/branch-admin/hrm')} className="p-2 hover:bg-neutral-200 rounded-lg transition-colors">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-neutral-800">Leave Approvals</h1>
                            <p className="text-neutral-500">Review and manage leave requests from your branch staff</p>
                        </div>
                    </div>
                    <button onClick={fetchLeaveRequests} className="flex items-center gap-2 px-4 py-2 text-emerald-600 border border-emerald-200 rounded-lg hover:bg-emerald-50 transition-colors">
                        <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-neutral-500">Pending</p>
                                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                            </div>
                            <div className="p-3 bg-yellow-100 rounded-lg">
                                <Clock className="w-6 h-6 text-yellow-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-neutral-500">Approved</p>
                                <p className="text-2xl font-bold text-emerald-600">{stats.approved}</p>
                            </div>
                            <div className="p-3 bg-emerald-100 rounded-lg">
                                <CheckCircle className="w-6 h-6 text-emerald-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-neutral-500">Rejected</p>
                                <p className="text-2xl font-bold text-error-600">{stats.rejected}</p>
                            </div>
                            <div className="p-3 bg-error-100 rounded-lg">
                                <XCircle className="w-6 h-6 text-error-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-neutral-500">Total Requests</p>
                                <p className="text-2xl font-bold text-neutral-800">{stats.total}</p>
                            </div>
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <FileText className="w-6 h-6 text-primary-500" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4 mb-6">
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex-1 min-w-[250px]">
                            <div className="relative">
                                <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                                <input 
                                    type="text" 
                                    placeholder="Search by employee name, role, or ID..." 
                                    value={searchTerm} 
                                    onChange={(e) => setSearchTerm(e.target.value)} 
                                    className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" 
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Filter className="w-4 h-4 text-neutral-500" />
                            <select 
                                className="px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" 
                                value={filterStatus} 
                                onChange={(e) => {
                                    setFilterStatus(e.target.value);
                                    setPagination(prev => ({ ...prev, currentPage: 1 }));
                                }}
                            >
                                <option value="Pending">Pending Only</option>
                                <option value="Approved">Approved</option>
                                <option value="Rejected">Rejected</option>
                                <option value="all">All Requests</option>
                            </select>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="bg-error-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-error-500" />
                        <span className="text-red-700">{error}</span>
                    </div>
                )}

                {isLoading ? (
                    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-12 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                        <span className="ml-3 text-neutral-600">Loading leave requests...</span>
                    </div>
                ) : (
                    <>
                        {/* Leave Requests List */}
                        <div className="space-y-4 mb-6">
                            {filteredRequests.length > 0 ? (
                                filteredRequests.map((request) => (
                                    <div key={request.id} className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6 hover:shadow-md transition-shadow">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-start gap-4">
                                                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-primary-500 rounded-full flex items-center justify-center text-white font-medium">
                                                    {getInitials(request.employee)}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-1">
                                                        <h3 className="font-semibold text-neutral-800">{request.employee}</h3>
                                                        <span className="text-xs text-neutral-400">#{request.employeeId}</span>
                                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(request.status)}`}>
                                                            {request.status}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-neutral-500 mb-2">{request.role} • {request.branch}</p>
                                                    <div className="flex flex-wrap items-center gap-4 text-sm">
                                                        <span className={`px-2 py-1 rounded text-xs font-medium ${getLeaveTypeBadge(request.leaveType || '')}`}>
                                                            {request.leaveType || 'Leave'}
                                                        </span>
                                                        <span className="text-neutral-600 flex items-center gap-1">
                                                            <Calendar className="w-4 h-4" />
                                                            {formatDate(request.startDate)} - {formatDate(request.endDate)}
                                                        </span>
                                                        <span className="text-neutral-600">
                                                            {request.days} day{request.days > 1 ? 's' : ''}
                                                        </span>
                                                    </div>
                                                    {request.reason && (
                                                        <p className="text-sm text-neutral-600 mt-3 bg-neutral-50 p-3 rounded-lg">
                                                            <strong>Reason:</strong> {request.reason}
                                                        </p>
                                                    )}
                                                    {request.comments && (
                                                        <p className="text-sm text-neutral-500 mt-2 flex items-start gap-2">
                                                            <MessageSquare className="w-4 h-4 mt-0.5" />
                                                            <span><strong>Comments:</strong> {request.comments}</span>
                                                        </p>
                                                    )}
                                                    <p className="text-xs text-neutral-400 mt-2">
                                                        Requested: {formatDate(request.requestedAt)}
                                                    </p>
                                                </div>
                                            </div>
                                            {request.status === 'Pending' && (
                                                <div className="flex items-center gap-2 ml-4">
                                                    <button 
                                                        onClick={() => handleApprove(request.id)} 
                                                        disabled={processingId === request.id} 
                                                        className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 transition-colors"
                                                    >
                                                        {processingId === request.id ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            <CheckCircle className="w-4 h-4" />
                                                        )}
                                                        Approve
                                                    </button>
                                                    <button 
                                                        onClick={() => openRejectModal(request)} 
                                                        disabled={processingId === request.id} 
                                                        className="flex items-center gap-2 px-4 py-2 bg-error-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors"
                                                    >
                                                        {processingId === request.id ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            <XCircle className="w-4 h-4" />
                                                        )}
                                                        Reject
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-12 text-center">
                                    <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                                    <p className="text-neutral-500 text-lg">No leave requests found</p>
                                    <p className="text-neutral-400 text-sm mt-1">
                                        {filterStatus === 'Pending' 
                                            ? 'No pending leave requests to review' 
                                            : `No ${filterStatus.toLowerCase()} leave requests`}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Pagination */}
                        {pagination.lastPage > 1 && (
                            <div className="flex items-center justify-between bg-white rounded-xl shadow-sm border border-neutral-200 p-4">
                                <p className="text-sm text-neutral-500">
                                    Showing page {pagination.currentPage} of {pagination.lastPage} ({pagination.total} total)
                                </p>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
                                        disabled={pagination.currentPage <= 1}
                                        className="px-3 py-1 border border-neutral-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-50"
                                    >
                                        Previous
                                    </button>
                                    <button
                                        onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
                                        disabled={pagination.currentPage >= pagination.lastPage}
                                        className="px-3 py-1 border border-neutral-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-50"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* Reject Modal */}
                {showRejectModal && selectedRequest && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
                            <div className="p-6 border-b border-neutral-200">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold text-neutral-800">Reject Leave Request</h3>
                                    <button 
                                        onClick={() => setShowRejectModal(false)} 
                                        className="p-2 hover:bg-neutral-100 rounded-lg"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                            <div className="p-6">
                                <div className="mb-4">
                                    <p className="text-neutral-600">
                                        Are you sure you want to reject the leave request from <strong>{selectedRequest.employee}</strong>?
                                    </p>
                                    <p className="text-sm text-neutral-500 mt-2">
                                        {formatDate(selectedRequest.startDate)} - {formatDate(selectedRequest.endDate)} ({selectedRequest.days} days)
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                                        Rejection Reason (Optional)
                                    </label>
                                    <textarea
                                        value={rejectComments}
                                        onChange={(e) => setRejectComments(e.target.value)}
                                        placeholder="Provide a reason for rejection..."
                                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-error-500"
                                        rows={3}
                                    />
                                </div>
                            </div>
                            <div className="p-6 border-t border-neutral-200 flex items-center justify-end gap-3">
                                <button
                                    onClick={() => setShowRejectModal(false)}
                                    className="px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleReject(selectedRequest.id, rejectComments)}
                                    disabled={processingId === selectedRequest.id}
                                    className="flex items-center gap-2 px-4 py-2 bg-error-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
                                >
                                    {processingId === selectedRequest.id ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <XCircle className="w-4 h-4" />
                                    )}
                                    Reject Request
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BranchLeaveApprovals;
