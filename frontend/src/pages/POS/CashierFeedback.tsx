import React, { useState, useEffect } from 'react';
import api from "../../utils/api/axios";
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

const CashierFeedback: React.FC = () => {
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

    const getAuthHeaders = () => {
        const token = localStorage.getItem('authToken');
        return { headers: { Authorization: `Bearer ${token}` } };
    };

    const fetchFeedbacks = async () => {
        try {
            setLoading(true);
            const response = await api.get(
                '/api/cashier-my-feedbacks',
                getAuthHeaders()
            );

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
            const response = await api.post(
                '/api/submit-feedback',
                {
                    type: newFeedback.type,
                    category: newFeedback.category,
                    subject: newFeedback.subject,
                    description: newFeedback.description,
                    experience: newFeedback.type === 'praise' ? 'positive' : newFeedback.type === 'complaint' ? 'negative' : 'neutral',
                },
                getAuthHeaders()
            );

            if (response.data.status === 200 || response.data.status === 201) {
                showMessage('success', 'Feedback submitted successfully!');
                setShowNewFeedback(false);
                setNewFeedback({
                    type: 'suggestion',
                    category: 'general',
                    subject: '',
                    description: '',
                });
                fetchFeedbacks();
            }
        } catch (error) {
            console.error('Error submitting feedback:', error);
            showMessage('error', 'Failed to submit feedback');
        }
    };

    const showMessage = (type: 'success' | 'error', text: string) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 5000);
    };

    const getTypeStyle = (type: string) => {
        switch (type) {
            case 'suggestion': return 'bg-blue-100 text-blue-700';
            case 'complaint': return 'bg-red-100 text-red-700';
            case 'praise': return 'bg-green-100 text-green-700';
            case 'question': return 'bg-purple-100 text-purple-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-700';
            case 'in_progress': return 'bg-blue-100 text-blue-700';
            case 'resolved': return 'bg-green-100 text-green-700';
            case 'closed': return 'bg-gray-100 text-gray-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getPriorityStyle = (priority: string) => {
        switch (priority) {
            case 'urgent': return 'bg-red-100 text-red-700';
            case 'high': return 'bg-orange-100 text-orange-700';
            case 'medium': return 'bg-yellow-100 text-yellow-700';
            case 'low': return 'bg-gray-100 text-gray-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'praise': return <ThumbsUp className="w-5 h-5 text-green-600" />;
            case 'complaint': return <ThumbsDown className="w-5 h-5 text-red-600" />;
            case 'question': return <MessageCircle className="w-5 h-5 text-purple-600" />;
            default: return <MessageSquare className="w-5 h-5 text-blue-600" />;
        }
    };

    const filteredFeedbacks = feedbacks.filter(f => {
        // Filter by category
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
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading feedbacks...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <MessageSquare className="w-8 h-8 text-emerald-600" />
                        Feedback & Complaints
                    </h1>
                    <p className="text-gray-600 mt-1">Submit feedback or view your submissions</p>
                </div>
                <button
                    onClick={() => setShowNewFeedback(true)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    New Feedback
                </button>
            </div>

            {/* Success/Error Message */}
            {message && (
                <div className={`p-4 rounded-xl flex items-center gap-3 ${
                    message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                }`}>
                    {message.type === 'success' ? (
                        <CheckCircle className="w-5 h-5" />
                    ) : (
                        <AlertCircle className="w-5 h-5" />
                    )}
                    <span>{message.text}</span>
                </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Total Submissions</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                        </div>
                        <MessageSquare className="w-10 h-10 text-blue-500" />
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Pending</p>
                            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                        </div>
                        <Clock className="w-10 h-10 text-yellow-500" />
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Resolved</p>
                            <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
                        </div>
                        <CheckCircle className="w-10 h-10 text-green-500" />
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Complaints</p>
                            <p className="text-2xl font-bold text-red-600">{stats.complaints}</p>
                        </div>
                        <AlertTriangle className="w-10 h-10 text-red-500" />
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="flex flex-wrap gap-4">
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        >
                            <option value="all">All Categories</option>
                            <option value="suggestion">Suggestion</option>
                            <option value="complaint">Complaint</option>
                            <option value="general">General</option>
                            <option value="service">Service</option>
                            <option value="facility">Facility</option>
                            <option value="staff">Staff</option>
                            <option value="medical">Medical</option>
                            <option value="billing">Billing</option>
                        </select>
                    </div>
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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

            {/* Feedbacks List */}
            <div className="space-y-4">
                {filteredFeedbacks.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                        <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">No feedbacks found</p>
                        <button
                            onClick={() => setShowNewFeedback(true)}
                            className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
                        >
                            Submit Your First Feedback
                        </button>
                    </div>
                ) : (
                    filteredFeedbacks.map((feedback) => (
                        <div key={feedback.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-start gap-4 flex-1">
                                    <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50">
                                        {getTypeIcon(feedback.type)}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <h3 className="text-lg font-semibold text-gray-900">{feedback.subject}</h3>
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTypeStyle(feedback.type)}`}>
                                                {feedback.type}
                                            </span>
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusStyle(feedback.status)}`}>
                                                {feedback.status.replace('_', ' ')}
                                            </span>
                                            {feedback.priority && (
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityStyle(feedback.priority)}`}>
                                                    {feedback.priority}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-gray-700 mb-3">{feedback.description}</p>
                                        <div className="flex items-center gap-4 text-sm text-gray-500">
                                            <span>Category: {feedback.category}</span>
                                            <span>•</span>
                                            <span>Submitted: {new Date(feedback.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedFeedback(feedback)}
                                    className="px-3 py-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors flex items-center gap-2"
                                >
                                    <Eye className="w-4 h-4" />
                                    View
                                </button>
                            </div>

                            {/* Response */}
                            {feedback.response && (
                                <div className="mt-4 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Send className="w-4 h-4 text-emerald-600" />
                                        <span className="font-medium text-emerald-900">Response from {feedback.responded_by || 'Admin'}</span>
                                        <span className="text-sm text-emerald-600">• {feedback.responded_at ? new Date(feedback.responded_at).toLocaleDateString() : ''}</span>
                                    </div>
                                    <p className="text-emerald-800">{feedback.response}</p>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* New Feedback Modal */}
            {showNewFeedback && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-gray-900">Submit Feedback</h2>
                            <button
                                onClick={() => setShowNewFeedback(false)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Type *</label>
                                <select
                                    value={newFeedback.type}
                                    onChange={(e) => setNewFeedback({ ...newFeedback, type: e.target.value as any })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                >
                                    <option value="suggestion">Suggestion</option>
                                    <option value="complaint">Complaint</option>
                                    <option value="praise">Praise</option>
                                    <option value="question">Question</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                                <select
                                    value={newFeedback.category}
                                    onChange={(e) => setNewFeedback({ ...newFeedback, category: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                >
                                    <option value="general">General</option>
                                    <option value="service">Service</option>
                                    <option value="facility">Facility</option>
                                    <option value="staff">Staff</option>
                                    <option value="medical">Medical</option>
                                    <option value="billing">Billing</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Subject *</label>
                                <input
                                    type="text"
                                    value={newFeedback.subject}
                                    onChange={(e) => setNewFeedback({ ...newFeedback, subject: e.target.value })}
                                    placeholder="Brief summary of your feedback"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Message *</label>
                                <textarea
                                    value={newFeedback.description}
                                    onChange={(e) => setNewFeedback({ ...newFeedback, description: e.target.value })}
                                    placeholder="Describe your feedback in detail..."
                                    rows={6}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    onClick={() => setShowNewFeedback(false)}
                                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSubmitFeedback}
                                    className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors flex items-center gap-2"
                                >
                                    <Send className="w-4 h-4" />
                                    Submit Feedback
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* View Feedback Modal */}
            {selectedFeedback && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-gray-900">Feedback Details</h2>
                            <button
                                onClick={() => setSelectedFeedback(null)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            <div>
                                <div className="flex items-center gap-2 mb-4">
                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getTypeStyle(selectedFeedback.type)}`}>
                                        {selectedFeedback.type}
                                    </span>
                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusStyle(selectedFeedback.status)}`}>
                                        {selectedFeedback.status.replace('_', ' ')}
                                    </span>
                                    {selectedFeedback.priority && (
                                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityStyle(selectedFeedback.priority)}`}>
                                            {selectedFeedback.priority} priority
                                        </span>
                                    )}
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">{selectedFeedback.subject}</h3>
                                <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                                    <span>Category: {selectedFeedback.category}</span>
                                    <span>•</span>
                                    <span>Submitted: {new Date(selectedFeedback.created_at).toLocaleString()}</span>
                                </div>
                                <p className="text-gray-700 whitespace-pre-wrap">{selectedFeedback.description}</p>
                            </div>

                            {selectedFeedback.response && (
                                <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Send className="w-5 h-5 text-emerald-600" />
                                        <span className="font-semibold text-emerald-900">Response from {selectedFeedback.responded_by || 'Admin'}</span>
                                        <span className="text-sm text-emerald-600">• {selectedFeedback.responded_at ? new Date(selectedFeedback.responded_at).toLocaleString() : ''}</span>
                                    </div>
                                    <p className="text-emerald-800 whitespace-pre-wrap">{selectedFeedback.response}</p>
                                </div>
                            )}

                            <div className="flex justify-end">
                                <button
                                    onClick={() => setSelectedFeedback(null)}
                                    className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
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

export default CashierFeedback;
