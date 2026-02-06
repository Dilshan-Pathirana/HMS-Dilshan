import React, { useState, useEffect } from 'react';
import api from "../../../utils/api/axios";
import {
    FileText, Eye, Edit, Trash2, Send, CheckCircle, XCircle, Clock,
    Search, Package, Plus, AlertTriangle, MessageSquare
} from 'lucide-react';
import alert from '../../../utils/alert';
import { CreatePRModal } from '../../../components/modals/CreatePRModal';

interface PurchaseRequest {
    id: string;
    pr_number: string;
    priority: 'Normal' | 'Urgent' | 'Emergency';
    status: 'Draft' | 'Pending Approval' | 'Approved' | 'Rejected' | 'Converted' | 'Clarification Requested';
    total_estimated_cost: number;
    total_items: number;
    general_remarks?: string;
    created_at: string;
    creator: {
        first_name: string;
        last_name: string;
    };
    approver?: {
        first_name: string;
        last_name: string;
    };
    approval_remarks?: string;
    approved_at?: string;
    rejected_by?: {
        first_name: string;
        last_name: string;
    };
    rejection_reason?: string;
    rejected_at?: string;
    items: PRItem[];
}

interface PRItem {
    id: string;
    product: {
        item_name: string;
        item_code?: string;
    };
    requested_quantity: number;
    estimated_unit_price: number;
    total_estimated_cost: number;
    supplier?: {
        supplier_name: string;
    };
    item_remarks?: string;
    suggestion_reason?: string;
}

interface Stats {
    total: number;
    draft: number;
    pending: number;
    approved: number;
    rejected: number;
    converted: number;
    clarification_requested: number;
}

export const PurchaseRequestList: React.FC = () => {
    const [purchaseRequests, setPurchaseRequests] = useState<PurchaseRequest[]>([]);
    const [filteredPRs, setFilteredPRs] = useState<PurchaseRequest[]>([]);
    const [stats, setStats] = useState<Stats>({
        total: 0,
        draft: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        converted: 0,
        clarification_requested: 0
    });
    const [loading, setLoading] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPR, setSelectedPR] = useState<PurchaseRequest | null>(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingPR, setEditingPR] = useState<PurchaseRequest | null>(null);
    const [isResubmitMode, setIsResubmitMode] = useState(false);

    useEffect(() => {
        fetchPurchaseRequests();
        fetchStats();
    }, []);

    useEffect(() => {
        filterPurchaseRequests();
    }, [selectedStatus, searchTerm, purchaseRequests]);

    const fetchPurchaseRequests = async () => {
        setLoading(true);
        try {
            const response = await api.get('/purchase-requests');
            if (response.data.success) {
                setPurchaseRequests(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching purchase requests:', error);
            alert.error('Failed to fetch purchase requests');
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await api.get('/purchase-requests/stats');
            if (response.data.success) {
                setStats(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const handleCreateSuccess = () => {
        fetchPurchaseRequests();
        fetchStats();
    };

    const filterPurchaseRequests = () => {
        let filtered = [...purchaseRequests];

        // Filter by status
        if (selectedStatus !== 'all') {
            filtered = filtered.filter(pr => pr.status === selectedStatus);
        }

        // Filter by search term
        if (searchTerm) {
            filtered = filtered.filter(pr =>
                pr.pr_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                pr.creator.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                pr.creator.last_name.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        setFilteredPRs(filtered);
    };

    const handleViewDetails = async (prId: string) => {
        try {
            const response = await api.get(`/purchase-requests/${prId}`);
            if (response.data.success) {
                setSelectedPR(response.data.data);
                setShowDetailsModal(true);
            }
        } catch (error) {
            alert.error('Failed to fetch purchase request details');
        }
    };

    const handleEdit = async (prId: string) => {
        try {
            const response = await api.get(`/purchase-requests/${prId}`);
            if (response.data.success) {
                setEditingPR(response.data.data);
                setShowCreateModal(true);
            }
        } catch (error) {
            alert.error('Failed to load purchase request for editing');
        }
    };

    const handleDelete = async (prId: string, prNumber: string) => {
        if (!confirm(`Are you sure you want to delete ${prNumber}?`)) {
            return;
        }

        try {
            const response = await api.delete(`/purchase-requests/${prId}`);
            if (response.data.success) {
                alert.success('Purchase request deleted successfully');
                fetchPurchaseRequests();
                fetchStats();
            }
        } catch (error: any) {
            alert.error(error.response?.data?.message || 'Failed to delete purchase request');
        }
    };

    const handleSubmit = async (prId: string, prNumber: string) => {
        if (!confirm(`Submit ${prNumber} for approval?`)) {
            return;
        }

        try {
            const response = await api.post(`/purchase-requests/${prId}/submit`);
            if (response.data.success) {
                alert.success('Purchase request submitted for approval');
                fetchPurchaseRequests();
                fetchStats();
            }
        } catch (error: any) {
            alert.error(error.response?.data?.message || 'Failed to submit purchase request');
        }
    };

    const handleEditForResubmit = async (prId: string) => {
        try {
            const response = await api.get(`/purchase-requests/${prId}`);
            if (response.data.success) {
                setEditingPR(response.data.data);
                setIsResubmitMode(true);
                setShowCreateModal(true);
            }
        } catch (error) {
            alert.error('Failed to load purchase request for editing');
        }
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            Draft: 'bg-neutral-100 text-neutral-700',
            'Pending Approval': 'bg-yellow-100 text-yellow-700',
            Approved: 'bg-green-100 text-green-700',
            Rejected: 'bg-error-100 text-red-700',
            Converted: 'bg-blue-100 text-blue-700',
            'Clarification Requested': 'bg-orange-100 text-orange-700'
        };

        const icons: Record<string, JSX.Element> = {
            Draft: <Edit className="w-4 h-4" />,
            'Pending Approval': <Clock className="w-4 h-4" />,
            Approved: <CheckCircle className="w-4 h-4" />,
            Rejected: <XCircle className="w-4 h-4" />,
            Converted: <Package className="w-4 h-4" />,
            'Clarification Requested': <Clock className="w-4 h-4" />
        };

        return (
            <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 ${styles[status]}`}>
                {icons[status]}
                {status}
            </span>
        );
    };

    const getPriorityBadge = (priority: string) => {
        const styles: Record<string, string> = {
            Normal: 'bg-blue-50 text-primary-500 border-blue-200',
            Urgent: 'bg-orange-50 text-orange-600 border-orange-200',
            Emergency: 'bg-error-50 text-error-600 border-red-200'
        };

        return (
            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${styles[priority]}`}>
                {priority}
            </span>
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

    const formatCurrency = (amount: number) => {
        return `LKR ${amount.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    return (
        <div className="ml-0 md:ml-64 pt-24 min-h-screen bg-neutral-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-neutral-900">Purchase Requests</h1>
                    <p className="text-neutral-600">Manage and track purchase requests</p>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
                    <div className="bg-white rounded-lg shadow p-4 border-l-4 border-primary-500">
                        <p className="text-sm text-neutral-600">Total</p>
                        <p className="text-2xl font-bold text-neutral-900">{stats.total}</p>
                    </div>
                    <div className="bg-white rounded-lg shadow p-4 border-l-4 border-gray-500">
                        <p className="text-sm text-neutral-600">Draft</p>
                        <p className="text-2xl font-bold text-neutral-700">{stats.draft}</p>
                    </div>
                    <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500">
                        <p className="text-sm text-neutral-600">Pending</p>
                        <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                    </div>
                    <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
                        <p className="text-sm text-neutral-600">Approved</p>
                        <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
                    </div>
                    <div className="bg-white rounded-lg shadow p-4 border-l-4 border-error-500">
                        <p className="text-sm text-neutral-600">Rejected</p>
                        <p className="text-2xl font-bold text-error-600">{stats.rejected}</p>
                    </div>
                    <div className="bg-white rounded-lg shadow p-4 border-l-4 border-primary-500">
                        <p className="text-sm text-neutral-600">Converted</p>
                        <p className="text-2xl font-bold text-primary-500">{stats.converted}</p>
                    </div>
                </div>

                {/* Clarification Requested Notification */}
                {stats.clarification_requested > 0 && (
                    <div className="bg-orange-50 border-l-4 border-orange-500 rounded-lg shadow p-4 mb-6">
                        <div className="flex items-center gap-3">
                            <div className="flex-shrink-0">
                                <AlertTriangle className="w-6 h-6 text-orange-500" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-sm font-semibold text-orange-800">
                                    Clarification Requested
                                </h3>
                                <p className="text-sm text-orange-700 mt-1">
                                    You have <span className="font-bold">{stats.clarification_requested}</span> purchase request(s) that require clarification. 
                                    Please review and respond to continue the approval process.
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedStatus('Clarification Requested')}
                                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium flex items-center gap-2"
                            >
                                <MessageSquare className="w-4 h-4" />
                                View PRs
                            </button>
                        </div>
                    </div>
                )}

                {/* Filters and Create Button */}
                <div className="bg-white rounded-lg shadow p-4 mb-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
                                <input
                                    type="text"
                                    placeholder="Search by PR number or creator..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                />
                            </div>
                        </div>
                        <div>
                            <select
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value)}
                                className="px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                            >
                                <option value="all">All Status</option>
                                <option value="Draft">Draft</option>
                                <option value="Pending Approval">Pending Approval</option>
                                <option value="Approved">Approved</option>
                                <option value="Rejected">Rejected</option>
                                <option value="Clarification Requested">Clarification Requested</option>
                                <option value="Converted">Converted</option>
                            </select>
                        </div>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors flex items-center gap-2 shadow-md hover:shadow-lg"
                        >
                            <Plus className="w-5 h-5" />
                            Create New PR
                        </button>
                    </div>
                </div>

                {/* Purchase Requests Table */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    {loading ? (
                        <div className="p-8 text-center">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                            <p className="mt-2 text-neutral-600">Loading purchase requests...</p>
                        </div>
                    ) : filteredPRs.length === 0 ? (
                        <div className="p-8 text-center text-neutral-500">
                            <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                            <p className="text-lg font-medium">No purchase requests found</p>
                            <p className="text-sm">Create a new purchase request to get started</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-neutral-50 border-b border-neutral-200">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                                            PR Number
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                                            Date
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                                            Priority
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                                            Items
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                                            Total Cost
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                                            Created By
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredPRs.map((pr) => (
                                        <tr key={pr.id} className="hover:bg-neutral-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm font-medium text-primary-500">
                                                    {pr.pr_number}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">
                                                {formatDate(pr.created_at)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {getPriorityBadge(pr.priority)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                                                {pr.total_items} items
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900">
                                                {formatCurrency(pr.total_estimated_cost)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {getStatusBadge(pr.status)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">
                                                {pr.creator.first_name} {pr.creator.last_name}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleViewDetails(pr.id)}
                                                        className="text-primary-500 hover:text-blue-800"
                                                        title="View Details"
                                                    >
                                                        <Eye className="w-5 h-5" />
                                                    </button>
                                                    {pr.status === 'Draft' && (
                                                        <>
                                                            <button
                                                                onClick={() => handleEdit(pr.id)}
                                                                className="text-primary-500 hover:text-blue-800"
                                                                title="Edit Draft"
                                                            >
                                                                <Edit className="w-5 h-5" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleSubmit(pr.id, pr.pr_number)}
                                                                className="text-green-600 hover:text-green-800"
                                                                title="Submit for Approval"
                                                            >
                                                                <Send className="w-5 h-5" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(pr.id, pr.pr_number)}
                                                                className="text-error-600 hover:text-red-800"
                                                                title="Delete"
                                                            >
                                                                <Trash2 className="w-5 h-5" />
                                                            </button>
                                                        </>
                                                    )}
                                                    {pr.status === 'Clarification Requested' && (
                                                        <>
                                                            <button
                                                                onClick={() => handleEditForResubmit(pr.id)}
                                                                className="text-orange-600 hover:text-orange-800"
                                                                title="Edit & Respond to Clarification"
                                                            >
                                                                <Edit className="w-5 h-5" />
                                                            </button>
                                                            <span className="text-xs text-orange-600 font-medium px-2 py-1 bg-orange-50 rounded">
                                                                Needs Response
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Details Modal */}
                {showDetailsModal && selectedPR && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="sticky top-0 bg-white border-b border-neutral-200 px-6 py-4 flex justify-between items-center">
                                <div>
                                    <h2 className="text-2xl font-bold text-neutral-900">{selectedPR.pr_number}</h2>
                                    <p className="text-sm text-neutral-600">Purchase Request Details</p>
                                </div>
                                <button
                                    onClick={() => setShowDetailsModal(false)}
                                    className="text-neutral-400 hover:text-neutral-600"
                                >
                                    <XCircle className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="p-6">
                                {/* PR Information */}
                                <div className="grid grid-cols-2 gap-6 mb-6">
                                    <div>
                                        <p className="text-sm text-neutral-600">Status</p>
                                        <div className="mt-1">{getStatusBadge(selectedPR.status)}</div>
                                    </div>
                                    <div>
                                        <p className="text-sm text-neutral-600">Priority</p>
                                        <div className="mt-1">{getPriorityBadge(selectedPR.priority)}</div>
                                    </div>
                                    <div>
                                        <p className="text-sm text-neutral-600">Created By</p>
                                        <p className="mt-1 font-medium">
                                            {selectedPR.creator.first_name} {selectedPR.creator.last_name}
                                        </p>
                                        <p className="text-xs text-neutral-500">{formatDate(selectedPR.created_at)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-neutral-600">Total Estimated Cost</p>
                                        <p className="mt-1 text-lg font-bold text-primary-500">
                                            {formatCurrency(selectedPR.total_estimated_cost)}
                                        </p>
                                    </div>
                                </div>

                                {selectedPR.general_remarks && (
                                    <div className="mb-6 p-4 bg-neutral-50 rounded-lg">
                                        <p className="text-sm text-neutral-600 mb-1">General Remarks</p>
                                        <p className="text-neutral-900">{selectedPR.general_remarks}</p>
                                    </div>
                                )}

                                {selectedPR.status === 'Approved' && selectedPR.approver && (
                                    <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
                                        <p className="text-sm text-green-700 font-semibold mb-2">Approved</p>
                                        <p className="text-sm text-neutral-700">
                                            By: {selectedPR.approver.first_name} {selectedPR.approver.last_name}
                                        </p>
                                        <p className="text-xs text-neutral-600">{formatDate(selectedPR.approved_at!)}</p>
                                        {selectedPR.approval_remarks && (
                                            <p className="text-sm text-neutral-700 mt-2">{selectedPR.approval_remarks}</p>
                                        )}
                                    </div>
                                )}

                                {selectedPR.status === 'Rejected' && selectedPR.rejected_by && (
                                    <div className="mb-6 p-4 bg-error-50 rounded-lg border border-red-200">
                                        <p className="text-sm text-red-700 font-semibold mb-2">Rejected</p>
                                        <p className="text-sm text-neutral-700">
                                            By: {selectedPR.rejected_by.first_name} {selectedPR.rejected_by.last_name}
                                        </p>
                                        <p className="text-xs text-neutral-600">{formatDate(selectedPR.rejected_at!)}</p>
                                        {selectedPR.rejection_reason && (
                                            <p className="text-sm text-neutral-700 mt-2">{selectedPR.rejection_reason}</p>
                                        )}
                                    </div>
                                )}

                                {/* Items Table */}
                                <div>
                                    <h3 className="text-lg font-semibold mb-4">Items ({selectedPR.items.length})</h3>
                                    <div className="border border-neutral-200 rounded-lg overflow-hidden">
                                        <table className="w-full">
                                            <thead className="bg-neutral-50">
                                                <tr>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500">#</th>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500">Product</th>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500">Supplier</th>
                                                    <th className="px-4 py-2 text-right text-xs font-medium text-neutral-500">Qty</th>
                                                    <th className="px-4 py-2 text-right text-xs font-medium text-neutral-500">Unit Price</th>
                                                    <th className="px-4 py-2 text-right text-xs font-medium text-neutral-500">Total</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200">
                                                {selectedPR.items.map((item, index) => (
                                                    <tr key={item.id}>
                                                        <td className="px-4 py-3 text-sm text-neutral-600">{index + 1}</td>
                                                        <td className="px-4 py-3">
                                                            <p className="text-sm font-medium text-neutral-900">
                                                                {item.product.item_name}
                                                            </p>
                                                            {item.suggestion_reason && (
                                                                <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                                                                    {item.suggestion_reason}
                                                                </span>
                                                            )}
                                                            {item.item_remarks && (
                                                                <p className="text-xs text-neutral-500 mt-1">{item.item_remarks}</p>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-neutral-600">
                                                            {item.supplier?.supplier_name || '-'}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-right text-neutral-900">
                                                            {item.requested_quantity}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-right text-neutral-900">
                                                            {formatCurrency(item.estimated_unit_price)}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-right font-medium text-neutral-900">
                                                            {formatCurrency(item.total_estimated_cost)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot className="bg-neutral-50">
                                                <tr>
                                                    <td colSpan={5} className="px-4 py-3 text-right font-semibold text-neutral-900">
                                                        Total Estimated Cost:
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-bold text-primary-500 text-lg">
                                                        {formatCurrency(selectedPR.total_estimated_cost)}
                                                    </td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            <div className="sticky bottom-0 bg-neutral-50 border-t border-neutral-200 px-6 py-4 flex justify-end gap-3">
                                <button
                                    onClick={() => setShowDetailsModal(false)}
                                    className="px-6 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-100 transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Create/Edit PR Modal */}
                <CreatePRModal
                    isOpen={showCreateModal}
                    onClose={() => {
                        setShowCreateModal(false);
                        setEditingPR(null); // Reset editing state
                        setIsResubmitMode(false); // Reset resubmit mode
                    }}
                    onSuccess={handleCreateSuccess}
                    editingPR={editingPR}
                    isResubmitMode={isResubmitMode}
                />
            </div>
        </div>
    );
};

export default PurchaseRequestList;
