import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../../components/common/Layout/DashboardLayout';
import { BranchAdminSidebar } from '../../../components/common/Layout/BranchAdminSidebar';
import {
    Filter,
    Search, Eye, Edit, CheckCircle, XCircle, MessageSquare,
    Clock, AlertCircle, Package, TrendingUp
} from 'lucide-react';
import api from "../../../utils/api/axios";
import { useNavigate, useLocation } from 'react-router-dom';
import alert from '../../../utils/alert';
import { PRReviewModal } from '../../../components/modals/PRReviewModal';

interface PurchaseRequest {
    id: string;
    pr_number: string;
    status: string;
    priority: 'Normal' | 'Urgent' | 'Emergency';
    supplier_id: string;
    total_items: number;
    total_estimated_cost: number;
    created_at: string;
    general_remarks: string;
    creator: {
        id: string;
        first_name: string;
        last_name: string;
        user_type: string;
    };
    items: any[];
}

interface Supplier {
    id: string;
    supplier_name: string;
}

export const BranchAdminPurchaseRequests: React.FC = () => {
    const [purchaseRequests, setPurchaseRequests] = useState<PurchaseRequest[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPR, setSelectedPR] = useState<PurchaseRequest | null>(null);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [pendingCount, setPendingCount] = useState(0);
    
    // Filters
    const [filterRole, setFilterRole] = useState('all');
    const [filterSupplier, setFilterSupplier] = useState('all');
    const [filterPriority, setFilterPriority] = useState('all');
    const [sortBy, setSortBy] = useState('urgent_first');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    const [userName, setUserName] = useState('Branch Admin');
    const [profileImage, setProfileImage] = useState('');
    const [branchName, setBranchName] = useState('');
    const [branchLogo, setBranchLogo] = useState('');
    const [userGender, setUserGender] = useState('');
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
        setUserName(`${userInfo.first_name || ''} ${userInfo.last_name || ''}`);
        setProfileImage(userInfo.profile_picture || '');
        setBranchName(userInfo.branch_name || userInfo.branch?.name || 'Branch');
        setBranchLogo(userInfo.branch_logo || userInfo.branch?.logo || '');
        setUserGender(userInfo.gender || '');
        
        fetchPendingCount();
        fetchSuppliers();
        fetchPurchaseRequests();
    }, []);

    useEffect(() => {
        fetchPurchaseRequests();
    }, [filterRole, filterSupplier, filterPriority, sortBy, dateFrom, dateTo]);

    const fetchPendingCount = async () => {
        try {
            const response = await api.get('/branch-admin/purchase-requests/pending-count');
            if (response.data.success) {
                setPendingCount(response.data.count);
            }
        } catch (error) {
            console.error('Failed to fetch pending count:', error);
        }
    };

    const fetchSuppliers = async () => {
        try {
            // Try branch admin endpoint first, fall back to super admin endpoint
            let response;
            try {
                response = await api.get('/branch-admin/suppliers');
            } catch {
                // Fallback to super admin endpoint if branch admin endpoint fails
                response = await api.get('/pharmacy/suppliers');
            }
            
            if (response.data.status === 200) {
                // API may return data in 'data' or 'suppliers' field
                const supplierData = response.data.data || response.data.suppliers || [];
                setSuppliers(supplierData);
            }
        } catch (error) {
            console.error('Failed to fetch suppliers:', error);
        }
    };

    const fetchPurchaseRequests = async () => {
        setLoading(true);
        try {
            const params: any = {
                sort_by: sortBy
            };

            if (filterRole !== 'all') params.requester_role = filterRole;
            if (filterSupplier !== 'all') params.supplier_id = filterSupplier;
            if (filterPriority !== 'all') params.priority = filterPriority;
            if (dateFrom) params.date_from = dateFrom;
            if (dateTo) params.date_to = dateTo;

            const response = await api.get('/branch-admin/purchase-requests/pending', { params });
            
            if (response.data.success) {
                setPurchaseRequests(response.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch purchase requests:', error);
            alert.error('Failed to load purchase requests');
        } finally {
            setLoading(false);
        }
    };

    const handleViewPR = async (pr: PurchaseRequest) => {
        try {
            const response = await api.get(`/branch-admin/purchase-requests/${pr.id}`);
            if (response.data.success) {
                setSelectedPR(response.data.data);
                setShowReviewModal(true);
            }
        } catch (error) {
            console.error('Failed to fetch PR details:', error);
            alert.error('Failed to load PR details');
        }
    };

    const handleModalClose = () => {
        setShowReviewModal(false);
        setSelectedPR(null);
        fetchPurchaseRequests();
        fetchPendingCount();
    };

    const getPriorityBadge = (priority: string) => {
        switch (priority) {
            case 'Emergency':
                return <span className="px-2 py-1 rounded-full text-xs font-semibold bg-error-100 text-red-700 border border-red-300">🚨 Emergency</span>;
            case 'Urgent':
                return <span className="px-2 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700 border border-orange-300">⚡ Urgent</span>;
            case 'Normal':
                return <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-300">📋 Normal</span>;
            default:
                return <span className="px-2 py-1 rounded-full text-xs font-semibold bg-neutral-100 text-neutral-700 border border-neutral-300">{priority}</span>;
        }
    };

    const getRoleBadge = (userType: string) => {
        switch (userType) {
            case 'pharmacist':
                return <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">💊 Pharmacist</span>;
            case 'doctor':
                return <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">🩺 Doctor</span>;
            default:
                return <span className="px-2 py-1 rounded-full text-xs font-medium bg-neutral-100 text-neutral-700">{userType}</span>;
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-LK', {
            style: 'currency',
            currency: 'LKR',
            minimumFractionDigits: 2
        }).format(amount);
    };

    const filteredPRs = purchaseRequests.filter(pr => {
        const matchesSearch = pr.pr_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
            `${pr.creator.first_name} ${pr.creator.last_name}`.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
    });

    return (
        <DashboardLayout
            userName={userName}
            userRole="Branch Admin"
            profileImage={profileImage}
            branchName={branchName}
            branchLogo={branchLogo}
            userGender={userGender}
            sidebarContent={<BranchAdminSidebar />}
        >
            <div className="space-y-6">
                {/* Header */}
                <div className="bg-gradient-to-r from-emerald-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold">Purchase Requests</h1>
                            <p className="text-emerald-100 mt-1">Review and approve purchase requests from your team</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="bg-white/20 rounded-lg px-4 py-3">
                                <div className="flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-white" />
                                    <div>
                                        <p className="text-xs text-emerald-100">Pending Approval</p>
                                        <p className="text-2xl font-bold text-white">{pendingCount}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Pending Notification Alert */}
                {pendingCount > 0 && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
                            <div>
                                <h3 className="font-semibold text-orange-800">Action Required</h3>
                                <p className="text-orange-700 text-sm mt-1">
                                    You have <strong>{pendingCount}</strong> purchase request{pendingCount > 1 ? 's' : ''} awaiting your approval.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-4">
                    <div className="flex items-center gap-2 mb-4">
                        <Filter className="w-5 h-5 text-neutral-600" />
                        <h3 className="font-semibold text-neutral-800">Filters & Search</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                        {/* Search */}
                        <div className="lg:col-span-2">
                            <label className="block text-sm font-medium text-neutral-700 mb-1">Search</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="PR Number or Creator..."
                                    className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                />
                            </div>
                        </div>

                        {/* Role Filter */}
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1">Requester Role</label>
                            <select
                                value={filterRole}
                                onChange={(e) => setFilterRole(e.target.value)}
                                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            >
                                <option value="all">All Roles</option>
                                <option value="pharmacist">Pharmacist</option>
                                <option value="doctor">Doctor</option>
                            </select>
                        </div>

                        {/* Supplier Filter */}
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1">Supplier</label>
                            <select
                                value={filterSupplier}
                                onChange={(e) => setFilterSupplier(e.target.value)}
                                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            >
                                <option value="all">All Suppliers</option>
                                {suppliers.map(supplier => (
                                    <option key={supplier.id} value={supplier.id}>{supplier.supplier_name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Priority Filter */}
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1">Priority</label>
                            <select
                                value={filterPriority}
                                onChange={(e) => setFilterPriority(e.target.value)}
                                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            >
                                <option value="all">All Priorities</option>
                                <option value="Emergency">Emergency</option>
                                <option value="Urgent">Urgent</option>
                                <option value="Normal">Normal</option>
                            </select>
                        </div>

                        {/* Sort By */}
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1">Sort By</label>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            >
                                <option value="urgent_first">Urgent First</option>
                                <option value="oldest_first">Oldest First</option>
                                <option value="newest_first">Newest First</option>
                            </select>
                        </div>
                    </div>

                    {/* Date Range */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1">Date From</label>
                            <input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1">Date To</label>
                            <input
                                type="date"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Purchase Requests Table */}
                <div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-neutral-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">PR Number</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Type</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Requested By</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Items</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Est. Cost</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Priority</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {loading ? (
                                    <tr>
                                        <td colSpan={8} className="px-6 py-8 text-center">
                                            <div className="flex items-center justify-center">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                                                <span className="ml-3 text-neutral-600">Loading purchase requests...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredPRs.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-6 py-8 text-center text-neutral-500">
                                            <Package className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                                            <p>No pending purchase requests found</p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredPRs.map((pr) => (
                                        <tr key={pr.id} className="hover:bg-neutral-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="font-semibold text-primary-500">{pr.pr_number}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {getRoleBadge(pr.creator.user_type)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div>
                                                    <p className="font-medium text-neutral-800">{pr.creator.first_name} {pr.creator.last_name}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="px-2 py-1 bg-neutral-100 rounded-full text-sm font-medium">{pr.total_items} items</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="font-semibold text-neutral-800">{formatCurrency(pr.total_estimated_cost)}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">
                                                {formatDate(pr.created_at)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {getPriorityBadge(pr.priority)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <button
                                                    onClick={() => handleViewPR(pr)}
                                                    className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors flex items-center gap-2 text-sm font-medium"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                    Review
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* PR Review Modal */}
            {showReviewModal && selectedPR && (
                <PRReviewModal
                    isOpen={showReviewModal}
                    onClose={handleModalClose}
                    purchaseRequest={selectedPR}
                />
            )}
        </DashboardLayout>
    );
};
