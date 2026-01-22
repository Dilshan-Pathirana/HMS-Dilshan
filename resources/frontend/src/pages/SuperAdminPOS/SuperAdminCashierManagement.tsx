import { useState, useEffect } from "react";
import axios from "axios";
import { 
    Users, Building2, Search, RefreshCw, 
    DollarSign, TrendingUp, CheckCircle, Clock,
    AlertCircle, XCircle, Calendar
} from "lucide-react";
import { useBranchContext } from "../../context/POS/BranchContext";
import BranchSelector from "../../components/pharmacyPOS/Common/BranchSelector";

interface Cashier {
    id: string;
    name: string;
    email: string;
    branch_id: string;
    branch_name: string;
    is_active: boolean;
    created_at: string;
    today_transactions: number;
    today_total: number;
    week_transactions: number;
    week_total: number;
    eod_completed: boolean;
    last_eod_date: string | null;
}

interface CashierSummary {
    total_cashiers: number;
    active_today: number;
    eod_completed: number;
    total_today_sales: number;
}

/**
 * Super Admin Cashier Management Page
 * 
 * View all cashiers across all branches with performance metrics:
 * - Filter by branch (uses shared BranchContext)
 * - View today's and weekly transaction data
 * - View EOD completion status
 */
const SuperAdminCashierManagement = () => {
    // Use shared branch context for branch filtering
    const { selectedBranch, getActiveBranchId } = useBranchContext();
    
    const [cashiers, setCashiers] = useState<Cashier[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [summary, setSummary] = useState<CashierSummary>({
        total_cashiers: 0,
        active_today: 0,
        eod_completed: 0,
        total_today_sales: 0
    });
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        loadCashiers();
    }, []);

    useEffect(() => {
        loadCashiers();
    }, [selectedBranch, selectedDate]);

    const loadCashiers = async () => {
        setIsLoading(true);
        setError("");
        try {
            let url = "/api/super-admin/pos/cashiers";
            const params = new URLSearchParams();
            const branchId = getActiveBranchId();
            if (branchId) params.append("branch_id", branchId);
            if (selectedDate) params.append("date", selectedDate);
            if (params.toString()) url += "?" + params.toString();

            const response = await axios.get(url, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            });

            const cashierData = response.data.cashiers || [];
            setCashiers(cashierData);

            // Calculate summary
            const activeCashiers = cashierData.filter((c: Cashier) => c.today_transactions > 0).length;
            const eodCompleted = cashierData.filter((c: Cashier) => c.eod_completed).length;
            const totalSales = cashierData.reduce((sum: number, c: Cashier) => sum + (c.today_total || 0), 0);

            setSummary({
                total_cashiers: cashierData.length,
                active_today: activeCashiers,
                eod_completed: eodCompleted,
                total_today_sales: totalSales
            });
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to load cashiers");
        } finally {
            setIsLoading(false);
        }
    };

    const filteredCashiers = cashiers.filter(cashier => {
        if (!searchTerm) return true;
        const search = searchTerm.toLowerCase();
        return cashier.name.toLowerCase().includes(search) ||
               cashier.email.toLowerCase().includes(search) ||
               cashier.branch_name.toLowerCase().includes(search);
    });

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800 flex items-center">
                    <Users className="w-8 h-8 mr-3 text-blue-600" />
                    Cashier Management
                </h1>
                <p className="text-gray-600 mt-1">View and manage cashiers across all branches</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-xl shadow-sm p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Total Cashiers</p>
                            <p className="text-2xl font-bold text-gray-800">{summary.total_cashiers}</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <Users className="w-6 h-6 text-blue-600" />
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Active Today</p>
                            <p className="text-2xl font-bold text-green-600">{summary.active_today}</p>
                        </div>
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                            <TrendingUp className="w-6 h-6 text-green-600" />
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">EOD Completed</p>
                            <p className="text-2xl font-bold text-purple-600">{summary.eod_completed}</p>
                        </div>
                        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-6 h-6 text-purple-600" />
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Today's Sales</p>
                            <p className="text-2xl font-bold text-blue-600">Rs. {summary.total_today_sales.toLocaleString()}</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <DollarSign className="w-6 h-6 text-blue-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search cashiers..."
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <BranchSelector showLabel={false} compact={false} />
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <button
                        onClick={loadCashiers}
                        disabled={isLoading}
                        className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
                    >
                        <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
                        <span>Refresh</span>
                    </button>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center text-red-700">
                    <AlertCircle className="w-5 h-5 mr-2" />
                    {error}
                </div>
            )}

            {/* Cashiers Table */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Cashier
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Branch
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Today's Transactions
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Today's Total
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Week Total
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                EOD Status
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {isLoading ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center">
                                    <RefreshCw className="w-8 h-8 mx-auto animate-spin text-gray-400" />
                                    <p className="mt-2 text-gray-500">Loading cashiers...</p>
                                </td>
                            </tr>
                        ) : filteredCashiers.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center">
                                    <Users className="w-12 h-12 mx-auto text-gray-300" />
                                    <p className="mt-2 text-gray-500">No cashiers found</p>
                                </td>
                            </tr>
                        ) : (
                            filteredCashiers.map(cashier => (
                                <tr key={cashier.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                                <span className="text-blue-600 font-semibold">
                                                    {cashier.name.charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                            <div className="ml-3">
                                                <p className="font-medium text-gray-900">{cashier.name}</p>
                                                <p className="text-sm text-gray-500">{cashier.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center text-gray-700">
                                            <Building2 className="w-4 h-4 mr-2 text-gray-400" />
                                            {cashier.branch_name}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
                                            cashier.today_transactions > 0 
                                                ? "bg-green-100 text-green-700" 
                                                : "bg-gray-100 text-gray-500"
                                        }`}>
                                            {cashier.today_transactions} txns
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <span className="font-semibold text-blue-600">
                                            Rs. {(cashier.today_total || 0).toLocaleString()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <div>
                                            <span className="font-medium text-gray-900">
                                                Rs. {(cashier.week_total || 0).toLocaleString()}
                                            </span>
                                            <p className="text-xs text-gray-500">{cashier.week_transactions} txns</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        {cashier.eod_completed ? (
                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-700">
                                                <CheckCircle className="w-4 h-4 mr-1" />
                                                Completed
                                            </span>
                                        ) : cashier.today_transactions > 0 ? (
                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-yellow-100 text-yellow-700">
                                                <Clock className="w-4 h-4 mr-1" />
                                                Pending
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-500">
                                                <XCircle className="w-4 h-4 mr-1" />
                                                No Activity
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default SuperAdminCashierManagement;
