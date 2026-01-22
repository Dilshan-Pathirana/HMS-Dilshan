import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Calendar, ArrowLeft, Send, Users, Clock, CheckCircle, XCircle,
    Loader2, Plus, AlertCircle, Bell, Check, X
} from 'lucide-react';
import axios from 'axios';
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
    peerRespondedAt?: string | null;
    peerRejectionReason?: string | null;
    requestedDate: string;
    responseDate?: string;
    responseBy?: string;
    rejectionReason?: string;
}

// Incoming schedule assignments from Branch Admin
interface IncomingAssignment {
    id: string;
    shiftType: string;
    startTime: string;
    endTime: string;
    date: string;
    daysOfWeek?: string[];
    notes: string | null;
    status: 'pending' | 'acknowledged' | 'rejected';
    assignedBy?: string;
    isOvertime?: boolean;
    reason?: string;
    hours?: number;
    createdAt: string;
}

interface Colleague {
    id: string;
    name: string;
    role: string;
}

interface UserSchedule {
    id: string;
    date: string;
    shiftType: string;
    startTime: string;
    endTime: string;
    status: string;
    daysOfWeek?: string[];
    source?: string;
    isOverridden?: boolean;
    overrideType?: string;
    overrideReason?: string;
}

interface ScheduleOverride {
    id: string;
    date: string;
    type: 'shift_change' | 'time_off' | 'cancellation' | 'interchange';
    originalShiftType: string | null;
    newShiftType: string | null;
    newStartTime: string | null;
    newEndTime: string | null;
    reason: string | null;
    status: string;
}

interface ShiftType {
    id: string;
    name: string;
    startTime: string;
    endTime: string;
}

// Incoming swap request from a colleague
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

const CashierScheduleRequests: React.FC = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [requests, setRequests] = useState<ScheduleChangeRequest[]>([]);
    const [incomingAssignments, setIncomingAssignments] = useState<IncomingAssignment[]>([]);
    const [incomingSwapRequests, setIncomingSwapRequests] = useState<IncomingSwapRequest[]>([]);
    const [colleagues, setColleagues] = useState<Colleague[]>([]);
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [requestType, setRequestType] = useState<'change' | 'interchange' | 'time_off' | 'cancellation'>('change');
    const [userSchedules, setUserSchedules] = useState<UserSchedule[]>([]);
    const [scheduleOverrides, setScheduleOverrides] = useState<ScheduleOverride[]>([]);
    const [selectedScheduleId, setSelectedScheduleId] = useState<string>('');
    const [loadingSchedules, setLoadingSchedules] = useState(false);
    const [shiftTypes, setShiftTypes] = useState<ShiftType[]>([]);
    const [activeTab, setActiveTab] = useState<'incoming' | 'swap-requests' | 'my-requests'>('incoming');
    const [formData, setFormData] = useState({
        originalShiftDate: '',
        originalShiftType: '',
        requestedShiftDate: '',
        requestedShiftType: '',
        interchangeWith: '',
        interchangeShiftDate: '',
        interchangeShiftType: '',
        reason: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSwapRejectModal, setShowSwapRejectModal] = useState(false);
    const [selectedSwapRequest, setSelectedSwapRequest] = useState<IncomingSwapRequest | null>(null);
    const [swapRejectionReason, setSwapRejectionReason] = useState('');
    const [processingSwap, setProcessingSwap] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('authToken');
            const [requestsRes, colleaguesRes, schedulesRes, swapRequestsRes] = await Promise.all([
                axios.get('/api/hrm/cashier/schedule-change-requests', {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get('/api/hrm/cashier/colleagues', {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get('/api/hrm/cashier/schedules', {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get('/api/hrm/cashier/incoming-swap-requests', {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);

            if (requestsRes.data.status === 200) {
                setRequests(requestsRes.data.requests || []);
            }
            if (colleaguesRes.data.status === 200) {
                setColleagues(colleaguesRes.data.colleagues || []);
            }
            if (swapRequestsRes.data.status === 200) {
                setIncomingSwapRequests(swapRequestsRes.data.incomingSwapRequests || []);
            }
            
            // Process incoming assignments (pending schedules from branch admin)
            if (schedulesRes.data.status === 200) {
                const shifts = schedulesRes.data.shifts || [];
                const pendingAssignments: IncomingAssignment[] = shifts
                    .filter((shift: any) => shift.status === 'pending')
                    .map((shift: any) => {
                        // Parse notes for overtime info
                        let notes = null;
                        let isOvertime = false;
                        let reason = '';
                        let hours = 0;
                        let assignedBy = '';
                        
                        try {
                            if (shift.notes) {
                                const parsed = typeof shift.notes === 'string' ? JSON.parse(shift.notes) : shift.notes;
                                if (parsed.type === 'OVERTIME') {
                                    isOvertime = true;
                                    reason = parsed.reason || '';
                                    hours = parsed.hours || 0;
                                    assignedBy = parsed.assigned_by || '';
                                } else {
                                    notes = shift.notes;
                                }
                            }
                        } catch {
                            notes = shift.notes;
                        }
                        
                        return {
                            id: shift.id,
                            shiftType: shift.shiftType || 'Shift',
                            startTime: shift.startTime || '08:00',
                            endTime: shift.endTime || '17:00',
                            date: shift.date,
                            daysOfWeek: shift.daysOfWeek,
                            notes: notes,
                            status: shift.status,
                            assignedBy: assignedBy,
                            isOvertime: isOvertime,
                            reason: reason,
                            hours: hours,
                            createdAt: shift.createdAt || new Date().toISOString()
                        };
                    });
                setIncomingAssignments(pendingAssignments);
                
                // If there are pending assignments, show that tab first
                if (pendingAssignments.length > 0) {
                    setActiveTab('incoming');
                }
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Failed to load schedule requests');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleAcknowledgeAssignment = async (assignmentId: string) => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await axios.post(
                '/api/hrm/cashier/acknowledge-shift',
                { shift_id: assignmentId },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.status === 200) {
                toast.success('Schedule acknowledged successfully!');
                fetchData();
            } else {
                toast.error(response.data.message || 'Failed to acknowledge');
            }
        } catch (error) {
            console.error('Error acknowledging assignment:', error);
            toast.error('Failed to acknowledge assignment');
        }
    };
    
    const handleRejectAssignment = async (assignmentId: string, reason: string) => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await axios.post(
                '/api/hrm/cashier/reject-shift',
                { shift_id: assignmentId, rejection_reason: reason },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.status === 200) {
                toast.success('Schedule rejected');
                fetchData();
            } else {
                toast.error(response.data.message || 'Failed to reject');
            }
        } catch (error) {
            console.error('Error rejecting assignment:', error);
            toast.error('Failed to reject assignment');
        }
    };

    const fetchShiftTypes = async () => {
        try {
            const token = localStorage.getItem('authToken');
            
            // First try /api/hrm/cashier/shift-types (cashier-accessible endpoint)
            try {
                const response = await axios.get('/api/hrm/cashier/shift-types', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                
                if (response.data.status === 200 && response.data.shiftTypes?.length > 0) {
                    setShiftTypes(response.data.shiftTypes);
                    return;
                }
            } catch (e: any) {
                // Silently fail and try next endpoint - don't let 401 trigger logout
                if (e?.response?.status !== 401) {
                    console.log('cashier shift-types endpoint not available, trying fallback');
                }
            }
            
            // Fallback to /api/hrm/shifts (shift_definitions table)
            try {
                const response = await axios.get('/api/hrm/shifts', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                
                if (response.data.status === 200) {
                    const types = (response.data.shifts || []).map((s: any) => ({
                        id: s.id,
                        name: s.shift_name || s.shiftName || s.name,
                        startTime: s.start_time || s.startTime,
                        endTime: s.end_time || s.endTime
                    }));
                    if (types.length > 0) {
                        setShiftTypes(types);
                        return;
                    }
                }
            } catch (e: any) {
                if (e?.response?.status !== 401) {
                    console.log('hrm/shifts failed, using defaults');
                }
            }
            
            // Use fallback shift types if all APIs fail
            setShiftTypes([
                { id: '1', name: 'Morning', startTime: '06:00', endTime: '14:00' },
                { id: '2', name: 'Evening', startTime: '14:00', endTime: '22:00' },
                { id: '3', name: 'Night', startTime: '22:00', endTime: '06:00' }
            ]);
        } catch (error) {
            console.error('Error fetching shift types:', error);
            // Use fallback shift types if API fails
            setShiftTypes([
                { id: '1', name: 'Morning', startTime: '06:00', endTime: '14:00' },
                { id: '2', name: 'Evening', startTime: '14:00', endTime: '22:00' },
                { id: '3', name: 'Night', startTime: '22:00', endTime: '06:00' }
            ]);
        }
    };

    // Generate occurrences for repeating schedules and apply overrides
    const generateScheduleOccurrences = (shifts: UserSchedule[], overrides: ScheduleOverride[]): UserSchedule[] => {
        const today = new Date();
        const twoWeeksLater = new Date();
        twoWeeksLater.setDate(today.getDate() + 14);
        
        // Map ISO day numbers (1=Monday to 7=Sunday) to JS day numbers (0=Sunday to 6=Saturday)
        const isoToJsDay: { [key: string]: number } = {
            '1': 1, // Monday
            '2': 2, // Tuesday
            '3': 3, // Wednesday
            '4': 4, // Thursday
            '5': 5, // Friday
            '6': 6, // Saturday
            '7': 0  // Sunday
        };
        
        // Create a map of overrides by date for quick lookup
        const overridesByDate: { [date: string]: ScheduleOverride } = {};
        overrides.forEach(override => {
            overridesByDate[override.date] = override;
        });
        
        const allSchedules: UserSchedule[] = [];
        
        shifts.forEach((shift) => {
            // If schedule has daysOfWeek, generate individual occurrences
            if (shift.daysOfWeek && shift.daysOfWeek.length > 0 && shift.source === 'shift_management') {
                const currentDate = new Date(today);
                
                // Convert daysOfWeek from ISO format to JS format
                const jsDays = shift.daysOfWeek.map(d => isoToJsDay[d] ?? parseInt(d));
                
                while (currentDate <= twoWeeksLater) {
                    const currentJsDay = currentDate.getDay();
                    if (jsDays.includes(currentJsDay)) {
                        const dateStr = currentDate.toISOString().split('T')[0];
                        const override = overridesByDate[dateStr];
                        
                        // Skip if this date is cancelled or time_off
                        if (override && (override.type === 'cancellation' || override.type === 'time_off')) {
                            // Add a modified entry showing the day off
                            allSchedules.push({
                                ...shift,
                                id: `${shift.id}_${dateStr}`,
                                date: dateStr,
                                shiftType: override.type === 'time_off' ? 'Time Off' : 'Cancelled',
                                isOverridden: true,
                                overrideType: override.type,
                                overrideReason: override.reason || undefined,
                                status: 'approved_change'
                            });
                        } else if (override && override.type === 'shift_change') {
                            // Apply the shift change
                            allSchedules.push({
                                ...shift,
                                id: `${shift.id}_${dateStr}`,
                                date: dateStr,
                                shiftType: override.newShiftType || shift.shiftType,
                                startTime: override.newStartTime || shift.startTime,
                                endTime: override.newEndTime || shift.endTime,
                                isOverridden: true,
                                overrideType: override.type,
                                overrideReason: override.reason || undefined,
                                status: 'approved_change'
                            });
                        } else if (override && override.type === 'interchange') {
                            // Show interchange info
                            allSchedules.push({
                                ...shift,
                                id: `${shift.id}_${dateStr}`,
                                date: dateStr,
                                shiftType: override.newShiftType || shift.shiftType,
                                startTime: override.newStartTime || shift.startTime,
                                endTime: override.newEndTime || shift.endTime,
                                isOverridden: true,
                                overrideType: override.type,
                                overrideReason: 'Shift swapped',
                                status: 'approved_change'
                            });
                        } else {
                            // No override, use original schedule
                            allSchedules.push({
                                ...shift,
                                id: `${shift.id}_${dateStr}`,
                                date: dateStr
                            });
                        }
                    }
                    currentDate.setDate(currentDate.getDate() + 1);
                }
            } else {
                // Regular single-date schedule - include all acknowledged schedules for request purposes
                const shiftDate = shift.date || new Date().toISOString().split('T')[0];
                if (shiftDate >= today.toISOString().split('T')[0]) {
                    const override = overridesByDate[shiftDate];
                    if (override) {
                        allSchedules.push({
                            ...shift,
                            shiftType: override.newShiftType || shift.shiftType,
                            startTime: override.newStartTime || shift.startTime,
                            endTime: override.newEndTime || shift.endTime,
                            isOverridden: true,
                            overrideType: override.type,
                            overrideReason: override.reason || undefined,
                            status: 'approved_change'
                        });
                    } else {
                        allSchedules.push(shift);
                    }
                }
            }
        });
        
        // Sort by date
        return allSchedules.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    };

    const fetchUserSchedules = async () => {
        setLoadingSchedules(true);
        try {
            const token = localStorage.getItem('authToken');
            const response = await axios.get('/api/hrm/cashier/schedules', {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (response.data.status === 200) {
                const shifts = response.data.shifts || [];
                const overrides = response.data.overrides || [];
                // Store overrides in state
                setScheduleOverrides(overrides);
                // Generate occurrences for repeating schedules with overrides applied
                const allSchedules = generateScheduleOccurrences(shifts, overrides);
                setUserSchedules(allSchedules);
            }
        } catch (error) {
            console.error('Error fetching user schedules:', error);
            toast.error('Failed to load your schedules');
        } finally {
            setLoadingSchedules(false);
        }
    };

    const handleOpenRequestModal = () => {
        setShowRequestModal(true);
        fetchUserSchedules();
        fetchShiftTypes();
        setSelectedScheduleId('');
        setFormData({
            originalShiftDate: '',
            originalShiftType: '',
            requestedShiftDate: '',
            requestedShiftType: '',
            interchangeWith: '',
            interchangeShiftDate: '',
            interchangeShiftType: '',
            reason: ''
        });
    };

    const handleSelectSchedule = (schedule: UserSchedule) => {
        setSelectedScheduleId(schedule.id);
        setFormData({
            ...formData,
            originalShiftDate: schedule.date,
            originalShiftType: schedule.shiftType
        });
    };
    
    // Handle approving a swap request from a colleague
    const handleApproveSwapRequest = async (requestId: string) => {
        setProcessingSwap(true);
        try {
            const token = localStorage.getItem('authToken');
            const response = await axios.post(
                '/api/hrm/cashier/respond-swap-request',
                { request_id: requestId, action: 'approve' },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            if (response.data.status === 200) {
                toast.success(response.data.message || 'Swap request approved! It will be sent to Branch Admin.');
                fetchData();
            } else {
                toast.error(response.data.message || 'Failed to approve swap request');
            }
        } catch (error) {
            console.error('Error approving swap request:', error);
            toast.error('Failed to approve swap request');
        } finally {
            setProcessingSwap(false);
        }
    };
    
    // Handle rejecting a swap request from a colleague
    const handleRejectSwapRequest = async () => {
        if (!selectedSwapRequest) return;
        
        setProcessingSwap(true);
        try {
            const token = localStorage.getItem('authToken');
            const response = await axios.post(
                '/api/hrm/cashier/respond-swap-request',
                { 
                    request_id: selectedSwapRequest.id, 
                    action: 'reject',
                    rejection_reason: swapRejectionReason || 'No reason provided'
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            if (response.data.status === 200) {
                toast.success('Swap request rejected');
                setShowSwapRejectModal(false);
                setSelectedSwapRequest(null);
                setSwapRejectionReason('');
                fetchData();
            } else {
                toast.error(response.data.message || 'Failed to reject swap request');
            }
        } catch (error) {
            console.error('Error rejecting swap request:', error);
            toast.error('Failed to reject swap request');
        } finally {
            setProcessingSwap(false);
        }
    };
    
    const openSwapRejectModal = (request: IncomingSwapRequest) => {
        setSelectedSwapRequest(request);
        setSwapRejectionReason('');
        setShowSwapRejectModal(true);
    };

    const handleSubmitRequest = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.originalShiftDate || !formData.reason) {
            toast.error('Please fill in all required fields');
            return;
        }

        if (requestType === 'interchange' && !formData.interchangeWith) {
            toast.error('Please select a colleague to interchange with');
            return;
        }

        if (requestType === 'change' && (!formData.requestedShiftDate || !formData.requestedShiftType)) {
            toast.error('Please specify the requested shift details');
            return;
        }

        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('authToken');
            const response = await axios.post(
                '/api/hrm/cashier/schedule-change-request',
                {
                    ...formData,
                    requestType
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.status === 200 || response.data.status === 201) {
                toast.success(response.data.message || 'Schedule change request submitted successfully!');
                setShowRequestModal(false);
                setFormData({
                    originalShiftDate: '',
                    originalShiftType: '',
                    requestedShiftDate: '',
                    requestedShiftType: '',
                    interchangeWith: '',
                    interchangeShiftDate: '',
                    interchangeShiftType: '',
                    reason: ''
                });
                fetchData();
            } else {
                toast.error(response.data.message || 'Failed to submit request');
            }
        } catch (error) {
            console.error('Error submitting request:', error);
            toast.error('Failed to submit request');
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    };

    const getStatusBadge = (status: string) => {
        const badges = {
            pending: { bg: 'bg-amber-100', text: 'text-amber-800', icon: <Clock className="w-4 h-4" />, label: 'Pending' },
            approved: { bg: 'bg-green-100', text: 'text-green-800', icon: <CheckCircle className="w-4 h-4" />, label: 'Approved' },
            rejected: { bg: 'bg-red-100', text: 'text-red-800', icon: <XCircle className="w-4 h-4" />, label: 'Rejected' }
        };
        const badge = badges[status as keyof typeof badges] || badges.pending;
        return (
            <span className={`flex items-center gap-1.5 px-3 py-1 ${badge.bg} ${badge.text} text-sm rounded-full font-medium`}>
                {badge.icon}
                {badge.label}
            </span>
        );
    };

    const getRequestTypeLabel = (type: string) => {
        const labels = {
            change: 'Schedule Change',
            interchange: 'Shift Interchange',
            time_off: 'Time Off',
            cancellation: 'Shift Cancellation'
        };
        return labels[type as keyof typeof labels] || type;
    };

    const pendingRequests = requests.filter(r => r.status === 'pending').length;
    const approvedRequests = requests.filter(r => r.status === 'approved').length;
    const rejectedRequests = requests.filter(r => r.status === 'rejected').length;

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-purple-500 mx-auto mb-4" />
                    <p className="text-gray-600">Loading schedule requests...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50/30 p-6">
            {/* Header */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/pos/hr')}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 text-gray-600" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">Schedule Change Requests</h1>
                            <p className="text-gray-600 text-sm mt-1">Request schedule changes or swap shifts with colleagues</p>
                        </div>
                    </div>
                    <button
                        onClick={handleOpenRequestModal}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        New Request
                    </button>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-purple-900 font-semibold text-2xl">{incomingAssignments.length}</p>
                                <p className="text-purple-700 text-sm">New Assignments</p>
                            </div>
                            <Bell className="w-8 h-8 text-purple-500" />
                        </div>
                    </div>
                    <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-amber-900 font-semibold text-2xl">{pendingRequests}</p>
                                <p className="text-amber-700 text-sm">Pending</p>
                            </div>
                            <Clock className="w-8 h-8 text-amber-500" />
                        </div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-green-900 font-semibold text-2xl">{approvedRequests}</p>
                                <p className="text-green-700 text-sm">Approved</p>
                            </div>
                            <CheckCircle className="w-8 h-8 text-green-500" />
                        </div>
                    </div>
                    <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-red-900 font-semibold text-2xl">{rejectedRequests}</p>
                                <p className="text-red-700 text-sm">Rejected</p>
                            </div>
                            <XCircle className="w-8 h-8 text-red-500" />
                        </div>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-blue-900 font-semibold text-2xl">{requests.length}</p>
                                <p className="text-blue-700 text-sm">Total Requests</p>
                            </div>
                            <Calendar className="w-8 h-8 text-blue-500" />
                        </div>
                    </div>
                    {incomingSwapRequests.length > 0 && (
                        <div className="bg-cyan-50 rounded-lg p-4 border border-cyan-200 animate-pulse">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-cyan-900 font-semibold text-2xl">{incomingSwapRequests.length}</p>
                                    <p className="text-cyan-700 text-sm">Swap Requests</p>
                                </div>
                                <Users className="w-8 h-8 text-cyan-500" />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
                <div className="flex border-b border-gray-200">
                    <button
                        onClick={() => setActiveTab('incoming')}
                        className={`flex-1 px-6 py-4 text-sm font-medium flex items-center justify-center gap-2 ${
                            activeTab === 'incoming'
                                ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50/50'
                                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                        }`}
                    >
                        <Bell className="w-4 h-4" />
                        Incoming Assignments
                        {incomingAssignments.length > 0 && (
                            <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded-full">
                                {incomingAssignments.length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('swap-requests')}
                        className={`flex-1 px-6 py-4 text-sm font-medium flex items-center justify-center gap-2 ${
                            activeTab === 'swap-requests'
                                ? 'text-cyan-600 border-b-2 border-cyan-600 bg-cyan-50/50'
                                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                        }`}
                    >
                        <Users className="w-4 h-4" />
                        Swap Requests
                        {incomingSwapRequests.length > 0 && (
                            <span className="px-2 py-0.5 text-xs bg-cyan-100 text-cyan-700 rounded-full animate-pulse">
                                {incomingSwapRequests.length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('my-requests')}
                        className={`flex-1 px-6 py-4 text-sm font-medium flex items-center justify-center gap-2 ${
                            activeTab === 'my-requests'
                                ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50/50'
                                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                        }`}
                    >
                        <Send className="w-4 h-4" />
                        My Requests
                        {requests.length > 0 && (
                            <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded-full">
                                {requests.length}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* Incoming Swap Requests Tab */}
            {activeTab === 'swap-requests' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
                    <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-gray-800">
                            Shift Swap Requests from Colleagues ({incomingSwapRequests.length})
                        </h2>
                    </div>
                    
                    {incomingSwapRequests.length === 0 ? (
                        <div className="p-12 text-center">
                            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500">No pending swap requests from colleagues</p>
                            <p className="text-sm text-gray-400 mt-1">When a colleague wants to swap shifts with you, it will appear here</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {incomingSwapRequests.map((swapReq) => (
                                <div key={swapReq.id} className="p-4 hover:bg-cyan-50/50 transition-colors">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center">
                                                    <Users className="w-5 h-5 text-cyan-600" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-800">{swapReq.requesterName}</p>
                                                    <p className="text-xs text-gray-500">wants to swap shifts with you</p>
                                                </div>
                                            </div>
                                            
                                            <div className="grid grid-cols-2 gap-4 mt-3 p-3 bg-gray-50 rounded-lg">
                                                <div>
                                                    <p className="text-xs text-gray-500 mb-1">Their Shift (You'll Get)</p>
                                                    <p className="font-medium text-gray-800">{formatDate(swapReq.requesterShiftDate)}</p>
                                                    <p className="text-sm text-cyan-600">{swapReq.requesterShiftType || 'Not specified'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500 mb-1">Your Shift (They Want)</p>
                                                    <p className="font-medium text-gray-800">
                                                        {swapReq.yourShiftDate ? formatDate(swapReq.yourShiftDate) : 'To be determined'}
                                                    </p>
                                                    <p className="text-sm text-purple-600">{swapReq.yourShiftType || 'Not specified'}</p>
                                                </div>
                                            </div>
                                            
                                            <div className="mt-3 p-2 bg-amber-50 rounded-lg">
                                                <p className="text-xs text-amber-700 font-medium">Reason:</p>
                                                <p className="text-sm text-gray-700">{swapReq.reason}</p>
                                            </div>
                                            
                                            <p className="text-xs text-gray-400 mt-2">
                                                Requested on {new Date(swapReq.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                        
                                        <div className="flex flex-col gap-2 ml-4">
                                            <button
                                                onClick={() => handleApproveSwapRequest(swapReq.id)}
                                                disabled={processingSwap}
                                                className="px-4 py-2 bg-emerald-500 text-white text-sm rounded-lg hover:bg-emerald-600 transition-colors flex items-center gap-1 disabled:opacity-50"
                                            >
                                                <Check className="w-4 h-4" />
                                                Approve
                                            </button>
                                            <button
                                                onClick={() => openSwapRejectModal(swapReq)}
                                                disabled={processingSwap}
                                                className="px-4 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors flex items-center gap-1 disabled:opacity-50"
                                            >
                                                <X className="w-4 h-4" />
                                                Reject
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Incoming Assignments Tab */}
            {activeTab === 'incoming' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
                    <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-gray-800">
                            Incoming Schedule Assignments ({incomingAssignments.length})
                        </h2>
                        <p className="text-sm text-gray-500">Schedules assigned by Branch Admin that need your response</p>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {incomingAssignments.length === 0 ? (
                            <div className="py-12 text-center text-gray-500">
                                <Bell className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                                <p className="text-lg mb-2">No pending assignments</p>
                                <p className="text-sm">You have no new schedule assignments from your Branch Admin</p>
                            </div>
                        ) : (
                            incomingAssignments.map((assignment) => (
                                <div key={assignment.id} className="p-6 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${assignment.isOvertime ? 'bg-orange-100' : 'bg-purple-100'}`}>
                                                {assignment.isOvertime ? (
                                                    <Clock className="w-5 h-5 text-orange-600" />
                                                ) : (
                                                    <Calendar className="w-5 h-5 text-purple-600" />
                                                )}
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-gray-800">
                                                    {assignment.isOvertime ? 'Overtime Assignment' : 'Schedule Assignment'}
                                                </h3>
                                                <p className="text-xs text-gray-500">
                                                    {assignment.assignedBy ? `Assigned by ${assignment.assignedBy}` : 'Assigned by Branch Admin'}
                                                </p>
                                            </div>
                                        </div>
                                        <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-800 text-sm rounded-full font-medium">
                                            <AlertCircle className="w-4 h-4" />
                                            Pending Response
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <p className="text-xs text-gray-500 mb-2">Shift Type</p>
                                            <p className="font-medium text-gray-800">{assignment.shiftType}</p>
                                        </div>
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <p className="text-xs text-gray-500 mb-2">Date</p>
                                            <p className="font-medium text-gray-800">{formatDate(assignment.date)}</p>
                                        </div>
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <p className="text-xs text-gray-500 mb-2">Time</p>
                                            <p className="font-medium text-gray-800">{assignment.startTime} - {assignment.endTime}</p>
                                        </div>
                                    </div>
                                    
                                    {assignment.isOvertime && assignment.reason && (
                                        <div className="bg-orange-50 p-4 rounded-lg mb-4">
                                            <p className="text-xs text-orange-600 mb-2">Overtime Reason ({assignment.hours}h)</p>
                                            <p className="text-gray-700">{assignment.reason}</p>
                                        </div>
                                    )}
                                    
                                    {assignment.notes && !assignment.isOvertime && (
                                        <div className="bg-blue-50 p-4 rounded-lg mb-4">
                                            <p className="text-xs text-blue-600 mb-2">Notes</p>
                                            <p className="text-gray-700">{assignment.notes}</p>
                                        </div>
                                    )}

                                    <div className="flex justify-end gap-3">
                                        <button
                                            onClick={() => {
                                                const reason = prompt('Reason for rejection (optional):');
                                                if (reason !== null) {
                                                    handleRejectAssignment(assignment.id, reason);
                                                }
                                            }}
                                            className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                                        >
                                            <X className="w-4 h-4" />
                                            Reject
                                        </button>
                                        <button
                                            onClick={() => handleAcknowledgeAssignment(assignment.id)}
                                            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                                        >
                                            <Check className="w-4 h-4" />
                                            Accept & Acknowledge
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* My Requests Tab */}
            {activeTab === 'my-requests' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-800">My Requests ({requests.length})</h2>
                </div>
                <div className="divide-y divide-gray-100">
                    {requests.length === 0 ? (
                        <div className="py-12 text-center text-gray-500">
                            <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                            <p className="text-lg mb-2">No schedule requests yet</p>
                            <p className="text-sm">Click "New Request" to submit a schedule change request</p>
                        </div>
                    ) : (
                        requests.map((request) => (
                            <div key={request.id} className="p-6 hover:bg-gray-50 transition-colors">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${
                                            request.requestType === 'change' ? 'bg-blue-100' :
                                            request.requestType === 'interchange' ? 'bg-purple-100' :
                                            'bg-amber-100'
                                        }`}>
                                            {request.requestType === 'interchange' ? (
                                                <Users className="w-5 h-5 text-purple-600" />
                                            ) : (
                                                <Calendar className="w-5 h-5 text-blue-600" />
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-800">
                                                {getRequestTypeLabel(request.requestType)}
                                            </h3>
                                            <p className="text-xs text-gray-500">
                                                Requested on {formatDate(request.requestedDate)}
                                            </p>
                                        </div>
                                    </div>
                                    {getStatusBadge(request.status)}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <p className="text-xs text-gray-500 mb-2">Original Shift</p>
                                        <p className="font-medium text-gray-800">{formatDate(request.originalShiftDate)}</p>
                                        <p className="text-sm text-gray-600">{request.originalShiftType}</p>
                                    </div>
                                    {request.requestType === 'change' && request.requestedShiftDate && (
                                        <div className="bg-blue-50 p-4 rounded-lg">
                                            <p className="text-xs text-blue-600 mb-2">Requested Shift</p>
                                            <p className="font-medium text-gray-800">{formatDate(request.requestedShiftDate)}</p>
                                            <p className="text-sm text-gray-600">{request.requestedShiftType}</p>
                                        </div>
                                    )}
                                    {request.requestType === 'interchange' && request.interchangeWithName && (
                                        <div className="bg-purple-50 p-4 rounded-lg">
                                            <p className="text-xs text-purple-600 mb-2">Swap With</p>
                                            <p className="font-medium text-gray-800">{request.interchangeWithName}</p>
                                            {/* Peer approval status */}
                                            {request.peerStatus && (
                                                <div className="mt-2">
                                                    {request.peerStatus === 'pending' && (
                                                        <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded-full">
                                                            <Clock className="w-3 h-3" />
                                                            Waiting for their approval
                                                        </span>
                                                    )}
                                                    {request.peerStatus === 'approved' && (
                                                        <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                                                            <CheckCircle className="w-3 h-3" />
                                                            Approved - Pending Admin Review
                                                        </span>
                                                    )}
                                                    {request.peerStatus === 'rejected' && (
                                                        <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-red-100 text-red-700 rounded-full">
                                                            <XCircle className="w-3 h-3" />
                                                            Declined by colleague
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Peer rejection reason */}
                                {request.requestType === 'interchange' && request.peerStatus === 'rejected' && request.peerRejectionReason && (
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                                        <div className="flex items-start gap-2">
                                            <Users className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                            <div>
                                                <p className="text-sm font-medium text-red-800 mb-1">Colleague's Response:</p>
                                                <p className="text-sm text-red-700">{request.peerRejectionReason}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="mb-4">
                                    <p className="text-sm font-medium text-gray-700 mb-1">Reason:</p>
                                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{request.reason}</p>
                                </div>

                                {request.status === 'rejected' && request.rejectionReason && (
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                        <div className="flex items-start gap-2">
                                            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                            <div>
                                                <p className="text-sm font-medium text-red-800 mb-1">Rejection Reason:</p>
                                                <p className="text-sm text-red-700">{request.rejectionReason}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {request.responseDate && (
                                    <div className="text-xs text-gray-500 mt-3">
                                        {request.status === 'approved' ? 'Approved' : 'Rejected'} on {formatDate(request.responseDate)}
                                        {request.responseBy && ` by ${request.responseBy}`}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
            )}

            {/* Request Modal */}
            {showRequestModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-xl font-bold text-gray-800">New Schedule Request</h2>
                        </div>
                        <form onSubmit={handleSubmitRequest} className="p-6">
                            <div className="space-y-4">
                                {/* Request Type */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Request Type *
                                    </label>
                                    <div className="grid grid-cols-3 gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setRequestType('change')}
                                            className={`p-4 border-2 rounded-lg text-center transition-all ${
                                                requestType === 'change'
                                                    ? 'border-blue-500 bg-blue-50'
                                                    : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                        >
                                            <Calendar className="w-6 h-6 mx-auto mb-2 text-blue-500" />
                                            <p className="text-sm font-medium">Schedule Change</p>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setRequestType('interchange')}
                                            className={`p-4 border-2 rounded-lg text-center transition-all ${
                                                requestType === 'interchange'
                                                    ? 'border-purple-500 bg-purple-50'
                                                    : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                        >
                                            <Users className="w-6 h-6 mx-auto mb-2 text-purple-500" />
                                            <p className="text-sm font-medium">Shift Swap</p>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setRequestType('time_off')}
                                            className={`p-4 border-2 rounded-lg text-center transition-all ${
                                                requestType === 'time_off'
                                                    ? 'border-amber-500 bg-amber-50'
                                                    : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                        >
                                            <Clock className="w-6 h-6 mx-auto mb-2 text-amber-500" />
                                            <p className="text-sm font-medium">Time Off</p>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setRequestType('cancellation')}
                                            className={`p-4 border-2 rounded-lg text-center transition-all ${
                                                requestType === 'cancellation'
                                                    ? 'border-red-500 bg-red-50'
                                                    : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                        >
                                            <XCircle className="w-6 h-6 mx-auto mb-2 text-red-500" />
                                            <p className="text-sm font-medium">Cancel Shift</p>
                                        </button>
                                    </div>
                                </div>

                                {/* Select from Available Schedules */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Select Your Schedule *
                                    </label>
                                    {loadingSchedules ? (
                                        <div className="flex items-center justify-center py-8 bg-gray-50 rounded-lg">
                                            <Loader2 className="w-6 h-6 animate-spin text-purple-500 mr-2" />
                                            <span className="text-gray-500">Loading your schedules...</span>
                                        </div>
                                    ) : userSchedules.length === 0 ? (
                                        <div className="text-center py-8 bg-gray-50 rounded-lg">
                                            <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                                            <p className="text-gray-500">No upcoming schedules found</p>
                                            <p className="text-xs text-gray-400 mt-1">You need assigned schedules to make a request</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-2">
                                            {userSchedules.map((schedule) => {
                                                const isSelected = selectedScheduleId === schedule.id;
                                                const dateObj = new Date(schedule.date);
                                                return (
                                                    <div
                                                        key={schedule.id}
                                                        onClick={() => handleSelectSchedule(schedule)}
                                                        className={`p-3 rounded-lg cursor-pointer transition-all border-2 ${
                                                            schedule.isOverridden
                                                                ? 'bg-purple-50 border-purple-200'
                                                                : isSelected
                                                                    ? 'border-purple-500 bg-purple-50'
                                                                    : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                                                        }`}
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-3">
                                                                <div className={`w-3 h-3 rounded-full ${isSelected ? 'bg-purple-500' : schedule.isOverridden ? 'bg-purple-400' : 'bg-gray-300'}`}></div>
                                                                <div>
                                                                    <p className="font-medium text-gray-800">
                                                                        {dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                                                    </p>
                                                                    <p className="text-xs text-gray-500">{schedule.date}</p>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="flex items-center gap-2 justify-end">
                                                                    {schedule.isOverridden && (
                                                                        <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full font-medium">
                                                                            {schedule.overrideType === 'time_off' ? 'Time Off' :
                                                                             schedule.overrideType === 'cancellation' ? 'Cancelled' :
                                                                             schedule.overrideType === 'shift_change' ? 'Changed' :
                                                                             schedule.overrideType === 'interchange' ? 'Swapped' : 'Modified'}
                                                                        </span>
                                                                    )}
                                                                    <span className={`px-2 py-1 ${schedule.isOverridden ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'} text-xs rounded-full font-medium`}>
                                                                        {schedule.shiftType}
                                                                    </span>
                                                                </div>
                                                                <p className="text-xs text-gray-500 mt-1">
                                                                    {schedule.startTime} - {schedule.endTime}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                    {selectedScheduleId && (
                                        <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                                            <CheckCircle className="w-3 h-3" />
                                            Selected: {formData.originalShiftDate} - {formData.originalShiftType}
                                        </p>
                                    )}
                                </div>

                                {/* Requested Shift (for change type) */}
                                {requestType === 'change' && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Requested Shift Date *
                                            </label>
                                            <input
                                                type="date"
                                                value={formData.requestedShiftDate}
                                                onChange={(e) => setFormData({ ...formData, requestedShiftDate: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Requested Shift Type *
                                            </label>
                                            <select
                                                value={formData.requestedShiftType}
                                                onChange={(e) => setFormData({ ...formData, requestedShiftType: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                                required
                                            >
                                                <option value="">Select shift</option>
                                                {shiftTypes.length > 0 ? (
                                                    shiftTypes.map((shift) => (
                                                        <option key={shift.id} value={shift.name}>
                                                            {shift.name} ({shift.startTime} - {shift.endTime})
                                                        </option>
                                                    ))
                                                ) : (
                                                    <>
                                                        <option value="Morning">Morning</option>
                                                        <option value="Evening">Evening</option>
                                                        <option value="Night">Night</option>
                                                    </>
                                                )}
                                            </select>
                                        </div>
                                    </div>
                                )}

                                {/* Colleague Selection (for interchange) */}
                                {requestType === 'interchange' && (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                <Users className="w-4 h-4 inline mr-1" />
                                                Swap With Colleague *
                                            </label>
                                            <select
                                                value={formData.interchangeWith}
                                                onChange={(e) => setFormData({ ...formData, interchangeWith: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                                required
                                            >
                                                <option value="">Select colleague</option>
                                                {colleagues.map(colleague => (
                                                    <option key={colleague.id} value={colleague.id}>
                                                        {colleague.name} ({colleague.role})
                                                    </option>
                                                ))}
                                            </select>
                                            {colleagues.length === 0 && (
                                                <p className="text-xs text-amber-600 mt-1">
                                                    No colleagues available in your branch for shift swap
                                                </p>
                                            )}
                                        </div>
                                        
                                        {formData.interchangeWith && (
                                            <div className="p-3 bg-cyan-50 border border-cyan-200 rounded-lg">
                                                <p className="text-sm text-cyan-800 font-medium mb-2">
                                                    <AlertCircle className="w-4 h-4 inline mr-1" />
                                                    How Shift Swap Works:
                                                </p>
                                                <ol className="text-xs text-cyan-700 space-y-1 list-decimal list-inside">
                                                    <li>Your request will be sent to the selected colleague</li>
                                                    <li>They must approve the swap first</li>
                                                    <li>After their approval, it goes to Branch Admin for final decision</li>
                                                </ol>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Reason */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Reason *
                                    </label>
                                    <textarea
                                        value={formData.reason}
                                        onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                        rows={4}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                        placeholder="Please provide a detailed reason for this request..."
                                        required
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-3 mt-6">
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Submitting...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-4 h-4" />
                                            Submit Request
                                        </>
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowRequestModal(false)}
                                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            
            {/* Swap Reject Modal */}
            {showSwapRejectModal && selectedSwapRequest && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                                <X className="w-5 h-5 text-red-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-800">Reject Swap Request</h3>
                                <p className="text-sm text-gray-500">From {selectedSwapRequest.requesterName}</p>
                            </div>
                        </div>
                        
                        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-600">
                                <span className="font-medium">Their shift:</span> {formatDate(selectedSwapRequest.requesterShiftDate)} - {selectedSwapRequest.requesterShiftType}
                            </p>
                        </div>
                        
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Reason for rejection (optional)
                            </label>
                            <textarea
                                value={swapRejectionReason}
                                onChange={(e) => setSwapRejectionReason(e.target.value)}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                placeholder="e.g., I have a prior commitment on that date..."
                            />
                        </div>
                        
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleRejectSwapRequest}
                                disabled={processingSwap}
                                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                            >
                                {processingSwap ? 'Rejecting...' : 'Confirm Reject'}
                            </button>
                            <button
                                onClick={() => {
                                    setShowSwapRejectModal(false);
                                    setSelectedSwapRequest(null);
                                    setSwapRejectionReason('');
                                }}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CashierScheduleRequests;
