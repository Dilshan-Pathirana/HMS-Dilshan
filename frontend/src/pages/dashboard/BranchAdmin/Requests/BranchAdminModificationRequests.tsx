import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../../../components/common/Layout/DashboardLayout';
import {
    CalendarClock, User, ChevronLeft,
    CheckCircle, XCircle, Loader2, CalendarX,
    MessageSquare, RotateCcw, AlertTriangle,
    Users, Clock, RefreshCw, Coffee
} from 'lucide-react';
import api from "../../../../utils/api/axios";
import { useNavigate } from 'react-router-dom';
import { BranchAdminMenuItems } from '../../../../config/branchAdminNavigation';

interface ModificationRequest {
    id: string;
    source: 'doctor' | 'employee'; // New field to identify source
    user_id: string;
    user_name: string;
    user_email: string;
    user_role: string;
    doctor_id: string | null;
    doctor_name: string | null;
    doctor_email: string | null;
    branch_id: string;
    branch_name: string;
    schedule_id: string | null;
    parent_request_id: string | null;
    parent_request_type: string | null;
    parent_start_date: string | null;
    schedule_day: string | null;
    schedule_start_time: string | null;
    schedule_end_time: string | null;
    request_type: string;
    start_date: string;
    end_date: string | null;
    new_start_time: string | null;
    new_end_time: string | null;
    new_max_patients: number | null;
    reason: string;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    // Employee-specific fields
    original_shift_date?: string;
    original_shift_type?: string;
    requested_shift_date?: string;
    requested_shift_type?: string;
    interchange_with?: string;
    interchange_with_name?: string;
}

interface RequestStats {
    totalRequests: number;
    pendingRequests: number;
    approvedRequests: number;
    rejectedRequests: number;
    cancellationRequests: number;
    employeeRequests: number;
}

export const BranchAdminModificationRequests: React.FC = () => {
    const [requests, setRequests] = useState<ModificationRequest[]>([]);
    const [stats, setStats] = useState<RequestStats>({
        totalRequests: 0,
        pendingRequests: 0,
        approvedRequests: 0,
        rejectedRequests: 0,
        cancellationRequests: 0,
        employeeRequests: 0
    });
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<ModificationRequest | null>(null);
    const [rejectReason, setRejectReason] = useState('');
    const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected' | 'cancellations' | 'employee' | 'all'>('pending');
    const [userName, setUserName] = useState('Branch Admin');
    const [profileImage, setProfileImage] = useState('');
    const [branchName, setBranchName] = useState('');
    const [branchLogo, setBranchLogo] = useState('');
    const [userGender, setUserGender] = useState('');
    const navigate = useNavigate();

    const requestTypeLabels: Record<string, string> = {
        // Doctor request types
        'block_date': 'Block Date(s)',
        'block_schedule': 'Block Recurring Schedule',
        'delay_start': 'Delay Start Time',
        'limit_appointments': 'Limit Appointments',
        'early_end': 'End Early',
        'cancel_block': 'Cancel Blocked Date',
        // Employee request types
        'employee_change': 'Schedule Change',
        'employee_interchange': 'Shift Swap',
        'employee_time_off': 'Time Off Request',
        'employee_cancellation': 'Schedule Cancellation'
    };

    const requestTypeColors: Record<string, string> = {
        // Doctor request types
        'block_date': 'bg-red-100 text-red-700',
        'block_schedule': 'bg-red-100 text-red-700',
        'delay_start': 'bg-orange-100 text-orange-700',
        'limit_appointments': 'bg-amber-100 text-amber-700',
        'early_end': 'bg-purple-100 text-purple-700',
        'cancel_block': 'bg-blue-100 text-blue-700',
        // Employee request types
        'employee_change': 'bg-indigo-100 text-indigo-700',
        'employee_interchange': 'bg-cyan-100 text-cyan-700',
        'employee_time_off': 'bg-green-100 text-green-700',
        'employee_cancellation': 'bg-rose-100 text-rose-700'
    };

    const getRequestIcon = (requestType: string) => {
        switch (requestType) {
            case 'employee_change':
                return <Clock className="w-6 h-6 text-indigo-600" />;
            case 'employee_interchange':
                return <RefreshCw className="w-6 h-6 text-cyan-600" />;
            case 'employee_time_off':
                return <Coffee className="w-6 h-6 text-green-600" />;
            case 'employee_cancellation':
                return <CalendarX className="w-6 h-6 text-rose-600" />;
            case 'cancel_block':
                return <RotateCcw className="w-6 h-6 text-purple-600" />;
            default:
                return <CalendarX className="w-6 h-6 text-gray-600" />;
        }
    };

    useEffect(() => {
        const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
        setUserName(`${userInfo.first_name || ''} ${userInfo.last_name || ''}`);
        setProfileImage(userInfo.profile_picture || '');
        setBranchName(userInfo.branch_name || userInfo.branch?.name || 'Branch');
        setBranchLogo(userInfo.branch_logo || userInfo.branch?.logo || '');
        setUserGender(userInfo.gender || '');
        
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const response = await api.get('/branch-admin/requests/modification-requests');
            
            if (response.data.status === 200) {
                const requestsList = response.data.requests || [];
                const counts = response.data.counts || {};
                setRequests(requestsList);
                setStats({
                    totalRequests: requestsList.length,
                    pendingRequests: counts.pending || requestsList.filter((r: ModificationRequest) => r.status === 'pending').length,
                    approvedRequests: counts.approved || requestsList.filter((r: ModificationRequest) => r.status === 'approved').length,
                    rejectedRequests: counts.rejected || requestsList.filter((r: ModificationRequest) => r.status === 'rejected').length,
                    cancellationRequests: counts.cancellation_requests || requestsList.filter((r: ModificationRequest) => r.request_type === 'cancel_block' && r.status === 'pending').length,
                    employeeRequests: counts.employee_requests || requestsList.filter((r: ModificationRequest) => r.source === 'employee' && r.status === 'pending').length
                });
            }
        } catch (error) {
            console.error('Failed to fetch modification requests:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (request: ModificationRequest) => {
        const requesterName = request.user_name || request.doctor_name || 'Unknown';
        const requestLabel = requestTypeLabels[request.request_type] || request.request_type;
        if (!confirm(`Approve this ${requestLabel} request from ${requesterName}? This action cannot be undone.`)) return;
        
        setProcessingId(request.id);
        try {
            // Use different endpoint for employee requests
            const endpoint = request.source === 'employee'
                ? `/branch-admin/requests/employee-schedule-requests/${request.id}/approve`
                : `/branch-admin/requests/modification-requests/${request.id}/approve`;
            
            const response = await api.post(endpoint, {
                notes: 'Approved by Branch Admin'
            });
            
            if (response.data.status === 200) {
                alert('Request approved successfully!');
                fetchRequests();
            } else {
                alert(response.data.message || 'Failed to approve request');
            }
        } catch (error) {
            console.error('Failed to approve request:', error);
            alert('Failed to approve request. Please try again.');
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async () => {
        if (!selectedRequest) return;
        
        setProcessingId(selectedRequest.id);
        try {
            // Use different endpoint for employee requests
            const endpoint = selectedRequest.source === 'employee'
                ? `/branch-admin/requests/employee-schedule-requests/${selectedRequest.id}/reject`
                : `/branch-admin/requests/modification-requests/${selectedRequest.id}/reject`;
            
            const response = await api.post(endpoint, {
                notes: rejectReason || 'Rejected by Branch Admin'
            });
            
            if (response.data.status === 200) {
                alert('Request rejected.');
                setShowRejectModal(false);
                setRejectReason('');
                setSelectedRequest(null);
                fetchRequests();
            } else {
                alert(response.data.message || 'Failed to reject request');
            }
        } catch (error) {
            console.error('Failed to reject request:', error);
            alert('Failed to reject request. Please try again.');
        } finally {
            setProcessingId(null);
        }
    };

    const formatTime = (time: string | null) => {
        if (!time) return 'N/A';
        const [hours, minutes] = time.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 || 12;
        return `${hour12}:${minutes} ${ampm}`;
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const filteredRequests = activeTab === 'all' 
        ? requests 
        : activeTab === 'cancellations'
        ? requests.filter(r => r.request_type === 'cancel_block')
        : activeTab === 'employee'
        ? requests.filter(r => r.source === 'employee' && r.status === 'pending')
        : requests.filter(r => r.status === activeTab);

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
                {/* Header */}
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => navigate('/branch-admin/requests')}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5 text-gray-500" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Schedule Modification Requests</h1>
                        <p className="text-gray-500">Review and manage doctor and employee schedule modification requests</p>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                    {[
                        { label: 'All Requests', value: stats.totalRequests, color: 'blue', tab: 'all' as const },
                        { label: 'Pending', value: stats.pendingRequests, color: 'amber', tab: 'pending' as const },
                        { label: 'Staff Requests', value: stats.employeeRequests, color: 'indigo', tab: 'employee' as const },
                        { label: 'Approved', value: stats.approvedRequests, color: 'green', tab: 'approved' as const },
                        { label: 'Rejected', value: stats.rejectedRequests, color: 'red', tab: 'rejected' as const },
                        { label: 'Cancellations', value: stats.cancellationRequests, color: 'purple', tab: 'cancellations' as const }
                    ].map((stat) => (
                        <button
                            key={stat.tab}
                            onClick={() => setActiveTab(stat.tab)}
                            className={`p-4 rounded-xl border transition-all ${
                                activeTab === stat.tab
                                    ? `bg-${stat.color}-50 border-${stat.color}-200 ring-2 ring-${stat.color}-500`
                                    : 'bg-white border-gray-100 hover:bg-gray-50'
                            }`}
                        >
                            <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                            <p className="text-sm text-gray-500">{stat.label}</p>
                        </button>
                    ))}
                </div>

                {/* Requests List */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                    <div className="p-5 border-b border-gray-100">
                        <h2 className="text-lg font-semibold text-gray-800">
                            {activeTab === 'all' 
                                ? 'All Requests' 
                                : activeTab === 'cancellations'
                                ? 'Cancellation Requests'
                                : activeTab === 'employee'
                                ? 'Staff Schedule Requests'
                                : `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Requests`}
                        </h2>
                    </div>

                    {loading ? (
                        <div className="p-8 text-center">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto" />
                            <p className="text-gray-500 mt-2">Loading requests...</p>
                        </div>
                    ) : filteredRequests.length === 0 ? (
                        <div className="p-12 text-center">
                            <CalendarClock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-800 mb-2">No requests found</h3>
                            <p className="text-gray-500">
                                {activeTab === 'pending' 
                                    ? 'No pending modification requests at this time' 
                                    : activeTab === 'cancellations'
                                    ? 'No cancellation requests at this time'
                                    : activeTab === 'employee'
                                    ? 'No pending staff schedule requests at this time'
                                    : `No ${activeTab} requests`
                                }
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {filteredRequests.map((request) => (
                                <div key={request.id} className="p-5 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-4">
                                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                                                request.source === 'employee' 
                                                    ? 'bg-indigo-100' 
                                                    : request.request_type === 'cancel_block' 
                                                    ? 'bg-purple-100' 
                                                    : 'bg-gray-100'
                                            }`}>
                                                {request.source === 'employee' ? (
                                                    getRequestIcon(request.request_type)
                                                ) : request.request_type === 'cancel_block' ? (
                                                    <RotateCcw className="w-6 h-6 text-purple-600" />
                                                ) : (
                                                    <CalendarX className="w-6 h-6 text-gray-600" />
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-1">
                                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${requestTypeColors[request.request_type] || 'bg-gray-100 text-gray-700'}`}>
                                                        {requestTypeLabels[request.request_type] || request.request_type}
                                                    </span>
                                                    {request.source === 'employee' && (
                                                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-indigo-100 text-indigo-700">
                                                            {request.user_role || 'Staff'}
                                                        </span>
                                                    )}
                                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                                        request.status === 'pending' 
                                                            ? 'bg-amber-100 text-amber-700' 
                                                            : request.status === 'approved'
                                                            ? 'bg-green-100 text-green-700'
                                                            : 'bg-red-100 text-red-700'
                                                    }`}>
                                                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                                                    </span>
                                                </div>
                                                
                                                {/* Show parent request info for cancellation requests */}
                                                {request.request_type === 'cancel_block' && request.parent_request_id && (
                                                    <div className="mb-2 p-2 bg-purple-50 border border-purple-100 rounded-lg">
                                                        <div className="flex items-center gap-2 text-purple-700">
                                                            <AlertTriangle className="w-4 h-4" />
                                                            <span className="text-sm font-medium">
                                                                Requesting to cancel approved block date
                                                            </span>
                                                        </div>
                                                        {request.parent_start_date && (
                                                            <p className="text-xs text-purple-600 mt-1 ml-6">
                                                                Original block: {formatDate(request.parent_start_date)}
                                                            </p>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Show interchange info for shift swap requests */}
                                                {request.request_type === 'employee_interchange' && request.interchange_with_name && (
                                                    <div className="mb-2 p-2 bg-cyan-50 border border-cyan-100 rounded-lg">
                                                        <div className="flex items-center gap-2 text-cyan-700">
                                                            <RefreshCw className="w-4 h-4" />
                                                            <span className="text-sm font-medium">
                                                                Swap shift with: {request.interchange_with_name}
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}
                                                
                                                <div className="flex items-center gap-2 text-gray-800 font-medium">
                                                    {request.source === 'employee' ? (
                                                        <Users className="w-4 h-4 text-gray-400" />
                                                    ) : (
                                                        <User className="w-4 h-4 text-gray-400" />
                                                    )}
                                                    {request.user_name || request.doctor_name}
                                                </div>
                                                <p className="text-sm text-gray-500">{request.user_email || request.doctor_email}</p>
                                                
                                                <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                                                    {request.source === 'employee' ? (
                                                        <>
                                                            <div>
                                                                <span className="text-gray-500">Original Date:</span>
                                                                <span className="ml-2 text-gray-800">{formatDate(request.original_shift_date || request.start_date)}</span>
                                                            </div>
                                                            {request.original_shift_type && (
                                                                <div>
                                                                    <span className="text-gray-500">Original Shift:</span>
                                                                    <span className="ml-2 text-gray-800">{request.original_shift_type}</span>
                                                                </div>
                                                            )}
                                                            {request.requested_shift_date && (
                                                                <div>
                                                                    <span className="text-gray-500">Requested Date:</span>
                                                                    <span className="ml-2 text-gray-800">{formatDate(request.requested_shift_date)}</span>
                                                                </div>
                                                            )}
                                                            {request.requested_shift_type && (
                                                                <div>
                                                                    <span className="text-gray-500">Requested Shift:</span>
                                                                    <span className="ml-2 text-gray-800">{request.requested_shift_type}</span>
                                                                </div>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <>
                                                            <div>
                                                                <span className="text-gray-500">Date:</span>
                                                                <span className="ml-2 text-gray-800">{formatDate(request.start_date)}</span>
                                                                {request.end_date && request.end_date !== request.start_date && (
                                                                    <span className="text-gray-800"> to {formatDate(request.end_date)}</span>
                                                                )}
                                                            </div>
                                                            {request.schedule_day && (
                                                                <div>
                                                                    <span className="text-gray-500">Schedule:</span>
                                                                    <span className="ml-2 text-gray-800">
                                                                        {request.schedule_day} ({formatTime(request.schedule_start_time)} - {formatTime(request.schedule_end_time)})
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </>
                                                    )}
                                                    {request.new_start_time && (
                                                        <div>
                                                            <span className="text-gray-500">New Start:</span>
                                                            <span className="ml-2 text-gray-800">{formatTime(request.new_start_time)}</span>
                                                        </div>
                                                    )}
                                                    {request.new_end_time && (
                                                        <div>
                                                            <span className="text-gray-500">New End:</span>
                                                            <span className="ml-2 text-gray-800">{formatTime(request.new_end_time)}</span>
                                                        </div>
                                                    )}
                                                    {request.new_max_patients && (
                                                        <div>
                                                            <span className="text-gray-500">Max Patients:</span>
                                                            <span className="ml-2 text-gray-800">{request.new_max_patients}</span>
                                                        </div>
                                                    )}
                                                </div>
                                                
                                                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                                    <div className="flex items-start gap-2">
                                                        <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5" />
                                                        <div>
                                                            <span className="text-xs text-gray-500 uppercase">Reason</span>
                                                            <p className="text-sm text-gray-700">{request.reason}</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <p className="text-xs text-gray-400 mt-2">
                                                    Submitted: {formatDate(request.created_at)}
                                                </p>
                                            </div>
                                        </div>

                                        {request.status === 'pending' && (
                                            <div className="flex flex-col gap-2 ml-4">
                                                <button
                                                    onClick={() => handleApprove(request)}
                                                    disabled={processingId === request.id}
                                                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                                                >
                                                    {processingId === request.id ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <CheckCircle className="w-4 h-4" />
                                                    )}
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={() => { setSelectedRequest(request); setShowRejectModal(true); }}
                                                    disabled={processingId === request.id}
                                                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                                                >
                                                    <XCircle className="w-4 h-4" />
                                                    Reject
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Reject Modal */}
                {showRejectModal && selectedRequest && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Reject Request</h3>
                            <p className="text-gray-600 mb-4">
                                Are you sure you want to reject this {requestTypeLabels[selectedRequest.request_type] || selectedRequest.request_type} request from {selectedRequest.user_name || selectedRequest.doctor_name}?
                            </p>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Reason (optional)</label>
                                <textarea
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                    rows={3}
                                    placeholder="Provide a reason for rejection..."
                                />
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => { setShowRejectModal(false); setRejectReason(''); setSelectedRequest(null); }}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleReject}
                                    disabled={processingId === selectedRequest.id}
                                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                                >
                                    {processingId === selectedRequest.id ? 'Rejecting...' : 'Reject Request'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default BranchAdminModificationRequests;
