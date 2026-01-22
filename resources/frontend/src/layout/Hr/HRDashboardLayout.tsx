import { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import HrNavbar from "../../components/hrDashboard/Common/HrNavbar.tsx";
import HrSidebar from "../../components/hrDashboard/Common/HrSidebar.tsx";
import { useUserRole } from "../../utils/state/checkAuthenticatedUserStates.ts";
import {
    accessForAdmin,
    accessForPharmacyUser,
    accessForCashierUser,
} from "../../utils/state/GivePermissionForUserRole.tsx";
import { NonAdminAccessRedirectRoutes } from "../../routes/AdminRoutes/NonAdminAccessRedirectRoutes.tsx";
import LeaveManagement from "../../pages/HRDashboard/Leave/LeaveManagement.tsx";
import HRShiftManagement from "../../pages/HRDashboard/Shift/HRShiftManagement.tsx";
import ShiftManagement from "../../pages/dashboard/Users/ShiftManagement/ShiftManagement.tsx";
import LeaveRequestManagement from "../../pages/HRDashboard/LeaveRequest/LeaveRequestManagement.tsx";
import SalaryManagement from "../../pages/HRDashboard/Salary/SalaryManagement.tsx";
import OTManagement from "../../pages/HRDashboard/OT/OTManagement.tsx";
import SalaryPayManagement from "../../pages/HRDashboard/Salary/SalaryPay/SalaryPayManagement.tsx";
// New HRM Dashboards
import SuperAdminHRMDashboard from "../../pages/dashboard/HRM/SuperAdmin/SuperAdminHRMDashboard.tsx";
import BranchAdminHRMDashboard from "../../pages/dashboard/HRM/BranchAdmin/BranchAdminHRMDashboard.tsx";
import EmployeeHRMDashboard from "../../pages/dashboard/HRM/Employee/EmployeeHRMDashboard.tsx";
import HRPolicies from "../../pages/HRM/HRPolicies.tsx";
import LeaveTypes from "../../pages/HRM/LeaveTypes.tsx";
import ShiftTemplates from "../../pages/HRM/ShiftTemplates.tsx";
import PayrollConfig from "../../pages/HRM/PayrollConfig.tsx";

type RouteDefinition = {
    path: string;
    element: React.ReactNode;
};

const generateRoutes = (
    permission: boolean,
    accessRoutes: RouteDefinition[],
    redirectRoutes: RouteDefinition[],
) => {
    return (permission ? accessRoutes : redirectRoutes).map((route) => (
        <Route key={route.path} path={route.path} element={route.element} />
    ));
};

const HRDashboardLayout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const userRole = useUserRole();
    const permissionForAdminUser = accessForAdmin(userRole);
    const permissionForPharmacistUser = accessForPharmacyUser(userRole);
    const permissionForCashierUser = accessForCashierUser(userRole);

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    // Determine which dashboard to show based on role
    const getDashboardComponent = () => {
        if (permissionForAdminUser) {
            return <SuperAdminHRMDashboard />;
        } else if (userRole === 'branch_admin' || userRole === 'manager') {
            return <BranchAdminHRMDashboard />;
        } else {
            return <EmployeeHRMDashboard />;
        }
    };

    return (
        <Routes>
            {/* New HRM Dashboard - Main entry point */}
            <Route path="/" element={getDashboardComponent()} />
            
            {/* Super Admin HRM routes */}
            <Route path="/super-admin" element={<SuperAdminHRMDashboard />} />
            <Route path="/super-admin/hrm/policies" element={<HRPolicies />} />
            <Route path="/super-admin/hrm/leave-types" element={<LeaveTypes />} />
            <Route path="/super-admin/hrm/shift-templates" element={<ShiftTemplates />} />
            <Route path="/super-admin/hrm/payroll-config" element={<PayrollConfig />} />
            <Route path="/branch-admin" element={<BranchAdminHRMDashboard />} />
            <Route path="/employee" element={<EmployeeHRMDashboard />} />
            
            {/* Legacy routes with old layout */}
            {generateRoutes(
                permissionForAdminUser,
                [
                    {
                        path: "/shift-management",
                        element: (
                            <>
                                <HrNavbar toggleSidebar={toggleSidebar} />
                                <HrSidebar isOpenSidebarMenu={isSidebarOpen} />
                                <ShiftManagement />
                            </>
                        ),
                    },
                    {
                        path: "/ot-management",
                        element: (
                            <>
                                <HrNavbar toggleSidebar={toggleSidebar} />
                                <HrSidebar isOpenSidebarMenu={isSidebarOpen} />
                                <OTManagement />
                            </>
                        ),
                    },
                    {
                        path: "/leave-request",
                        element: (
                            <>
                                <HrNavbar toggleSidebar={toggleSidebar} />
                                <HrSidebar isOpenSidebarMenu={isSidebarOpen} />
                                <LeaveRequestManagement />
                            </>
                        ),
                    },
                    {
                        path: "/staff-salary",
                        element: (
                            <>
                                <HrNavbar toggleSidebar={toggleSidebar} />
                                <HrSidebar isOpenSidebarMenu={isSidebarOpen} />
                                <SalaryManagement />
                            </>
                        ),
                    },
                    {
                        path: "/staff-salary-pay",
                        element: (
                            <>
                                <HrNavbar toggleSidebar={toggleSidebar} />
                                <HrSidebar isOpenSidebarMenu={isSidebarOpen} />
                                <SalaryPayManagement />
                            </>
                        ),
                    },
                ],
                NonAdminAccessRedirectRoutes,
            )}
            {generateRoutes(
                permissionForPharmacistUser,
                [
                    {
                        path: "/leave-management",
                        element: (
                            <>
                                <HrNavbar toggleSidebar={toggleSidebar} />
                                <HrSidebar isOpenSidebarMenu={isSidebarOpen} />
                                <LeaveManagement />
                            </>
                        ),
                    },
                    {
                        path: "/shift-management",
                        element: (
                            <>
                                <HrNavbar toggleSidebar={toggleSidebar} />
                                <HrSidebar isOpenSidebarMenu={isSidebarOpen} />
                                <HRShiftManagement />
                            </>
                        ),
                    },
                    {
                        path: "/leave-request",
                        element: (
                            <>
                                <HrNavbar toggleSidebar={toggleSidebar} />
                                <HrSidebar isOpenSidebarMenu={isSidebarOpen} />
                                <LeaveRequestManagement />
                            </>
                        ),
                    },
                ],
                NonAdminAccessRedirectRoutes,
            )}
            {generateRoutes(
                permissionForCashierUser,
                [
                    {
                        path: "/leave-management",
                        element: (
                            <>
                                <HrNavbar toggleSidebar={toggleSidebar} />
                                <HrSidebar isOpenSidebarMenu={isSidebarOpen} />
                                <LeaveManagement />
                            </>
                        ),
                    },
                    {
                        path: "/leave-request",
                        element: (
                            <>
                                <HrNavbar toggleSidebar={toggleSidebar} />
                                <HrSidebar isOpenSidebarMenu={isSidebarOpen} />
                                <LeaveRequestManagement />
                            </>
                        ),
                    },
                    {
                        path: "/shift-management",
                        element: (
                            <>
                                <HrNavbar toggleSidebar={toggleSidebar} />
                                <HrSidebar isOpenSidebarMenu={isSidebarOpen} />
                                <HRShiftManagement />
                            </>
                        ),
                    },
                ],
                NonAdminAccessRedirectRoutes,
            )}
        </Routes>
    );
};

export default HRDashboardLayout;
