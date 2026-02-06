import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../../../components/common/Layout/DashboardLayout';
import {
    CalendarDays, Clock, User, Building2, ChevronLeft,
    CheckCircle, XCircle, AlertCircle, Loader2, Users,
    MessageSquare, Calendar, Edit3
} from 'lucide-react';
import api from "../../../../utils/api/axios";
import { useNavigate } from 'react-router-dom';
import { BranchAdminMenuItems } from '../../../../config/branchAdminNavigation';

interface ScheduleRequest {
    id: string;
    doctor_id: string;
    doctor_name: string;
    doctor_email: string;
    branch_id: string;
    branch_name: string;
    schedule_day: string;
    start_time: string;
    end_time: string;
    max_patients: number;
    time_per_patient: number;
    reason: string;
    requested_at: string;
    status: string;
}

interface RequestStats {
    totalRequests: number;
    pendingRequests: number;
    approvedToday: number;
    rejectedToday: number;
}

export const BranchAdminScheduleRequests: React.FC = () => {
    const [requests, setRequests] = useState<ScheduleRequest[]>([]);
    const [stats, setStats] = useState<RequestStats>({
        totalRequests: 0,
        pendingRequests: 0,
        approvedToday: 0,
        rejectedToday: 0
    });
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [showRequestEditModal, setShowRequestEditModal] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<ScheduleRequest | null>(null);
    const [rejectReason, setRejectReason] = useState('');
    const [editNotes, setEditNotes] = useState('');
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
        
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const response = await api.get('/branch-admin/requests/schedule-requests');
            
            if (response.data.status === 200) {
                const requestsList = response.data.requests || [];
                setRequests(requestsList);
                setStats({
                    totalRequests: requestsList.length,
                    pendingRequests: requestsList.filter((r: ScheduleRequest) => r.status === 'pending').length,
                    approvedToday: 0,
                    rejectedToday: 0
                });
            }
        } catch (error) {
            console.error('Failed to fetch schedule requests:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (request: ScheduleRequest) => {
        if (!confirm(`Approve schedule request from ${request.doctor_name} for ${request.schedule_day}?`)) return;
        
        setProcessingId(request.id);
        try {
            const response = await api.post(`/branch-admin/requests/schedule-requests/${request.id}/approve`, {
                notes: 'Approved by Branch Admin'
            });
            
            if (response.data.status === 200) {
                alert('Schedule request approved successfully!');
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
            const response = await api.post(`/branch-admin/requests/schedule-requests/${selectedRequest.id}/reject`, {
                reason: rejectReason || 'Rejected by Branch Admin',
                notes: rejectReason
            });
            
            if (response.data.status === 200) {
                alert('Schedule request rejected.');
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

    const handleRequestEdit = async () => {
        if (!selectedRequest) return;
        
        setProcessingId(selectedRequest.id);
        try {
            const response = await api.post(`/branch-admin/requests/schedule-requests/${selectedRequest.id}/request-revision`, {
                reason: editNotes,
                notes: editNotes
            });
            
            if (response.data.status === 200) {
                alert('Request sent back to doctor for revision.');
                setShowRequestEditModal(false);
                setEditNotes('');
                setSelectedRequest(null);
                fetchRequests();
            } else {
                alert(response.data.message || 'Failed to send back request');
            }
        } catch (error) {
            console.error('Failed to request edit:', error);
            alert('Failed to send back request. Please try again.');
        } finally {
            setProcessingId(null);
        }
    };

    const formatTime = (time: string) => {
        if (!time) return 'N/A';
        const [hours, minutes] = time.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 || 12;
        return `${hour12}:${minutes} ${ampm}`;
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const calculateDuration = (startTime: string, endTime: string) => {
        if (!startTime || !endTime) return 'N/A';
        try {
            const [startHour, startMin] = startTime.split(':').map(Number);
            const [endHour, endMin] = endTime.split(':').map(Number);
            const startMinutes = startHour * 60 + startMin;
            const endMinutes = endHour * 60 + endMin;
            const durationMinutes = endMinutes - startMinutes;
            
            if (durationMinutes <= 0) return 'N/A';
            
            const hours = Math.floor(durationMinutes / 60);
            const mins = durationMinutes % 60;
            
            if (hours > 0 && mins > 0) {
                return `${hours}h ${mins}m`;
            } else if (hours > 0) {
                return `${hours} hour${hours > 1 ? 's' : ''}`;
            } else {
                return `${mins} minutes`;
            }
        } catch {
            return 'N/A';
        }
    };

    const SidebarMenu = () => (
        <nav className="py-4">
            <div className="px-4 mb-4">
                <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Navigation</h2>
            </div>
            <ul className="space-y-1 px-2">
                {BranchAdminMenuItems.map((item, index) => (
                    <li key={index}>
                        <button
                            onClick={() => navigate(item.path)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                                item.path.includes('/requests') 
                                    ? 'bg-gradient-to-r from-emerald-50 to-blue-50 text-emerald-700'
                                    : 'text-neutral-700 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-blue-50'
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
                <div className="bg-gradient-to-r from-purple-500 to-violet-600 rounded-xl shadow-lg p-6 text-white">
                    <div className="flex items-start justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate('/branch-admin/requests')}
                                className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                            >
                                <ChevronLeft className="w-6 h-6" />
                            </button>
                            <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                                <CalendarDays className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold">Doctor Schedule Requests</h2>
                                <p className="text-purple-100 mt-1">
                                    Review and approve doctor schedule requests
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="flex items-center gap-2 justify-end">
                                <Building2 className="w-4 h-4 text-purple-200" />
                                <span className="text-purple-100">{branchName}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <CalendarDays className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-neutral-900">{stats.totalRequests}</p>
                                <p className="text-xs text-neutral-500">Total Requests</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-amber-100 rounded-lg">
                                <Clock className="w-5 h-5 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-neutral-900">{stats.pendingRequests}</p>
                                <p className="text-xs text-neutral-500">Pending</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <CheckCircle className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-neutral-900">{stats.approvedToday}</p>
                                <p className="text-xs text-neutral-500">Approved Today</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-error-100 rounded-lg">
                                <XCircle className="w-5 h-5 text-error-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-neutral-900">{stats.rejectedToday}</p>
                                <p className="text-xs text-neutral-500">Rejected Today</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Requests List */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                    <div className="p-4 border-b border-gray-100">
                        <h3 className="text-lg font-semibold text-neutral-900">Pending Schedule Requests</h3>
                        <p className="text-sm text-neutral-500">Review doctor schedule requests and approve or send back for revision</p>
                    </div>
                    
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                        </div>
                    ) : requests.length === 0 ? (
                        <div className="text-center py-12">
                            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                            <h3 className="text-lg font-medium text-neutral-900 mb-2">No Pending Requests</h3>
                            <p className="text-neutral-500">All schedule requests have been processed</p>
                        </div>
                    ) : (
                        <div className="p-4 space-y-4">
                            {requests.map((request) => (
                                <div key={request.id} className="bg-neutral-50 rounded-xl border border-neutral-200 overflow-hidden hover:shadow-md transition-shadow">
                                    {/* Request Header */}
                                    <div className="bg-gradient-to-r from-purple-500 to-violet-600 px-5 py-3 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                                                <User className="w-5 h-5 text-white" />
                                            </div>
                                            <div className="text-white">
                                                <h4 className="font-semibold">{request.doctor_name}</h4>
                                                <p className="text-purple-100 text-sm">{request.doctor_email}</p>
                                            </div>
                                        </div>
                                        <span className="px-3 py-1 bg-white/20 text-white text-xs font-medium rounded-full">
                                            Pending Approval
                                        </span>
                                    </div>

                                    {/* Request Body */}
                                    <div className="p-5">
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                                            {/* Day */}
                                            <div className="bg-white rounded-lg p-4 border border-gray-100">
                                                <div className="flex items-center gap-2 text-neutral-500 mb-1">
                                                    <Calendar className="w-4 h-4" />
                                                    <span className="text-xs font-medium uppercase">Day of Week</span>
                                                </div>
                                                <p className="text-lg font-bold text-purple-600">{request.schedule_day}</p>
                                                <p className="text-xs text-neutral-400">Recurring weekly</p>
                                            </div>

                                            {/* Time Slot */}
                                            <div className="bg-white rounded-lg p-4 border border-gray-100">
                                                <div className="flex items-center gap-2 text-neutral-500 mb-1">
                                                    <Clock className="w-4 h-4" />
                                                    <span className="text-xs font-medium uppercase">Time Slot</span>
                                                </div>
                                                <p className="text-lg font-bold text-primary-500">
                                                    {formatTime(request.start_time)} - {formatTime(request.end_time)}
                                                </p>
                                                <p className="text-xs text-neutral-400">
                                                    Duration: {calculateDuration(request.start_time, request.end_time)}
                                                </p>
                                            </div>

                                            {/* Max Patients */}
                                            <div className="bg-white rounded-lg p-4 border border-gray-100">
                                                <div className="flex items-center gap-2 text-neutral-500 mb-1">
                                                    <Users className="w-4 h-4" />
                                                    <span className="text-xs font-medium uppercase">Max Patients</span>
                                                </div>
                                                <p className="text-lg font-bold text-green-600">{request.max_patients}</p>
                                                <p className="text-xs text-neutral-400">per session</p>
                                            </div>

                                            {/* Time Per Patient */}
                                            <div className="bg-white rounded-lg p-4 border border-gray-100">
                                                <div className="flex items-center gap-2 text-neutral-500 mb-1">
                                                    <Clock className="w-4 h-4" />
                                                    <span className="text-xs font-medium uppercase">Time/Patient</span>
                                                </div>
                                                <p className="text-lg font-bold text-orange-600">{request.time_per_patient} min</p>
                                                <p className="text-xs text-neutral-400">consultation time</p>
                                            </div>
                                        </div>

                                        {/* Branch Info */}
                                        <div className="flex items-center gap-4 mb-4 p-3 bg-white rounded-lg border border-gray-100">
                                            <div className="flex items-center gap-2">
                                                <Building2 className="w-5 h-5 text-purple-500" />
                                                <span className="text-sm font-medium text-neutral-700">Branch:</span>
                                                <span className="text-sm text-neutral-900">{request.branch_name}</span>
                                            </div>
                                            <div className="text-gray-300">|</div>
                                            <div className="flex items-center gap-2">
                                                <CalendarDays className="w-5 h-5 text-neutral-400" />
                                                <span className="text-sm text-neutral-500">
                                                    Requested: {formatDate(request.requested_at)}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Reason */}
                                        {request.reason && (
                                            <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 mb-4">
                                                <div className="flex items-start gap-2">
                                                    <MessageSquare className="w-4 h-4 text-primary-500 mt-0.5" />
                                                    <div>
                                                        <span className="text-xs font-medium text-primary-500 uppercase">Request Notes</span>
                                                        <p className="text-sm text-blue-800 mt-1">{request.reason}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Actions */}
                                        <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-neutral-200">
                                            <button
                                                onClick={() => handleApprove(request)}
                                                disabled={processingId === request.id}
                                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 font-medium"
                                            >
                                                {processingId === request.id ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <CheckCircle className="w-4 h-4" />
                                                )}
                                                Approve Schedule
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setSelectedRequest(request);
                                                    setShowRequestEditModal(true);
                                                }}
                                                disabled={processingId === request.id}
                                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50 font-medium"
                                            >
                                                <Edit3 className="w-4 h-4" />
                                                Request Revision
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setSelectedRequest(request);
                                                    setShowRejectModal(true);
                                                }}
                                                disabled={processingId === request.id}
                                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 font-medium"
                                            >
                                                <XCircle className="w-4 h-4" />
                                                Reject Request
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Reject Modal */}
            {showRejectModal && selectedRequest && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
                        <h3 className="text-lg font-semibold text-neutral-900 mb-4">Reject Schedule Request</h3>
                        <p className="text-sm text-neutral-600 mb-4">
                            Rejecting request from <strong>{selectedRequest.doctor_name}</strong> for <strong>{selectedRequest.schedule_day}</strong>
                        </p>
                        <textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="Enter reason for rejection (optional)"
                            className="w-full p-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                            rows={4}
                        />
                        <div className="flex justify-end gap-3 mt-4">
                            <button
                                onClick={() => {
                                    setShowRejectModal(false);
                                    setRejectReason('');
                                    setSelectedRequest(null);
                                }}
                                className="px-4 py-2 text-neutral-700 bg-neutral-100 rounded-lg hover:bg-neutral-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleReject}
                                disabled={processingId === selectedRequest.id}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                            >
                                {processingId === selectedRequest.id ? 'Rejecting...' : 'Reject Request'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Request Edit Modal */}
            {showRequestEditModal && selectedRequest && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
                        <h3 className="text-lg font-semibold text-neutral-900 mb-4">Request Schedule Edit</h3>
                        <p className="text-sm text-neutral-600 mb-4">
                            Send back to <strong>{selectedRequest.doctor_name}</strong> for revision
                        </p>
                        <textarea
                            value={editNotes}
                            onChange={(e) => setEditNotes(e.target.value)}
                            placeholder="Enter notes for the doctor on what needs to be changed..."
                            className="w-full p-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
                            rows={4}
                        />
                        <div className="flex justify-end gap-3 mt-4">
                            <button
                                onClick={() => {
                                    setShowRequestEditModal(false);
                                    setEditNotes('');
                                    setSelectedRequest(null);
                                }}
                                className="px-4 py-2 text-neutral-700 bg-neutral-100 rounded-lg hover:bg-neutral-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRequestEdit}
                                disabled={processingId === selectedRequest.id || !editNotes.trim()}
                                className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50"
                            >
                                {processingId === selectedRequest.id ? 'Sending...' : 'Send for Revision'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
};

export default BranchAdminScheduleRequests;
