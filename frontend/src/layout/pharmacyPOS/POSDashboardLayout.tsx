import { Route, Routes } from "react-router-dom";
import { useUserRole } from "../../utils/state/checkAuthenticatedUserStates";
import { NonAdminAccessRedirectRoutes } from "../../routes/AdminRoutes/NonAdminAccessRedirectRoutes";
import {
    accessForAdmin,
    accessForBranchAdmin,
    accessForCashierUser,
    accessForDoctorUser,
    accessForPharmacyUser,
} from "../../utils/state/GivePermissionForUserRole";
import ModernPOSNavbar from "../../components/pharmacyPOS/Common/Navbar/ModernPOSNavbar.tsx";
import POSSidebar from "../../components/pharmacyPOS/Common/POSSidebar.tsx";
import { useState } from "react";
import SuperAdminAccessRoutes from "../../routes/AdminRoutes/SuperAdminAccessRoute.tsx";
import BranchAdminAccessRoutes from "../../routes/AdminRoutes/BranchAdminAccessRoute.tsx";
import CashierUserAccessRoutes from "../../routes/AdminRoutes/CashierUserAccessRoute.tsx";
import PharmacistUserAccessRoutes from "../../routes/AdminRoutes/PharmacistUserAccessRoute.tsx";
import { BranchProvider } from "../../context/POS/BranchContext.tsx";

type RouteDefinition = { path: string; element: React.ReactNode };
type GenerateRoutesProps = (
    permission: boolean,
    accessRoutes: RouteDefinition[],
    redirectRoutes: RouteDefinition[],
) => JSX.Element[];

const generateRoutes: GenerateRoutesProps = (
    permission,
    accessRoutes,
    redirectRoutes,
) => {
    return (permission ? accessRoutes : redirectRoutes).map((route) => (
        <Route key={route.path} path={route.path} element={route.element} />
    ));
};

const POSDashboardLayout = () => {
    const userRole = useUserRole();
    const permissionForAdminUser = accessForAdmin(userRole);
    const permissionForBranchAdminUser = accessForBranchAdmin(userRole);
    const permissionForCashierUser = accessForCashierUser(userRole);
    const permissionForPharmacyUser = accessForPharmacyUser(userRole);
    const permissionForDoctorUser = accessForDoctorUser(userRole);

    const [sidebarOpen, setSidebarOpen] = useState(true);
    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    return (
        <BranchProvider>
            <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50/30">
                {/* Fixed Sidebar */}
                <div className="fixed top-0 left-0 h-full z-30">
                    <POSSidebar sidebarOpen={sidebarOpen} userRole={userRole} />
                </div>

                {/* Main Content Area */}
                <div className={`flex flex-col flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
                    {/* Fixed Modern Navbar */}
                    <div className="fixed top-0 right-0 left-0 z-20" style={{ marginLeft: sidebarOpen ? '256px' : '80px' }}>
                        <ModernPOSNavbar toggleSidebar={toggleSidebar} />
                    </div>

                    {/* Main Content with proper spacing */}
                    <main className="flex-1 flex flex-col mt-16 p-6 bg-gradient-to-br from-gray-50/50 via-white to-emerald-50/20">
                        <Routes>
                            {generateRoutes(
                                permissionForAdminUser,
                                SuperAdminAccessRoutes,
                                NonAdminAccessRedirectRoutes,
                            )}

                            {generateRoutes(
                                permissionForBranchAdminUser,
                                BranchAdminAccessRoutes,
                                NonAdminAccessRedirectRoutes,
                            )}

                            {generateRoutes(
                                permissionForCashierUser || permissionForDoctorUser,
                                CashierUserAccessRoutes,
                                NonAdminAccessRedirectRoutes,
                            )}
                            {generateRoutes(
                                permissionForPharmacyUser,
                                PharmacistUserAccessRoutes,
                                NonAdminAccessRedirectRoutes,
                            )}
                            
                            {/* Fallback route for debugging */}
                            <Route path="*" element={
                                <div className="flex flex-col items-center justify-center min-h-[50vh] text-gray-600">
                                    <p className="text-lg mb-2">No matching route found</p>
                                    <p className="text-sm">User Role: {userRole}</p>
                                    <p className="text-sm mt-2">
                                        Admin: {permissionForAdminUser ? 'Yes' : 'No'} | 
                                        Branch Admin: {permissionForBranchAdminUser ? 'Yes' : 'No'} | 
                                        Cashier: {permissionForCashierUser ? 'Yes' : 'No'} | 
                                        Pharmacy: {permissionForPharmacyUser ? 'Yes' : 'No'} | 
                                        Doctor: {permissionForDoctorUser ? 'Yes' : 'No'}
                                    </p>
                                </div>
                            } />
                        </Routes>
                    </main>
                </div>
            </div>
        </BranchProvider>
    );
};

export default POSDashboardLayout;
