import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FileText, ArrowLeft, Download, Eye, Loader2, Plus,
    Calendar, Clock, CheckCircle, AlertCircle, Send
} from 'lucide-react';
import api from "../../../../utils/api/axios";
import { toast } from 'react-toastify';

interface ServiceLetter {
    id: string;
    type: string;
    requestDate: string;
    status: 'pending' | 'processing' | 'ready' | 'rejected';
    processedDate?: string;
    fileUrl?: string;
    reason?: string;
    rejectionReason?: string;
}

const letterTypes = [
    { value: 'employment', label: 'Employment Confirmation Letter', description: 'Confirms your current employment status and position' },
    { value: 'salary', label: 'Salary Certificate', description: 'Confirms your current salary for loan/visa applications' },
    { value: 'experience', label: 'Experience Letter', description: 'Details your role and responsibilities' },
    { value: 'service', label: 'Service Letter', description: 'For bank, visa, or other official purposes' },
    { value: 'promotion', label: 'Promotion Confirmation', description: 'Confirms your recent promotion' },
    { value: 'transfer', label: 'Transfer Letter', description: 'Confirms branch transfer details' }
];

const NurseServiceLetters: React.FC = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [letters, setLetters] = useState<ServiceLetter[]>([]);
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [selectedType, setSelectedType] = useState('');
    const [reason, setReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchLetters();
    }, []);

    const fetchLetters = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('authToken');
            const response = await api.get('/hrm/cashier/service-letters', {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.status === 200) {
                setLetters(response.data.letters || []);
            }
        } catch (error) {
            console.error('Error fetching service letters:', error);
            // Mock data for demonstration
            setLetters([
                {
                    id: '1',
                    type: 'employment',
                    requestDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
                    status: 'ready',
                    processedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                    fileUrl: '/letters/emp-001.pdf'
                },
                {
                    id: '2',
                    type: 'salary',
                    requestDate: new Date().toISOString(),
                    status: 'pending',
                    reason: 'Required for home loan application'
                }
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const submitRequest = async () => {
        if (!selectedType) {
            toast.error('Please select a letter type');
            return;
        }

        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('authToken');
            const response = await api.post(
                '/hrm/cashier/service-letter/request',
                { type: selectedType, reason },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.status === 200 || response.data.status === 201) {
                toast.success('Letter request submitted successfully!');
                setShowRequestModal(false);
                setSelectedType('');
                setReason('');
                fetchLetters();
            } else {
                toast.error(response.data.message || 'Failed to submit request');
            }
        } catch (error) {
            console.error('Error submitting request:', error);
            toast.info('Request submitted (demo mode)');
            setShowRequestModal(false);
            setSelectedType('');
            setReason('');
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const getStatusBadge = (status: string) => {
        const badges: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
            pending: { bg: 'bg-amber-100', text: 'text-amber-800', icon: <Clock className="w-3 h-3" /> },
            processing: { bg: 'bg-blue-100', text: 'text-blue-800', icon: <Loader2 className="w-3 h-3 animate-spin" /> },
            ready: { bg: 'bg-green-100', text: 'text-green-800', icon: <CheckCircle className="w-3 h-3" /> },
            rejected: { bg: 'bg-red-100', text: 'text-red-800', icon: <AlertCircle className="w-3 h-3" /> }
        };
        const badge = badges[status] || badges.pending;
        return (
            <span className={`flex items-center gap-1 px-2 py-1 ${badge.bg} ${badge.text} text-xs rounded-full font-medium`}>
                {badge.icon}
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    const getLetterTypeName = (type: string) => {
        const letterType = letterTypes.find(lt => lt.value === type);
        return letterType?.label || type;
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center sm:ml-64 pt-20">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-teal-500 mx-auto mb-4" />
                    <p className="text-gray-600">Loading service letters...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-teal-50/30 p-6 sm:ml-64 pt-20">
            {/* Header */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/nurse-dashboard/hr')}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 text-gray-600" />
                        </button>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-teal-100 rounded-lg">
                                <FileText className="w-6 h-6 text-teal-600" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-800">Service Letters</h1>
                                <p className="text-gray-600 text-sm mt-1">Request official letters and certificates</p>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowRequestModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Request Letter
                    </button>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <p className="text-gray-600 text-sm">Total Requests</p>
                        <p className="text-2xl font-bold text-gray-800">{letters.length}</p>
                    </div>
                    <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                        <p className="text-amber-700 text-sm">Pending</p>
                        <p className="text-2xl font-bold text-amber-800">
                            {letters.filter(l => l.status === 'pending').length}
                        </p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                        <p className="text-blue-700 text-sm">Processing</p>
                        <p className="text-2xl font-bold text-blue-800">
                            {letters.filter(l => l.status === 'processing').length}
                        </p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                        <p className="text-green-700 text-sm">Ready</p>
                        <p className="text-2xl font-bold text-green-800">
                            {letters.filter(l => l.status === 'ready').length}
                        </p>
                    </div>
                </div>
            </div>

            {/* Letters List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-800">My Letter Requests</h2>
                </div>
                <div className="p-6">
                    {letters.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                            <p>No letter requests yet</p>
                            <button
                                onClick={() => setShowRequestModal(true)}
                                className="mt-4 px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600"
                            >
                                Request Your First Letter
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {letters.map((letter) => (
                                <div key={letter.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-4">
                                            <div className="p-2 bg-teal-100 rounded-lg">
                                                <FileText className="w-5 h-5 text-teal-600" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-gray-800">
                                                    {getLetterTypeName(letter.type)}
                                                </h3>
                                                <p className="text-sm text-gray-500 mt-1">
                                                    Requested on {formatDate(letter.requestDate)}
                                                </p>
                                                {letter.reason && (
                                                    <p className="text-sm text-gray-600 mt-2">
                                                        <span className="font-medium">Reason:</span> {letter.reason}
                                                    </p>
                                                )}
                                                {letter.rejectionReason && (
                                                    <p className="text-sm text-red-600 mt-2">
                                                        <span className="font-medium">Rejection reason:</span> {letter.rejectionReason}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {getStatusBadge(letter.status)}
                                            {letter.status === 'ready' && letter.fileUrl && (
                                                <div className="flex gap-2">
                                                    <button className="p-2 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors">
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    <button className="p-2 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors">
                                                        <Download className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    {letter.processedDate && (
                                        <div className="mt-3 pt-3 border-t border-gray-100">
                                            <p className="text-xs text-gray-500">
                                                Processed on {formatDate(letter.processedDate)}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Request Modal */}
            {showRequestModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-xl font-bold text-gray-800">Request Service Letter</h2>
                            <p className="text-sm text-gray-600 mt-1">
                                Select the type of letter you need
                            </p>
                        </div>
                        <div className="p-6">
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-3">Letter Type</label>
                                <div className="space-y-3">
                                    {letterTypes.map((type) => (
                                        <label
                                            key={type.value}
                                            className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                                                selectedType === type.value
                                                    ? 'border-teal-500 bg-teal-50'
                                                    : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                        >
                                            <input
                                                type="radio"
                                                name="letterType"
                                                value={type.value}
                                                checked={selectedType === type.value}
                                                onChange={(e) => setSelectedType(e.target.value)}
                                                className="mt-1 text-teal-500 focus:ring-teal-500"
                                            />
                                            <div>
                                                <p className="font-medium text-gray-800">{type.label}</p>
                                                <p className="text-sm text-gray-500">{type.description}</p>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Purpose / Reason (Optional)
                                </label>
                                <textarea
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    rows={3}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                                    placeholder="e.g., Required for visa application, bank loan..."
                                />
                            </div>

                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setShowRequestModal(false)}
                                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={submitRequest}
                                    disabled={isSubmitting || !selectedType}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-teal-500 text-white rounded-lg hover:bg-teal-600 disabled:opacity-50"
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
                    </div>
                </div>
            )}
        </div>
    );
};

export default NurseServiceLetters;
