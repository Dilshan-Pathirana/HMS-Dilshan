import type { ReactNode } from "react";
import { Route, Routes } from "react-router-dom";
import { useUserRole } from "../utils/state/checkAuthenticatedUserStates.ts";
import { accessForAdmin } from "../utils/state/GivePermissionForUserRole.tsx";
import { NonAdminAccessRedirectRoutes } from "../routes/AdminRoutes/NonAdminAccessRedirectRoutes.tsx";
import { useSelector } from "react-redux";
import { RootState } from "../store";
import { DashboardLayout as NewDashboardLayout } from "../components/common/Layout/DashboardLayout.tsx";
import { SidebarMenu, SuperAdminMenuItems, BranchAdminMenuItems } from "../components/common/Layout/SidebarMenu.tsx";
import UsersCreatePage from "../pages/dashboard/Users/UsersCreatePage.tsx";
import UserManagement from "../pages/dashboard/Users/UserManagement/UserManagement.tsx";
import BranchView from "../pages/dashboard/Branch/BranchView/BranchView.tsx";
import PharmacyManagement from "../pages/dashboard/Branch/PharmacyManagement.tsx";
import DoctorScheduleManagement from "../pages/Appoiment/DoctorSchedule/DoctorScheduleManagement.tsx";
import DoctorAppointmentManagement from "../pages/Appoiment/AppoimentShedule/DoctorAppointmentManagement.tsx";
import DoctorScheduleDetails from "../pages/Appoiment/AppoimentShedule/DoctorScheduleDetails.tsx";
import AllAppointmentManagement from "../pages/Appoiment/AllAppointment/AllAppointmentManagement.tsx";
import DoctorScheduleCancellationManagement from "../pages/DoctorScheduleCancel/DoctorScheduleCancellationManagement.tsx";
import CreateQuestions from "../pages/dashboard/Users/Patient/CreateQuestions.tsx";
import GetAllQuestions from "../pages/dashboard/Users/Patient/GetAllQuestions.tsx";
import DoctorSessionCreate from "../pages/dashboard/DoctorSession/DoctorSessionCreate.tsx";
import DoctorCreatedDisease from "../pages/dashboard/DoctorDiseases/DoctorCreatedDisease.tsx";
import DoctorDiseaseTable from "../pages/dashboard/DoctorDiseases/DoctorDiseaseTable.tsx";
import SuperAdminMainDashboard from "../pages/dashboard/SuperAdmin/SuperAdminMainDashboard.tsx";
import { SuperAdminReportsContent } from "../pages/dashboard/SuperAdmin/SuperAdminReportsContent.tsx";
import { SuperAdminAnalyticsContent } from "../pages/dashboard/SuperAdmin/SuperAdminAnalyticsContent.tsx";
import { SuperAdminSettingsContent } from "../pages/dashboard/SuperAdmin/SuperAdminSettingsContent.tsx";
import SuperAdminPharmacies from "../pages/dashboard/SuperAdmin/SuperAdminPharmacies.tsx";
import SuperAdminConsultationMonitor from "../pages/dashboard/SuperAdmin/SuperAdminConsultationMonitor.tsx";
// POS Management imports
import SuperAdminPOSDashboardEnhanced from "../components/pharmacyPOS/SuperAdminPOS/SuperAdminPOSDashboard/SuperAdminPOSDashboardEnhanced.tsx";
import SuperAdminPOSDashboardZoned from "../components/pharmacyPOS/SuperAdminPOS/SuperAdminPOSDashboard/SuperAdminPOSDashboardZoned.tsx";
import SuperAdminPOSAnalytics from "../components/pharmacyPOS/SuperAdminPOS/SuperAdminPOSAnalytics/SuperAdminPOSAnalytics.tsx";
import SuperAdminPOSPage from "../pages/SuperAdminPOS/SuperAdminPOSPage.tsx";
import SuperAdminCashierManagement from "../pages/SuperAdminPOS/SuperAdminCashierManagement.tsx";
import SuperAdminSalesPage from "../components/pharmacyPOS/SuperAdminPOS/SuperAdminPOSSalesPage/SuperAdminSales.tsx";
import SuperAdminInventoryPage from "../components/pharmacyPOS/SuperAdminPOS/SuperAdminPOSInventoryPage/SuperAdminInventory.tsx";
import SuperAdminPurchasingPage from "../components/pharmacyPOS/SuperAdminPOS/SuperAdminPurchasingPage/SuperAdminPurchasing.tsx";
import SuperAdminDamageStockListPage from "../components/pharmacyPOS/SuperAdminPOS/SuperAdminPOSDamageStock/SuperAdminDamageStockList/SuperAdminDamageStockList.tsx";
import SuperAdminAddDamageStock from "../components/pharmacyPOS/SuperAdminPOS/SuperAdminPOSDamageStock/SuperAdminDamageStockAdd/SuperAdminAddDamageStock.tsx";
import SuperAdminStockTransfer from "../components/pharmacyPOS/SuperAdminPOS/SuperAdminPOSStockTransfer/SuperAdminStockTransferAdd/SuperAdminStockTransfer.tsx";
import SuperAdminStockTransferListPage from "../components/pharmacyPOS/SuperAdminPOS/SuperAdminPOSStockTransfer/SuperAdminStockTransferList/SuperAdminStockTransferList.tsx";
import SuperAdminReOrderListPage from "../components/pharmacyPOS/SuperAdminPOS/SuperAdminPOSReStockPage/SuperAdminReStockList/SuperAdminReOrderList.tsx";
import SuperAdminAddReStock from "../components/pharmacyPOS/SuperAdminPOS/SuperAdminPOSReStockPage/SuperAdminReStockAdd/SuperAdminReStockAdd.tsx";
import SuperAdminAddDiscount from "../components/pharmacyPOS/SuperAdminPOS/SuperAdminPOSProductDiscountPage/SuperAdminProductDiscountAdd/SuperAdminAddDiscount.tsx";
import ProductDiscountList from "../components/pharmacyPOS/Common/ProductDiscountList/ProductDiscountList.tsx";
// Enhanced POS imports
import DiscountManagement from "../components/pharmacyPOS/SuperAdminPOS/Discounts/DiscountManagement.tsx";
import PriceOverrideRequests from "../components/pharmacyPOS/SuperAdminPOS/PriceOverrides/PriceOverrideRequests.tsx";
import { BranchProvider } from "../context/POS/BranchContext.tsx";

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

// Helper to get role name from role ID
const getRoleName = (roleId: number | null): string => {
    switch (roleId) {
        case 1: return 'Super Admin';
        case 2: return 'Branch Admin';
        case 3: return 'Doctor';
        case 4: return 'Nurse';
        case 5: return 'Patient';
        case 6: return 'Cashier';
        case 7: return 'Pharmacist';
        case 8: return 'IT Support';
        case 9: return 'Center Aid';
        case 10: return 'Auditor';
        default: return 'User';
    }
};

type DashboardLayoutProps = {
    children?: ReactNode;
};

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
    const userRole = useUserRole();
    const permissionForAdminUser = accessForAdmin(userRole);
    const authState = useSelector((state: RootState) => state.auth);

    // Determine which menu items to use based on user role
    const getMenuItems = () => {
        if (userRole === 2) {
            return BranchAdminMenuItems;
        }
        return SuperAdminMenuItems;
    };

    // Get user name from localStorage since authState doesn't store it
    const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
    const userName = userInfo.first_name && userInfo.last_name
        ? `${userInfo.first_name} ${userInfo.last_name}`
        : authState.userType || 'Admin User';
    const roleName = getRoleName(authState.userRole);

    return (
        <BranchProvider>
            <NewDashboardLayout
                userName={userName}
                userRole={roleName}
                sidebarContent={<SidebarMenu items={getMenuItems()} />}
                branchName="Hospital Management"
            >
                {children ? (
                    children
                ) : (
                    <Routes>
                    {/* Default dashboard route */}
                    <Route index element={<SuperAdminMainDashboard />} />
                    <Route path="super-admin/reports" element={<SuperAdminReportsContent />} />
                    <Route path="super-admin/analytics" element={<SuperAdminAnalyticsContent />} />
                    <Route path="super-admin/settings" element={<SuperAdminSettingsContent />} />
                    <Route path="super-admin/pharmacies" element={<SuperAdminPharmacies />} />
                    <Route path="super-admin/consultation-monitor" element={<SuperAdminConsultationMonitor />} />

                    {/* POS Management Routes */}
                    <Route path="pos" element={<SuperAdminPOSDashboardZoned />} />
                    <Route path="pos/dashboard" element={<SuperAdminPOSDashboardEnhanced />} />
                    <Route path="pos/analytics" element={<SuperAdminPOSAnalytics />} />
                    <Route path="pos/pos" element={<SuperAdminPOSPage />} />
                    <Route path="pos/transactions" element={<SuperAdminPOSPage />} />
                    <Route path="pos/cashiers" element={<SuperAdminCashierManagement />} />
                    <Route path="pos/sales" element={<SuperAdminSalesPage />} />
                    <Route path="pos/inventory" element={<SuperAdminInventoryPage />} />
                    <Route path="pos/purchasing" element={<SuperAdminPurchasingPage />} />
                    <Route path="pos/damage-stock/view" element={<SuperAdminDamageStockListPage />} />
                    <Route path="pos/damage-stock/add" element={<SuperAdminAddDamageStock />} />
                    <Route path="pos/stock-movement/transfer" element={<SuperAdminStockTransfer />} />
                    <Route path="pos/stock-movement/history" element={<SuperAdminStockTransferListPage />} />
                    <Route path="pos/re-order-stock/list" element={<SuperAdminReOrderListPage />} />
                    <Route path="pos/re-order-stock/add" element={<SuperAdminAddReStock />} />
                    <Route path="pos/product-discount/add" element={<SuperAdminAddDiscount />} />
                    <Route path="pos/product-discount/list" element={<ProductDiscountList />} />
                    {/* Enhanced POS Routes */}
                    <Route path="pos/discounts" element={<DiscountManagement />} />
                    <Route path="pos/discounts/active" element={<DiscountManagement />} />
                    <Route path="pos/price-overrides" element={<PriceOverrideRequests />} />

                    {generateRoutes(
                        permissionForAdminUser,
                        [
                            {
                                path: "/branch",
                                element: <BranchView />,
                            },
                            {
                                path: "/branch/pharmacies",
                                element: <PharmacyManagement />,
                            },
                            { path: "/users/create", element: <UsersCreatePage /> },
                            { path: "/users/list", element: <UserManagement /> },
                            {
                                path: "/doctor/schedule",
                                element: <DoctorScheduleManagement />,
                            },
                            {
                                path: "/doctor/schedule/cancel-request",
                                element: <DoctorScheduleCancellationManagement />,
                            },
                            {
                                path: "/doctor/appointment",
                                element: <DoctorAppointmentManagement />,
                            },
                            {
                                path: "/doctor/doctor-schedule-details",
                                element: <DoctorScheduleDetails />,
                            },
                            {
                                path: "/all/appointment",
                                element: <AllAppointmentManagement />,
                            },
                            {
                                path: "/patient/create-questions",
                                element: <CreateQuestions />,
                            },
                            {
                                path: "/patient/all-questions",
                                element: <GetAllQuestions />,
                            },
                            {
                                path: "/doctor/create-session",
                                element: <DoctorSessionCreate />,
                            },
                            {
                                path: "/doctor/create-diseases",
                                element: <DoctorCreatedDisease />,
                            },
                            {
                                path: "/doctor/all-diseases",
                                element: <DoctorDiseaseTable />,
                            },
                        ],
                        NonAdminAccessRedirectRoutes,
                    )}
                    </Routes>
                )}
            </NewDashboardLayout>
        </BranchProvider>
    );
};

export default DashboardLayout;
