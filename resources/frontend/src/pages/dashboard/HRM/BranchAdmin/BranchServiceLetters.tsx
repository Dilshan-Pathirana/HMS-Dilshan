import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FileText, ArrowLeft, CheckCircle, XCircle, Clock,
    Loader2, User, Eye, Check, X, AlertCircle, FileCheck,
    Printer
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';
import LetterPreviewModal from '../../../../components/HRM/LetterPreviewModal';

interface LetterRequest {
    id: string;
    reference_number: string;
    template_name: string;
    letter_type: string;
    purpose: string;
    addressed_to: string | null;
    required_by: string | null;
    status: string;
    created_at: string;
    processed_at: string | null;
    rejection_reason: string | null;
    generated_content: string | null;
    first_name: string;
    last_name: string;
    employee_id: string;
    designation: string;
    branch_id: string;
}

const BranchServiceLetters: React.FC = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [requests, setRequests] = useState<LetterRequest[]>([]);
    const [selectedRequest, setSelectedRequest] = useState<LetterRequest | null>(null);
    const [showProcessModal, setShowProcessModal] = useState(false);
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [previewContent, setPreviewContent] = useState('');
    const [editedLetterContent, setEditedLetterContent] = useState('');
    const [processAction, setProcessAction] = useState<'approve' | 'reject'>('approve');
    const [rejectionReason, setRejectionReason] = useState('');
    const [adminRemarks, setAdminRemarks] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [isLoadingPreview, setIsLoadingPreview] = useState(false);
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'generated' | 'rejected'>('pending');

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('/api/hrm/branch-admin/letter-requests', {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.status === 'success') {
                setRequests(response.data.data || []);
            }
        } catch (error) {
            console.error('Error fetching letter requests:', error);
            toast.error('Failed to load letter requests');
        } finally {
            setIsLoading(false);
        }
    };

    const handleProcess = async () => {
        if (!selectedRequest) return;
        
        if (processAction === 'reject' && !rejectionReason.trim()) {
            toast.error('Please provide a reason for rejection');
            return;
        }

        setIsProcessing(true);
        try {
            const token = localStorage.getItem('token');
            await axios.put(
                `/api/hrm/branch-admin/letter-requests/${selectedRequest.id}/process`,
                {
                    action: processAction,
                    rejection_reason: processAction === 'reject' ? rejectionReason : null,
                    admin_remarks: adminRemarks || null
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            toast.success(
                processAction === 'approve' 
                    ? 'Letter request approved and generated!' 
                    : 'Letter request rejected'
            );
            setShowProcessModal(false);
            setSelectedRequest(null);
            setRejectionReason('');
            setAdminRemarks('');
            fetchRequests();
        } catch (error) {
            console.error('Error processing request:', error);
            toast.error('Failed to process request');
        } finally {
            setIsProcessing(false);
        }
    };

    const openProcessModal = (request: LetterRequest, action: 'approve' | 'reject') => {
        setSelectedRequest(request);
        setProcessAction(action);
        setShowProcessModal(true);
    };

    const openPreviewModal = async (request: LetterRequest) => {
        setSelectedRequest(request);
        setIsLoadingPreview(true);
        
        try {
            const token = localStorage.getItem('token');
            
            if (request.status === 'generated' && request.generated_content) {
                // Already generated, show saved content
                setPreviewContent(request.generated_content);
                setEditedLetterContent(request.generated_content);
            } else {
                // Get preview content from server
                const response = await axios.get(
                    `/api/hrm/branch-admin/letter-requests/${request.id}/preview`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                
                if (response.data.status === 'success') {
                    setPreviewContent(response.data.content);
                    setEditedLetterContent(response.data.content);
                } else {
                    toast.error('Failed to load letter preview');
                    return;
                }
            }
            
            setShowPreviewModal(true);
        } catch (error) {
            console.error('Error loading preview:', error);
            toast.error('Failed to load letter preview');
        } finally {
            setIsLoadingPreview(false);
        }
    };

    const handleSaveLetterContent = async (content: string) => {
        if (!selectedRequest) return;
        
        const token = localStorage.getItem('token');
        await axios.put(
            `/api/hrm/branch-admin/letter-requests/${selectedRequest.id}/update-content`,
            { content },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        
        setEditedLetterContent(content);
        fetchRequests();
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">
                        <Clock className="w-3 h-3" />
                        Pending
                    </span>
                );
            case 'generated':
            case 'approved':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                        <CheckCircle className="w-3 h-3" />
                        Generated
                    </span>
                );
            case 'rejected':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                        <XCircle className="w-3 h-3" />
                        Rejected
                    </span>
                );
            case 'collected':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                        <FileCheck className="w-3 h-3" />
                        Collected
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
                        {status}
                    </span>
                );
        }
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const filteredRequests = requests.filter(req => {
        if (statusFilter === 'all') return true;
        return req.status === statusFilter;
    });

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-indigo-500 mx-auto mb-4" />
                    <p className="text-gray-600">Loading letter requests...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50/30 p-6">
            {/* Header */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/branch-admin/hrm')}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 text-gray-600" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">Service Letter Requests</h1>
                            <p className="text-gray-600 text-sm mt-1">
                                Review and process letter requests from staff
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-500">
                            {requests.filter(r => r.status === 'pending').length} pending
                        </span>
                    </div>
                </div>

                {/* Status Filters */}
                <div className="flex items-center gap-2">
                    {[
                        { value: 'pending', label: 'Pending', icon: <Clock className="w-4 h-4" /> },
                        { value: 'generated', label: 'Generated', icon: <CheckCircle className="w-4 h-4" /> },
                        { value: 'rejected', label: 'Rejected', icon: <XCircle className="w-4 h-4" /> },
                        { value: 'all', label: 'All', icon: <FileText className="w-4 h-4" /> }
                    ].map(filter => (
                        <button
                            key={filter.value}
                            onClick={() => setStatusFilter(filter.value as any)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                                statusFilter === filter.value
                                    ? 'bg-indigo-500 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            {filter.icon}
                            <span className="text-sm font-medium">{filter.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Requests List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {filteredRequests.length === 0 ? (
                    <div className="p-12 text-center">
                        <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                        <p className="text-lg text-gray-500 mb-2">No letter requests found</p>
                        <p className="text-sm text-gray-400">
                            {statusFilter === 'pending' 
                                ? 'No pending requests to process' 
                                : 'No requests match your filter'}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Reference
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Employee
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Letter Type
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Purpose
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Required By
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {filteredRequests.map(request => (
                                    <tr key={request.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm font-medium text-indigo-600">
                                                {request.reference_number}
                                            </span>
                                            <p className="text-xs text-gray-400 mt-1">
                                                {formatDate(request.created_at)}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                                                    <User className="w-4 h-4 text-white" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">
                                                        {request.first_name} {request.last_name}
                                                    </p>
                                                    <p className="text-xs text-gray-500">{request.designation}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm text-gray-700">{request.template_name || request.letter_type}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm text-gray-600 max-w-xs truncate" title={request.purpose}>
                                                {request.purpose}
                                            </p>
                                            {request.addressed_to && (
                                                <p className="text-xs text-gray-400 mt-1">
                                                    To: {request.addressed_to}
                                                </p>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm text-gray-600">
                                                {formatDate(request.required_by)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getStatusBadge(request.status)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {request.status === 'pending' ? (
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => openPreviewModal(request)}
                                                        className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                                                        title="Preview & Edit Letter"
                                                        disabled={isLoadingPreview}
                                                    >
                                                        {isLoadingPreview && selectedRequest?.id === request.id ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            <Eye className="w-4 h-4" />
                                                        )}
                                                    </button>
                                                    <button
                                                        onClick={() => openProcessModal(request, 'approve')}
                                                        className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                                                        title="Approve & Generate"
                                                    >
                                                        <Check className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => openProcessModal(request, 'reject')}
                                                        className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                                                        title="Reject"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ) : request.status === 'generated' ? (
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => openPreviewModal(request)}
                                                        className="p-2 bg-indigo-100 text-indigo-600 rounded-lg hover:bg-indigo-200 transition-colors"
                                                        title="View & Print Letter"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => openPreviewModal(request)}
                                                        className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                                                        title="Print"
                                                    >
                                                        <Printer className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ) : request.status === 'rejected' ? (
                                                <button
                                                    onClick={() => {
                                                        setSelectedRequest(request);
                                                    }}
                                                    className="text-xs text-gray-500 hover:text-gray-700"
                                                    title={request.rejection_reason || 'No reason provided'}
                                                >
                                                    View Reason
                                                </button>
                                            ) : (
                                                <span className="text-xs text-gray-400">Processed</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Process Modal */}
            {showProcessModal && selectedRequest && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center gap-3">
                                {processAction === 'approve' ? (
                                    <div className="p-2 bg-green-100 rounded-lg">
                                        <CheckCircle className="w-6 h-6 text-green-600" />
                                    </div>
                                ) : (
                                    <div className="p-2 bg-red-100 rounded-lg">
                                        <XCircle className="w-6 h-6 text-red-600" />
                                    </div>
                                )}
                                <div>
                                    <h2 className="text-xl font-bold text-gray-800">
                                        {processAction === 'approve' ? 'Approve & Generate Letter' : 'Reject Request'}
                                    </h2>
                                    <p className="text-sm text-gray-500">
                                        {selectedRequest.reference_number}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="p-6">
                            {/* Request Details */}
                            <div className="bg-gray-50 rounded-lg p-4 mb-6">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-gray-500">Employee:</span>
                                        <p className="font-medium text-gray-800">
                                            {selectedRequest.first_name} {selectedRequest.last_name}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Letter Type:</span>
                                        <p className="font-medium text-gray-800">{selectedRequest.template_name}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <span className="text-gray-500">Purpose:</span>
                                        <p className="font-medium text-gray-800">{selectedRequest.purpose}</p>
                                    </div>
                                </div>
                            </div>

                            {processAction === 'reject' ? (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Reason for Rejection *
                                    </label>
                                    <textarea
                                        value={rejectionReason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                        rows={3}
                                        placeholder="Explain why this request is being rejected..."
                                    />
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Admin Remarks (Optional)
                                    </label>
                                    <textarea
                                        value={adminRemarks}
                                        onChange={(e) => setAdminRemarks(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                        rows={3}
                                        placeholder="Any additional remarks..."
                                    />
                                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                                        <p className="text-sm text-green-700 flex items-center gap-2">
                                            <AlertCircle className="w-4 h-4" />
                                            The letter will be automatically generated using the employee's details.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    setShowProcessModal(false);
                                    setSelectedRequest(null);
                                    setRejectionReason('');
                                    setAdminRemarks('');
                                }}
                                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleProcess}
                                disabled={isProcessing}
                                className={`px-6 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                                    processAction === 'approve'
                                        ? 'bg-green-500 text-white hover:bg-green-600'
                                        : 'bg-red-500 text-white hover:bg-red-600'
                                } disabled:opacity-50`}
                            >
                                {isProcessing ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : processAction === 'approve' ? (
                                    <Check className="w-4 h-4" />
                                ) : (
                                    <X className="w-4 h-4" />
                                )}
                                {processAction === 'approve' ? 'Approve & Generate' : 'Reject'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Letter Preview Modal */}
            {showPreviewModal && selectedRequest && (
                <LetterPreviewModal
                    isOpen={showPreviewModal}
                    onClose={() => {
                        setShowPreviewModal(false);
                        setSelectedRequest(null);
                        setPreviewContent('');
                    }}
                    letterContent={editedLetterContent || previewContent}
                    letterDetails={{
                        reference_number: selectedRequest.reference_number,
                        template_name: selectedRequest.template_name || selectedRequest.letter_type,
                        letter_type: selectedRequest.letter_type,
                        employee_name: `${selectedRequest.first_name} ${selectedRequest.last_name}`,
                        designation: selectedRequest.designation,
                        purpose: selectedRequest.purpose,
                        date: selectedRequest.processed_at || new Date().toISOString()
                    }}
                    isEditable={selectedRequest.status === 'pending' || selectedRequest.status === 'generated'}
                    onSave={handleSaveLetterContent}
                />
            )}
        </div>
    );
};

export default BranchServiceLetters;
