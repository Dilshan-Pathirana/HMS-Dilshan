import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../utils/api/axios";
import { 
    ArrowLeft, CheckCircle, AlertTriangle, Clock, XCircle,
    DollarSign, RefreshCw, Send, MessageSquare,
    Calendar, User, FileText, Eye, Check, X
} from "lucide-react";

interface CashierEOD {
    id: string;
    cashier_id: string;
    cashier_name: string;
    cashier_email: string;
    summary_date: string;
    total_transactions: number;
    total_sales: number;
    cash_total: number;
    card_total: number;
    online_total: number;
    qr_total: number;
    cash_in_total: number;
    cash_out_total: number;
    expected_cash_balance: number;
    actual_cash_counted: number;
    cash_variance: number;
    variance_remarks: string | null;
    eod_status: string;
    submitted_at: string | null;
    approved_at: string | null;
    rejection_reason: string | null;
}

interface EODStats {
    total_cashiers: number;
    pending_eods: number;
    approved_eods: number;
    rejected_eods: number;
    total_sales_today: number;
}

const BranchAdminEODManagement = () => {
    const navigate = useNavigate();
    const [eodList, setEodList] = useState<CashierEOD[]>([]);
    const [stats, setStats] = useState<EODStats>({
        total_cashiers: 0,
        pending_eods: 0,
        approved_eods: 0,
        rejected_eods: 0,
        total_sales_today: 0
    });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [activeTab, setActiveTab] = useState<"pending" | "approved" | "all">("pending");
    
    // Modal states
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [selectedEOD, setSelectedEOD] = useState<CashierEOD | null>(null);
    const [rejectionReason, setRejectionReason] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        fetchEODList();
    }, [selectedDate]);

    const fetchEODList = async () => {
        setIsLoading(true);
        setError("");
        try {
            const token = localStorage.getItem("token") || localStorage.getItem("authToken");
            const response = await api.get(
                `/api/branch-admin/pos/eod-requests?date=${selectedDate}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.status === 200) {
                setEodList(response.data.data.eod_list || []);
                setStats(response.data.data.stats || {
                    total_cashiers: 0,
                    pending_eods: 0,
                    approved_eods: 0,
                    rejected_eods: 0,
                    total_sales_today: 0
                });
            }
        } catch (err: any) {
            console.error("Error fetching EOD list:", err);
            setError(err.response?.data?.message || "Failed to load EOD requests");
        } finally {
            setIsLoading(false);
        }
    };

    const handleApprove = async (eodId: string) => {
        setIsProcessing(true);
        try {
            const token = localStorage.getItem("token") || localStorage.getItem("authToken");
            const response = await api.post(
                `/api/branch-admin/pos/eod-requests/${eodId}/approve`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.status === 200) {
                setSuccess("EOD approved successfully!");
                fetchEODList();
                setTimeout(() => setSuccess(""), 3000);
            }
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to approve EOD");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleReject = async () => {
        if (!selectedEOD || !rejectionReason.trim()) {
            setError("Please provide a reason for rejection");
            return;
        }

        setIsProcessing(true);
        try {
            const token = localStorage.getItem("token") || localStorage.getItem("authToken");
            const response = await api.post(
                `/api/branch-admin/pos/eod-requests/${selectedEOD.id}/reject`,
                { rejection_reason: rejectionReason },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.status === 200) {
                setSuccess("EOD rejected and sent back to cashier for revision.");
                setShowRejectModal(false);
                setRejectionReason("");
                setSelectedEOD(null);
                fetchEODList();
                setTimeout(() => setSuccess(""), 3000);
            }
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to reject EOD");
        } finally {
            setIsProcessing(false);
        }
    };

    const openRejectModal = (eod: CashierEOD) => {
        setSelectedEOD(eod);
        setRejectionReason("");
        setShowRejectModal(true);
    };

    const openDetailsModal = (eod: CashierEOD) => {
        setSelectedEOD(eod);
        setShowDetailsModal(true);
    };

    const getStatusBadge = (status: string) => {
        const badges: { [key: string]: { bg: string; text: string; icon: any; label: string } } = {
            PENDING: { bg: "bg-yellow-100", text: "text-yellow-800", icon: Clock, label: "Pending Review" },
            SUBMITTED: { bg: "bg-blue-100", text: "text-blue-800", icon: Send, label: "Submitted" },
            APPROVED: { bg: "bg-green-100", text: "text-green-800", icon: CheckCircle, label: "Approved" },
            CLOSED: { bg: "bg-green-100", text: "text-green-800", icon: CheckCircle, label: "Closed" },
            REJECTED: { bg: "bg-error-100", text: "text-red-800", icon: XCircle, label: "Needs Revision" },
            OPEN: { bg: "bg-neutral-100", text: "text-neutral-600", icon: Clock, label: "Open" },
        };
        const badge = badges[status] || badges.OPEN;
        const Icon = badge.icon;

        return (
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
                <Icon className="w-3 h-3" />
                {badge.label}
            </span>
        );
    };

    const filteredEODs = eodList.filter(eod => {
        if (activeTab === "pending") return ["PENDING", "SUBMITTED"].includes(eod.eod_status);
        if (activeTab === "approved") return ["APPROVED", "CLOSED"].includes(eod.eod_status);
        return true;
    });

    return (
        <div className="p-6 bg-neutral-50 min-h-screen">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-700 rounded-xl shadow-lg p-6 text-white mb-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate("/pos")}
                            className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold">EOD Management</h1>
                            <p className="text-purple-100 text-sm">Review and approve cashier End of Day submissions</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-white/20 rounded-lg px-3 py-2">
                            <Calendar className="w-4 h-4" />
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="bg-transparent border-none text-white focus:outline-none"
                            />
                        </div>
                        <button
                            onClick={fetchEODList}
                            disabled={isLoading}
                            className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition"
                        >
                            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-neutral-500">Total Cashiers</p>
                            <p className="text-2xl font-bold text-neutral-800">{stats.total_cashiers}</p>
                        </div>
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-primary-500" />
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-neutral-500">Pending Review</p>
                            <p className="text-2xl font-bold text-yellow-600">{stats.pending_eods}</p>
                        </div>
                        <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                            <Clock className="w-5 h-5 text-yellow-600" />
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-neutral-500">Approved</p>
                            <p className="text-2xl font-bold text-green-600">{stats.approved_eods}</p>
                        </div>
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-neutral-500">Needs Revision</p>
                            <p className="text-2xl font-bold text-error-600">{stats.rejected_eods}</p>
                        </div>
                        <div className="w-10 h-10 bg-error-100 rounded-full flex items-center justify-center">
                            <XCircle className="w-5 h-5 text-error-600" />
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-neutral-500">Today's Sales</p>
                            <p className="text-xl font-bold text-primary-500">Rs. {stats.total_sales_today.toLocaleString()}</p>
                        </div>
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <DollarSign className="w-5 h-5 text-primary-500" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Alerts */}
            {error && (
                <div className="mb-4 p-4 bg-error-50 border border-red-200 rounded-xl flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-error-500" />
                    <p className="text-red-700">{error}</p>
                    <button onClick={() => setError("")} className="ml-auto text-error-500 hover:text-red-700">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {success && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <p className="text-green-700">{success}</p>
                </div>
            )}

            {/* Tabs */}
            <div className="bg-white rounded-t-xl shadow-sm border-b mb-0">
                <div className="flex">
                    <button
                        onClick={() => setActiveTab("pending")}
                        className={`px-6 py-4 font-medium transition-all border-b-2 ${
                            activeTab === "pending"
                                ? "text-purple-600 border-purple-600"
                                : "text-neutral-500 border-transparent hover:text-neutral-700"
                        }`}
                    >
                        <Clock className="w-4 h-4 inline-block mr-2" />
                        Pending Review ({stats.pending_eods})
                    </button>
                    <button
                        onClick={() => setActiveTab("approved")}
                        className={`px-6 py-4 font-medium transition-all border-b-2 ${
                            activeTab === "approved"
                                ? "text-purple-600 border-purple-600"
                                : "text-neutral-500 border-transparent hover:text-neutral-700"
                        }`}
                    >
                        <CheckCircle className="w-4 h-4 inline-block mr-2" />
                        Approved ({stats.approved_eods})
                    </button>
                    <button
                        onClick={() => setActiveTab("all")}
                        className={`px-6 py-4 font-medium transition-all border-b-2 ${
                            activeTab === "all"
                                ? "text-purple-600 border-purple-600"
                                : "text-neutral-500 border-transparent hover:text-neutral-700"
                        }`}
                    >
                        <FileText className="w-4 h-4 inline-block mr-2" />
                        All EODs
                    </button>
                </div>
            </div>

            {/* EOD List */}
            <div className="bg-white rounded-b-xl shadow-sm overflow-hidden">
                {isLoading ? (
                    <div className="p-12 text-center">
                        <RefreshCw className="w-8 h-8 mx-auto animate-spin text-neutral-400" />
                        <p className="mt-2 text-neutral-500">Loading EOD requests...</p>
                    </div>
                ) : filteredEODs.length === 0 ? (
                    <div className="p-12 text-center">
                        <FileText className="w-12 h-12 mx-auto text-gray-300" />
                        <p className="mt-2 text-neutral-500">No EOD submissions found for this date</p>
                    </div>
                ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-neutral-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Cashier</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-neutral-500 uppercase">Transactions</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-neutral-500 uppercase">Total Sales</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-neutral-500 uppercase">Cash Variance</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-neutral-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-neutral-500 uppercase">Submitted</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-neutral-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredEODs.map((eod) => (
                                <tr key={eod.id} className="hover:bg-neutral-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                                                <span className="text-purple-600 font-semibold">
                                                    {(eod.cashier_name || 'U').charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                            <div className="ml-3">
                                                <p className="font-medium text-neutral-900">{eod.cashier_name || 'Unknown'}</p>
                                                <p className="text-sm text-neutral-500">{eod.cashier_email || 'N/A'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <span className="font-medium text-neutral-800">{eod.total_transactions}</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <span className="font-semibold text-primary-500">
                                            Rs. {(eod.total_sales || 0).toLocaleString()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <span className={`font-medium ${
                                            eod.cash_variance === 0 ? 'text-green-600' :
                                            eod.cash_variance > 0 ? 'text-primary-500' : 'text-error-600'
                                        }`}>
                                            {eod.cash_variance > 0 ? '+' : ''}{(eod.cash_variance || 0).toLocaleString()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        {getStatusBadge(eod.eod_status)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-neutral-500">
                                        {eod.submitted_at ? new Date(eod.submitted_at).toLocaleTimeString() : '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <button
                                                onClick={() => openDetailsModal(eod)}
                                                className="p-2 text-neutral-600 hover:bg-neutral-100 rounded-lg transition"
                                                title="View Details"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            {["PENDING", "SUBMITTED"].includes(eod.eod_status) && (
                                                <>
                                                    <button
                                                        onClick={() => handleApprove(eod.id)}
                                                        disabled={isProcessing}
                                                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                                                        title="Approve"
                                                    >
                                                        <Check className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => openRejectModal(eod)}
                                                        disabled={isProcessing}
                                                        className="p-2 text-error-600 hover:bg-error-50 rounded-lg transition"
                                                        title="Request Revision"
                                                    >
                                                        <MessageSquare className="w-4 h-4" />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Details Modal */}
            {showDetailsModal && selectedEOD && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-100">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold text-neutral-800">EOD Details</h2>
                                <button
                                    onClick={() => setShowDetailsModal(false)}
                                    className="p-2 hover:bg-neutral-100 rounded-lg"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        <div className="p-6 space-y-6">
                            {/* Cashier Info */}
                            <div className="flex items-center gap-4 p-4 bg-neutral-50 rounded-xl">
                                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                                    <span className="text-purple-600 font-bold text-lg">
                                        {(selectedEOD.cashier_name || 'U').charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <div>
                                    <p className="font-semibold text-neutral-800">{selectedEOD.cashier_name}</p>
                                    <p className="text-sm text-neutral-500">{selectedEOD.cashier_email}</p>
                                </div>
                                <div className="ml-auto">
                                    {getStatusBadge(selectedEOD.eod_status)}
                                </div>
                            </div>

                            {/* Sales Summary */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-blue-50 rounded-xl">
                                    <p className="text-sm text-primary-500">Total Sales</p>
                                    <p className="text-2xl font-bold text-blue-700">Rs. {selectedEOD.total_sales.toLocaleString()}</p>
                                </div>
                                <div className="p-4 bg-green-50 rounded-xl">
                                    <p className="text-sm text-green-600">Transactions</p>
                                    <p className="text-2xl font-bold text-green-700">{selectedEOD.total_transactions}</p>
                                </div>
                            </div>

                            {/* Payment Breakdown */}
                            <div>
                                <h3 className="font-semibold text-neutral-800 mb-3">Payment Breakdown</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="flex justify-between p-3 bg-neutral-50 rounded-lg">
                                        <span className="text-neutral-600">Cash</span>
                                        <span className="font-medium">Rs. {(selectedEOD.cash_total || 0).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between p-3 bg-neutral-50 rounded-lg">
                                        <span className="text-neutral-600">Card</span>
                                        <span className="font-medium">Rs. {(selectedEOD.card_total || 0).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between p-3 bg-neutral-50 rounded-lg">
                                        <span className="text-neutral-600">Online</span>
                                        <span className="font-medium">Rs. {(selectedEOD.online_total || 0).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between p-3 bg-neutral-50 rounded-lg">
                                        <span className="text-neutral-600">QR</span>
                                        <span className="font-medium">Rs. {(selectedEOD.qr_total || 0).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Cash Reconciliation */}
                            <div>
                                <h3 className="font-semibold text-neutral-800 mb-3">Cash Reconciliation</h3>
                                <div className="space-y-2">
                                    <div className="flex justify-between p-3 bg-neutral-50 rounded-lg">
                                        <span className="text-neutral-600">Cash In</span>
                                        <span className="font-medium text-green-600">+Rs. {(selectedEOD.cash_in_total || 0).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between p-3 bg-neutral-50 rounded-lg">
                                        <span className="text-neutral-600">Cash Out</span>
                                        <span className="font-medium text-error-600">-Rs. {(selectedEOD.cash_out_total || 0).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between p-3 bg-blue-50 rounded-lg">
                                        <span className="text-blue-700">Expected Balance</span>
                                        <span className="font-bold text-blue-700">Rs. {(selectedEOD.expected_cash_balance || 0).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between p-3 bg-purple-50 rounded-lg">
                                        <span className="text-purple-700">Actual Cash Counted</span>
                                        <span className="font-bold text-purple-700">Rs. {(selectedEOD.actual_cash_counted || 0).toLocaleString()}</span>
                                    </div>
                                    <div className={`flex justify-between p-3 rounded-lg ${
                                        selectedEOD.cash_variance === 0 ? 'bg-green-50' :
                                        selectedEOD.cash_variance > 0 ? 'bg-blue-50' : 'bg-error-50'
                                    }`}>
                                        <span className={`font-medium ${
                                            selectedEOD.cash_variance === 0 ? 'text-green-700' :
                                            selectedEOD.cash_variance > 0 ? 'text-blue-700' : 'text-red-700'
                                        }`}>Variance</span>
                                        <span className={`font-bold ${
                                            selectedEOD.cash_variance === 0 ? 'text-green-700' :
                                            selectedEOD.cash_variance > 0 ? 'text-blue-700' : 'text-red-700'
                                        }`}>
                                            {selectedEOD.cash_variance > 0 ? '+' : ''}Rs. {(selectedEOD.cash_variance || 0).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Variance Remarks */}
                            {selectedEOD.variance_remarks && (
                                <div>
                                    <h3 className="font-semibold text-neutral-800 mb-2">Variance Remarks</h3>
                                    <p className="p-3 bg-yellow-50 rounded-lg text-yellow-800">{selectedEOD.variance_remarks}</p>
                                </div>
                            )}

                            {/* Rejection Reason */}
                            {selectedEOD.rejection_reason && (
                                <div>
                                    <h3 className="font-semibold text-red-700 mb-2">Revision Required</h3>
                                    <p className="p-3 bg-error-50 rounded-lg text-red-700">{selectedEOD.rejection_reason}</p>
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        {["PENDING", "SUBMITTED"].includes(selectedEOD.eod_status) && (
                            <div className="p-6 border-t border-gray-100 flex gap-3">
                                <button
                                    onClick={() => {
                                        setShowDetailsModal(false);
                                        openRejectModal(selectedEOD);
                                    }}
                                    className="flex-1 py-3 px-4 border border-red-300 text-error-600 rounded-xl hover:bg-error-50 transition font-medium"
                                >
                                    Request Revision
                                </button>
                                <button
                                    onClick={() => {
                                        handleApprove(selectedEOD.id);
                                        setShowDetailsModal(false);
                                    }}
                                    disabled={isProcessing}
                                    className="flex-1 py-3 px-4 bg-green-600 text-white rounded-xl hover:bg-green-700 transition font-medium"
                                >
                                    Approve EOD
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Reject Modal */}
            {showRejectModal && selectedEOD && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4">
                        <div className="p-6 border-b border-gray-100">
                            <h2 className="text-xl font-bold text-neutral-800">Request Revision</h2>
                            <p className="text-sm text-neutral-500 mt-1">
                                Send this EOD back to {selectedEOD.cashier_name} for corrections
                            </p>
                        </div>
                        <div className="p-6">
                            <label className="block text-sm font-medium text-neutral-700 mb-2">
                                Reason for Revision *
                            </label>
                            <textarea
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                rows={4}
                                className="w-full p-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                                placeholder="Please explain what needs to be corrected..."
                            />
                        </div>
                        <div className="p-6 border-t border-gray-100 flex gap-3">
                            <button
                                onClick={() => {
                                    setShowRejectModal(false);
                                    setRejectionReason("");
                                }}
                                className="flex-1 py-3 px-4 border border-neutral-300 text-neutral-700 rounded-xl hover:bg-neutral-50 transition font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleReject}
                                disabled={isProcessing || !rejectionReason.trim()}
                                className="flex-1 py-3 px-4 bg-red-600 text-white rounded-xl hover:bg-red-700 transition font-medium disabled:bg-neutral-300"
                            >
                                {isProcessing ? "Sending..." : "Send for Revision"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BranchAdminEODManagement;
