import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FileText, ArrowLeft, Send, CheckCircle, Clock, XCircle,
    Loader2, Eye, Plus
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';
import LetterPreviewModal from '../../../components/HRM/LetterPreviewModal';

interface ServiceLetterRequest {
    id: string;
    letterType: string;
    purpose: string;
    addressedTo: string;
    urgency: 'normal' | 'urgent';
    status: 'pending' | 'approved' | 'completed' | 'generated' | 'rejected';
    requestedDate: string;
    completedDate: string | null;
    rejectionReason: string | null;
    documentUrl: string | null;
    templateName?: string;
    referenceNumber?: string;
}

const letterTypes = [
    { value: 'confirmation', label: 'Employment Confirmation Letter' },
    { value: 'service_period', label: 'Service Period Certificate' },
    { value: 'salary_certificate', label: 'Salary Certificate' },
    { value: 'experience_letter', label: 'Experience Letter' },
    { value: 'no_objection', label: 'No Objection Certificate' },
    { value: 'relieving_letter', label: 'Relieving Letter' }
];

const CashierServiceLetters: React.FC = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [requests, setRequests] = useState<ServiceLetterRequest[]>([]);
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [selectedLetter, setSelectedLetter] = useState<ServiceLetterRequest | null>(null);
    const [letterContent, setLetterContent] = useState('');
    const [isLoadingContent, setIsLoadingContent] = useState(false);
    const [formData, setFormData] = useState({
        letterType: '',
        purpose: '',
        addressedTo: '',
        urgency: 'normal' as 'normal' | 'urgent'
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('authToken');
            const response = await axios.get('/api/hrm/cashier/service-letter-requests', {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.status === 200) {
                setRequests(response.data.requests || []);
            }
        } catch (error) {
            console.error('Error fetching requests:', error);
            toast.error('Failed to load service letter requests');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmitRequest = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.letterType || !formData.purpose || !formData.addressedTo) {
            toast.error('Please fill in all required fields');
            return;
        }

        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('authToken');
            const response = await axios.post(
                '/api/hrm/cashier/service-letter-request',
                formData,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.status === 200 || response.data.status === 201) {
                toast.success('Service letter request submitted successfully!');
                setShowRequestModal(false);
                setFormData({
                    letterType: '',
                    purpose: '',
                    addressedTo: '',
                    urgency: 'normal'
                });
                fetchRequests();
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

    const downloadLetter = async (request: ServiceLetterRequest) => {
        if (!request.documentUrl) return;

        try {
            const token = localStorage.getItem('authToken');
            const response = await axios.get(request.documentUrl, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob'
            });

            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${request.letterType}-${request.id}.pdf`;
            link.click();
            window.URL.revokeObjectURL(url);
            toast.success('Letter downloaded successfully!');
        } catch (error) {
            console.error('Error downloading letter:', error);
            toast.error('Failed to download letter');
        }
    };

    const viewLetter = async (request: ServiceLetterRequest) => {
        setSelectedLetter(request);
        setIsLoadingContent(true);
        
        try {
            const token = localStorage.getItem('authToken');
            const response = await axios.get(
                `/api/hrm/cashier/service-letter-requests/${request.id}/content`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            if (response.data.status === 'success') {
                setLetterContent(response.data.data.content || '');
                setShowPreviewModal(true);
            } else {
                toast.error('Letter content not available');
            }
        } catch (error) {
            console.error('Error loading letter:', error);
            toast.error('Failed to load letter content');
        } finally {
            setIsLoadingContent(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const badges = {
            pending: { bg: 'bg-amber-100', text: 'text-amber-800', icon: <Clock className="w-4 h-4" />, label: 'Pending' },
            approved: { bg: 'bg-blue-100', text: 'text-blue-800', icon: <CheckCircle className="w-4 h-4" />, label: 'Approved' },
            generated: { bg: 'bg-green-100', text: 'text-green-800', icon: <CheckCircle className="w-4 h-4" />, label: 'Ready' },
            completed: { bg: 'bg-green-100', text: 'text-green-800', icon: <CheckCircle className="w-4 h-4" />, label: 'Completed' },
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

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const getLetterTypeLabel = (value: string) => {
        return letterTypes.find(type => type.value === value)?.label || value;
    };

    const pendingRequests = requests.filter(r => r.status === 'pending').length;
    const completedRequests = requests.filter(r => r.status === 'completed').length;

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-pink-500 mx-auto mb-4" />
                    <p className="text-gray-600">Loading service letter requests...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-pink-50/30 p-6">
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
                            <h1 className="text-2xl font-bold text-gray-800">Service Letter Requests</h1>
                            <p className="text-gray-600 text-sm mt-1">Request employment certificates and letters</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowRequestModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        New Request
                    </button>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-amber-900 font-semibold text-2xl">{pendingRequests}</p>
                                <p className="text-amber-700 text-sm">Pending Requests</p>
                            </div>
                            <Clock className="w-8 h-8 text-amber-500" />
                        </div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-green-900 font-semibold text-2xl">{completedRequests}</p>
                                <p className="text-green-700 text-sm">Completed</p>
                            </div>
                            <CheckCircle className="w-8 h-8 text-green-500" />
                        </div>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-blue-900 font-semibold text-2xl">{requests.length}</p>
                                <p className="text-blue-700 text-sm">Total Requests</p>
                            </div>
                            <FileText className="w-8 h-8 text-blue-500" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Requests List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-800">My Requests ({requests.length})</h2>
                </div>
                <div className="divide-y divide-gray-100">
                    {requests.length === 0 ? (
                        <div className="py-12 text-center text-gray-500">
                            <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                            <p className="text-lg mb-2">No service letter requests yet</p>
                            <p className="text-sm">Click "New Request" to submit your first request</p>
                        </div>
                    ) : (
                        requests.map((request) => (
                            <div key={request.id} className="p-6 hover:bg-gray-50 transition-colors">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-3">
                                            <FileText className="w-5 h-5 text-pink-500" />
                                            <h3 className="font-semibold text-gray-800 text-lg">
                                                {getLetterTypeLabel(request.letterType)}
                                            </h3>
                                            {getStatusBadge(request.status)}
                                            {request.urgency === 'urgent' && (
                                                <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full font-medium">
                                                    URGENT
                                                </span>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                                            <div>
                                                <p className="text-xs text-gray-500 mb-1">Purpose</p>
                                                <p className="text-sm text-gray-700">{request.purpose}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 mb-1">Addressed To</p>
                                                <p className="text-sm text-gray-700">{request.addressedTo}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6 text-xs text-gray-500">
                                            <span>Requested: {formatDate(request.requestedDate)}</span>
                                            {request.completedDate && (
                                                <span>Completed: {formatDate(request.completedDate)}</span>
                                            )}
                                        </div>
                                        {request.status === 'rejected' && request.rejectionReason && (
                                            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                                                <p className="text-xs text-red-600 font-medium mb-1">Rejection Reason:</p>
                                                <p className="text-sm text-red-800">{request.rejectionReason}</p>
                                            </div>
                                        )}
                                    </div>
                                    {(request.status === 'generated' || request.status === 'completed') && (
                                        <div className="flex flex-col gap-2 ml-4">
                                            <button
                                                onClick={() => viewLetter(request)}
                                                disabled={isLoadingContent && selectedLetter?.id === request.id}
                                                className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors disabled:opacity-50"
                                            >
                                                {isLoadingContent && selectedLetter?.id === request.id ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <Eye className="w-4 h-4" />
                                                )}
                                                View & Print
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Request Modal */}
            {showRequestModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-xl font-bold text-gray-800">New Service Letter Request</h2>
                        </div>
                        <form onSubmit={handleSubmitRequest} className="p-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Letter Type *
                                    </label>
                                    <select
                                        value={formData.letterType}
                                        onChange={(e) => setFormData({ ...formData, letterType: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                                        required
                                    >
                                        <option value="">Select letter type</option>
                                        {letterTypes.map(type => (
                                            <option key={type.value} value={type.value}>{type.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Purpose *
                                    </label>
                                    <textarea
                                        value={formData.purpose}
                                        onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                                        placeholder="e.g., Bank loan application, Visa processing, etc."
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Addressed To *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.addressedTo}
                                        onChange={(e) => setFormData({ ...formData, addressedTo: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                                        placeholder="e.g., To Whom It May Concern, Bank Manager, etc."
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Urgency
                                    </label>
                                    <div className="flex gap-4">
                                        <label className="flex items-center">
                                            <input
                                                type="radio"
                                                value="normal"
                                                checked={formData.urgency === 'normal'}
                                                onChange={(e) => setFormData({ ...formData, urgency: 'normal' })}
                                                className="mr-2"
                                            />
                                            <span className="text-sm text-gray-700">Normal (5-7 days)</span>
                                        </label>
                                        <label className="flex items-center">
                                            <input
                                                type="radio"
                                                value="urgent"
                                                checked={formData.urgency === 'urgent'}
                                                onChange={(e) => setFormData({ ...formData, urgency: 'urgent' })}
                                                className="mr-2"
                                            />
                                            <span className="text-sm text-gray-700">Urgent (2-3 days)</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 mt-6">
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors disabled:opacity-50"
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

            {/* Letter Preview Modal */}
            {showPreviewModal && selectedLetter && (
                <LetterPreviewModal
                    isOpen={showPreviewModal}
                    onClose={() => {
                        setShowPreviewModal(false);
                        setSelectedLetter(null);
                        setLetterContent('');
                    }}
                    letterContent={letterContent}
                    letterDetails={{
                        reference_number: selectedLetter.referenceNumber || selectedLetter.id,
                        template_name: selectedLetter.templateName || getLetterTypeLabel(selectedLetter.letterType),
                        letter_type: selectedLetter.letterType,
                        employee_name: '', // Will be populated from content
                        designation: '',
                        purpose: selectedLetter.purpose,
                        date: selectedLetter.completedDate || undefined
                    }}
                    isEditable={false}
                />
            )}
        </div>
    );
};

export default CashierServiceLetters;
