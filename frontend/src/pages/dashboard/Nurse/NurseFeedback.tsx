import React, { useState, useEffect } from 'react';
import api from "../../../utils/api/axios";
import {
    MessageSquare, Plus, Send, CheckCircle, AlertCircle, Clock,
    ThumbsUp, ThumbsDown, MessageCircle, Eye, X, AlertTriangle
} from 'lucide-react';

interface Feedback {
    id: string;
    type: 'suggestion' | 'complaint' | 'praise' | 'question';
    category: string;
    subject: string;
    description: string;
    created_at: string;
    status: 'pending' | 'in-review' | 'responded' | 'resolved' | 'closed';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    response?: string;
    responded_at?: string;
    responded_by?: string;
}

const NurseFeedback: React.FC = () => {
    const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
    const [loading, setLoading] = useState(true);
    const [showNewFeedback, setShowNewFeedback] = useState(false);
    const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const [newFeedback, setNewFeedback] = useState({
        type: 'suggestion' as 'suggestion' | 'complaint' | 'praise' | 'question',
        category: 'general',
        subject: '',
        description: '',
    });

    const [filterType, setFilterType] = useState<string>('all');
    const [filterStatus, setFilterStatus] = useState<string>('all');

    useEffect(() => {
        fetchFeedbacks();
    }, []);

    const fetchFeedbacks = async () => {
        try {
            setLoading(true);
            const response = await api.get('/patient/my-feedbacks');

            if (response.data.status === 200 && response.data.feedbacks) {
                setFeedbacks(response.data.feedbacks);
            }
        } catch (error) {
            console.error('Error fetching feedbacks:', error);
            showMessage('error', 'Failed to load feedbacks');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitFeedback = async () => {
        if (!newFeedback.subject || !newFeedback.description) {
            showMessage('error', 'Please fill in all required fields');
            return;
        }

        try {
            const payload = {
                category: newFeedback.category,
                subject: newFeedback.subject,
                description: newFeedback.description,
                experience: newFeedback.type === 'praise' ? 'positive' : newFeedback.type === 'complaint' ? 'negative' : 'neutral',
                rating: newFeedback.type === 'praise' ? 5 : newFeedback.type === 'complaint' ? 2 : 3,
                user_type: 'nurse',
            };

            const response = await api.post('/submit-feedback', payload);

            if (response.data.status === 200 || response.data.status === 201) {
                showMessage('success', 'Feedback submitted successfully! Branch admins will be notified.');
                setShowNewFeedback(false);
                setNewFeedback({
                    type: 'suggestion',
                    category: 'general',
                    subject: '',
                    description: '',
                });
                fetchFeedbacks();
            }
        } catch (error: any) {
            console.error('Error submitting feedback:', error);
            const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to submit feedback';
            showMessage('error', errorMessage);
        }
    };

    const showMessage = (type: 'success' | 'error', text: string) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 5000);
    };

    const getTypeStyle = (type: string) => {
        switch (type) {
            case 'suggestion': return 'bg-blue-100 text-blue-700';
            case 'complaint': return 'bg-error-100 text-red-700';
            case 'praise': return 'bg-green-100 text-green-700';
            case 'question': return 'bg-purple-100 text-purple-700';
            default: return 'bg-neutral-100 text-neutral-700';
        }
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-700';
            case 'in-review': return 'bg-blue-100 text-blue-700';
            case 'responded': return 'bg-green-100 text-green-700';
            case 'resolved': return 'bg-emerald-100 text-emerald-700';
            case 'closed': return 'bg-neutral-100 text-neutral-700';
            default: return 'bg-neutral-100 text-neutral-700';
        }
    };

    const getPriorityStyle = (priority: string) => {
        switch (priority) {
            case 'urgent': return 'bg-error-100 text-red-700';
            case 'high': return 'bg-orange-100 text-orange-700';
            case 'medium': return 'bg-yellow-100 text-yellow-700';
            case 'low': return 'bg-neutral-100 text-neutral-700';
            default: return 'bg-neutral-100 text-neutral-700';
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'praise': return <ThumbsUp className="w-5 h-5 text-green-600" />;
            case 'complaint': return <ThumbsDown className="w-5 h-5 text-error-600" />;
            case 'question': return <MessageCircle className="w-5 h-5 text-purple-600" />;
            default: return <MessageSquare className="w-5 h-5 text-primary-500" />;
        }
    };

    const filteredFeedbacks = feedbacks.filter(f => {
        if (filterType !== 'all' && f.category !== filterType) return false;
        if (filterStatus !== 'all' && f.status !== filterStatus) return false;
        return true;
    });

    const stats = {
        total: feedbacks.length,
        pending: feedbacks.filter(f => f.status === 'pending').length,
        resolved: feedbacks.filter(f => f.status === 'resolved').length,
        complaints: feedbacks.filter(f => f.category === 'complaint').length,
    };

    if (loading) {
        return (
            <div className="p-6 bg-neutral-50 min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-neutral-600">Loading feedbacks...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 bg-neutral-50 min-h-screen">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 flex items-center gap-2 sm:gap-3">
                        <MessageSquare className="w-6 h-6 sm:w-8 sm:h-8 text-teal-600" />
                        Feedback & Complaints
                    </h1>
                    <p className="text-sm sm:text-base text-neutral-600 mt-1">Submit feedback or view your submissions</p>
                </div>
                <button
                    onClick={() => setShowNewFeedback(true)}
                    className="w-full sm:w-auto px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    New Feedback
                </button>
            </div>

            {message && (
                <div className={`p-4 rounded-xl flex items-center gap-3 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-error-50 text-red-700'
                    }`}>
                    {message.type === 'success' ? (
                        <CheckCircle className="w-5 h-5" />
                    ) : (
                        <AlertCircle className="w-5 h-5" />
                    )}
                    <span>{message.text}</span>
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs sm:text-sm text-neutral-600">Total Submissions</p>
                            <p className="text-xl sm:text-2xl font-bold text-neutral-900">{stats.total}</p>
                        </div>
                        <MessageSquare className="w-8 h-8 sm:w-10 sm:h-10 text-teal-500" />
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs sm:text-sm text-neutral-600">Pending</p>
                            <p className="text-xl sm:text-2xl font-bold text-yellow-600">{stats.pending}</p>
                        </div>
                        <Clock className="w-8 h-8 sm:w-10 sm:h-10 text-yellow-500" />
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs sm:text-sm text-neutral-600">Resolved</p>
                            <p className="text-xl sm:text-2xl font-bold text-green-600">{stats.resolved}</p>
                        </div>
                        <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 text-green-500" />
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs sm:text-sm text-neutral-600">Complaints</p>
                            <p className="text-xl sm:text-2xl font-bold text-error-600">{stats.complaints}</p>
                        </div>
                        <AlertTriangle className="w-8 h-8 sm:w-10 sm:h-10 text-error-500" />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">Category</label>
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                        >
                            <option value="all">All Categories</option>
                            <option value="suggestion">Suggestion</option>
                            <option value="complaint">Complaint</option>
                            <option value="general">General</option>
                            <option value="service">Service</option>
                            <option value="facility">Facility</option>
                            <option value="staff">Staff</option>
                            <option value="medical">Medical</option>
                            <option value="equipment">Equipment</option>
                            <option value="scheduling">Scheduling</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">Status</label>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                        >
                            <option value="all">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="in-review">In Review</option>
                            <option value="responded">Responded</option>
                            <option value="resolved">Resolved</option>
                            <option value="closed">Closed</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="space-y-3 sm:space-y-4">
                {filteredFeedbacks.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-8 sm:p-12 text-center">
                        <MessageSquare className="w-12 h-12 sm:w-16 sm:h-16 text-neutral-400 mx-auto mb-4" />
                        <p className="text-sm sm:text-base text-neutral-600">No feedbacks found</p>
                        <button
                            onClick={() => setShowNewFeedback(true)}
                            className="mt-4 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors text-sm sm:text-base"
                        >
                            Submit Your First Feedback
                        </button>
                    </div>
                ) : (
                    filteredFeedbacks.map((feedback) => (
                        <div key={feedback.id} className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4 sm:p-6 hover:shadow-md transition-shadow">
                            <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4 mb-4">
                                <div className="hidden sm:block p-3 rounded-xl bg-gradient-to-br from-teal-50 to-cyan-50 shrink-0">
                                    {getTypeIcon(feedback.type)}
                                </div>
                                <div className="flex-1 min-w-0 w-full">
                                    <div className="flex flex-wrap items-center gap-2 mb-2">
                                        <h3 className="text-base sm:text-lg font-semibold text-neutral-900 break-words">{feedback.subject}</h3>
                                        <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${getTypeStyle(feedback.type)}`}>
                                            {feedback.type}
                                        </span>
                                        <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${getStatusStyle(feedback.status)}`}>
                                            {feedback.status.replace('_', ' ')}
                                        </span>
                                        {feedback.priority && (
                                            <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${getPriorityStyle(feedback.priority)}`}>
                                                {feedback.priority}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm sm:text-base text-neutral-700 mb-3 break-words">{feedback.description}</p>
                                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-neutral-500">
                                        <span className="break-words">Category: {feedback.category}</span>
                                        <span className="hidden sm:inline">•</span>
                                        <span className="break-words">Submitted: {new Date(feedback.created_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedFeedback(feedback)}
                                    className="w-full sm:w-auto px-3 py-2 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm sm:text-base shrink-0"
                                >
                                    <Eye className="w-4 h-4" />
                                    View
                                </button>
                            </div>

                            {feedback.response && (
                                <div className="mt-4 p-3 sm:p-4 bg-teal-50 rounded-lg border border-teal-200">
                                    <div className="flex flex-wrap items-center gap-2 mb-2">
                                        <Send className="w-4 h-4 text-teal-600 shrink-0" />
                                        <span className="text-sm sm:text-base font-medium text-teal-900 break-words">Response from {feedback.responded_by || 'Admin'}</span>
                                        <span className="text-xs sm:text-sm text-teal-600 break-words">• {feedback.responded_at ? new Date(feedback.responded_at).toLocaleDateString() : ''}</span>
                                    </div>
                                    <p className="text-sm sm:text-base text-teal-800 break-words">{feedback.response}</p>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {showNewFeedback && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 overflow-y-auto"
                    style={{ zIndex: 9999 }}
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setShowNewFeedback(false);
                    }}
                >
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleSubmitFeedback();
                        }}
                        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl my-4 max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                        style={{ position: 'relative', zIndex: 10000 }}
                    >
                        <div className="sticky top-0 bg-white border-b border-neutral-200 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between rounded-t-2xl">
                            <h2 className="text-xl sm:text-2xl font-bold text-neutral-900">Submit Feedback</h2>
                            <button
                                type="button"
                                onClick={() => setShowNewFeedback(false)}
                                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors shrink-0"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-4 sm:p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-2">Type *</label>
                                <select
                                    value={newFeedback.type}
                                    onChange={(e) => setNewFeedback({ ...newFeedback, type: e.target.value as any })}
                                    className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-neutral-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                                >
                                    <option value="suggestion">Suggestion</option>
                                    <option value="complaint">Complaint</option>
                                    <option value="praise">Praise</option>
                                    <option value="question">Question</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-2">Category *</label>
                                <select
                                    value={newFeedback.category}
                                    onChange={(e) => setNewFeedback({ ...newFeedback, category: e.target.value })}
                                    className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-neutral-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                                >
                                    <option value="general">General</option>
                                    <option value="service">Service</option>
                                    <option value="facility">Facility</option>
                                    <option value="staff">Staff</option>
                                    <option value="medical">Medical</option>
                                    <option value="equipment">Equipment</option>
                                    <option value="scheduling">Scheduling</option>
                                    <option value="patient-care">Patient Care</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-2">Subject *</label>
                                <input
                                    type="text"
                                    value={newFeedback.subject}
                                    onChange={(e) => setNewFeedback({ ...newFeedback, subject: e.target.value })}
                                    placeholder="Brief summary of your feedback"
                                    className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-neutral-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-2">Message *</label>
                                <textarea
                                    value={newFeedback.description}
                                    onChange={(e) => setNewFeedback({ ...newFeedback, description: e.target.value })}
                                    placeholder="Describe your feedback in detail..."
                                    rows={6}
                                    className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-neutral-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 resize-none"
                                    required
                                />
                            </div>

                            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowNewFeedback(false)}
                                    className="w-full sm:w-auto px-6 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="w-full sm:w-auto px-6 py-2 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-lg"
                                >
                                    <Send className="w-4 h-4" />
                                    Submit Feedback
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            )}

            {selectedFeedback && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl my-4 max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-neutral-200 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between rounded-t-2xl">
                            <h2 className="text-xl sm:text-2xl font-bold text-neutral-900">Feedback Details</h2>
                            <button
                                onClick={() => setSelectedFeedback(null)}
                                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors shrink-0"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                            <div>
                                <div className="flex flex-wrap items-center gap-2 mb-4">
                                    <span className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${getTypeStyle(selectedFeedback.type)}`}>
                                        {selectedFeedback.type}
                                    </span>
                                    <span className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${getStatusStyle(selectedFeedback.status)}`}>
                                        {selectedFeedback.status.replace('_', ' ')}
                                    </span>
                                    {selectedFeedback.priority && (
                                        <span className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${getPriorityStyle(selectedFeedback.priority)}`}>
                                            {selectedFeedback.priority} priority
                                        </span>
                                    )}
                                </div>
                                <h3 className="text-lg sm:text-xl font-semibold text-neutral-900 mb-2 break-words">{selectedFeedback.subject}</h3>
                                <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-neutral-500 mb-4">
                                    <span className="break-words">Category: {selectedFeedback.category}</span>
                                    <span className="hidden sm:inline">•</span>
                                    <span className="break-words">Submitted: {new Date(selectedFeedback.created_at).toLocaleString()}</span>
                                </div>
                                <p className="text-sm sm:text-base text-neutral-700 whitespace-pre-wrap break-words">{selectedFeedback.description}</p>
                            </div>

                            {selectedFeedback.response && (
                                <div className="p-3 sm:p-4 bg-teal-50 rounded-lg border border-teal-200">
                                    <div className="flex flex-wrap items-center gap-2 mb-3">
                                        <Send className="w-4 h-4 sm:w-5 sm:h-5 text-teal-600 shrink-0" />
                                        <span className="text-sm sm:text-base font-semibold text-teal-900 break-words">Response from {selectedFeedback.responded_by || 'Admin'}</span>
                                        <span className="text-xs sm:text-sm text-teal-600 break-words">• {selectedFeedback.responded_at ? new Date(selectedFeedback.responded_at).toLocaleString() : ''}</span>
                                    </div>
                                    <p className="text-sm sm:text-base text-teal-800 whitespace-pre-wrap break-words">{selectedFeedback.response}</p>
                                </div>
                            )}

                            <div className="flex justify-end pt-2">
                                <button
                                    onClick={() => setSelectedFeedback(null)}
                                    className="w-full sm:w-auto px-6 py-2 bg-neutral-200 hover:bg-neutral-300 text-neutral-700 rounded-lg transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NurseFeedback;
