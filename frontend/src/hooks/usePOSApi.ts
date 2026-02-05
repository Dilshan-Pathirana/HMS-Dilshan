/**
 * Hook for POS API endpoints
 * 
 * Provides the correct API base path based on user role:
 * - Super Admin: /api/super-admin/pos
 * - Branch Admin: /api/branch-admin/pos
 * - Cashier: /api/cashier-billing
 */

import { useMemo } from 'react';
import { useUserRole } from '../utils/state/checkAuthenticatedUserStates';

// Role constants
const SUPER_ADMIN = 1;
const BRANCH_ADMIN = 2;
const CASHIER = 6;

export interface POSApiEndpoints {
    base: string;
    dashboardStats: string;
    transactions: string;
    cashEntries: string;
    cashSummary: string;
    eodSummary: string;
    eodSubmit: string;
    inventoryList: string;
    searchPatients: string;
    searchProducts: string;
    dailySalesTrend: string;
    analytics: string;
    products: string;
}

/**
 * Get POS API endpoints based on user role
 */
export const usePOSApi = (): POSApiEndpoints => {
    const userRole = useUserRole();

    return useMemo(() => {
        const API_BASE = '/api';

        if (userRole === SUPER_ADMIN) {
            return {
                base: `${API_BASE}/super-admin/pos`,
                dashboardStats: `${API_BASE}/super-admin/pos/dashboard-stats`,
                transactions: `${API_BASE}/super-admin/pos/transactions`,
                cashEntries: `${API_BASE}/super-admin/pos/cash-entries`,
                cashSummary: `${API_BASE}/super-admin/pos/cash-summary`,
                eodSummary: `${API_BASE}/super-admin/pos/eod-summary`,
                eodSubmit: `${API_BASE}/super-admin/pos/eod-submit`,
                inventoryList: `${API_BASE}/super-admin/pos/inventory-list`,
                searchPatients: `${API_BASE}/search-patients`,
                searchProducts: `${API_BASE}/super-admin/pos/search-products`,
                dailySalesTrend: `${API_BASE}/super-admin/pos/daily-sales-trend`,
                analytics: `${API_BASE}/super-admin/pos/analytics`,
                products: `${API_BASE}/super-admin/pos/products`,
            };
        } else if (userRole === BRANCH_ADMIN) {
            return {
                base: `${API_BASE}/branch-admin/pos`,
                dashboardStats: `${API_BASE}/branch-admin/pos/dashboard-stats`,
                transactions: `${API_BASE}/branch-admin/pos/transactions`,
                cashEntries: `${API_BASE}/branch-admin/pos/cash-entries`,
                cashSummary: `${API_BASE}/branch-admin/pos/cash-summary`,
                eodSummary: `${API_BASE}/branch-admin/pos/eod-summary`,
                eodSubmit: `${API_BASE}/branch-admin/pos/eod-submit`,
                inventoryList: `${API_BASE}/branch-admin/pos/inventory-list`,
                searchPatients: `${API_BASE}/branch-admin/pos/search-patients`,
                searchProducts: `${API_BASE}/branch-admin/pos/search-products`,
                dailySalesTrend: `${API_BASE}/branch-admin/pos/daily-sales-trend`,
                analytics: `${API_BASE}/branch-admin/pos/analytics`,
                products: `${API_BASE}/branch-admin/pos/products`,
            };
        } else {
            // Cashier or other roles
            return {
                base: `${API_BASE}/cashier-billing`,
                dashboardStats: `${API_BASE}/cashier-billing/dashboard-stats`,
                transactions: `${API_BASE}/cashier-billing/transactions`,
                cashEntries: `${API_BASE}/cashier-billing/cash-entries`,
                cashSummary: `${API_BASE}/cashier-billing/cash-summary`,
                eodSummary: `${API_BASE}/cashier-billing/eod-summary`,
                eodSubmit: `${API_BASE}/cashier-billing/eod-submit`,
                inventoryList: `${API_BASE}/cashier-inventory-list`,
                searchPatients: `${API_BASE}/cashier-search-patients`,
                searchProducts: `${API_BASE}/cashier-search-products`,
                dailySalesTrend: `${API_BASE}/cashier-billing/daily-sales-trend`,
                analytics: `${API_BASE}/cashier-billing/analytics`,
                products: `${API_BASE}/cashier-billing/products`,
            };
        }
    }, [userRole]);
};

/**
 * Get POS API endpoints without hook (for use in non-component contexts)
 * Uses localStorage to get user role
 */
export const getPOSApiEndpoints = (): POSApiEndpoints => {
    const API_BASE = '/api';
    
    // Try to get user info from localStorage
    let userRole = 0;
    try {
        const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
        userRole = userInfo.role_as || 0;
    } catch {
        userRole = 0;
    }

    if (userRole === SUPER_ADMIN) {
        return {
            base: `${API_BASE}/super-admin/pos`,
            dashboardStats: `${API_BASE}/super-admin/pos/dashboard-stats`,
            transactions: `${API_BASE}/super-admin/pos/transactions`,
            cashEntries: `${API_BASE}/super-admin/pos/cash-entries`,
            cashSummary: `${API_BASE}/super-admin/pos/cash-summary`,
            eodSummary: `${API_BASE}/super-admin/pos/eod-summary`,
            eodSubmit: `${API_BASE}/super-admin/pos/eod-submit`,
            inventoryList: `${API_BASE}/super-admin/pos/inventory-list`,
            searchPatients: `${API_BASE}/search-patients`,
            searchProducts: `${API_BASE}/super-admin/pos/search-products`,
            dailySalesTrend: `${API_BASE}/super-admin/pos/daily-sales-trend`,
            analytics: `${API_BASE}/super-admin/pos/analytics`,
            products: `${API_BASE}/super-admin/pos/products`,
        };
    } else if (userRole === BRANCH_ADMIN) {
        return {
            base: `${API_BASE}/branch-admin/pos`,
            dashboardStats: `${API_BASE}/branch-admin/pos/dashboard-stats`,
            transactions: `${API_BASE}/branch-admin/pos/transactions`,
            cashEntries: `${API_BASE}/branch-admin/pos/cash-entries`,
            cashSummary: `${API_BASE}/branch-admin/pos/cash-summary`,
            eodSummary: `${API_BASE}/branch-admin/pos/eod-summary`,
            eodSubmit: `${API_BASE}/branch-admin/pos/eod-submit`,
            inventoryList: `${API_BASE}/branch-admin/pos/inventory-list`,
            searchPatients: `${API_BASE}/branch-admin/pos/search-patients`,
            searchProducts: `${API_BASE}/branch-admin/pos/search-products`,
            dailySalesTrend: `${API_BASE}/branch-admin/pos/daily-sales-trend`,
            analytics: `${API_BASE}/branch-admin/pos/analytics`,
            products: `${API_BASE}/branch-admin/pos/products`,
        };
    } else {
        // Cashier or other roles
        return {
            base: `${API_BASE}/cashier-billing`,
            dashboardStats: `${API_BASE}/cashier-billing/dashboard-stats`,
            transactions: `${API_BASE}/cashier-billing/transactions`,
            cashEntries: `${API_BASE}/cashier-billing/cash-entries`,
            cashSummary: `${API_BASE}/cashier-billing/cash-summary`,
            eodSummary: `${API_BASE}/cashier-billing/eod-summary`,
            eodSubmit: `${API_BASE}/cashier-billing/eod-submit`,
            inventoryList: `${API_BASE}/cashier-inventory-list`,
            searchPatients: `${API_BASE}/cashier-search-patients`,
            searchProducts: `${API_BASE}/cashier-search-products`,
            dailySalesTrend: `${API_BASE}/cashier-billing/daily-sales-trend`,
            analytics: `${API_BASE}/cashier-billing/analytics`,
            products: `${API_BASE}/cashier-billing/products`,
        };
    }
};

export default usePOSApi;
