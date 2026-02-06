import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../utils/api/axios";
import { 
    DollarSign, ShoppingCart, TrendingUp, AlertCircle, 
    FileText, PlusCircle, CheckCircle, Clock, Building2,
    CreditCard, Smartphone, QrCode, User, MapPin, Phone, BarChart3
} from "lucide-react";

interface DashboardStats {
    branch: {
        id: string;
        name: string;
        type: string;
    };
    cashier: {
        id: string;
        name: string;
    };
    today_stats: {
        date: string;
        total_sales: number;
        transaction_count: number;
        cash_in: number;
        cash_out: number;
    };
    payment_breakdown: {
        cash: number;
        card: number;
        online: number;
        qr: number;
    };
    eod_status: string;
    is_eod_locked: boolean;
}

const CashierBillingDashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchDashboardStats();
    }, []);

    const fetchDashboardStats = async () => {
        try {
            setIsLoading(true);
            const token = localStorage.getItem("authToken");
            const response = await api.get(
                "/api/cashier-billing/dashboard-stats",
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (response.data.status === 200) {
                setStats(response.data.data);
            }
        } catch (err) {
            console.error("Error fetching dashboard stats:", err);
            setError("Failed to load dashboard data");
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-neutral-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
            </div>
        );
    }

    if (error || !stats) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-neutral-50">
                <div className="text-center">
                    <AlertCircle className="mx-auto h-12 w-12 text-error-500 mb-4" />
                    <p className="text-neutral-600">{error || "Failed to load dashboard"}</p>
                </div>
            </div>
        );
    }

    const { today_stats, payment_breakdown, eod_status, is_eod_locked } = stats;

    const quickActions = [
        { id: 'new-sale', label: 'New Transaction', icon: <ShoppingCart className="w-6 h-6" />, color: 'from-blue-500 to-cyan-600', path: '/pos/pos', disabled: is_eod_locked },
        { id: 'cash-entry', label: 'Cash Entry', icon: <PlusCircle className="w-6 h-6" />, color: 'from-green-500 to-emerald-600', path: '/pos/cash-entries', disabled: is_eod_locked },
        { id: 'transactions', label: 'Transactions', icon: <FileText className="w-6 h-6" />, color: 'from-purple-500 to-pink-600', path: '/pos/transactions', disabled: false },
        { id: 'reports', label: 'Reports', icon: <BarChart3 className="w-6 h-6" />, color: 'from-indigo-500 to-violet-600', path: '/pos/reports', disabled: false },
        { id: 'eod', label: is_eod_locked ? 'EOD Locked' : 'End of Day', icon: <Clock className="w-6 h-6" />, color: 'from-orange-500 to-red-600', path: '/pos/eod', disabled: is_eod_locked },
    ];

    return (
        <div className="p-6 space-y-6 bg-neutral-50 min-h-screen">
            {/* Branch Info Header */}
            <div className="bg-gradient-to-r from-emerald-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
                <div className="flex items-start justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                            <Building2 className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold">{stats.branch.name}</h2>
                            <div className="flex items-center gap-4 mt-2 text-emerald-100 flex-wrap">
                                <span className="flex items-center gap-1">
                                    <MapPin className="w-4 h-4" />
                                    {stats.branch.type || 'Branch'}
                                </span>
                                <span className="text-white/70">|</span>
                                <span className="flex items-center gap-1">
                                    <User className="w-4 h-4" />
                                    {stats.cashier.name}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-emerald-100 text-sm">
                            {new Date(today_stats.date).toLocaleDateString('en-US', { 
                                weekday: 'long', 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                            })}
                        </p>
                        <div className={`mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                            eod_status === 'OPEN' ? 'bg-green-400/30 text-green-100' :
                            eod_status === 'SUBMITTED' ? 'bg-yellow-400/30 text-yellow-100' :
                            'bg-gray-400/30 text-gray-100'
                        }`}>
                            {eod_status === 'OPEN' ? <CheckCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                            {eod_status}
                        </div>
                    </div>
                </div>
            </div>

            {/* EOD Status Alert */}
            {is_eod_locked && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                    <p className="text-sm text-yellow-700">
                        Today's End of Day (EOD) has been submitted and locked. No new transactions can be added.
                    </p>
                </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-xl shadow-md border border-neutral-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg">
                            <DollarSign className="w-6 h-6 text-white" />
                        </div>
                        <TrendingUp className="w-5 h-5 text-green-600" />
                    </div>
                    <p className="text-sm text-neutral-600 mb-1">Total Sales</p>
                    <p className="text-3xl font-bold text-neutral-800">Rs. {today_stats.total_sales.toLocaleString()}</p>
                    <p className="text-xs text-green-600 mt-2">{today_stats.transaction_count} transactions</p>
                </div>

                <div className="bg-white rounded-xl shadow-md border border-neutral-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
                            <ShoppingCart className="w-6 h-6 text-white" />
                        </div>
                        <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <p className="text-sm text-neutral-600 mb-1">Transactions</p>
                    <p className="text-3xl font-bold text-neutral-800">{today_stats.transaction_count}</p>
                    <p className="text-xs text-green-600 mt-2">Completed today</p>
                </div>

                <div className="bg-white rounded-xl shadow-md border border-neutral-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg">
                            <TrendingUp className="w-6 h-6 text-white" />
                        </div>
                        <PlusCircle className="w-5 h-5 text-emerald-600" />
                    </div>
                    <p className="text-sm text-neutral-600 mb-1">Cash In</p>
                    <p className="text-3xl font-bold text-neutral-800">Rs. {today_stats.cash_in.toLocaleString()}</p>
                    <p className="text-xs text-emerald-600 mt-2">Additional collections</p>
                </div>

                <div className="bg-white rounded-xl shadow-md border border-neutral-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-gradient-to-br from-red-500 to-pink-600 rounded-lg">
                            <TrendingUp className="w-6 h-6 text-white transform rotate-180" />
                        </div>
                        <AlertCircle className="w-5 h-5 text-error-600" />
                    </div>
                    <p className="text-sm text-neutral-600 mb-1">Cash Out</p>
                    <p className="text-3xl font-bold text-neutral-800">Rs. {today_stats.cash_out.toLocaleString()}</p>
                    <p className="text-xs text-error-600 mt-2">Petty cash & expenses</p>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-md border border-neutral-200 p-6">
                <h2 className="text-xl font-bold text-neutral-800 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {quickActions.map(action => (
                        <button
                            key={action.id}
                            onClick={() => !action.disabled && navigate(action.path)}
                            disabled={action.disabled}
                            className={`flex flex-col items-center gap-3 p-6 rounded-lg border-2 border-neutral-200 hover:border-primary-500 hover:shadow-lg transition-all group ${
                                action.disabled ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                        >
                            <div className={`p-4 bg-gradient-to-br ${action.color} rounded-full text-white group-hover:scale-110 transition-transform`}>
                                {action.icon}
                            </div>
                            <span className="text-sm font-medium text-neutral-700 text-center">{action.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Payment Mode Breakdown */}
            <div className="bg-white rounded-xl shadow-md border border-neutral-200 p-6">
                <h2 className="text-xl font-bold text-neutral-800 mb-4">Payment Mode Breakdown</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl">
                        <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
                            <DollarSign className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <p className="text-xs text-neutral-500">Cash</p>
                            <p className="text-lg font-bold text-neutral-800">Rs. {payment_breakdown.cash.toLocaleString()}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl">
                        <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg">
                            <CreditCard className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <p className="text-xs text-neutral-500">Card</p>
                            <p className="text-lg font-bold text-neutral-800">Rs. {payment_breakdown.card.toLocaleString()}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl">
                        <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg">
                            <Smartphone className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <p className="text-xs text-neutral-500">Online</p>
                            <p className="text-lg font-bold text-neutral-800">Rs. {payment_breakdown.online.toLocaleString()}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl">
                        <div className="p-3 bg-gradient-to-br from-orange-500 to-amber-600 rounded-lg">
                            <QrCode className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <p className="text-xs text-neutral-500">QR Code</p>
                            <p className="text-lg font-bold text-neutral-800">Rs. {payment_breakdown.qr.toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* EOD Status Card */}
            <div className="bg-white rounded-xl shadow-md border border-neutral-200 p-6">
                <h2 className="text-xl font-bold text-neutral-800 mb-4">End of Day Status</h2>
                <div className="flex items-center gap-4">
                    <div className={`px-4 py-2 rounded-full text-sm font-medium ${
                        eod_status === 'OPEN' ? 'bg-green-100 text-green-800' :
                        eod_status === 'SUBMITTED' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-neutral-100 text-neutral-800'
                    }`}>
                        {eod_status}
                    </div>
                    <p className="text-sm text-neutral-600">
                        {eod_status === 'OPEN' ? 'Day is open for transactions' :
                         eod_status === 'SUBMITTED' ? 'EOD submitted, awaiting approval' :
                         'Day is closed and locked'}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default CashierBillingDashboard;
