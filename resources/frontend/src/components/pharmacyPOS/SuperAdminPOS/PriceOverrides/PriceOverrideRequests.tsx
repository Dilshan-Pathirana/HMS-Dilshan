import { useState, useEffect } from "react";
import axios from "axios";
import {
    DollarSign, Clock, Check, X, AlertTriangle,
    User, Package, Calendar, RefreshCw, Filter
} from "lucide-react";

interface PriceOverrideRequest {
    id: string;
    product_id: string;
    original_price: number;
    requested_price: number;
    min_allowed_price: number;
    quantity: number;
    reason: string;
    branch_id: string;
    requested_by: string;
    status: "pending" | "approved" | "denied" | "expired";
    approved_by?: string;
    approval_notes?: string;
    rejection_reason?: string;
    expires_at: string;
    created_at: string;
    product?: {
        id: string;
        item_name: string;
        item_code: string;
    };
    requester?: {
        id: string;
        first_name: string;
        last_name: string;
    };
}

const PriceOverrideRequests = () => {
    const [requests, setRequests] = useState<PriceOverrideRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedRequest, setSelectedRequest] = useState<PriceOverrideRequest | null>(null);
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [showDenyModal, setShowDenyModal] = useState(false);
    const [notes, setNotes] = useState("");
    const [rejectionReason, setRejectionReason] = useState("");
    const [filterStatus, setFilterStatus] = useState<string>("pending");

    useEffect(() => {
        fetchRequests();
        // Auto-refresh every 30 seconds for real-time updates
        const interval = setInterval(fetchRequests, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchRequests = async () => {
        try {
            setIsLoading(true);
            const token = localStorage.getItem("authToken");
            const response = await axios.get("/api/super-admin/enhanced-pos/price-overrides/pending", {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.data.success) {
                setRequests(response.data.data);
            }
        } catch (err) {
            console.error("Error fetching requests:", err);
            setError("Failed to load price override requests");
        } finally {
            setIsLoading(false);
        }
    };

    const handleApprove = async () => {
        if (!selectedRequest) return;

        try {
            const token = localStorage.getItem("authToken");
            await axios.post(
                `/api/super-admin/enhanced-pos/price-overrides/${selectedRequest.id}/approve`,
                { notes },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setShowApproveModal(false);
            setSelectedRequest(null);
            setNotes("");
            fetchRequests();
        } catch (err) {
            console.error("Error approving request:", err);
            setError("Failed to approve request");
        }
    };

    const handleDeny = async () => {
        if (!selectedRequest || !rejectionReason) return;

        try {
            const token = localStorage.getItem("authToken");
            await axios.post(
                `/api/super-admin/enhanced-pos/price-overrides/${selectedRequest.id}/deny`,
                { rejection_reason: rejectionReason },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setShowDenyModal(false);
            setSelectedRequest(null);
            setRejectionReason("");
            fetchRequests();
        } catch (err) {
            console.error("Error denying request:", err);
            setError("Failed to deny request");
        }
    };

    const getTimeRemaining = (expiresAt: string) => {
        const now = new Date();
        const expires = new Date(expiresAt);
        const diff = expires.getTime() - now.getTime();

        if (diff <= 0) return "Expired";

        const minutes = Math.floor(diff / 60000);
        if (minutes < 60) return `${minutes}m remaining`;
        
        const hours = Math.floor(minutes / 60);
        return `${hours}h ${minutes % 60}m remaining`;
    };

    const getPriceReduction = (original: number, requested: number) => {
        const reduction = original - requested;
        const percentage = (reduction / original) * 100;
        return {
            amount: reduction,
            percentage: percentage.toFixed(1),
        };
    };

    const filteredRequests = requests.filter(req => {
        if (!filterStatus || filterStatus === "all") return true;
        return req.status === filterStatus;
    });

    if (isLoading && requests.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <DollarSign className="w-7 h-7 text-orange-500" />
                        Price Override Requests
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Review and approve/deny price override requests from cashiers
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="denied">Denied</option>
                        <option value="all">All</option>
                    </select>
                    <button
                        onClick={fetchRequests}
                        className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        title="Refresh"
                    >
                        <RefreshCw className="w-5 h-5 text-gray-600" />
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-100 rounded-lg">
                            <Clock className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Pending</p>
                            <p className="text-xl font-bold text-orange-600">
                                {requests.filter(r => r.status === "pending").length}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <Check className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Approved Today</p>
                            <p className="text-xl font-bold text-green-600">
                                {requests.filter(r => r.status === "approved").length}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 rounded-lg">
                            <X className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Denied Today</p>
                            <p className="text-xl font-bold text-red-600">
                                {requests.filter(r => r.status === "denied").length}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-100 rounded-lg">
                            <AlertTriangle className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Expired</p>
                            <p className="text-xl font-bold text-gray-600">
                                {requests.filter(r => r.status === "expired").length}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Requests List */}
            <div className="space-y-4">
                {filteredRequests.length === 0 ? (
                    <div className="bg-white rounded-xl p-12 text-center">
                        <Check className="w-16 h-16 mx-auto text-green-300 mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900">No Pending Requests</h3>
                        <p className="text-gray-500 mt-2">All price override requests have been processed</p>
                    </div>
                ) : (
                    filteredRequests.map((request) => {
                        const reduction = getPriceReduction(request.original_price, request.requested_price);
                        const isPending = request.status === "pending";
                        
                        return (
                            <div 
                                key={request.id}
                                className={`bg-white rounded-xl p-5 shadow-sm border-2 transition-all ${
                                    isPending ? "border-orange-200 hover:border-orange-300" : "border-gray-100"
                                }`}
                            >
                                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                    {/* Left: Product & Request Info */}
                                    <div className="flex-1 space-y-3">
                                        <div className="flex items-start gap-3">
                                            <div className={`p-2 rounded-lg ${
                                                isPending ? "bg-orange-100" : 
                                                request.status === "approved" ? "bg-green-100" :
                                                "bg-red-100"
                                            }`}>
                                                <Package className={`w-5 h-5 ${
                                                    isPending ? "text-orange-600" : 
                                                    request.status === "approved" ? "text-green-600" :
                                                    "text-red-600"
                                                }`} />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-gray-900">
                                                    {request.product?.item_name || "Unknown Product"}
                                                </h3>
                                                <p className="text-sm text-gray-500">
                                                    Code: {request.product?.item_code} | Qty: {request.quantity}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Price Comparison */}
                                        <div className="flex items-center gap-4 bg-gray-50 p-3 rounded-lg">
                                            <div>
                                                <p className="text-xs text-gray-500">Original Price</p>
                                                <p className="font-semibold text-gray-900">
                                                    Rs. {request.original_price.toLocaleString()}
                                                </p>
                                            </div>
                                            <div className="text-2xl text-gray-400">→</div>
                                            <div>
                                                <p className="text-xs text-gray-500">Requested Price</p>
                                                <p className="font-semibold text-red-600">
                                                    Rs. {request.requested_price.toLocaleString()}
                                                </p>
                                            </div>
                                            <div className="ml-auto">
                                                <span className="px-2 py-1 bg-red-100 text-red-700 text-sm font-medium rounded-full">
                                                    -{reduction.percentage}% (Rs. {reduction.amount.toLocaleString()})
                                                </span>
                                            </div>
                                        </div>

                                        {/* Reason */}
                                        <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100">
                                            <p className="text-sm text-yellow-800">
                                                <strong>Reason:</strong> {request.reason}
                                            </p>
                                        </div>

                                        {/* Meta Info */}
                                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                                            <div className="flex items-center gap-1">
                                                <User className="w-4 h-4" />
                                                <span>
                                                    {request.requester?.first_name} {request.requester?.last_name}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Calendar className="w-4 h-4" />
                                                <span>{new Date(request.created_at).toLocaleString()}</span>
                                            </div>
                                            {isPending && (
                                                <div className={`flex items-center gap-1 ${
                                                    new Date(request.expires_at) < new Date() 
                                                        ? "text-red-600" 
                                                        : "text-orange-600"
                                                }`}>
                                                    <Clock className="w-4 h-4" />
                                                    <span>{getTimeRemaining(request.expires_at)}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Right: Actions */}
                                    {isPending && (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => {
                                                    setSelectedRequest(request);
                                                    setShowApproveModal(true);
                                                }}
                                                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                            >
                                                <Check className="w-4 h-4" />
                                                Approve
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setSelectedRequest(request);
                                                    setShowDenyModal(true);
                                                }}
                                                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                            >
                                                <X className="w-4 h-4" />
                                                Deny
                                            </button>
                                        </div>
                                    )}

                                    {/* Status Badge for non-pending */}
                                    {!isPending && (
                                        <div className={`px-4 py-2 rounded-lg text-sm font-medium ${
                                            request.status === "approved" 
                                                ? "bg-green-100 text-green-700" 
                                                : request.status === "denied"
                                                ? "bg-red-100 text-red-700"
                                                : "bg-gray-100 text-gray-700"
                                        }`}>
                                            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Approve Modal */}
            {showApproveModal && selectedRequest && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-md w-full">
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <Check className="w-6 h-6 text-green-600" />
                                Approve Price Override
                            </h2>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                                <p className="text-sm text-green-800">
                                    You are approving a price reduction of{" "}
                                    <strong>
                                        Rs. {(selectedRequest.original_price - selectedRequest.requested_price).toLocaleString()}
                                    </strong>{" "}
                                    for {selectedRequest.product?.item_name}
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Notes (optional)
                                </label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                    rows={3}
                                    placeholder="Add any notes about this approval..."
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => {
                                        setShowApproveModal(false);
                                        setSelectedRequest(null);
                                        setNotes("");
                                    }}
                                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleApprove}
                                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                >
                                    Approve Override
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Deny Modal */}
            {showDenyModal && selectedRequest && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-md w-full">
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <X className="w-6 h-6 text-red-600" />
                                Deny Price Override
                            </h2>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                                <p className="text-sm text-red-800">
                                    You are denying the price override request for{" "}
                                    <strong>{selectedRequest.product?.item_name}</strong>
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Reason for Denial *
                                </label>
                                <textarea
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                    rows={3}
                                    placeholder="Explain why this request is being denied..."
                                    required
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => {
                                        setShowDenyModal(false);
                                        setSelectedRequest(null);
                                        setRejectionReason("");
                                    }}
                                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDeny}
                                    disabled={!rejectionReason.trim()}
                                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Deny Request
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PriceOverrideRequests;
