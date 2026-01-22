import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { DashboardLayout } from '../../../components/common/Layout/DashboardLayout';
import { BranchAdminSidebar } from '../../../components/common/Layout/BranchAdminSidebar';
import {
    MessageSquare,
    Search,
    Star,
    Clock,
    CheckCircle,
    Flag,
    Send,
    X,
    User,
    Building2,
    Calendar,
    ThumbsUp,
    ThumbsDown,
    Meh,
    RefreshCw,
    Eye,
    MessageCircle,
    Stethoscope
} from 'lucide-react';
import axios from 'axios';

interface Feedback {
    id: number;
    uuid: string;
    user_id: number;
    user_type: string;
    user_name: string;
    branch_id: number | null;
    branch_name: string | null;
    doctor_id: number | null;
    doctor_name: string | null;
    category: string;
    subject: string;
    description: string;
    rating: number | null;
    experience: 'positive' | 'neutral' | 'negative' | null;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    status: 'pending' | 'in-review' | 'responded' | 'resolved' | 'closed';
    admin_response: string | null;
    responded_by: number | null;
    responded_by_name: string | null;
    responded_at: string | null;
    internal_notes: string | null;
    is_anonymous: boolean;
    is_flagged: boolean;
    flag_reason: string | null;
    created_at: string;
    updated_at: string;
}

interface Stats {
    total: number;
    pending: number;
    in_review: number;
    responded: number;
    resolved: number;
    flagged: number;
    by_category: Record<string, number>;
    by_user_type: Record<string, number>;
    average_rating: number;
}

const CATEGORIES = [
    { value: 'all', label: 'All Categories' },
    { value: 'service', label: 'Service Quality' },
    { value: 'facility', label: 'Facility Issue' },
    { value: 'staff', label: 'Staff Feedback' },
    { value: 'medical', label: 'Medical Care' },
    { value: 'billing', label: 'Billing Issue' },
    { value: 'general', label: 'General' },
    { value: 'suggestion', label: 'Suggestion' },
    { value: 'complaint', label: 'Complaint' }
];

const STATUSES = [
    { value: 'all', label: 'All Status' },
    { value: 'pending', label: 'Pending' },
    { value: 'in-review', label: 'In Review' },
    { value: 'responded', label: 'Responded' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'closed', label: 'Closed' }
];

const PRIORITIES = [
    { value: 'all', label: 'All Priorities' },
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' }
];

const USER_TYPES = [
    { value: 'all', label: 'All Users' },
    { value: 'patient', label: 'Patients' },
    { value: 'staff', label: 'Staff' }
];

export const BranchAdminFeedbacks: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [userName, setUserName] = useState('Branch Admin');
    const [branchName, setBranchName] = useState('');
    const [userGender, setUserGender] = useState('');
    const [profileImage, setProfileImage] = useState('');
    
    const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterPriority, setFilterPriority] = useState('all');
    const [filterUserType, setFilterUserType] = useState('all');
    const [showFlagged, setShowFlagged] = useState(false);
    const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showResponseModal, setShowResponseModal] = useState(false);
    const [responseText, setResponseText] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [expandedId, setExpandedId] = useState<number | null>(null);

    useEffect(() => {
        // Get user info from localStorage
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const userInfo = JSON.parse(userStr);
            setUserName(`${userInfo.first_name || ''} ${userInfo.last_name || ''}`);
            setBranchName(userInfo.branch_name || '');
            setUserGender(userInfo.gender || 'male');
            setProfileImage(userInfo.profile_picture || '');
        }
    }, []);

    useEffect(() => {
        fetchFeedbacks();
        fetchStats();
    }, [filterCategory, filterStatus, filterPriority, filterUserType, showFlagged]);

    const fetchFeedbacks = async () => {
        try {
            setLoading(true);
            const params: Record<string, string> = {};
            if (filterCategory !== 'all') params.category = filterCategory;
            if (filterStatus !== 'all') params.status = filterStatus;
            if (filterPriority !== 'all') params.priority = filterPriority;
            if (filterUserType !== 'all') params.user_type = filterUserType;
            if (showFlagged) params.flagged = 'true';
            if (searchTerm) params.search = searchTerm;

            const response = await axios.get('/api/branch-admin/feedbacks', { params });
            if (response.data.status === 200) {
                setFeedbacks(response.data.feedbacks);
            }
        } catch (error) {
            console.error('Failed to fetch feedbacks:', error);
            // Mock data for demo
            setFeedbacks([
                {
                    id: 1,
                    uuid: 'uuid-1',
                    user_id: 101,
                    user_type: 'patient',
                    user_name: 'John Doe',
                    branch_id: 1,
                    branch_name: 'Main Branch',
                    doctor_id: 5,
                    doctor_name: 'Dr. Smith',
                    category: 'service',
                    subject: 'Excellent service at reception',
                    description: 'The reception staff was very helpful and professional. They handled my appointment efficiently.',
                    rating: 5,
                    experience: 'positive',
                    priority: 'low',
                    status: 'pending',
                    admin_response: null,
                    responded_by: null,
                    responded_by_name: null,
                    responded_at: null,
                    internal_notes: null,
                    is_anonymous: false,
                    is_flagged: false,
                    flag_reason: null,
                    created_at: '2025-12-28T10:30:00',
                    updated_at: '2025-12-28T10:30:00'
                },
                {
                    id: 2,
                    uuid: 'uuid-2',
                    user_id: 102,
                    user_type: 'patient',
                    user_name: 'Jane Smith',
                    branch_id: 1,
                    branch_name: 'Main Branch',
                    doctor_id: null,
                    doctor_name: null,
                    category: 'facility',
                    subject: 'Waiting area needs improvement',
                    description: 'The waiting area is too crowded and there are not enough seats. The AC was also not working properly.',
                    rating: 2,
                    experience: 'negative',
                    priority: 'medium',
                    status: 'in-review',
                    admin_response: null,
                    responded_by: null,
                    responded_by_name: null,
                    responded_at: null,
                    internal_notes: 'Need to coordinate with maintenance',
                    is_anonymous: false,
                    is_flagged: true,
                    flag_reason: 'Recurring issue',
                    created_at: '2025-12-27T14:15:00',
                    updated_at: '2025-12-27T16:30:00'
                },
                {
                    id: 3,
                    uuid: 'uuid-3',
                    user_id: 50,
                    user_type: 'nurse',
                    user_name: 'Sarah Johnson',
                    branch_id: 1,
                    branch_name: 'Main Branch',
                    doctor_id: null,
                    doctor_name: null,
                    category: 'suggestion',
                    subject: 'Suggestion for shift scheduling',
                    description: 'It would be helpful to have the shift schedule published earlier, at least 2 weeks in advance.',
                    rating: null,
                    experience: 'neutral',
                    priority: 'low',
                    status: 'responded',
                    admin_response: 'Thank you for your suggestion. We will work on publishing schedules 2 weeks in advance starting next month.',
                    responded_by: 10,
                    responded_by_name: 'Admin User',
                    responded_at: '2025-12-26T11:00:00',
                    internal_notes: null,
                    is_anonymous: false,
                    is_flagged: false,
                    flag_reason: null,
                    created_at: '2025-12-25T09:00:00',
                    updated_at: '2025-12-26T11:00:00'
                }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await axios.get('/api/branch-admin/feedbacks/stats');
            if (response.data.status === 200) {
                setStats(response.data.stats);
            }
        } catch (error) {
            console.error('Failed to fetch stats:', error);
            // Mock stats
            setStats({
                total: 45,
                pending: 12,
                in_review: 8,
                responded: 15,
                resolved: 10,
                flagged: 3,
                by_category: {
                    service: 15,
                    facility: 8,
                    staff: 5,
                    medical: 10,
                    billing: 4,
                    general: 3
                },
                by_user_type: {
                    patient: 35,
                    staff: 10
                },
                average_rating: 3.8
            });
        }
    };

    const handleSearch = () => {
        fetchFeedbacks();
    };

    const handleRespond = async () => {
        if (!selectedFeedback || !responseText.trim()) return;
        
        setSubmitting(true);
        try {
            await axios.post(`/api/branch-admin/feedbacks/${selectedFeedback.id}/respond`, {
                response: responseText
            });
            setShowResponseModal(false);
            setResponseText('');
            fetchFeedbacks();
            fetchStats();
        } catch (error) {
            console.error('Failed to respond:', error);
            alert('Failed to send response. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdateStatus = async (id: number, status: string) => {
        try {
            await axios.post(`/api/branch-admin/feedbacks/${id}/status`, { status });
            fetchFeedbacks();
            fetchStats();
        } catch (error) {
            console.error('Failed to update status:', error);
        }
    };

    const handleToggleFlag = async (id: number) => {
        try {
            await axios.post(`/api/branch-admin/feedbacks/${id}/flag`);
            fetchFeedbacks();
            fetchStats();
        } catch (error) {
            console.error('Failed to toggle flag:', error);
        }
    };

    const handleUpdatePriority = async (id: number, priority: string) => {
        try {
            await axios.post(`/api/branch-admin/feedbacks/${id}/priority`, { priority });
            fetchFeedbacks();
        } catch (error) {
            console.error('Failed to update priority:', error);
        }
    };

    const getStatusBadge = (status: string) => {
        const badges: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
            pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: <Clock className="w-3 h-3" /> },
            'in-review': { bg: 'bg-blue-100', text: 'text-blue-700', icon: <Eye className="w-3 h-3" /> },
            responded: { bg: 'bg-purple-100', text: 'text-purple-700', icon: <MessageCircle className="w-3 h-3" /> },
            resolved: { bg: 'bg-green-100', text: 'text-green-700', icon: <CheckCircle className="w-3 h-3" /> },
            closed: { bg: 'bg-gray-100', text: 'text-gray-700', icon: <X className="w-3 h-3" /> }
        };
        const badge = badges[status] || badges.pending;
        return (
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
                {badge.icon}
                {status.replace('-', ' ').charAt(0).toUpperCase() + status.replace('-', ' ').slice(1)}
            </span>
        );
    };

    const getPriorityBadge = (priority: string) => {
        const badges: Record<string, { bg: string; text: string }> = {
            low: { bg: 'bg-gray-100', text: 'text-gray-600' },
            medium: { bg: 'bg-blue-100', text: 'text-blue-600' },
            high: { bg: 'bg-orange-100', text: 'text-orange-600' },
            urgent: { bg: 'bg-red-100', text: 'text-red-600' }
        };
        const badge = badges[priority] || badges.medium;
        return (
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${badge.bg} ${badge.text}`}>
                {priority.charAt(0).toUpperCase() + priority.slice(1)}
            </span>
        );
    };

    const getCategoryIcon = (category: string) => {
        const icons: Record<string, string> = {
            service: '⭐',
            facility: '🏢',
            staff: '👥',
            medical: '🏥',
            billing: '💰',
            general: '📝',
            suggestion: '💡',
            complaint: '⚠️'
        };
        return icons[category] || '📝';
    };

    const getExperienceIcon = (experience: string | null) => {
        if (!experience) return null;
        const icons: Record<string, React.ReactNode> = {
            positive: <ThumbsUp className="w-4 h-4 text-green-500" />,
            neutral: <Meh className="w-4 h-4 text-yellow-500" />,
            negative: <ThumbsDown className="w-4 h-4 text-red-500" />
        };
        return icons[experience];
    };

    const renderStars = (rating: number | null) => {
        if (!rating) return <span className="text-gray-400 text-sm">No rating</span>;
        return (
            <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        className={`w-4 h-4 ${star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                    />
                ))}
            </div>
        );
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <DashboardLayout
            userName={userName}
            userRole="Branch Admin"
            branchName={branchName}
            userGender={userGender}
            profileImage={profileImage}
            sidebarContent={<BranchAdminSidebar />}
        >
            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Feedback Management</h1>
                        <p className="text-gray-600 mt-1">Review and respond to feedback from patients and staff</p>
                    </div>
                    <button
                        onClick={() => { fetchFeedbacks(); fetchStats(); }}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Refresh
                    </button>
                </div>

                {/* Stats Cards */}
                {stats && (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <MessageSquare className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                                    <p className="text-xs text-gray-500">Total</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-yellow-100 rounded-lg">
                                    <Clock className="w-5 h-5 text-yellow-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
                                    <p className="text-xs text-gray-500">Pending</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-100 rounded-lg">
                                    <Eye className="w-5 h-5 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-gray-900">{stats.in_review}</p>
                                    <p className="text-xs text-gray-500">In Review</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-100 rounded-lg">
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-gray-900">{stats.resolved}</p>
                                    <p className="text-xs text-gray-500">Resolved</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-red-100 rounded-lg">
                                    <Flag className="w-5 h-5 text-red-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-gray-900">{stats.flagged}</p>
                                    <p className="text-xs text-gray-500">Flagged</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-amber-100 rounded-lg">
                                    <Star className="w-5 h-5 text-amber-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-gray-900">{stats.average_rating.toFixed(1)}</p>
                                    <p className="text-xs text-gray-500">Avg Rating</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <div className="flex flex-wrap gap-4">
                        {/* Search */}
                        <div className="flex-1 min-w-[200px]">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search feedbacks..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                />
                            </div>
                        </div>

                        {/* Category Filter */}
                        <select
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
                            className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                        >
                            {CATEGORIES.map((cat) => (
                                <option key={cat.value} value={cat.value}>{cat.label}</option>
                            ))}
                        </select>

                        {/* Status Filter */}
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                        >
                            {STATUSES.map((status) => (
                                <option key={status.value} value={status.value}>{status.label}</option>
                            ))}
                        </select>

                        {/* Priority Filter */}
                        <select
                            value={filterPriority}
                            onChange={(e) => setFilterPriority(e.target.value)}
                            className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                        >
                            {PRIORITIES.map((priority) => (
                                <option key={priority.value} value={priority.value}>{priority.label}</option>
                            ))}
                        </select>

                        {/* User Type Filter */}
                        <select
                            value={filterUserType}
                            onChange={(e) => setFilterUserType(e.target.value)}
                            className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                        >
                            {USER_TYPES.map((type) => (
                                <option key={type.value} value={type.value}>{type.label}</option>
                            ))}
                        </select>

                        {/* Flagged Toggle */}
                        <button
                            onClick={() => setShowFlagged(!showFlagged)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                                showFlagged 
                                    ? 'bg-red-100 border-red-300 text-red-700' 
                                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                            }`}
                        >
                            <Flag className="w-4 h-4" />
                            Flagged Only
                        </button>
                    </div>
                </div>

                {/* Feedback List */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                        </div>
                    ) : feedbacks.length === 0 ? (
                        <div className="text-center py-12">
                            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500">No feedbacks found</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {feedbacks.map((feedback) => (
                                <div
                                    key={feedback.id}
                                    className={`p-4 hover:bg-gray-50 transition-colors ${feedback.is_flagged ? 'bg-red-50' : ''}`}
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className="text-xl">{getCategoryIcon(feedback.category)}</span>
                                                <h3 className="font-semibold text-gray-900">{feedback.subject}</h3>
                                                {feedback.is_flagged && (
                                                    <Flag className="w-4 h-4 text-red-500 fill-red-500" />
                                                )}
                                            </div>
                                            
                                            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mb-3">
                                                <span className="flex items-center gap-1">
                                                    <User className="w-3.5 h-3.5" />
                                                    {feedback.user_name}
                                                    <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                                                        {feedback.user_type}
                                                    </span>
                                                </span>
                                                {feedback.branch_name && (
                                                    <span className="flex items-center gap-1">
                                                        <Building2 className="w-3.5 h-3.5" />
                                                        {feedback.branch_name}
                                                    </span>
                                                )}
                                                {feedback.doctor_name && (
                                                    <span className="flex items-center gap-1">
                                                        <Stethoscope className="w-3.5 h-3.5" />
                                                        {feedback.doctor_name}
                                                    </span>
                                                )}
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-3.5 h-3.5" />
                                                    {formatDate(feedback.created_at)}
                                                </span>
                                            </div>

                                            <p className={`text-gray-600 ${expandedId === feedback.id ? '' : 'line-clamp-2'}`}>
                                                {feedback.description}
                                            </p>
                                            {feedback.description.length > 150 && (
                                                <button
                                                    onClick={() => setExpandedId(expandedId === feedback.id ? null : feedback.id)}
                                                    className="text-emerald-600 text-sm mt-1 hover:underline"
                                                >
                                                    {expandedId === feedback.id ? 'Show less' : 'Read more'}
                                                </button>
                                            )}

                                            {feedback.admin_response && (
                                                <div className="mt-3 p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                                                    <p className="text-xs text-emerald-600 font-medium mb-1">
                                                        Response by {feedback.responded_by_name}
                                                    </p>
                                                    <p className="text-sm text-emerald-800">{feedback.admin_response}</p>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex flex-col items-end gap-2">
                                            {getStatusBadge(feedback.status)}
                                            {getPriorityBadge(feedback.priority)}
                                            <div className="flex items-center gap-2">
                                                {renderStars(feedback.rating)}
                                                {getExperienceIcon(feedback.experience)}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100">
                                        {feedback.admin_response ? (
                                            <button
                                                onClick={() => {
                                                    setSelectedFeedback(feedback);
                                                    setShowDetailModal(true);
                                                }}
                                                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
                                            >
                                                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                                                Responded
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => {
                                                    setSelectedFeedback(feedback);
                                                    setShowResponseModal(true);
                                                }}
                                                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                                            >
                                                <Send className="w-3.5 h-3.5" />
                                                Respond
                                            </button>
                                        )}
                                        
                                        <select
                                            value={feedback.status}
                                            onChange={(e) => handleUpdateStatus(feedback.id, e.target.value)}
                                            className="px-2 py-1.5 text-sm border border-gray-200 rounded-lg"
                                        >
                                            <option value="pending">Pending</option>
                                            <option value="in-review">In Review</option>
                                            <option value="responded">Responded</option>
                                            <option value="resolved">Resolved</option>
                                            <option value="closed">Closed</option>
                                        </select>

                                        <select
                                            value={feedback.priority}
                                            onChange={(e) => handleUpdatePriority(feedback.id, e.target.value)}
                                            className="px-2 py-1.5 text-sm border border-gray-200 rounded-lg"
                                        >
                                            <option value="low">Low</option>
                                            <option value="medium">Medium</option>
                                            <option value="high">High</option>
                                            <option value="urgent">Urgent</option>
                                        </select>

                                        <button
                                            onClick={() => handleToggleFlag(feedback.id)}
                                            className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border ${
                                                feedback.is_flagged
                                                    ? 'bg-red-100 border-red-300 text-red-700'
                                                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                                            }`}
                                        >
                                            <Flag className="w-3.5 h-3.5" />
                                            {feedback.is_flagged ? 'Unflag' : 'Flag'}
                                        </button>

                                        <button
                                            onClick={() => {
                                                setSelectedFeedback(feedback);
                                                setShowDetailModal(true);
                                            }}
                                            className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
                                        >
                                            <Eye className="w-3.5 h-3.5" />
                                            Details
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Response Modal */}
                {showResponseModal && selectedFeedback && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl">
                            <div className="p-6 border-b border-gray-100">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold">Respond to Feedback</h3>
                                    <button
                                        onClick={() => setShowResponseModal(false)}
                                        className="p-2 hover:bg-gray-100 rounded-lg"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                            <div className="p-6">
                                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                                    <p className="text-sm font-medium text-gray-700">{selectedFeedback.subject}</p>
                                    <p className="text-sm text-gray-500 mt-1">{selectedFeedback.description}</p>
                                </div>
                                <textarea
                                    value={responseText}
                                    onChange={(e) => setResponseText(e.target.value)}
                                    placeholder="Type your response here..."
                                    rows={5}
                                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                />
                            </div>
                            <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
                                <button
                                    onClick={() => setShowResponseModal(false)}
                                    className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleRespond}
                                    disabled={!responseText.trim() || submitting}
                                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
                                >
                                    {submitting && <RefreshCw className="w-4 h-4 animate-spin" />}
                                    <Send className="w-4 h-4" />
                                    Send Response
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Detail Modal */}
                {showDetailModal && selectedFeedback && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
                            <div className="p-6 border-b border-gray-100 sticky top-0 bg-white">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold">Feedback Details</h3>
                                    <button
                                        onClick={() => setShowDetailModal(false)}
                                        className="p-2 hover:bg-gray-100 rounded-lg"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-500">User</p>
                                        <p className="font-medium">{selectedFeedback.user_name}</p>
                                        <p className="text-sm text-gray-400">{selectedFeedback.user_type}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Category</p>
                                        <p className="font-medium flex items-center gap-2">
                                            {getCategoryIcon(selectedFeedback.category)}
                                            {selectedFeedback.category}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Status</p>
                                        {getStatusBadge(selectedFeedback.status)}
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Priority</p>
                                        {getPriorityBadge(selectedFeedback.priority)}
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Rating</p>
                                        {renderStars(selectedFeedback.rating)}
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Experience</p>
                                        <div className="flex items-center gap-2">
                                            {getExperienceIcon(selectedFeedback.experience)}
                                            <span className="capitalize">{selectedFeedback.experience || 'Not specified'}</span>
                                        </div>
                                    </div>
                                    {selectedFeedback.branch_name && (
                                        <div>
                                            <p className="text-sm text-gray-500">Branch</p>
                                            <p className="font-medium">{selectedFeedback.branch_name}</p>
                                        </div>
                                    )}
                                    {selectedFeedback.doctor_name && (
                                        <div>
                                            <p className="text-sm text-gray-500">Doctor</p>
                                            <p className="font-medium">{selectedFeedback.doctor_name}</p>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Subject</p>
                                    <p className="font-medium text-lg">{selectedFeedback.subject}</p>
                                </div>

                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Description</p>
                                    <p className="text-gray-700 whitespace-pre-wrap">{selectedFeedback.description}</p>
                                </div>

                                {selectedFeedback.admin_response && (
                                    <div className="p-4 bg-emerald-50 rounded-lg">
                                        <p className="text-sm text-emerald-600 font-medium mb-1">
                                            Response by {selectedFeedback.responded_by_name}
                                            {selectedFeedback.responded_at && ` • ${formatDate(selectedFeedback.responded_at)}`}
                                        </p>
                                        <p className="text-emerald-800">{selectedFeedback.admin_response}</p>
                                    </div>
                                )}

                                {selectedFeedback.internal_notes && (
                                    <div className="p-4 bg-yellow-50 rounded-lg">
                                        <p className="text-sm text-yellow-600 font-medium mb-1">Internal Notes</p>
                                        <p className="text-yellow-800">{selectedFeedback.internal_notes}</p>
                                    </div>
                                )}

                                <div className="text-sm text-gray-400">
                                    <p>Created: {formatDate(selectedFeedback.created_at)}</p>
                                    <p>Updated: {formatDate(selectedFeedback.updated_at)}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default BranchAdminFeedbacks;
