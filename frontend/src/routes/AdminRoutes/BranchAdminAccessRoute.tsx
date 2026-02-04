import React from "react";
import CashierBillingPOS from "../../pages/CashierBilling/CashierBillingPOS.tsx";
import CashierCashEntries from "../../pages/CashierBilling/CashierCashEntries.tsx";
import CashierTransactionList from "../../pages/CashierBilling/CashierTransactionList.tsx";
import CashierEODProcess from "../../pages/CashierBilling/CashierEODProcess.tsx";
import CashierReports from "../../pages/CashierBilling/CashierReports.tsx";
import BranchAdminPOSDashboard from "../../pages/BranchAdminPOS/BranchAdminPOSDashboard.tsx";
import BranchAdminPOSAnalytics from "../../pages/BranchAdminPOS/BranchAdminPOSAnalytics.tsx";
import BranchAdminCashierManagement from "../../pages/BranchAdminPOS/BranchAdminCashierManagement.tsx";
import BranchAdminEODManagement from "../../pages/BranchAdminPOS/BranchAdminEODManagement.tsx";

type RouteDefinition = { path: string; element: React.ReactNode };

/**
 * Branch Admin POS Access Routes
 * 
 * Branch Admin can access POS functionality for their own branch only.
 * - Dashboard: Overview of branch POS performance
 * - Analytics: Branch-specific sales analytics
 * - POS: Point of sale terminal (same as cashier)
 * - Cashiers: View and manage branch cashiers
 * - Cash Entries: Cash in/out management
 * - Transactions: View all branch transactions
 * - EOD: End of day process monitoring
 * - Reports: Branch-specific sales reports
 */
const BranchAdminAccessRoutes: RouteDefinition[] = [
    // Main Dashboard - Branch Admin POS Dashboard with branch overview
    {
        path: "",
        element: <BranchAdminPOSDashboard />,
    },
    // Analytics - Branch-specific sales analytics
    {
        path: "/analytics",
        element: <BranchAdminPOSAnalytics />,
    },
    // Point of Sale - Create new billing transactions
    {
        path: "/pos",
        element: <CashierBillingPOS />,
    },
    // Cashier Management - View and manage branch cashiers
    {
        path: "/cashiers",
        element: <BranchAdminCashierManagement />,
    },
    // Cash Entries - Record cash in/out
    {
        path: "/cash-entries",
        element: <CashierCashEntries />,
    },
    // Transactions - View all transactions for branch
    {
        path: "/transactions",
        element: <CashierTransactionList />,
    },
    // End of Day - Review and approve cashier EOD submissions
    {
        path: "/eod",
        element: <BranchAdminEODManagement />,
    },
    // Reports - Branch-specific sales reports
    {
        path: "/reports",
        element: <CashierReports />,
    },
];

export default BranchAdminAccessRoutes;
