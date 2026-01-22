/**
 * POS Layout Wrapper
 * 
 * Provides consistent layout and context for all POS pages including:
 * - POSProvider for state management
 * - Common header with branch info and user role
 * - Low stock alert banner
 * - Permission-based navigation
 */

import React, { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
    AlertTriangle, Bell, Building2, ChevronDown, 
    LayoutDashboard, ShoppingCart, FileText, Users, 
    BarChart3, Settings, LogOut
} from 'lucide-react';
import { POSProvider, usePOS } from '../../context/POSContext';
import { useAuth } from '../../hooks/useAuth';
import { RoleGuard, AdminGuard } from '../../components/security/RoleGuard';

interface POSLayoutProps {
    children: ReactNode;
}

// Inner layout component that uses POS context
const POSLayoutInner: React.FC<POSLayoutProps> = ({ children }) => {
    const location = useLocation();
    const { user, isSuperAdmin, isBranchAdmin, isCashier } = useAuth();
    const { 
        currentBranch, 
        lowStockItems, 
        clearLowStockAlerts,
        isEodLocked,
        todayStats
    } = usePOS();
    
    // Determine navigation items based on role
    const getNavItems = () => {
        const baseItems = [
            { 
                path: '/pos', 
                label: 'Dashboard', 
                icon: LayoutDashboard,
                roles: ['super_admin', 'branch_admin', 'cashier']
            },
        ];
        
        if (isSuperAdmin) {
            return [
                { path: '/super-admin/pos', label: 'Dashboard', icon: LayoutDashboard },
                { path: '/super-admin/pos/analytics', label: 'Analytics', icon: BarChart3 },
                { path: '/super-admin/pos/transactions', label: 'Transactions', icon: FileText },
                { path: '/super-admin/pos/cashiers', label: 'Cashiers', icon: Users },
            ];
        } else if (isBranchAdmin) {
            return [
                { path: '/branch-admin/pos', label: 'Dashboard', icon: LayoutDashboard },
                { path: '/branch-admin/pos/analytics', label: 'Analytics', icon: BarChart3 },
                { path: '/branch-admin/pos/cashiers', label: 'Cashiers', icon: Users },
                { path: '/branch-admin/pos/transactions', label: 'Transactions', icon: FileText },
                { path: '/branch-admin/pos/new', label: 'New Sale', icon: ShoppingCart },
            ];
        } else {
            return [
                { path: '/cashier/billing', label: 'Dashboard', icon: LayoutDashboard },
                { path: '/cashier/billing/pos', label: 'New Sale', icon: ShoppingCart },
                { path: '/cashier/billing/transactions', label: 'Transactions', icon: FileText },
                { path: '/cashier/billing/cash-entries', label: 'Cash Entries', icon: Settings },
                { path: '/cashier/billing/eod', label: 'EOD Process', icon: FileText },
            ];
        }
    };
    
    const navItems = getNavItems();
    
    // Get role display
    const getRoleDisplay = () => {
        if (isSuperAdmin) return 'Super Admin';
        if (isBranchAdmin) return 'Branch Admin';
        if (isCashier) return 'Cashier';
        return 'User';
    };
    
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Top Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        {/* Logo and Branch */}
                        <div className="flex items-center space-x-4">
                            <Link to="/pos" className="flex items-center">
                                <ShoppingCart className="h-8 w-8 text-emerald-600" />
                                <span className="ml-2 text-xl font-bold text-gray-900">POS</span>
                            </Link>
                            
                            {currentBranch && (
                                <div className="hidden sm:flex items-center px-3 py-1 bg-emerald-50 rounded-lg">
                                    <Building2 className="w-4 h-4 text-emerald-600 mr-2" />
                                    <span className="text-sm font-medium text-emerald-700">
                                        {currentBranch.name}
                                    </span>
                                </div>
                            )}
                        </div>
                        
                        {/* Stats Summary */}
                        {todayStats && (
                            <div className="hidden md:flex items-center space-x-6 text-sm">
                                <div>
                                    <span className="text-gray-500">Today's Sales:</span>
                                    <span className="ml-2 font-semibold text-emerald-600">
                                        Rs. {todayStats.total_sales?.toLocaleString() || '0'}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-gray-500">Transactions:</span>
                                    <span className="ml-2 font-semibold text-gray-900">
                                        {todayStats.transaction_count || 0}
                                    </span>
                                </div>
                            </div>
                        )}
                        
                        {/* User Menu */}
                        <div className="flex items-center space-x-4">
                            {/* Low Stock Alert Bell */}
                            {lowStockItems.length > 0 && (
                                <button
                                    onClick={() => {/* Show low stock modal */}}
                                    className="relative p-2 text-amber-600 hover:bg-amber-50 rounded-full"
                                >
                                    <Bell className="w-5 h-5" />
                                    <span className="absolute top-0 right-0 w-4 h-4 bg-amber-500 text-white text-xs rounded-full flex items-center justify-center">
                                        {lowStockItems.length}
                                    </span>
                                </button>
                            )}
                            
                            {/* EOD Status */}
                            {isEodLocked && (
                                <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">
                                    EOD Locked
                                </span>
                            )}
                            
                            {/* User Info */}
                            <div className="flex items-center">
                                <div className="text-right mr-3">
                                    <p className="text-sm font-medium text-gray-900">
                                        {user?.first_name || 'User'}
                                    </p>
                                    <p className="text-xs text-gray-500">{getRoleDisplay()}</p>
                                </div>
                                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                                    <span className="text-emerald-600 font-medium text-sm">
                                        {(user?.first_name?.[0] || 'U').toUpperCase()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>
            
            {/* Low Stock Alert Banner */}
            {lowStockItems.length > 0 && (
                <div className="bg-amber-50 border-b border-amber-200">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <AlertTriangle className="w-5 h-5 text-amber-600 mr-2" />
                                <span className="text-sm text-amber-800">
                                    <strong>{lowStockItems.length} items</strong> are running low on stock
                                </span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() => {/* Show details */}}
                                    className="text-sm text-amber-700 hover:text-amber-900 font-medium"
                                >
                                    View Details
                                </button>
                                <button
                                    onClick={clearLowStockAlerts}
                                    className="text-sm text-amber-600 hover:text-amber-800"
                                >
                                    Dismiss
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Navigation */}
            <nav className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex space-x-1 overflow-x-auto">
                        {navItems.map((item) => {
                            const isActive = location.pathname === item.path;
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`flex items-center px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap ${
                                        isActive
                                            ? 'border-emerald-600 text-emerald-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                                >
                                    <item.icon className={`w-4 h-4 mr-2 ${isActive ? 'text-emerald-600' : 'text-gray-400'}`} />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </nav>
            
            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {children}
            </main>
        </div>
    );
};

// Main layout component with provider
const POSLayout: React.FC<POSLayoutProps> = ({ children }) => {
    return (
        <POSProvider>
            <POSLayoutInner>{children}</POSLayoutInner>
        </POSProvider>
    );
};

export default POSLayout;
