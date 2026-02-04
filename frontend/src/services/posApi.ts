/**
 * Unified POS API Service
 * 
 * Centralized API service for all POS operations. Automatically handles:
 * - Branch context based on user role
 * - Authentication headers
 * - Error handling
 * - Response normalization
 */

import axios from "axios";

// Types
export interface Branch {
    id: number | string;
    name: string;
    center_name?: string;
    type?: string;
    address?: string;
    city?: string;
    phone?: string;
}

export interface Product {
    id: string;
    item_name: string;
    item_code: string;
    selling_price: number;
    stock: number;
    category?: string;
    batch_number?: string;
    expiry_date?: string;
}

export interface TransactionItem {
    id?: string;
    product_id: string;
    service: string;
    amount: number;
    quantity: number;
    unitPrice?: number;
}

export interface TransactionData {
    transaction_type: 'OPD' | 'LAB' | 'PHARMACY' | 'SERVICE';
    patient_id?: string;
    patient_name: string;
    patient_phone?: string;
    service_details: TransactionItem[];
    total_amount: number;
    paid_amount: number;
    payment_method: 'CASH' | 'CARD' | 'ONLINE' | 'QR';
    remarks?: string;
}

export interface Transaction {
    id: string;
    branch_id: string;
    cashier_id: string;
    invoice_number: string;
    receipt_number: string;
    patient_name: string;
    patient_phone?: string;
    transaction_type: string;
    total_amount: number;
    paid_amount: number;
    balance_amount: number;
    payment_status: 'PAID' | 'PARTIAL' | 'PENDING';
    payment_method: string;
    service_details: TransactionItem[];
    transaction_date: string;
    created_at: string;
}

export interface DashboardStats {
    branch: Branch;
    cashier?: { id: string; name: string };
    today_stats: {
        date: string;
        total_sales: number;
        transaction_count: number;
        cash_in: number;
        cash_out: number;
        net_cash?: number;
    };
    payment_breakdown: {
        cash: number;
        card: number;
        online: number;
        qr: number;
    };
    eod_status?: string;
    is_eod_locked?: boolean;
    comparison?: {
        yesterday_sales: number;
        sales_change_percentage: number;
    };
}

export interface EODSummary {
    id?: string;
    total_sales: number;
    transaction_count: number;
    cash_total: number;
    card_total: number;
    online_total: number;
    qr_total: number;
    cash_in_total: number;
    cash_out_total: number;
    opening_balance: number;
    expected_balance: number;
    actual_balance?: number;
    variance?: number;
    eod_status: 'OPEN' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'FLAGGED';
}

export interface CashEntry {
    id?: string;
    entry_type: 'CASH_IN' | 'CASH_OUT';
    category: string;
    amount: number;
    description: string;
    reference_number?: string;
    remarks?: string;
}

export interface LowStockItem {
    name: string;
    code: string;
    current_stock: number;
    reorder_level: number;
}

export interface ApiResponse<T> {
    status: number;
    message?: string;
    data?: T;
    errors?: Record<string, string[]>;
    low_stock_warning?: LowStockItem[];
}

// Role constants
const SUPER_ADMIN = 1;
const BRANCH_ADMIN = 2;

// API Base URL
const API_BASE = '/api';

/**
 * Get authentication token
 */
const getToken = (): string => {
    return localStorage.getItem('token') || localStorage.getItem('authToken') || '';
};

/**
 * Get user info from localStorage
 */
const getUserInfo = () => {
    try {
        return JSON.parse(localStorage.getItem('user') || '{}');
    } catch {
        return {};
    }
};

/**
 * Get user role from Redux or localStorage
 */
const getUserRole = (): number => {
    const userInfo = getUserInfo();
    return userInfo.role_as || 0;
};

/**
 * Get API endpoint based on user role
 */
const getApiEndpoint = (baseEndpoint: string): string => {
    const role = getUserRole();

    if (role === SUPER_ADMIN) {
        return `${API_BASE}/super-admin/pos${baseEndpoint}`;
    } else if (role === BRANCH_ADMIN) {
        return `${API_BASE}/branch-admin/pos${baseEndpoint}`;
    } else {
        return `${API_BASE}/cashier-billing${baseEndpoint}`;
    }
};

/**
 * Create axios instance with auth headers
 */
const createApiClient = () => {
    const instance = axios.create({
        baseURL: API_BASE,
        headers: {
            'Content-Type': 'application/json',
        },
    });

    instance.interceptors.request.use((config) => {
        const token = getToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    });

    return instance;
};

const api = createApiClient();

/**
 * POS API Service
 */
export const POSApi = {
    // ==================== DASHBOARD ====================

    /**
     * Get dashboard statistics
     */
    getDashboardStats: async (branchId?: string): Promise<DashboardStats> => {
        const endpoint = getApiEndpoint('/dashboard-stats');
        const params = branchId ? { branch_id: branchId } : {};
        const response = await api.get<ApiResponse<DashboardStats>>(endpoint, { params });
        return response.data.data as DashboardStats;
    },

    /**
     * Get analytics data
     */
    getAnalytics: async (range: string = '7days', branchId?: string) => {
        const endpoint = getApiEndpoint('/analytics');
        const params: Record<string, string> = { range };
        if (branchId) params.branch_id = branchId;
        const response = await api.get(endpoint, { params });
        return response.data.data;
    },

    // ==================== TRANSACTIONS ====================

    /**
     * Create a new transaction
     */
    createTransaction: async (data: TransactionData): Promise<{ transaction: Transaction; low_stock_warning?: LowStockItem[] }> => {
        const endpoint = getApiEndpoint('/transactions');
        const response = await api.post<ApiResponse<Transaction>>(endpoint, data);
        return {
            transaction: response.data.data as Transaction,
            low_stock_warning: response.data.low_stock_warning,
        };
    },

    /**
     * Get transactions list
     */
    getTransactions: async (date?: string, branchId?: string): Promise<Transaction[]> => {
        const endpoint = getApiEndpoint('/transactions');
        const params: Record<string, string> = {};
        if (date) params.date = date;
        if (branchId) params.branch_id = branchId;
        const response = await api.get<ApiResponse<Transaction[]>>(endpoint, { params });
        return response.data.data || [];
    },

    // ==================== PRODUCTS ====================

    /**
     * Search products
     */
    searchProducts: async (query: string, branchId?: string): Promise<Product[]> => {
        const role = getUserRole();
        let endpoint: string;

        if (role === SUPER_ADMIN) {
            endpoint = `${API_BASE}/super-admin/pos/products`;
        } else if (role === BRANCH_ADMIN) {
            endpoint = `${API_BASE}/branch-admin/pos/products`;
        } else {
            endpoint = `${API_BASE}/cashier-search-products`;
        }

        const params: Record<string, string> = { search: query };
        if (branchId) params.branch_id = branchId;

        const response = await api.get<ApiResponse<Product[]>>(endpoint, { params });
        return response.data.data || [];
    },

    /**
     * Get products list
     */
    getProducts: async (branchId?: string): Promise<Product[]> => {
        const endpoint = getApiEndpoint('/products');
        const params = branchId ? { branch_id: branchId } : {};
        const response = await api.get<ApiResponse<Product[]>>(endpoint, { params });
        return response.data.data || [];
    },

    // ==================== CASH ENTRIES ====================

    /**
     * Create cash entry
     */
    createCashEntry: async (data: CashEntry): Promise<CashEntry> => {
        const response = await api.post<ApiResponse<CashEntry>>(`${API_BASE}/cashier-billing/cash-entries`, data);
        return response.data.data as CashEntry;
    },

    /**
     * Get cash entries
     */
    getCashEntries: async (date?: string): Promise<CashEntry[]> => {
        const params = date ? { date } : {};
        const response = await api.get<ApiResponse<CashEntry[]>>(`${API_BASE}/cashier-billing/cash-entries`, { params });
        return response.data.data || [];
    },

    /**
     * Get cash summary
     */
    getCashSummary: async (date?: string) => {
        const params = date ? { date } : {};
        const response = await api.get(`${API_BASE}/cashier-billing/cash-summary`, { params });
        return response.data.data;
    },

    // ==================== EOD ====================

    /**
     * Get EOD summary
     */
    getEODSummary: async (date?: string): Promise<EODSummary> => {
        const params = date ? { date } : {};
        const response = await api.get<ApiResponse<EODSummary>>(`${API_BASE}/cashier-billing/eod-summary`, { params });
        return response.data.data as EODSummary;
    },

    /**
     * Submit EOD
     */
    submitEOD: async (actualBalance: number, notes?: string): Promise<EODSummary> => {
        const response = await api.post<ApiResponse<EODSummary>>(`${API_BASE}/cashier-billing/eod-submit`, {
            actual_balance: actualBalance,
            notes,
        });
        return response.data.data as EODSummary;
    },

    /**
     * Get EOD history
     */
    getEODHistory: async (dateFrom?: string, dateTo?: string): Promise<EODSummary[]> => {
        const params: Record<string, string> = {};
        if (dateFrom) params.date_from = dateFrom;
        if (dateTo) params.date_to = dateTo;
        const response = await api.get<ApiResponse<EODSummary[]>>(`${API_BASE}/cashier-billing/eod-history`, { params });
        return response.data.data || [];
    },

    // ==================== BRANCHES (Super Admin) ====================

    /**
     * Get all branches
     */
    getBranches: async (): Promise<Branch[]> => {
        const response = await api.get<ApiResponse<Branch[]>>(`${API_BASE}/super-admin/pos/branches`);
        return response.data.data || [];
    },

    // ==================== CASHIERS ====================

    /**
     * Get cashiers for a branch
     */
    getCashiers: async (branchId?: string) => {
        const endpoint = getApiEndpoint('/cashiers');
        const params = branchId ? { branch_id: branchId } : {};
        const response = await api.get(endpoint, { params });
        return response.data.data || [];
    },

    /**
     * Get cashiers EOD status
     */
    getCashiersEODStatus: async (branchId?: string) => {
        const endpoint = getApiEndpoint('/cashiers/eod-status');
        const params = branchId ? { branch_id: branchId } : {};
        const response = await api.get(endpoint, { params });
        return response.data.data || [];
    },

    // ==================== REPORTS ====================

    /**
     * Get sales report
     */
    getSalesReport: async (dateFrom: string, dateTo: string, branchId?: string) => {
        const params: Record<string, string> = { date_from: dateFrom, date_to: dateTo };
        if (branchId) params.branch_id = branchId;
        const response = await api.get(`${API_BASE}/cashier-billing/sales-report`, { params });
        return response.data.data;
    },

    /**
     * Get daily sales trend
     */
    getDailySalesTrend: async (days: number = 7, branchId?: string) => {
        const params: Record<string, any> = { days };
        if (branchId) params.branch_id = branchId;
        const response = await api.get(`${API_BASE}/cashier-billing/daily-sales-trend`, { params });
        return response.data.data;
    },

    // ==================== AUDIT (Branch Admin / Super Admin) ====================

    /**
     * Get audit logs
     */
    getAuditLogs: async (filters: Record<string, any> = {}) => {
        const role = getUserRole();
        const endpoint = role === SUPER_ADMIN
            ? `${API_BASE}/super-admin/audit/logs`
            : `${API_BASE}/branch-admin/audit/logs`;
        const response = await api.get(endpoint, { params: filters });
        return response.data;
    },

    /**
     * Get transaction history from audit
     */
    getTransactionHistory: async (transactionId: string) => {
        const role = getUserRole();
        const endpoint = role === SUPER_ADMIN
            ? `${API_BASE}/super-admin/audit/transactions/${transactionId}/history`
            : `${API_BASE}/branch-admin/audit/transactions/${transactionId}/history`;
        const response = await api.get(endpoint);
        return response.data.data;
    },
};

export default POSApi;
