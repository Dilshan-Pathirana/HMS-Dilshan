import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Calendar, ArrowLeft, Send, Users, Clock, CheckCircle, XCircle,
    Loader2, Plus, AlertCircle, Bell, Check, X, Activity
} from 'lucide-react';
import api from "../../../../utils/api/axios";
import { toast } from 'react-toastify';

interface ScheduleChangeRequest {
    id: string;
    requestType: 'change' | 'interchange' | 'time_off' | 'cancellation';
    originalShiftDate: string;
    originalShiftType: string;
    requestedShiftDate?: string;
    requestedShiftType?: string;
    interchangeWith?: string;
    interchangeWithName?: string;
    interchangeShiftDate?: string;
    interchangeShiftType?: string;
    reason: string;
    status: 'pending' | 'approved' | 'rejected';
    peerStatus?: 'pending' | 'approved' | 'rejected' | null;
    requestedDate: string;
    responseDate?: string;
    rejectionReason?: string;
}

interface IncomingSwapRequest {
    id: string;
    requesterId: string;
    requesterName: string;
    requesterShiftDate: string;
    requesterShiftType: string;
    yourShiftDate: string | null;
    yourShiftType: string | null;
    reason: string;
    peerStatus: 'pending' | 'approved' | 'rejected';
    status: 'pending' | 'approved' | 'rejected';
    createdAt: string;
}

interface Colleague {
    id: string;
    name: string;
    role: string;
}

interface ShiftType {
    id: string;
    name: string;
    startTime: string;
    endTime: string;
}

const NurseScheduleRequests: React.FC = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'my-requests' | 'new-request' | 'swap-requests'>('my-requests');
    const [isLoading, setIsLoading] = useState(true);
    const [requests, setRequests] = useState<ScheduleChangeRequest[]>([]);
    const [incomingSwapRequests, setIncomingSwapRequests] = useState<IncomingSwapRequest[]>([]);
    const [colleagues, setColleagues] = useState<Colleague[]>([]);
    const [shiftTypes, setShiftTypes] = useState<ShiftType[]>([]);
    
    // New request form
    const [requestType, setRequestType] = useState<'change' | 'interchange' | 'time_off' | 'cancellation'>('time_off');
    const [originalShiftDate, setOriginalShiftDate] = useState('');
    const [originalShiftType, setOriginalShiftType] = useState('');
    const [requestedShiftDate, setRequestedShiftDate] = useState('');
    const [requestedShiftType, setRequestedShiftType] = useState('');
    const [interchangeWith, setInterchangeWith] = useState('');
    const [interchangeShiftDate, setInterchangeShiftDate] = useState('');
    const [interchangeShiftType, setInterchangeShiftType] = useState('');
    const [reason, setReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('authToken');
            const [requestsRes, colleaguesRes, shiftTypesRes, swapRes] = await Promise.all([
                api.get('/hrm/cashier/schedule-change-requests', {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                api.get('/hrm/cashier/colleagues', {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                api.get('/hrm/cashier/shift-types', {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                api.get('/hrm/cashier/incoming-swap-requests', {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);

            if (requestsRes.data.status === 200) {
                setRequests(requestsRes.data.requests || []);
            }
            if (colleaguesRes.data.status === 200) {
                setColleagues(colleaguesRes.data.colleagues || []);
            }
            if (shiftTypesRes.data.status === 200) {
                setShiftTypes(shiftTypesRes.data.shiftTypes || []);
            }
            if (swapRes.data.status === 200) {
                setIncomingSwapRequests(swapRes.data.requests || []);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Failed to load data');
        } finally {
            setIsLoading(false);
        }
    };

    const submitRequest = async () => {
        if (!originalShiftDate || !reason) {
            toast.error('Please fill in all required fields');
            return;
        }

        if (requestType === 'interchange' && !interchangeWith) {
            toast.error('Please select a colleague to swap with');
            return;
        }

        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('authToken');
            const response = await api.post(
                '/hrm/cashier/schedule-change-request',
                {
                    request_type: requestType,
                    original_shift_date: originalShiftDate,
                    original_shift_type: originalShiftType,
                    requested_shift_date: requestedShiftDate,
                    requested_shift_type: requestedShiftType,
                    interchange_with: interchangeWith,
                    interchange_shift_date: interchangeShiftDate,
                    interchange_shift_type: interchangeShiftType,
                    reason
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.status === 200 || response.data.status === 201) {
                toast.success('Request submitted successfully!');
                resetForm();
                setActiveTab('my-requests');
                fetchData();
            } else {
                toast.error(response.data.message || 'Failed to submit request');
            }
        } catch (error: any) {
            console.error('Error submitting request:', error);
            toast.error(error.response?.data?.message || 'Failed to submit request');
        } finally {
            setIsSubmitting(false);
        }
    };

    const respondToSwapRequest = async (requestId: string, action: 'approve' | 'reject', rejectionReason?: string) => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await api.post(
                '/hrm/cashier/respond-swap-request',
                { request_id: requestId, action, rejection_reason: rejectionReason },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.status === 200) {
                toast.success(`Swap request ${action}d successfully!`);
                fetchData();
            } else {
                toast.error(response.data.message || `Failed to ${action} request`);
            }
        } catch (error) {
            console.error(`Error ${action}ing swap request:`, error);
            toast.error(`Failed to ${action} swap request`);
        }
    };

    const resetForm = () => {
        setRequestType('time_off');
        setOriginalShiftDate('');
        setOriginalShiftType('');
        setRequestedShiftDate('');
        setRequestedShiftType('');
        setInterchangeWith('');
        setInterchangeShiftDate('');
        setInterchangeShiftType('');
        setReason('');
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    };

    const getStatusBadge = (status: string) => {
        const badges: Record<string, { bg: string; text: string; label: string }> = {
            pending: { bg: 'bg-amber-100', text: 'text-amber-800', label: 'Pending' },
            approved: { bg: 'bg-green-100', text: 'text-green-800', label: 'Approved' },
            rejected: { bg: 'bg-error-100', text: 'text-red-800', label: 'Rejected' }
        };
        const badge = badges[status] || badges.pending;
        return (
            <span className={`px-2 py-1 ${badge.bg} ${badge.text} text-xs rounded-full font-medium`}>
                {badge.label}
            </span>
        );
    };

    const getRequestTypeBadge = (type: string) => {
        const badges: Record<string, { bg: string; text: string; label: string }> = {
            change: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Shift Change' },
            interchange: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Shift Swap' },
            time_off: { bg: 'bg-green-100', text: 'text-green-800', label: 'Leave' },
            cancellation: { bg: 'bg-error-100', text: 'text-red-800', label: 'Cancellation' }
        };
        const badge = badges[type] || badges.change;
        return (
            <span className={`px-2 py-1 ${badge.bg} ${badge.text} text-xs rounded-full font-medium`}>
                {badge.label}
            </span>
        );
    };

    const pendingRequests = requests.filter(r => r.status === 'pending').length;
    const pendingSwaps = incomingSwapRequests.filter(r => r.peerStatus === 'pending').length;

    if (isLoading) {
        return (
            <div className="min-h-screen bg-neutral-50 flex items-center justify-center sm:ml-64 pt-20">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-teal-500 mx-auto mb-4" />
                    <p className="text-neutral-600">Loading requests...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-teal-50/30 p-6 sm:ml-64 pt-20">
            {/* Header */}
            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/nurse-dashboard/hr')}
                            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 text-neutral-600" />
                        </button>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-teal-100 rounded-lg">
                                <Activity className="w-6 h-6 text-teal-600" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-neutral-800">Leave & Shift Requests</h1>
                                <p className="text-neutral-600 text-sm mt-1">Apply for leave, request shift changes, or swap shifts</p>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={() => setActiveTab('new-request')}
                        className="flex items-center gap-2 px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        New Request
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-amber-900 font-semibold text-2xl">{pendingRequests}</p>
                                <p className="text-amber-700 text-sm">My Pending Requests</p>
                            </div>
                            <Clock className="w-8 h-8 text-amber-500" />
                        </div>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-purple-900 font-semibold text-2xl">{pendingSwaps}</p>
                                <p className="text-purple-700 text-sm">Swap Requests to Review</p>
                            </div>
                            <Users className="w-8 h-8 text-purple-500" />
                        </div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-green-900 font-semibold text-2xl">{requests.filter(r => r.status === 'approved').length}</p>
                                <p className="text-green-700 text-sm">Approved Requests</p>
                            </div>
                            <CheckCircle className="w-8 h-8 text-green-500" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 mb-6">
                <div className="flex border-b border-neutral-200">
                    <button
                        onClick={() => setActiveTab('my-requests')}
                        className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                            activeTab === 'my-requests'
                                ? 'text-teal-600 border-b-2 border-teal-500 bg-teal-50/50'
                                : 'text-neutral-500 hover:text-neutral-700'
                        }`}
                    >
                        My Requests ({requests.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('swap-requests')}
                        className={`flex-1 px-4 py-3 text-sm font-medium transition-colors relative ${
                            activeTab === 'swap-requests'
                                ? 'text-teal-600 border-b-2 border-teal-500 bg-teal-50/50'
                                : 'text-neutral-500 hover:text-neutral-700'
                        }`}
                    >
                        Swap Requests ({incomingSwapRequests.length})
                        {pendingSwaps > 0 && (
                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-error-500 text-white text-xs rounded-full flex items-center justify-center">
                                {pendingSwaps}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('new-request')}
                        className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                            activeTab === 'new-request'
                                ? 'text-teal-600 border-b-2 border-teal-500 bg-teal-50/50'
                                : 'text-neutral-500 hover:text-neutral-700'
                        }`}
                    >
                        <Plus className="w-4 h-4 inline mr-1" />
                        New Request
                    </button>
                </div>

                <div className="p-6">
                    {/* My Requests Tab */}
                    {activeTab === 'my-requests' && (
                        <div>
                            {requests.length === 0 ? (
                                <div className="text-center py-12 text-neutral-500">
                                    <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                    <p>No requests found</p>
                                    <button
                                        onClick={() => setActiveTab('new-request')}
                                        className="mt-4 px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600"
                                    >
                                        Create Your First Request
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {requests.map((request) => (
                                        <div key={request.id} className="border border-neutral-200 rounded-lg p-4 hover:bg-neutral-50">
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex items-center gap-3">
                                                    {getRequestTypeBadge(request.requestType)}
                                                    {getStatusBadge(request.status)}
                                                    {request.requestType === 'interchange' && request.peerStatus && (
                                                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                                                            request.peerStatus === 'approved' ? 'bg-blue-100 text-blue-800' :
                                                            request.peerStatus === 'rejected' ? 'bg-error-100 text-red-800' :
                                                            'bg-neutral-100 text-neutral-800'
                                                        }`}>
                                                            Peer: {request.peerStatus}
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="text-xs text-neutral-500">{formatDate(request.requestedDate)}</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4 mb-3">
                                                <div>
                                                    <p className="text-xs text-neutral-500 mb-1">Original Shift</p>
                                                    <p className="font-medium text-neutral-800">{formatDate(request.originalShiftDate)}</p>
                                                    <p className="text-sm text-neutral-600">{request.originalShiftType}</p>
                                                </div>
                                                {request.requestType === 'interchange' && request.interchangeWithName && (
                                                    <div>
                                                        <p className="text-xs text-neutral-500 mb-1">Swap With</p>
                                                        <p className="font-medium text-neutral-800">{request.interchangeWithName}</p>
                                                        {request.interchangeShiftDate && (
                                                            <p className="text-sm text-neutral-600">{formatDate(request.interchangeShiftDate)}</p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            <p className="text-sm text-neutral-600">
                                                <span className="font-medium">Reason:</span> {request.reason}
                                            </p>
                                            {request.status === 'rejected' && request.rejectionReason && (
                                                <div className="mt-3 p-3 bg-error-50 rounded-lg">
                                                    <p className="text-sm text-red-700">
                                                        <span className="font-medium">Rejection Reason:</span> {request.rejectionReason}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Swap Requests Tab */}
                    {activeTab === 'swap-requests' && (
                        <div>
                            {incomingSwapRequests.length === 0 ? (
                                <div className="text-center py-12 text-neutral-500">
                                    <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                    <p>No swap requests from colleagues</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {incomingSwapRequests.map((request) => (
                                        <div key={request.id} className="border border-neutral-200 rounded-lg p-4 hover:bg-neutral-50">
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex items-center gap-2">
                                                    <Users className="w-4 h-4 text-purple-500" />
                                                    <span className="font-medium text-neutral-800">{request.requesterName}</span>
                                                    <span className="text-neutral-500 text-sm">wants to swap shifts</span>
                                                </div>
                                                {getStatusBadge(request.peerStatus)}
                                            </div>
                                            <div className="grid grid-cols-2 gap-4 mb-3">
                                                <div className="bg-teal-50 p-3 rounded-lg">
                                                    <p className="text-xs text-teal-600 mb-1">Their Shift</p>
                                                    <p className="font-medium text-neutral-800">{formatDate(request.requesterShiftDate)}</p>
                                                    <p className="text-sm text-neutral-600">{request.requesterShiftType}</p>
                                                </div>
                                                <div className="bg-purple-50 p-3 rounded-lg">
                                                    <p className="text-xs text-purple-600 mb-1">Your Shift</p>
                                                    <p className="font-medium text-neutral-800">{request.yourShiftDate ? formatDate(request.yourShiftDate) : '-'}</p>
                                                    <p className="text-sm text-neutral-600">{request.yourShiftType || '-'}</p>
                                                </div>
                                            </div>
                                            <p className="text-sm text-neutral-600 mb-3">
                                                <span className="font-medium">Reason:</span> {request.reason}
                                            </p>
                                            {request.peerStatus === 'pending' && (
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => respondToSwapRequest(request.id, 'approve')}
                                                        className="flex items-center gap-1 px-4 py-2 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600"
                                                    >
                                                        <Check className="w-4 h-4" />
                                                        Accept
                                                    </button>
                                                    <button
                                                        onClick={() => respondToSwapRequest(request.id, 'reject')}
                                                        className="flex items-center gap-1 px-4 py-2 bg-error-500 text-white text-sm rounded-lg hover:bg-red-600"
                                                    >
                                                        <X className="w-4 h-4" />
                                                        Decline
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* New Request Tab */}
                    {activeTab === 'new-request' && (
                        <div>
                            <div className="max-w-2xl">
                                {/* Request Type */}
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-neutral-700 mb-2">Request Type</label>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        {[
                                            { value: 'time_off', label: 'Leave', icon: <Calendar className="w-4 h-4" />, color: 'green' },
                                            { value: 'change', label: 'Shift Change', icon: <Clock className="w-4 h-4" />, color: 'blue' },
                                            { value: 'interchange', label: 'Shift Swap', icon: <Users className="w-4 h-4" />, color: 'purple' },
                                            { value: 'cancellation', label: 'Cancel Shift', icon: <XCircle className="w-4 h-4" />, color: 'red' }
                                        ].map((type) => (
                                            <button
                                                key={type.value}
                                                onClick={() => setRequestType(type.value as any)}
                                                className={`p-3 rounded-lg border-2 transition-all text-left ${
                                                    requestType === type.value
                                                        ? `border-${type.color}-500 bg-${type.color}-50`
                                                        : 'border-neutral-200 hover:border-neutral-300'
                                                }`}
                                            >
                                                <div className={`flex items-center gap-2 ${requestType === type.value ? `text-${type.color}-600` : 'text-neutral-600'}`}>
                                                    {type.icon}
                                                    <span className="font-medium text-sm">{type.label}</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Original Shift Date */}
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                                        {requestType === 'time_off' ? 'Leave Date' : 'Shift Date'}
                                    </label>
                                    <input
                                        type="date"
                                        value={originalShiftDate}
                                        onChange={(e) => setOriginalShiftDate(e.target.value)}
                                        className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                                        min={new Date().toISOString().split('T')[0]}
                                    />
                                </div>

                                {/* Shift Type */}
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-neutral-700 mb-2">Shift Type</label>
                                    <select
                                        value={originalShiftType}
                                        onChange={(e) => setOriginalShiftType(e.target.value)}
                                        className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                                    >
                                        <option value="">Select shift type</option>
                                        {shiftTypes.map((shift) => (
                                            <option key={shift.id} value={shift.name}>
                                                {shift.name} ({shift.startTime} - {shift.endTime})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Interchange With (for swap) */}
                                {requestType === 'interchange' && (
                                    <>
                                        <div className="mb-4">
                                            <label className="block text-sm font-medium text-neutral-700 mb-2">Swap With</label>
                                            <select
                                                value={interchangeWith}
                                                onChange={(e) => setInterchangeWith(e.target.value)}
                                                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                                            >
                                                <option value="">Select colleague</option>
                                                {colleagues.map((colleague) => (
                                                    <option key={colleague.id} value={colleague.id}>
                                                        {colleague.name} ({colleague.role})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="mb-4">
                                            <label className="block text-sm font-medium text-neutral-700 mb-2">Their Shift Date</label>
                                            <input
                                                type="date"
                                                value={interchangeShiftDate}
                                                onChange={(e) => setInterchangeShiftDate(e.target.value)}
                                                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                                            />
                                        </div>
                                        <div className="mb-4">
                                            <label className="block text-sm font-medium text-neutral-700 mb-2">Their Shift Type</label>
                                            <select
                                                value={interchangeShiftType}
                                                onChange={(e) => setInterchangeShiftType(e.target.value)}
                                                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                                            >
                                                <option value="">Select shift type</option>
                                                {shiftTypes.map((shift) => (
                                                    <option key={shift.id} value={shift.name}>
                                                        {shift.name} ({shift.startTime} - {shift.endTime})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </>
                                )}

                                {/* Reason */}
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-neutral-700 mb-2">Reason</label>
                                    <textarea
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        rows={3}
                                        className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                                        placeholder="Please provide a reason for your request..."
                                    />
                                </div>

                                {/* Submit Button */}
                                <button
                                    onClick={submitRequest}
                                    disabled={isSubmitting}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors disabled:opacity-50"
                                >
                                    {isSubmitting ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <Send className="w-5 h-5" />
                                    )}
                                    Submit Request
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NurseScheduleRequests;
