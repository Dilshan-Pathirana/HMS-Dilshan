import { useEffect, useState } from "react";
import api from "../../../../utils/api/axios";
import { useNavigate } from "react-router-dom";
import {
    DollarSign, ShoppingCart, TrendingUp, AlertCircle,
    Building2, ArrowUpRight, ArrowDownRight,
    CreditCard, BarChart3, Filter,
    RefreshCw, Package, Truck, Users, Settings,
    Tag, FileText, AlertTriangle, Clock,
    Percent, Gift, CheckCircle, XCircle,
    ShoppingBag, Archive, ClipboardList, Box
} from "lucide-react";

interface Branch {
    id: string;
    name: string;
    type?: string;
}

interface DashboardStats {
    selected_branch: Branch | null;
    all_branches: Branch[];
    today_stats: {
        date: string;
        total_sales: number;
        transaction_count: number;
        cash_in: number;
        cash_out: number;
        net_cash: number;
    };
    payment_breakdown: {
        cash: number;
        card: number;
        online: number;
        qr: number;
    };
    branch_performance: {
        id: string;
        name: string;
        type: string;
        total_sales: number;
        transaction_count: number;
    }[];
    comparison: {
        yesterday_sales: number;
        sales_change_percentage: number;
    };
}

interface EnhancedStats {
    pending_overrides: number;
    today_discount_total: number;
    expiring_soon_count: number;
    low_stock_count: number;
    active_discounts: number;
    month_profit: number;
    month_margin: number;
}

// Zone Button Interface
interface ZoneButton {
    id: string;
    label: string;
    icon: JSX.Element;
    path?: string;
    badge?: number;
    badgeColor?: string;
    description: string;
    onClick?: () => void;
}

// Zone Interface
interface Zone {
    id: string;
    title: string;
    color: string;
    bgColor: string;
    icon: JSX.Element;
    buttons: ZoneButton[];
}

const SuperAdminPOSDashboardZoned = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [enhancedStats, setEnhancedStats] = useState<EnhancedStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedBranchId, setSelectedBranchId] = useState<string>("");

    useEffect(() => {
        fetchDashboardStats();
        fetchEnhancedStats();
    }, [selectedBranchId]);

    const fetchDashboardStats = async () => {
        try {
            setIsLoading(true);
            const token = localStorage.getItem("authToken");
            const url = selectedBranchId 
                ? `/super-admin/pos/dashboard-stats?branch_id=${selectedBranchId}`
                : "/super-admin/pos/dashboard-stats";
            
            const response = await api.get(url, {
                headers: { Authorization: `Bearer ${token}` },
            });

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

    const fetchEnhancedStats = async () => {
        try {
            const token = localStorage.getItem("authToken");
            const url = selectedBranchId 
                ? `/super-admin/enhanced-pos/dashboard-stats?branch_id=${selectedBranchId}`
                : "/super-admin/enhanced-pos/dashboard-stats";
            
            const response = await api.get(url, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.data.success) {
                setEnhancedStats(response.data.data);
            }
        } catch (err) {
            console.error("Error fetching enhanced stats:", err);
        }
    };

    const handleBranchChange = (branchId: string) => {
        setSelectedBranchId(branchId);
    };

    // Define zones with button-based navigation
    const zones: Zone[] = [
        {
            id: "sales",
            title: "Sales Zone",
            color: "text-emerald-600",
            bgColor: "bg-emerald-50 border-emerald-200",
            icon: <ShoppingCart className="w-6 h-6" />,
            buttons: [
                {
                    id: "new-sale",
                    label: "New Sale",
                    icon: <ShoppingBag className="w-5 h-5" />,
                    path: "/dashboard/pos/transactions",
                    description: "Start a new POS transaction"
                },
                {
                    id: "apply-discount",
                    label: "Apply Discount",
                    icon: <Tag className="w-5 h-5" />,
                    path: "/dashboard/pos/discounts/apply",
                    description: "Apply item or bill discount"
                },
                {
                    id: "view-offers",
                    label: "View Active Offers",
                    icon: <Gift className="w-5 h-5" />,
                    path: "/dashboard/pos/discounts/active",
                    badge: enhancedStats?.active_discounts,
                    badgeColor: "bg-purple-500",
                    description: "See current promotions & offers"
                },
                {
                    id: "pending-approvals",
                    label: "Price Overrides",
                    icon: <CheckCircle className="w-5 h-5" />,
                    path: "/dashboard/pos/price-overrides",
                    badge: enhancedStats?.pending_overrides,
                    badgeColor: "bg-orange-500",
                    description: "Pending price override requests"
                },
                {
                    id: "sales-history",
                    label: "Sales History",
                    icon: <ClipboardList className="w-5 h-5" />,
                    path: "/dashboard/pos/transactions",
                    description: "View past transactions"
                }
            ]
        },
        {
            id: "stock",
            title: "Stock Zone",
            color: "text-blue-600",
            bgColor: "bg-blue-50 border-blue-200",
            icon: <Package className="w-6 h-6" />,
            buttons: [
                {
                    id: "stock-levels",
                    label: "Stock Levels",
                    icon: <Box className="w-5 h-5" />,
                    path: "/dashboard/pharmacy/products",
                    description: "View current inventory levels"
                },
                {
                    id: "batch-inventory",
                    label: "Batch Inventory",
                    icon: <Archive className="w-5 h-5" />,
                    path: "/dashboard/pos/batches",
                    description: "View batch-wise stock"
                },
                {
                    id: "expiring-soon",
                    label: "Expiring Soon",
                    icon: <AlertTriangle className="w-5 h-5" />,
                    path: "/dashboard/pos/reports/expiring",
                    badge: enhancedStats?.expiring_soon_count,
                    badgeColor: "bg-red-500",
                    description: "Items expiring within 30 days"
                },
                {
                    id: "low-stock",
                    label: "Low Stock Alert",
                    icon: <AlertCircle className="w-5 h-5" />,
                    path: "/dashboard/pharmacy/low-stock",
                    badge: enhancedStats?.low_stock_count,
                    badgeColor: "bg-yellow-500",
                    description: "Items below reorder level"
                },
                {
                    id: "stock-aging",
                    label: "Stock Aging",
                    icon: <Clock className="w-5 h-5" />,
                    path: "/dashboard/pos/reports/aging",
                    description: "View aging inventory report"
                }
            ]
        },
        {
            id: "procurement",
            title: "Procurement Zone",
            color: "text-orange-600",
            bgColor: "bg-orange-50 border-orange-200",
            icon: <Truck className="w-6 h-6" />,
            buttons: [
                {
                    id: "purchase-requests",
                    label: "Purchase Requests",
                    icon: <FileText className="w-5 h-5" />,
                    path: "/dashboard/pharmacy/purchasing",
                    description: "View & manage purchase requests"
                },
                {
                    id: "receive-stock",
                    label: "Receive Stock",
                    icon: <Package className="w-5 h-5" />,
                    path: "/dashboard/pharmacy/receive",
                    description: "Record stock receipts"
                },
                {
                    id: "suppliers",
                    label: "Suppliers",
                    icon: <Users className="w-5 h-5" />,
                    path: "/dashboard/pharmacy/suppliers",
                    description: "Manage supplier information"
                },
                {
                    id: "transfer-stock",
                    label: "Stock Transfer",
                    icon: <Truck className="w-5 h-5" />,
                    path: "/dashboard/pharmacy/transfers",
                    description: "Inter-branch stock transfers"
                }
            ]
        },
        {
            id: "management",
            title: "Management Zone",
            color: "text-purple-600",
            bgColor: "bg-purple-50 border-purple-200",
            icon: <Settings className="w-6 h-6" />,
            buttons: [
                {
                    id: "pricing-controls",
                    label: "Pricing Controls",
                    icon: <DollarSign className="w-5 h-5" />,
                    path: "/dashboard/pos/pricing-controls",
                    description: "Set min/max prices & limits"
                },
                {
                    id: "discounts-management",
                    label: "Manage Discounts",
                    icon: <Percent className="w-5 h-5" />,
                    path: "/dashboard/pos/discounts",
                    description: "Create & edit discounts"
                },
                {
                    id: "analytics",
                    label: "Sales Analytics",
                    icon: <BarChart3 className="w-5 h-5" />,
                    path: "/dashboard/pos/analytics",
                    description: "View sales & profit reports"
                },
                {
                    id: "audit-logs",
                    label: "Audit Logs",
                    icon: <ClipboardList className="w-5 h-5" />,
                    path: "/dashboard/pos/audit-logs",
                    description: "View POS activity logs"
                },
                {
                    id: "cashiers",
                    label: "Cashier Management",
                    icon: <Users className="w-5 h-5" />,
                    path: "/dashboard/pos/cashiers",
                    description: "Manage cashier permissions"
                }
            ]
        }
    ];

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error || !stats) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center">
                    <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
                    <p className="text-gray-600">{error || "Failed to load dashboard"}</p>
                </div>
            </div>
        );
    }

    const { today_stats, branch_performance, comparison, all_branches } = stats;
    const salesChangePositive = comparison.sales_change_percentage >= 0;

    return (
        <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
            {/* Header with Branch Filter */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl shadow-lg p-6 text-white">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                            <Building2 className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold">
                                {selectedBranchId ? stats.selected_branch?.name : "All Branches"}
                            </h2>
                            <p className="text-blue-100 mt-1">Enhanced POS Dashboard</p>
                        </div>
                    </div>
                    
                    {/* Branch Filter */}
                    <div className="flex items-center gap-3">
                        <Filter className="w-5 h-5 text-blue-200" />
                        <select
                            value={selectedBranchId}
                            onChange={(e) => handleBranchChange(e.target.value)}
                            className="bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white/50 min-w-[200px]"
                        >
                            <option value="" className="text-gray-800">All Branches</option>
                            {all_branches.map((branch) => (
                                <option key={branch.id} value={branch.id} className="text-gray-800">
                                    {branch.name}
                                </option>
                            ))}
                        </select>
                        <button
                            onClick={() => {
                                fetchDashboardStats();
                                fetchEnhancedStats();
                            }}
                            className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                            title="Refresh"
                        >
                            <RefreshCw className="w-5 h-5" />
                        </button>
                    </div>
                </div>
                
                <div className="mt-4 text-right">
                    <p className="text-blue-100 text-sm">
                        {new Date(today_stats.date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}
                    </p>
                </div>
            </div>

            {/* Quick Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Today's Sales */}
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div className="p-2 bg-emerald-100 rounded-lg">
                            <DollarSign className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div className={`flex items-center gap-1 text-sm ${salesChangePositive ? 'text-emerald-600' : 'text-red-600'}`}>
                            {salesChangePositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                            {Math.abs(comparison.sales_change_percentage).toFixed(1)}%
                        </div>
                    </div>
                    <div className="mt-3">
                        <p className="text-xs text-gray-500">Today's Sales</p>
                        <p className="text-lg font-bold text-gray-900">
                            Rs. {today_stats.total_sales.toLocaleString('en-US', { minimumFractionDigits: 0 })}
                        </p>
                    </div>
                </div>

                {/* Transaction Count */}
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <div className="p-2 bg-blue-100 rounded-lg w-fit">
                        <ShoppingCart className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="mt-3">
                        <p className="text-xs text-gray-500">Transactions</p>
                        <p className="text-lg font-bold text-gray-900">{today_stats.transaction_count}</p>
                    </div>
                </div>

                {/* Today's Discounts */}
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <div className="p-2 bg-purple-100 rounded-lg w-fit">
                        <Tag className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="mt-3">
                        <p className="text-xs text-gray-500">Discounts Given</p>
                        <p className="text-lg font-bold text-purple-600">
                            Rs. {(enhancedStats?.today_discount_total || 0).toLocaleString()}
                        </p>
                    </div>
                </div>

                {/* Month Profit */}
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <div className="p-2 bg-green-100 rounded-lg w-fit">
                        <TrendingUp className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="mt-3">
                        <p className="text-xs text-gray-500">Month Profit</p>
                        <p className="text-lg font-bold text-green-600">
                            Rs. {(enhancedStats?.month_profit || 0).toLocaleString()}
                        </p>
                    </div>
                </div>

                {/* Margin */}
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <div className="p-2 bg-indigo-100 rounded-lg w-fit">
                        <BarChart3 className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div className="mt-3">
                        <p className="text-xs text-gray-500">Avg Margin</p>
                        <p className="text-lg font-bold text-indigo-600">
                            {(enhancedStats?.month_margin || 0).toFixed(1)}%
                        </p>
                    </div>
                </div>
            </div>

            {/* Button-Based Zones */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {zones.map((zone) => (
                    <div 
                        key={zone.id} 
                        className={`rounded-xl border-2 p-5 ${zone.bgColor}`}
                    >
                        {/* Zone Header */}
                        <div className="flex items-center gap-3 mb-4">
                            <div className={`p-2 rounded-lg bg-white ${zone.color}`}>
                                {zone.icon}
                            </div>
                            <h3 className={`text-lg font-semibold ${zone.color}`}>
                                {zone.title}
                            </h3>
                        </div>

                        {/* Zone Buttons Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {zone.buttons.map((button) => (
                                <button
                                    key={button.id}
                                    onClick={() => button.path && navigate(button.path)}
                                    className="relative flex flex-col items-center justify-center p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 hover:border-gray-200 group"
                                    title={button.description}
                                >
                                    {/* Badge */}
                                    {button.badge !== undefined && button.badge > 0 && (
                                        <span className={`absolute -top-2 -right-2 ${button.badgeColor} text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center`}>
                                            {button.badge}
                                        </span>
                                    )}
                                    
                                    {/* Icon */}
                                    <div className={`${zone.color} mb-2 group-hover:scale-110 transition-transform`}>
                                        {button.icon}
                                    </div>
                                    
                                    {/* Label */}
                                    <span className="text-xs font-medium text-gray-700 text-center leading-tight">
                                        {button.label}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Branch Performance (Compact) */}
            {branch_performance && branch_performance.length > 0 && (
                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-gray-600" />
                        {selectedBranchId ? 'Branch Details' : 'Top Performing Branches'}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {branch_performance.slice(0, 4).map((branch, index) => (
                            <div 
                                key={branch.id} 
                                className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                                    selectedBranchId === branch.id ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50 hover:bg-gray-100'
                                }`}
                                onClick={() => handleBranchChange(selectedBranchId === branch.id ? '' : branch.id)}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-full ${
                                        index === 0 ? 'bg-yellow-100' :
                                        index === 1 ? 'bg-gray-100' :
                                        index === 2 ? 'bg-orange-100' :
                                        'bg-indigo-100'
                                    }`}>
                                        <span className="font-bold text-sm">{index + 1}</span>
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900 text-sm">{branch.name}</p>
                                        <p className="text-xs text-gray-500">{branch.transaction_count} txns</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-semibold text-gray-900 text-sm">
                                        Rs. {branch.total_sales.toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SuperAdminPOSDashboardZoned;
