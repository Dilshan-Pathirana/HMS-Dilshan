import { Route, Routes } from "react-router-dom";
import { useUserRole } from "../../utils/state/checkAuthenticatedUserStates.ts";
import { NonAdminAccessRedirectRoutes } from "../../routes/AdminRoutes/NonAdminAccessRedirectRoutes.tsx";
import {
    accessForAdmin,
    accessForPharmacyUser,
} from "../../utils/state/GivePermissionForUserRole.tsx";
import PharmacyNavbar from "../../components/pharmacyDashboard/Common/pharmacyNavbar/PharmacyNavbar.tsx";
import PharmacySidebar from "../../components/pharmacyDashboard/Common/PharmacySidebar.tsx";
import { useState } from "react";
import ProductListForPharmacist from "../../components/pharmacyDashboard/PharmacistUserPharamacyDashboard/product/ProductListForPharmacist.tsx";
import ProductCreateFormForAdminUser from "../../components/pharmacyDashboard/SuperAdminUserPharmacyDashboard/products/productCreate/ProductCreateFormForAdminUser.tsx";
import { RouteDefinition } from "../../utils/types/pharmacy/PharcacyDashboardLayout";
import SupplierCreateForPharmacist from "../../components/pharmacyDashboard/PharmacistUserPharamacyDashboard/supplier/SupplierCreateForPharmacist.tsx";
import SupplierListForPharmacist from "../../components/pharmacyDashboard/PharmacistUserPharamacyDashboard/supplier/SupplierListForPharmacist.tsx";
import SupplierCreateForAdmin from "../../components/pharmacyDashboard/SuperAdminUserPharmacyDashboard/supplier/SupplierCreateForAdmin.tsx";
import AllPharmaciesSupplierList
    from "../../components/pharmacyDashboard/SuperAdminUserPharmacyDashboard/supplier/AllPharmaciesSupplierList.tsx";
import AllPharmaciesInventoryList
    from "../../components/pharmacyDashboard/SuperAdminUserPharmacyDashboard/products/productList/AllPharmaciesInventoryList.tsx";
import ProductCreateForPharmacistUser
    from "../../components/pharmacyDashboard/PharmacistUserPharamacyDashboard/product/productCreate/ProductCreateForPharmacistUser.tsx";
import PharmacyDashboardMain
    from "../../components/pharmacyDashboard/SuperAdminUserPharmacyDashboard/PharmacyDashboardMain.tsx";
import PharmacistDashboardNew from "../../pages/dashboard/Pharmacist/PharmacistDashboardNew.tsx";
import { PharmacistProfile } from "../../pages/dashboard/Pharmacist/PharmacistProfile.tsx";
import { PharmacistInventory } from "../../pages/dashboard/Pharmacist/PharmacistInventory.tsx";
import { PharmacistPrescriptions } from "../../pages/dashboard/Pharmacist/PharmacistPrescriptions.tsx";
import { PharmacistDispensing } from "../../pages/dashboard/Pharmacist/PharmacistDispensing.tsx";
import { PharmacistReports } from "../../pages/dashboard/Pharmacist/PharmacistReports.tsx";
import { PharmacistPurchase } from "../../pages/dashboard/Pharmacist/PharmacistPurchase.tsx";
import { PurchaseRequest } from "../../pages/dashboard/Pharmacist/PurchaseRequest.tsx";
import { PurchaseRequestList } from "../../pages/dashboard/Pharmacist/PurchaseRequestList.tsx";
import PharmacistFeedback from "../../pages/Pharmacy/PharmacistFeedback.tsx";

const generateRoutes = (
    permission: boolean,
    accessRoutes: RouteDefinition[],
    redirectRoutes: RouteDefinition[],
) => {
    return (permission ? accessRoutes : redirectRoutes).map((route) => (
        <Route key={route.path} path={route.path} element={route.element} />
    ));
};

const DashboardLayout = () => {
    const userRole = useUserRole();
    const permissionForAdminUser = accessForAdmin(userRole);
    const permissionForPharmacistUser = accessForPharmacyUser(userRole);

    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    return (
        <>
            <PharmacyNavbar toggleSidebar={toggleSidebar} />
            <PharmacySidebar isOpenSidebarMenu={isSidebarOpen} />

            <Routes>
                {generateRoutes(
                    permissionForPharmacistUser,
                    [
                        {
                            path: "/",
                            element: <PharmacistDashboardNew />,
                        },
                        {
                            path: "/dashboard",
                            element: <PharmacistDashboardNew />,
                        },
                        {
                            path: "/profile",
                            element: <PharmacistProfile />,
                        },
                        {
                            path: "/inventory",
                            element: <PharmacistInventory />,
                        },
                        {
                            path: "/prescriptions",
                            element: <PharmacistPrescriptions />,
                        },
                        {
                            path: "/dispensing",
                            element: <PharmacistDispensing />,
                        },
                        {
                            path: "/reports",
                            element: <PharmacistReports />,
                        },
                        {
                            path: "/purchase",
                            element: <PurchaseRequestList />,
                        },
                        {
                            path: "/purchase-request",
                            element: <PurchaseRequest />,
                        },
                        {
                            path: "/purchase-requests",
                            element: <PurchaseRequestList />,
                        },
                        {
                            path: "/purchase-orders",
                            element: <PharmacistPurchase />,
                        },
                        {
                            path: "/product-create",
                            element: <ProductCreateForPharmacistUser />,
                        },
                        {
                            path: "/product-list",
                            element: <ProductListForPharmacist />,
                        },
                        {
                            path: "/add-Supplier",
                            element: <SupplierCreateForPharmacist />,
                        },
                        {
                            path: "/supplier-list",
                            element: <SupplierListForPharmacist />,
                        },
                        {
                            path: "/feedback",
                            element: <PharmacistFeedback />,
                        },
                    ],
                    NonAdminAccessRedirectRoutes,
                )}
                {generateRoutes(
                    permissionForAdminUser,
                    [
                        {
                            path: "/",
                            element: <PharmacyDashboardMain />,
                        },
                        {
                            path: "/pharmacies",
                            element: <PharmacyDashboardMain />,
                        },
                        {
                            path: "/product-create",
                            element: <ProductCreateFormForAdminUser />,
                        },
                        {
                            path: "/product-list",
                            element: <AllPharmaciesInventoryList />,
                        },
                        {
                            path: "/add-Supplier",
                            element: <SupplierCreateForAdmin />,
                        },
                        {
                            path: "/supplier-list",
                            element: <AllPharmaciesSupplierList />,
                        },
                    ],
                    NonAdminAccessRedirectRoutes,
                )}
            </Routes>
        </>
    );
};

export default DashboardLayout;
