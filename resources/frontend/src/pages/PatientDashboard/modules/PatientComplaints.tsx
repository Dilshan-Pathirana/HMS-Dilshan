import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';
import {
    MessageSquare,
    Plus,
    Star,
    Clock,
    CheckCircle,
    AlertCircle,
    X,
    Send,
    ChevronDown,
    ChevronUp,
    Building2,
    User,
    Calendar,
    Filter,
    ThumbsUp,
    ThumbsDown,
    Frown,
    Meh,
    Smile,
    Bell,
    Eye
} from 'lucide-react';
import axios from 'axios';

interface Complaint {
    id: string;
    subject: string;
    type: 'medical' | 'service' | 'facility' | 'billing' | 'other';
    description: string;
    branch_name?: string;
    doctor_name?: string;
    status: 'pending' | 'in-review' | 'resolved' | 'closed';
    created_at: string;
    updated_at?: string;
    response?: string;
    response_by?: string;
    response_date?: string;
    rating?: number;
}

interface Feedback {
    id: string;
    visit_id?: string;
    doctor_name?: string;
    branch_name?: string;
    rating: number;
    experience: 'positive' | 'neutral' | 'negative';
    comment?: string;
    created_at: string;
}

const COMPLAINT_TYPES = [
    { value: 'medical', label: 'Medical Concern', icon: '🏥' },
    { value: 'service', label: 'Service Quality', icon: '⭐' },
    { value: 'facility', label: 'Facility Issue', icon: '🏢' },
    { value: 'billing', label: 'Billing Issue', icon: '💰' },
    { value: 'other', label: 'Other', icon: '📝' }
];

const PatientComplaints: React.FC = () => {
    const userId = useSelector((state: RootState) => state.auth.userId);
    const [activeTab, setActiveTab] = useState<'complaints' | 'feedback'>('complaints');
    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
    const [loading, setLoading] = useState(true);
    const [showNewComplaint, setShowNewComplaint] = useState(false);
    const [showNewFeedback, setShowNewFeedback] = useState(false);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [doctors, setDoctors] = useState<{ value: string; label: string }[]>([]);
    const [branches, setBranches] = useState<{ value: string; label: string }[]>([]);
    const [seenResponses, setSeenResponses] = useState<string[]>([]);

    // Get seen responses from localStorage on mount
    useEffect(() => {
        const storedSeenResponses = localStorage.getItem('seenComplaintResponses');
        if (storedSeenResponses) {
            setSeenResponses(JSON.parse(storedSeenResponses));
        }
    }, []);

    // Mark a response as seen
    const markResponseAsSeen = (complaintId: string) => {
        if (!seenResponses.includes(complaintId)) {
            const newSeenResponses = [...seenResponses, complaintId];
            setSeenResponses(newSeenResponses);
            localStorage.setItem('seenComplaintResponses', JSON.stringify(newSeenResponses));
        }
    };

    // Check if a complaint has a new (unseen) response
    const hasNewResponse = (complaint: Complaint) => {
        return complaint.response && !seenResponses.includes(complaint.id);
    };

    // Count complaints with new responses
    const newResponsesCount = complaints.filter(c => hasNewResponse(c)).length;

    // New complaint form
    const [newComplaint, setNewComplaint] = useState({
        type: 'service',
        subject: '',
        description: '',
        branch: '',
        doctor: ''
    });

    // New feedback form
    const [newFeedback, setNewFeedback] = useState({
        rating: 0,
        experience: '' as 'positive' | 'neutral' | 'negative' | '',
        comment: '',
        doctor: '',
        branch: ''
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [myFeedbacksRes, doctorsRes, branchesRes] = await Promise.all([
                    axios.get('/api/patient/my-feedbacks'),
                    axios.get('/api/get-doctors'),
                    axios.get('/api/get-branches')
                ]);
                
                if (myFeedbacksRes.data.status === 200) {
                    const allFeedbacks = myFeedbacksRes.data.feedbacks || [];
                    
                    // Separate complaints from general feedback
                    const complaintItems = allFeedbacks.filter((f: any) => 
                        ['complaint', 'medical', 'service', 'facility', 'billing'].includes(f.category)
                    ).map((f: any) => ({
                        id: f.id?.toString() || f.uuid,
                        subject: f.subject,
                        type: f.category === 'complaint' ? 'other' : f.category,
                        description: f.description,
                        branch_name: f.branch_name,
                        doctor_name: f.doctor_name,
                        status: f.status,
                        created_at: f.created_at,
                        response: f.admin_response,
                        response_by: f.responded_by_name,
                        response_date: f.responded_at
                    }));

                    const feedbackItems = allFeedbacks.filter((f: any) => 
                        ['general', 'suggestion', 'staff'].includes(f.category) || f.rating
                    ).map((f: any) => ({
                        id: f.id?.toString() || f.uuid,
                        doctor_name: f.doctor_name,
                        branch_name: f.branch_name,
                        rating: f.rating || 0,
                        experience: f.experience || 'neutral',
                        comment: f.description,
                        created_at: f.created_at
                    }));

                    setComplaints(complaintItems);
                    setFeedbacks(feedbackItems);
                }
                
                if (doctorsRes.data.doctors) {
                    const doctorOptions = doctorsRes.data.doctors.map((doctor: any) => ({
                        value: doctor.user_id,
                        label: `Dr. ${doctor.first_name} ${doctor.last_name}`
                    }));
                    setDoctors(doctorOptions);
                }

                if (branchesRes.data.branches) {
                    const branchOptions = branchesRes.data.branches.map((branch: any) => ({
                        value: branch.id.toString(),
                        label: branch.center_name
                    }));
                    setBranches(branchOptions);
                }
            } catch (error) {
                // Mock data for demo
                setComplaints([
                    {
                        id: '1',
                        subject: 'Long waiting time in reception',
                        type: 'service',
                        description: 'I had to wait for over 2 hours despite having an appointment. The reception area was crowded and there was no communication about the delay.',
                        branch_name: 'Main Hospital - City Center',
                        status: 'resolved',
                        created_at: '2025-01-15T10:30:00',
                        response: 'We apologize for the inconvenience. We have implemented a new queue management system to reduce waiting times. Thank you for your feedback.',
                        response_by: 'Patient Relations Team',
                        response_date: '2025-01-17T14:00:00'
                    },
                    {
                        id: '2',
                        subject: 'Billing discrepancy',
                        type: 'billing',
                        description: 'I was charged twice for the same consultation. Need this to be corrected.',
                        branch_name: 'Main Hospital - City Center',
                        status: 'in-review',
                        created_at: '2025-01-20T09:15:00'
                    },
                    {
                        id: '3',
                        subject: 'Excellent care from Dr. Johnson',
                        type: 'medical',
                        description: 'Just wanted to compliment Dr. Sarah Johnson for her excellent care during my recent treatment.',
                        doctor_name: 'Dr. Sarah Johnson',
                        status: 'closed',
                        created_at: '2025-01-10T16:45:00',
                        response: 'Thank you for your kind words! We have shared your appreciation with Dr. Johnson.',
                        response_by: 'Hospital Administration',
                        response_date: '2025-01-11T10:00:00'
                    }
                ]);

                setFeedbacks([
                    {
                        id: '1',
                        doctor_name: 'Dr. Sarah Johnson',
                        branch_name: 'Main Hospital - City Center',
                        rating: 5,
                        experience: 'positive',
                        comment: 'Very professional and caring doctor. Took time to explain everything.',
                        created_at: '2025-01-18T11:00:00'
                    },
                    {
                        id: '2',
                        doctor_name: 'Dr. Michael Chen',
                        branch_name: 'Westside Clinic',
                        rating: 4,
                        experience: 'positive',
                        comment: 'Good consultation, but had to wait a bit longer than expected.',
                        created_at: '2025-01-12T14:30:00'
                    }
                ]);
            } finally {
                setLoading(false);
            }
        };

        if (userId) {
            fetchData();
        }
    }, [userId]);

    const handleSubmitComplaint = async () => {
        if (!newComplaint.subject || !newComplaint.description || !newComplaint.branch) return;

        try {
            // Map complaint type to category - complaints are a special type
            const category = newComplaint.type === 'other' ? 'complaint' : newComplaint.type;
            
            // Get doctor_id from selected doctor option (doctor IDs are UUIDs)
            const selectedDoctor = doctors.find(d => d.label === newComplaint.doctor);
            const doctorId = selectedDoctor ? selectedDoctor.value : null;
            
            // Get branch_id if branch selected (branch IDs are UUIDs)
            const selectedBranch = branches.find(b => b.label === newComplaint.branch);
            const branchId = selectedBranch ? selectedBranch.value : null;

            const response = await axios.post('/api/submit-feedback', {
                category: category,
                subject: newComplaint.subject,
                description: newComplaint.description,
                doctor_id: doctorId,
                branch_id: branchId,
                is_anonymous: false
            });

            if (response.data.status === 201) {
                // Add to local state
                const complaint: Complaint = {
                    id: response.data.feedback.id?.toString() || Date.now().toString(),
                    subject: newComplaint.subject,
                    type: newComplaint.type as any,
                    description: newComplaint.description,
                    branch_name: newComplaint.branch || undefined,
                    doctor_name: newComplaint.doctor || undefined,
                    status: 'pending',
                    created_at: new Date().toISOString()
                };
                setComplaints([complaint, ...complaints]);
                setNewComplaint({ type: 'service', subject: '', description: '', branch: '', doctor: '' });
                setShowNewComplaint(false);
            }
        } catch (error) {
            console.error('Failed to submit complaint:', error);
            // Fallback to local update
            const complaint: Complaint = {
                id: Date.now().toString(),
                subject: newComplaint.subject,
                type: newComplaint.type as any,
                description: newComplaint.description,
                branch_name: newComplaint.branch || undefined,
                doctor_name: newComplaint.doctor || undefined,
                status: 'pending',
                created_at: new Date().toISOString()
            };
            setComplaints([complaint, ...complaints]);
            setNewComplaint({ type: 'service', subject: '', description: '', branch: '', doctor: '' });
            setShowNewComplaint(false);
        }
    };

    const handleSubmitFeedback = async () => {
        if (!newFeedback.rating || !newFeedback.experience) return;

        try {
            // Get doctor_id from selected doctor option (doctor IDs are UUIDs)
            const selectedDoctor = doctors.find(d => d.label === newFeedback.doctor);
            const doctorId = selectedDoctor ? selectedDoctor.value : null;
            
            // Get branch_id if branch selected (branch IDs are UUIDs)
            const selectedBranch = branches.find(b => b.label === newFeedback.branch);
            const branchId = selectedBranch ? selectedBranch.value : null;

            const response = await axios.post('/api/submit-feedback', {
                category: 'general',
                subject: newFeedback.comment ? 'General Feedback' : 'Rating Feedback',
                description: newFeedback.comment || `Rating: ${newFeedback.rating} stars - Experience: ${newFeedback.experience}`,
                rating: newFeedback.rating,
                experience: newFeedback.experience,
                doctor_id: doctorId,
                branch_id: branchId,
                is_anonymous: false
            });

            if (response.data.status === 201) {
                const feedback: Feedback = {
                    id: response.data.feedback.id?.toString() || Date.now().toString(),
                    doctor_name: newFeedback.doctor || undefined,
                    branch_name: newFeedback.branch || undefined,
                    rating: newFeedback.rating,
                    experience: newFeedback.experience as any,
                    comment: newFeedback.comment || undefined,
                    created_at: new Date().toISOString()
                };
                setFeedbacks([feedback, ...feedbacks]);
                setNewFeedback({ rating: 0, experience: '', comment: '', doctor: '', branch: '' });
                setShowNewFeedback(false);
            }
        } catch (error) {
            console.error('Failed to submit feedback:', error);
            // Fallback to local update
            const feedback: Feedback = {
                id: Date.now().toString(),
                doctor_name: newFeedback.doctor || undefined,
                branch_name: newFeedback.branch || undefined,
                rating: newFeedback.rating,
                experience: newFeedback.experience as any,
                comment: newFeedback.comment || undefined,
                created_at: new Date().toISOString()
            };
            setFeedbacks([feedback, ...feedbacks]);
            setNewFeedback({ rating: 0, experience: '', comment: '', doctor: '', branch: '' });
            setShowNewFeedback(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-700';
            case 'in-review': return 'bg-blue-100 text-blue-700';
            case 'resolved': return 'bg-green-100 text-green-700';
            case 'closed': return 'bg-gray-100 text-gray-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'pending': return <Clock className="w-4 h-4" />;
            case 'in-review': return <AlertCircle className="w-4 h-4" />;
            case 'resolved': return <CheckCircle className="w-4 h-4" />;
            default: return <CheckCircle className="w-4 h-4" />;
        }
    };

    const getExperienceIcon = (experience: string) => {
        switch (experience) {
            case 'positive': return <Smile className="w-6 h-6 text-green-500" />;
            case 'neutral': return <Meh className="w-6 h-6 text-yellow-500" />;
            case 'negative': return <Frown className="w-6 h-6 text-red-500" />;
            default: return null;
        }
    };

    const filteredComplaints = complaints.filter(c => 
        filterStatus === 'all' || c.status === filterStatus
    );

    const pendingCount = complaints.filter(c => c.status === 'pending' || c.status === 'in-review').length;
    const resolvedCount = complaints.filter(c => c.status === 'resolved' || c.status === 'closed').length;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-800">Complaints & Feedback</h1>
                <p className="text-gray-500">Share your concerns or rate your experience</p>
            </div>

            {/* New Responses Notification Banner */}
            {newResponsesCount > 0 && (
                <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl shadow-lg p-4 animate-pulse">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-full">
                                <Bell className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <p className="text-white font-semibold">
                                    You have {newResponsesCount} new response{newResponsesCount > 1 ? 's' : ''}!
                                </p>
                                <p className="text-white/80 text-sm">
                                    The branch admin has responded to your complaint{newResponsesCount > 1 ? 's' : ''}
                                </p>
                            </div>
                        </div>
                        <button 
                            onClick={() => setFilterStatus('all')}
                            className="px-4 py-2 bg-white text-emerald-600 rounded-lg font-medium hover:bg-emerald-50 transition-colors flex items-center gap-2"
                        >
                            <Eye className="w-4 h-4" />
                            View Now
                        </button>
                    </div>
                </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Total Complaints</p>
                            <p className="text-3xl font-bold text-gray-800">{complaints.length}</p>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-xl text-gray-600">
                            <MessageSquare className="w-8 h-8" />
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Pending</p>
                            <p className="text-3xl font-bold text-yellow-600">{pendingCount}</p>
                        </div>
                        <div className="p-3 bg-yellow-50 rounded-xl text-yellow-600">
                            <Clock className="w-8 h-8" />
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Resolved</p>
                            <p className="text-3xl font-bold text-green-600">{resolvedCount}</p>
                        </div>
                        <div className="p-3 bg-green-50 rounded-xl text-green-600">
                            <CheckCircle className="w-8 h-8" />
                        </div>
                    </div>
                </div>
                {/* New Responses Card */}
                <div className={`rounded-xl shadow-sm border p-5 ${newResponsesCount > 0 ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200' : 'bg-white border-gray-100'}`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">New Responses</p>
                            <p className={`text-3xl font-bold ${newResponsesCount > 0 ? 'text-emerald-600' : 'text-gray-400'}`}>{newResponsesCount}</p>
                        </div>
                        <div className={`p-3 rounded-xl relative ${newResponsesCount > 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-50 text-gray-400'}`}>
                            <Bell className="w-8 h-8" />
                            {newResponsesCount > 0 && (
                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-ping"></span>
                            )}
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Feedback Given</p>
                            <p className="text-3xl font-bold text-blue-600">{feedbacks.length}</p>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                            <Star className="w-8 h-8" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-2">
                <div className="flex gap-2">
                    <button
                        onClick={() => setActiveTab('complaints')}
                        className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                            activeTab === 'complaints'
                                ? 'bg-emerald-600 text-white'
                                : 'text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                        <MessageSquare className="w-5 h-5" />
                        Complaints & Concerns
                    </button>
                    <button
                        onClick={() => setActiveTab('feedback')}
                        className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                            activeTab === 'feedback'
                                ? 'bg-emerald-600 text-white'
                                : 'text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                        <Star className="w-5 h-5" />
                        Ratings & Feedback
                    </button>
                </div>
            </div>

            {/* Complaints Tab */}
            {activeTab === 'complaints' && (
                <div className="space-y-4">
                    {/* Actions Bar */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-between">
                        <div className="flex items-center gap-2">
                            <Filter className="w-5 h-5 text-gray-400" />
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            >
                                <option value="all">All Status</option>
                                <option value="pending">Pending</option>
                                <option value="in-review">In Review</option>
                                <option value="resolved">Resolved</option>
                                <option value="closed">Closed</option>
                            </select>
                        </div>
                        <button
                            onClick={() => setShowNewComplaint(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                        >
                            <Plus className="w-5 h-5" />
                            New Complaint
                        </button>
                    </div>

                    {/* Complaints List */}
                    {filteredComplaints.length === 0 ? (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                            <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-800 mb-2">No complaints found</h3>
                            <p className="text-gray-500 mb-4">Submit a complaint or concern and we'll address it promptly</p>
                            <button
                                onClick={() => setShowNewComplaint(true)}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                            >
                                <Plus className="w-5 h-5" />
                                Submit Complaint
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredComplaints.map((complaint) => (
                                <div key={complaint.id} className={`bg-white rounded-xl shadow-sm border overflow-hidden transition-all ${hasNewResponse(complaint) ? 'border-emerald-300 ring-2 ring-emerald-100' : 'border-gray-100'}`}>
                                    <div 
                                        className="p-5 cursor-pointer hover:bg-gray-50 transition-colors"
                                        onClick={() => {
                                            const isExpanding = expandedId !== complaint.id;
                                            setExpandedId(isExpanding ? complaint.id : null);
                                            // Mark as seen when expanded
                                            if (isExpanding && hasNewResponse(complaint)) {
                                                markResponseAsSeen(complaint.id);
                                            }
                                        }}
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-start gap-3">
                                                    <span className="text-2xl">
                                                        {COMPLAINT_TYPES.find(t => t.value === complaint.type)?.icon || '📝'}
                                                    </span>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <h3 className="font-semibold text-gray-800">{complaint.subject}</h3>
                                                            {hasNewResponse(complaint) && (
                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500 text-white animate-pulse">
                                                                    <Bell className="w-3 h-3" />
                                                                    New Response!
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-gray-500">
                                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(complaint.status)}`}>
                                                                {getStatusIcon(complaint.status)}
                                                                {complaint.status.charAt(0).toUpperCase() + complaint.status.slice(1).replace('-', ' ')}
                                                            </span>
                                                            <span className="flex items-center gap-1">
                                                                <Calendar className="w-4 h-4" />
                                                                {new Date(complaint.created_at).toLocaleDateString('en-US', { 
                                                                    month: 'short', 
                                                                    day: 'numeric', 
                                                                    year: 'numeric' 
                                                                })}
                                                            </span>
                                                            {complaint.branch_name && (
                                                                <span className="flex items-center gap-1">
                                                                    <Building2 className="w-4 h-4" />
                                                                    {complaint.branch_name}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            {expandedId === complaint.id ? (
                                                <ChevronUp className="w-5 h-5 text-gray-400" />
                                            ) : (
                                                <ChevronDown className="w-5 h-5 text-gray-400" />
                                            )}
                                        </div>
                                    </div>

                                    {/* Expanded Details */}
                                    {expandedId === complaint.id && (
                                        <div className="px-5 pb-5 border-t border-gray-100">
                                            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                                                <p className="text-sm text-gray-700">{complaint.description}</p>
                                            </div>

                                            {complaint.response && (
                                                <div className="mt-4 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <CheckCircle className="w-5 h-5 text-emerald-600" />
                                                        <span className="font-medium text-emerald-800">Response from {complaint.response_by}</span>
                                                    </div>
                                                    <p className="text-sm text-emerald-700">{complaint.response}</p>
                                                    {complaint.response_date && (
                                                        <p className="mt-2 text-xs text-emerald-600">
                                                            Responded on {new Date(complaint.response_date).toLocaleDateString('en-US', { 
                                                                month: 'long', 
                                                                day: 'numeric', 
                                                                year: 'numeric' 
                                                            })}
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Feedback Tab */}
            {activeTab === 'feedback' && (
                <div className="space-y-4">
                    {/* Add Feedback Button */}
                    <div className="flex justify-end">
                        <button
                            onClick={() => setShowNewFeedback(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                        >
                            <Plus className="w-5 h-5" />
                            Give Feedback
                        </button>
                    </div>

                    {/* Feedback List */}
                    {feedbacks.length === 0 ? (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                            <Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-800 mb-2">No feedback given yet</h3>
                            <p className="text-gray-500 mb-4">Share your experience to help us improve our services</p>
                            <button
                                onClick={() => setShowNewFeedback(true)}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                            >
                                <Plus className="w-5 h-5" />
                                Give Feedback
                            </button>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {feedbacks.map((feedback) => (
                                <div key={feedback.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                                    <div className="flex items-start gap-4">
                                        <div className="flex-shrink-0">
                                            {getExperienceIcon(feedback.experience)}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    {feedback.doctor_name && (
                                                        <h3 className="font-semibold text-gray-800">{feedback.doctor_name}</h3>
                                                    )}
                                                    {feedback.branch_name && (
                                                        <p className="text-sm text-gray-500 flex items-center gap-1">
                                                            <Building2 className="w-4 h-4" />
                                                            {feedback.branch_name}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                        <Star
                                                            key={star}
                                                            className={`w-5 h-5 ${
                                                                star <= feedback.rating
                                                                    ? 'text-yellow-400 fill-yellow-400'
                                                                    : 'text-gray-300'
                                                            }`}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                            {feedback.comment && (
                                                <p className="mt-3 text-sm text-gray-600">{feedback.comment}</p>
                                            )}
                                            <p className="mt-3 text-xs text-gray-400">
                                                {new Date(feedback.created_at).toLocaleDateString('en-US', { 
                                                    month: 'long', 
                                                    day: 'numeric', 
                                                    year: 'numeric' 
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* New Complaint Modal */}
            {showNewComplaint && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-100">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold text-gray-800">Submit a Complaint</h2>
                                <button
                                    onClick={() => setShowNewComplaint(false)}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-5">
                            {/* Type Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Category *
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    {COMPLAINT_TYPES.map((type) => (
                                        <button
                                            key={type.value}
                                            onClick={() => setNewComplaint({ ...newComplaint, type: type.value })}
                                            className={`p-3 rounded-xl border-2 transition-colors flex items-center gap-2 ${
                                                newComplaint.type === type.value
                                                    ? 'border-emerald-500 bg-emerald-50'
                                                    : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                        >
                                            <span className="text-xl">{type.icon}</span>
                                            <span className={`text-sm font-medium ${
                                                newComplaint.type === type.value ? 'text-emerald-700' : 'text-gray-600'
                                            }`}>{type.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Subject */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Subject *
                                </label>
                                <input
                                    type="text"
                                    value={newComplaint.subject}
                                    onChange={(e) => setNewComplaint({ ...newComplaint, subject: e.target.value })}
                                    placeholder="Brief summary of your concern..."
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Description *
                                </label>
                                <textarea
                                    value={newComplaint.description}
                                    onChange={(e) => setNewComplaint({ ...newComplaint, description: e.target.value })}
                                    placeholder="Please describe your concern in detail..."
                                    rows={4}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
                                />
                            </div>

                            {/* Branch (required) */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Medical Center *
                                </label>
                                <select
                                    value={newComplaint.branch}
                                    onChange={(e) => setNewComplaint({ ...newComplaint, branch: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    required
                                >
                                    <option value="">Select a medical center</option>
                                    {branches.map((branch) => (
                                        <option key={branch.value} value={branch.label}>
                                            {branch.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-100 flex gap-3">
                            <button
                                onClick={() => setShowNewComplaint(false)}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmitComplaint}
                                disabled={!newComplaint.subject || !newComplaint.description || !newComplaint.branch}
                                className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                <Send className="w-5 h-5" />
                                Submit
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* New Feedback Modal */}
            {showNewFeedback && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-100">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold text-gray-800">Give Feedback</h2>
                                <button
                                    onClick={() => setShowNewFeedback(false)}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-5">
                            {/* Rating */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-3">
                                    Rate your experience *
                                </label>
                                <div className="flex justify-center gap-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            onClick={() => setNewFeedback({ ...newFeedback, rating: star })}
                                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                        >
                                            <Star
                                                className={`w-10 h-10 ${
                                                    star <= newFeedback.rating
                                                        ? 'text-yellow-400 fill-yellow-400'
                                                        : 'text-gray-300'
                                                }`}
                                            />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Experience */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-3">
                                    How was your experience? *
                                </label>
                                <div className="grid grid-cols-3 gap-3">
                                    {[
                                        { key: 'positive', label: 'Positive', icon: Smile, color: 'green' },
                                        { key: 'neutral', label: 'Neutral', icon: Meh, color: 'yellow' },
                                        { key: 'negative', label: 'Negative', icon: Frown, color: 'red' }
                                    ].map((exp) => (
                                        <button
                                            key={exp.key}
                                            onClick={() => setNewFeedback({ ...newFeedback, experience: exp.key as any })}
                                            className={`p-4 rounded-xl border-2 transition-colors flex flex-col items-center gap-2 ${
                                                newFeedback.experience === exp.key
                                                    ? `border-${exp.color}-500 bg-${exp.color}-50`
                                                    : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                        >
                                            <exp.icon className={`w-8 h-8 ${
                                                newFeedback.experience === exp.key 
                                                    ? `text-${exp.color}-500` 
                                                    : 'text-gray-400'
                                            }`} />
                                            <span className="text-sm font-medium text-gray-600">{exp.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Doctor (optional) */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Doctor (optional)
                                </label>
                                <select
                                    value={newFeedback.doctor}
                                    onChange={(e) => setNewFeedback({ ...newFeedback, doctor: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                                >
                                    <option value="">Select a doctor (optional)</option>
                                    {doctors.map((doctor) => (
                                        <option key={doctor.value} value={doctor.label}>
                                            {doctor.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Comment */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Comments (optional)
                                </label>
                                <textarea
                                    value={newFeedback.comment}
                                    onChange={(e) => setNewFeedback({ ...newFeedback, comment: e.target.value })}
                                    placeholder="Tell us more about your experience..."
                                    rows={3}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
                                />
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-100 flex gap-3">
                            <button
                                onClick={() => setShowNewFeedback(false)}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmitFeedback}
                                disabled={!newFeedback.rating || !newFeedback.experience}
                                className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                <Send className="w-5 h-5" />
                                Submit
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PatientComplaints;
