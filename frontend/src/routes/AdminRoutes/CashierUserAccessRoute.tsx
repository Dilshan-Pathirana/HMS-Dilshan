import React from "react";
import CashierBillingDashboard from "../../pages/CashierBilling/CashierBillingDashboard.tsx";
import CashierBillingPOS from "../../pages/CashierBilling/CashierBillingPOS.tsx";
import CashierCashEntries from "../../pages/CashierBilling/CashierCashEntries.tsx";
import CashierTransactionList from "../../pages/CashierBilling/CashierTransactionList.tsx";
import CashierEODProcess from "../../pages/CashierBilling/CashierEODProcess.tsx";
import CashierReports from "../../pages/CashierBilling/CashierReports.tsx";
import POSProfile from "../../pages/POS/POSProfile.tsx";
import POSSettings from "../../pages/POS/POSSettings.tsx";
import CashierFeedback from "../../pages/POS/CashierFeedback.tsx";
import CashierHRDashboard from "../../pages/POS/CashierHR/CashierHRDashboard.tsx";
import CashierSchedules from "../../pages/POS/CashierHR/CashierSchedules.tsx";
import CashierScheduleRequests from "../../pages/POS/CashierHR/CashierScheduleRequests.tsx";
import CashierOvertimeAndSalary from "../../pages/POS/CashierHR/CashierOvertimeAndSalary.tsx";
import CashierPayslips from "../../pages/POS/CashierHR/CashierPayslips.tsx";
import CashierServiceLetters from "../../pages/POS/CashierHR/CashierServiceLetters.tsx";
import CashierPolicies from "../../pages/POS/CashierHR/CashierPolicies.tsx";
import CashierPendingConsultations from "../../pages/CashierBilling/CashierPendingConsultations.tsx";

type RouteDefinition = { path: string; element: React.ReactNode };

const CashierUserAccessRoutes: RouteDefinition[] = [
    // Main Dashboard - Cashier Billing Dashboard is now the main dashboard
    {
        path: "",
        element: <CashierBillingDashboard />,
    },
    // Point of Sale - Create new billing transactions
    {
        path: "pos",
        element: <CashierBillingPOS />,
    },
    // Cash Entries - Record cash in/out
    {
        path: "cash-entries",
        element: <CashierCashEntries />,
    },
    // Transactions - View all transactions
    {
        path: "transactions",
        element: <CashierTransactionList />,
    },
    // End of Day - Daily reconciliation
    {
        path: "eod",
        element: <CashierEODProcess />,
    },
    // Reports - Sales and transaction reports
    {
        path: "reports",
        element: <CashierReports />,
    },
    // Profile - Edit personal profile
    {
        path: "profile",
        element: <POSProfile />,
    },
    // Settings - User settings
    {
        path: "settings",
        element: <POSSettings />,
    },
    // Feedback - Submit feedback and complaints
    {
        path: "feedback",
        element: <CashierFeedback />,
    },
    // HR Module - HR self-service portal
    {
        path: "hr",
        element: <CashierHRDashboard />,
    },
    {
        path: "hr/schedules",
        element: <CashierSchedules />,
    },
    {
        path: "hr/schedule-requests",
        element: <CashierScheduleRequests />,
    },
    {
        path: "hr/overtime-salary",
        element: <CashierOvertimeAndSalary />,
    },
    {
        path: "hr/payslips",
        element: <CashierPayslips />,
    },
    {
        path: "hr/service-letters",
        element: <CashierServiceLetters />,
    },
    {
        path: "hr/policies",
        element: <CashierPolicies />,
    },
    // Consultations - View pending consultation payments
    {
        path: "consultations",
        element: <CashierPendingConsultations />,
    },
];
export default CashierUserAccessRoutes;
