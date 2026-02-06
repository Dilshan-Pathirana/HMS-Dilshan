import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../utils/api/axios";
import { 
    ArrowLeft, TrendingUp, TrendingDown, Plus, 
    AlertCircle, CheckCircle, Clock, DollarSign, Building2, Wallet
} from "lucide-react";
import { usePOSApi } from "../../hooks/usePOSApi";

interface CashEntry {
    id: string;
    entry_type: string;
    category: string;
    amount: number;
    description: string;
    reference_number: string | null;
    approval_status: string;
    created_at: string;
}

const CashierCashEntries = () => {
    const navigate = useNavigate();
    const posApi = usePOSApi();
    const [showForm, setShowForm] = useState(false);
    const [entryType, setEntryType] = useState("CASH_OUT");
    const [category, setCategory] = useState("");
    const [amount, setAmount] = useState("");
    const [description, setDescription] = useState("");
    const [referenceNumber, setReferenceNumber] = useState("");
    const [remarks, setRemarks] = useState("");
    const [entries, setEntries] = useState<CashEntry[]>([]);
    const [cashSummary, setCashSummary] = useState({ cash_in_total: 0, cash_out_total: 0, net_cash: 0 });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [isEodLocked, setIsEodLocked] = useState(false);

    const cashOutCategories = [
        { value: "PETTY_CASH", label: "Petty Cash" },
        { value: "COURIER", label: "Courier/Delivery" },
        { value: "EMERGENCY_PURCHASE", label: "Emergency Purchase" },
    ];

    const cashInCategories = [
        { value: "ADVANCE_PAYMENT", label: "Advance Payment" },
        { value: "MISC_COLLECTION", label: "Miscellaneous Collection" },
        { value: "ADJUSTMENT", label: "Adjustment" },
    ];

    useEffect(() => {
        checkEodStatus();
        fetchEntries();
        fetchCashSummary();
    }, []);

    const checkEodStatus = async () => {
        try {
            const token = localStorage.getItem("token") || localStorage.getItem("authToken");
            const response = await api.get(
                posApi.dashboardStats,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (response.data.status === 200) {
                setIsEodLocked(response.data.data.is_eod_locked);
            }
        } catch (err) {
            console.error("Error checking EOD status:", err);
        }
    };

    const fetchEntries = async () => {
        try {
            const token = localStorage.getItem("token") || localStorage.getItem("authToken");
            const response = await api.get(
                posApi.cashEntries,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (response.data.status === 200) {
                setEntries(response.data.data);
            }
        } catch (err) {
            console.error("Error fetching entries:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchCashSummary = async () => {
        try {
            const token = localStorage.getItem("token") || localStorage.getItem("authToken");
            const response = await api.get(
                posApi.cashSummary,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (response.data.status === 200) {
                setCashSummary(response.data.data);
            }
        } catch (err) {
            console.error("Error fetching summary:", err);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (!category) {
            setError("Please select a category");
            return;
        }

        try {
            setIsSubmitting(true);
            const token = localStorage.getItem("token") || localStorage.getItem("authToken");
            
            const response = await api.post(
                posApi.cashEntries,
                {
                    entry_type: entryType,
                    category: category,
                    amount: parseFloat(amount),
                    description: description,
                    reference_number: referenceNumber || null,
                    remarks: remarks || null,
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.status === 201) {
                setSuccess("Cash entry created successfully!");
                // Reset form
                setCategory("");
                setAmount("");
                setDescription("");
                setReferenceNumber("");
                setRemarks("");
                setShowForm(false);
                // Refresh data
                fetchEntries();
                fetchCashSummary();
                setTimeout(() => setSuccess(""), 3000);
            }
        } catch (err: any) {
            console.error("Error creating entry:", err);
            if (err.response?.data?.errors) {
                const errors = err.response.data.errors;
                setError(Object.values(errors).flat().join(", "));
            } else {
                setError(err.response?.data?.message || "Failed to create cash entry");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const badges = {
            PENDING: { bg: "bg-yellow-100", text: "text-yellow-800", icon: Clock, label: "Pending" },
            APPROVED: { bg: "bg-green-100", text: "text-green-800", icon: CheckCircle, label: "Approved" },
            REJECTED: { bg: "bg-error-100", text: "text-red-800", icon: AlertCircle, label: "Rejected" },
        };
        const badge = badges[status as keyof typeof badges] || badges.PENDING;
        const Icon = badge.icon;
        
        return (
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
                <Icon className="h-3 w-3" />
                {badge.label}
            </span>
        );
    };

    return (
        <div className="p-6 space-y-6 bg-neutral-50 min-h-screen">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate("/pos")}
                            className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </button>
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                                <Wallet className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold">Cash Entries</h1>
                                <p className="text-emerald-100 text-sm">Manage cash in/out transactions</p>
                            </div>
                        </div>
                    </div>
                    {!isEodLocked && !showForm && (
                        <button
                            onClick={() => setShowForm(true)}
                            className="bg-white/20 text-white px-6 py-3 rounded-lg hover:bg-white/30 transition flex items-center gap-2 backdrop-blur-sm"
                        >
                            <Plus className="h-5 w-5" />
                            <span className="font-medium">Add Cash Entry</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Alerts */}
            {error && (
                <div className="bg-error-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-error-500" />
                    <p className="text-sm text-red-700">{error}</p>
                </div>
            )}

            {success && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <p className="text-sm text-green-700">{success}</p>
                </div>
            )}

            {isEodLocked && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                    <p className="text-sm text-yellow-700">
                        EOD is locked. No new cash entries can be added.
                    </p>
                </div>
            )}

            {/* Cash Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl shadow-md border border-neutral-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
                            <TrendingUp className="h-6 w-6 text-white" />
                        </div>
                    </div>
                    <p className="text-sm text-neutral-600 mb-1">Cash In</p>
                    <p className="text-3xl font-bold text-neutral-800">
                        Rs. {(cashSummary?.cash_in_total || 0).toLocaleString()}
                    </p>
                </div>

                <div className="bg-white rounded-xl shadow-md border border-neutral-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-gradient-to-br from-red-500 to-pink-600 rounded-lg">
                            <TrendingDown className="h-6 w-6 text-white" />
                        </div>
                    </div>
                    <p className="text-sm text-neutral-600 mb-1">Cash Out</p>
                    <p className="text-3xl font-bold text-neutral-800">
                        Rs. {(cashSummary?.cash_out_total || 0).toLocaleString()}
                    </p>
                </div>

                <div className="bg-white rounded-xl shadow-md border border-neutral-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg">
                            <DollarSign className="h-6 w-6 text-white" />
                        </div>
                    </div>
                    <p className="text-sm text-neutral-600 mb-1">Net Cash</p>
                    <p className={`text-3xl font-bold ${
                        (cashSummary?.net_cash || 0) >= 0 ? "text-green-600" : "text-error-600"
                    }`}>
                        Rs. {(cashSummary?.net_cash || 0).toLocaleString()}
                    </p>
                </div>
            </div>

            {/* Add Entry Form */}
            {showForm && (
                <div className="bg-white rounded-xl shadow-md border border-neutral-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-neutral-800">Add New Cash Entry</h2>
                        <button
                            onClick={() => setShowForm(false)}
                            className="text-neutral-500 hover:text-neutral-700 p-2 hover:bg-neutral-100 rounded-lg"
                        >
                            ✕
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Entry Type */}
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2">
                                Entry Type *
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setEntryType("CASH_OUT");
                                        setCategory("");
                                    }}
                                    className={`p-4 rounded-lg border-2 transition ${
                                        entryType === "CASH_OUT"
                                            ? "border-error-500 bg-gradient-to-br from-red-50 to-pink-50"
                                            : "border-neutral-200 hover:border-neutral-300"
                                    }`}
                                >
                                    <div className={`p-2 rounded-lg mx-auto w-fit mb-2 ${entryType === "CASH_OUT" ? "bg-gradient-to-br from-red-500 to-pink-600" : "bg-neutral-100"}`}>
                                        <TrendingDown className={`h-5 w-5 ${entryType === "CASH_OUT" ? "text-white" : "text-neutral-600"}`} />
                                    </div>
                                    <span className={`font-medium ${entryType === "CASH_OUT" ? "text-red-700" : ""}`}>Cash Out</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setEntryType("CASH_IN");
                                        setCategory("");
                                    }}
                                    className={`p-4 rounded-lg border-2 transition ${
                                        entryType === "CASH_IN"
                                            ? "border-emerald-500 bg-gradient-to-br from-emerald-50 to-green-50"
                                            : "border-neutral-200 hover:border-neutral-300"
                                    }`}
                                >
                                    <div className={`p-2 rounded-lg mx-auto w-fit mb-2 ${entryType === "CASH_IN" ? "bg-gradient-to-br from-green-500 to-emerald-600" : "bg-neutral-100"}`}>
                                        <TrendingUp className={`h-5 w-5 ${entryType === "CASH_IN" ? "text-white" : "text-neutral-600"}`} />
                                    </div>
                                    <span className={`font-medium ${entryType === "CASH_IN" ? "text-emerald-700" : ""}`}>Cash In</span>
                                </button>
                            </div>
                        </div>

                        {/* Category */}
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2">
                                Category *
                            </label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                required
                            >
                                <option value="">Select category</option>
                                {(entryType === "CASH_OUT" ? cashOutCategories : cashInCategories).map((cat) => (
                                    <option key={cat.value} value={cat.value}>
                                        {cat.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Amount & Reference */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-2">
                                    Amount *
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                    placeholder="0.00"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-2">
                                    Reference Number
                                </label>
                                <input
                                    type="text"
                                    value={referenceNumber}
                                    onChange={(e) => setReferenceNumber(e.target.value)}
                                    className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                    placeholder="e.g., REF-001"
                                />
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2">
                                Description *
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={3}
                                className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                placeholder="Provide details about this cash entry..."
                                required
                            />
                        </div>

                        {/* Remarks */}
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2">
                                Remarks (Optional)
                            </label>
                            <input
                                type="text"
                                value={remarks}
                                onChange={(e) => setRemarks(e.target.value)}
                                className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                placeholder="Additional notes..."
                            />
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-3">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex-1 bg-gradient-to-r from-emerald-500 to-blue-600 text-white py-3 rounded-lg hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? "Submitting..." : "Submit Entry"}
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowForm(false)}
                                className="px-6 bg-neutral-100 text-neutral-700 py-3 rounded-lg hover:bg-neutral-200 transition border border-neutral-200"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Entries List */}
            <div className="bg-white rounded-xl shadow-md border border-neutral-200 overflow-hidden">
                <div className="p-6 border-b border-neutral-200">
                    <h2 className="text-lg font-semibold text-neutral-800">Today's Cash Entries</h2>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                    </div>
                ) : entries.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gradient-to-r from-emerald-50 to-blue-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase">Type</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase">Category</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase">Description</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-neutral-700 uppercase">Amount</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-neutral-700 uppercase">Status</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-neutral-700 uppercase">Time</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {entries.map((entry) => (
                                    <tr key={entry.id} className="hover:bg-neutral-50">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                {entry.entry_type === "CASH_IN" ? (
                                                    <div className="p-1 bg-gradient-to-br from-green-500 to-emerald-600 rounded">
                                                        <TrendingUp className="h-3 w-3 text-white" />
                                                    </div>
                                                ) : (
                                                    <div className="p-1 bg-gradient-to-br from-red-500 to-pink-600 rounded">
                                                        <TrendingDown className="h-3 w-3 text-white" />
                                                    </div>
                                                )}
                                                <span className={`text-sm font-medium ${
                                                    entry.entry_type === "CASH_IN" ? "text-emerald-700" : "text-red-700"
                                                }`}>
                                                    {entry.entry_type === "CASH_IN" ? "Cash In" : "Cash Out"}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-neutral-900">
                                            {entry.category.replace(/_/g, " ")}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-neutral-700 max-w-xs truncate">
                                            {entry.description}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-right font-semibold text-neutral-900">
                                            Rs. {entry.amount.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {getStatusBadge(entry.approval_status)}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-neutral-500 text-center">
                                            {new Date(entry.created_at).toLocaleTimeString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <div className="p-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full w-fit mx-auto mb-4">
                            <DollarSign className="h-8 w-8 text-neutral-500" />
                        </div>
                        <p className="text-neutral-500">No cash entries for today</p>
                        {!isEodLocked && (
                            <button
                                onClick={() => setShowForm(true)}
                                className="mt-4 text-emerald-600 hover:text-emerald-700 font-medium"
                            >
                                Add your first entry
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CashierCashEntries;
