import { Link, useLocation } from "react-router-dom";
import {
    Home,
    ShoppingCart,
    DollarSign,
    FileText,
    Clock,
    TrendingUp,
    Package,
    AlertTriangle,
    RefreshCw,
    Percent,
    BarChart3,
    ArrowRightLeft,
    PackagePlus,
    Building2,
    Users,
    ChevronDown,
    ChevronRight,
    User,
    Settings,
    MessageSquare,
} from "lucide-react";
import React, { useState } from "react";

import CureLogo from "../../../assets/cure-logo.png";

interface POSSidebarProps {
    sidebarOpen: boolean;
    userRole: number;
}

interface MenuItem {
    title: string;
    icon: React.ReactNode;
    path?: string;
    subItems?: { title: string; path: string }[];
}

// Role constants
const SUPER_ADMIN = 1;
const BRANCH_ADMIN = 2;
const CASHIER = 3;
const PHARMACIST = 4;
const DOCTOR = 5;

/**
 * Role-aware POS Sidebar Component
 * 
 * Displays different menu items based on user role:
 * - Super Admin (1): Full access to all POS features including inventory, purchasing, stock management
 * - Branch Admin (2): Branch-specific dashboard, analytics, POS, transactions, reports
 * - Cashier (3): Daily operations - POS, cash entries, transactions, EOD, reports
 * - Doctor (5): Read-only access similar to cashier
 * - Pharmacist (4): Pharmacy-focused items
 */
const POSSidebar: React.FC<POSSidebarProps> = ({ sidebarOpen, userRole }) => {
    
    // Super Admin Menu Items
    const superAdminMenuItems: MenuItem[] = [
        { title: "Dashboard", icon: <Home />, path: "/pos" },
        { title: "Analytics", icon: <BarChart3 />, path: "/pos/analytics" },
        { title: "Point of Sale", icon: <ShoppingCart />, path: "/pos/pos" },
        { title: "Cashiers", icon: <Building2 />, path: "/pos/cashiers" },
        { title: "Sales", icon: <DollarSign />, path: "/pos/sales" },
        { 
            title: "Inventory", 
            icon: <Package />, 
            path: "/pos/inventory"
        },
        { title: "Purchasing", icon: <ShoppingCart />, path: "/pos/purchasing" },
        { 
            title: "Damage Stock", 
            icon: <AlertTriangle />, 
            subItems: [
                { title: "View List", path: "/pos/damage-stock/view" },
                { title: "Add Damage", path: "/pos/damage-stock/add" },
            ]
        },
        { 
            title: "Stock Movement", 
            icon: <ArrowRightLeft />, 
            subItems: [
                { title: "Transfer Stock", path: "/pos/stock-movement/transfer" },
                { title: "Transfer History", path: "/pos/stock-movement/history" },
            ]
        },
        { 
            title: "Re-Order Stock", 
            icon: <PackagePlus />, 
            subItems: [
                { title: "View List", path: "/pos/re-order-stock/list" },
                { title: "Add Re-Stock", path: "/pos/re-order-stock/add" },
            ]
        },
        { 
            title: "Product Discount", 
            icon: <Percent />, 
            subItems: [
                { title: "Add Discount", path: "/pos/product-discount/add" },
                { title: "View Discounts", path: "/pos/product-discount/list" },
            ]
        },
    ];

    // Branch Admin Menu Items
    const branchAdminMenuItems: MenuItem[] = [
        { title: "Dashboard", icon: <Building2 />, path: "/pos" },
        { title: "Analytics", icon: <BarChart3 />, path: "/pos/analytics" },
        { title: "Point of Sale", icon: <ShoppingCart />, path: "/pos/pos" },
        { title: "Cashiers", icon: <Users />, path: "/pos/cashiers" },
        { title: "Cash Entries", icon: <DollarSign />, path: "/pos/cash-entries" },
        { title: "Transactions", icon: <FileText />, path: "/pos/transactions" },
        { title: "End of Day", icon: <Clock />, path: "/pos/eod" },
        { title: "Reports", icon: <TrendingUp />, path: "/pos/reports" },
    ];

    // Cashier Menu Items
    const cashierMenuItems: MenuItem[] = [
        { title: "Dashboard", icon: <Home />, path: "/pos" },
        { title: "Point of Sale", icon: <ShoppingCart />, path: "/pos/pos" },
        { title: "Cash Entries", icon: <DollarSign />, path: "/pos/cash-entries" },
        { title: "Transactions", icon: <FileText />, path: "/pos/transactions" },
        { title: "End of Day", icon: <Clock />, path: "/pos/eod" },
        { title: "HR Portal", icon: <Users />, path: "/pos/hr" },
        { 
            title: "Reports", 
            icon: <TrendingUp />,
            subItems: [
                { title: "Daily Sales Report", path: "/pos/transactions" },
                { title: "EOD History", path: "/pos/eod" },
            ]
        },
        { title: "Feedback", icon: <MessageSquare />, path: "/pos/feedback" },
        { title: "My Profile", icon: <User />, path: "/pos/profile" },
        { title: "Settings", icon: <Settings />, path: "/pos/settings" },
    ];

    // Pharmacist Menu Items
    const pharmacistMenuItems: MenuItem[] = [
        { title: "Dashboard", icon: <Home />, path: "/pos" },
        { title: "Inventory", icon: <Package />, path: "/pos/inventory" },
        { title: "Stock Check", icon: <RefreshCw />, path: "/pos/stock-check" },
    ];

    // Get menu items based on user role
    const getMenuItems = (): MenuItem[] => {
        switch (userRole) {
            case SUPER_ADMIN:
                return superAdminMenuItems;
            case BRANCH_ADMIN:
                return branchAdminMenuItems;
            case CASHIER:
            case DOCTOR:
                return cashierMenuItems;
            case PHARMACIST:
                return pharmacistMenuItems;
            default:
                return cashierMenuItems;
        }
    };

    const menuItems = getMenuItems();

    // Get sidebar header based on role
    const getSidebarHeader = () => {
        switch (userRole) {
            case SUPER_ADMIN:
                return "Super Admin POS";
            case BRANCH_ADMIN:
                return "Branch Admin POS";
            case CASHIER:
                return "Cashier POS";
            case PHARMACIST:
                return "Pharmacy POS";
            default:
                return "POS System";
        }
    };

    const location = useLocation();
    const [expandedItems, setExpandedItems] = useState<string[]>([]);

    const toggleExpand = (title: string) => {
        setExpandedItems(prev => 
            prev.includes(title) 
                ? prev.filter(item => item !== title)
                : [...prev, title]
        );
    };

    const isActive = (path?: string) => {
        if (!path) return false;
        return location.pathname === path || location.pathname.startsWith(path + '/');
    };

    const isSubItemActive = (subItems?: { title: string; path: string }[]) => {
        if (!subItems) return false;
        return subItems.some(sub => location.pathname === sub.path || location.pathname.startsWith(sub.path + '/'));
    };

    return (
        <div
            className={`bg-white h-screen shadow-xl border-r border-gray-100 transition-all duration-300 flex flex-col ${
                sidebarOpen ? "w-64" : "w-20"
            }`}
        >
            {/* Logo Section */}
            <div className="flex items-center justify-center py-6 border-b border-gray-100">
                <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                    <div className="relative">
                        <img
                            src={CureLogo}
                            alt="Logo"
                            className={`transition-all duration-300 ${sidebarOpen ? 'h-12 w-12' : 'h-10 w-10'}`}
                        />
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white"></div>
                    </div>
                    {sidebarOpen && (
                        <div className="flex flex-col">
                            <span className="text-lg font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                                CURE.lk
                            </span>
                            <span className="text-xs text-gray-500">Healthcare System</span>
                        </div>
                    )}
                </Link>
            </div>

            {/* Role indicator */}
            {sidebarOpen && (
                <div className="px-4 py-3">
                    <div className="px-3 py-2 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-xl border border-emerald-100">
                        <p className="text-xs text-emerald-700 font-semibold text-center">
                            {getSidebarHeader()}
                        </p>
                    </div>
                </div>
            )}

            {/* Navigation */}
            <nav className="flex-1 px-3 py-4 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
                <div className="space-y-1">
                    {menuItems.map((item, index) => (
                        <div key={`${item.title}-${index}`}>
                            {item.subItems ? (
                                // Menu item with sub-items
                                <div>
                                    <button
                                        onClick={() => toggleExpand(item.title)}
                                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                                            isSubItemActive(item.subItems)
                                                ? 'bg-gradient-to-r from-emerald-500 to-blue-500 text-white shadow-md'
                                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                        }`}
                                    >
                                        <span className={`flex-shrink-0 ${
                                            isSubItemActive(item.subItems) ? 'text-white' : 'text-gray-500 group-hover:text-emerald-600'
                                        }`}>
                                            {React.cloneElement(item.icon as React.ReactElement, { className: 'w-5 h-5' })}
                                        </span>
                                        {sidebarOpen && (
                                            <>
                                                <span className="flex-1 text-left text-sm font-medium">{item.title}</span>
                                                {expandedItems.includes(item.title) ? (
                                                    <ChevronDown className="w-4 h-4" />
                                                ) : (
                                                    <ChevronRight className="w-4 h-4" />
                                                )}
                                            </>
                                        )}
                                    </button>
                                    
                                    {/* Sub Items */}
                                    {sidebarOpen && expandedItems.includes(item.title) && (
                                        <div className="ml-4 mt-1 space-y-1 border-l-2 border-gray-100 pl-3">
                                            {item.subItems.map((subItem, subIndex) => (
                                                <Link
                                                    key={`${subItem.title}-${subIndex}`}
                                                    to={subItem.path}
                                                    className={`block px-3 py-2 text-sm rounded-lg transition-all duration-200 ${
                                                        isActive(subItem.path)
                                                            ? 'bg-emerald-50 text-emerald-700 font-medium'
                                                            : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                                                    }`}
                                                >
                                                    {subItem.title}
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                // Regular menu item
                                <Link
                                    to={item.path || '/pos'}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                                        isActive(item.path)
                                            ? 'bg-gradient-to-r from-emerald-500 to-blue-500 text-white shadow-md'
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                    }`}
                                >
                                    <span className={`flex-shrink-0 ${
                                        isActive(item.path) ? 'text-white' : 'text-gray-500 group-hover:text-emerald-600'
                                    }`}>
                                        {React.cloneElement(item.icon as React.ReactElement, { className: 'w-5 h-5' })}
                                    </span>
                                    {sidebarOpen && (
                                        <span className="text-sm font-medium">{item.title}</span>
                                    )}
                                </Link>
                            )}
                        </div>
                    ))}
                </div>
            </nav>

            {/* Footer */}
            {sidebarOpen && (
                <div className="p-4 border-t border-gray-100">
                    <div className="text-center">
                        <p className="text-xs text-gray-400">© 2024 CURE.lk</p>
                        <p className="text-xs text-gray-300">v2.0.0</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default POSSidebar;
