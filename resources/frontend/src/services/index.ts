/**
 * Services Index
 * Export all API services
 */

export { POSApi, default as posApi } from './posApi';
export type { 
    Branch, 
    Product, 
    Transaction, 
    TransactionData, 
    TransactionItem,
    DashboardStats,
    EODSummary,
    CashEntry,
    LowStockItem,
    ApiResponse
} from './posApi';

// Re-export other services as default imports
export { default as appointmentService } from './appointmentService';
export { default as nurseService } from './nurseService';
export { default as receptionistService } from './receptionistService';
