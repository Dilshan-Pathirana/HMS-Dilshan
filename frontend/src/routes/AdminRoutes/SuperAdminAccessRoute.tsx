import SuperAdminDashboardPage from "../../components/pharmacyPOS/SuperAdminPOS/SuperAdminPOSDashboard/SuperAdminDashboard.tsx";
import SuperAdminPOSDashboardEnhanced from "../../components/pharmacyPOS/SuperAdminPOS/SuperAdminPOSDashboard/SuperAdminPOSDashboardEnhanced.tsx";
import SuperAdminPOSAnalytics from "../../components/pharmacyPOS/SuperAdminPOS/SuperAdminPOSAnalytics/SuperAdminPOSAnalytics.tsx";
import SuperAdminSalesPage from "../../components/pharmacyPOS/SuperAdminPOS/SuperAdminPOSSalesPage/SuperAdminSales.tsx";
import SuperAdminInventoryPage from "../../components/pharmacyPOS/SuperAdminPOS/SuperAdminPOSInventoryPage/SuperAdminInventory.tsx";
import SuperAdminPurchasingPage from "../../components/pharmacyPOS/SuperAdminPOS/SuperAdminPurchasingPage/SuperAdminPurchasing.tsx";
import SuperAdminDamageStockListPage from "../../components/pharmacyPOS/SuperAdminPOS/SuperAdminPOSDamageStock/SuperAdminDamageStockList/SuperAdminDamageStockList.tsx";
import SuperAdminAddDamageStock from "../../components/pharmacyPOS/SuperAdminPOS/SuperAdminPOSDamageStock/SuperAdminDamageStockAdd/SuperAdminAddDamageStock.tsx";
import SuperAdminStockTransfer from "../../components/pharmacyPOS/SuperAdminPOS/SuperAdminPOSStockTransfer/SuperAdminStockTransferAdd/SuperAdminStockTransfer.tsx";
import SuperAdminStockTransferListPage from "../../components/pharmacyPOS/SuperAdminPOS/SuperAdminPOSStockTransfer/SuperAdminStockTransferList/SuperAdminStockTransferList.tsx";
import SuperAdminReOrderListPage from "../../components/pharmacyPOS/SuperAdminPOS/SuperAdminPOSReStockPage/SuperAdminReStockList/SuperAdminReOrderList.tsx";
import SuperAdminAddReStock from "../../components/pharmacyPOS/SuperAdminPOS/SuperAdminPOSReStockPage/SuperAdminReStockAdd/SuperAdminReStockAdd.tsx";
import React from "react";
import SuperAdminAddDiscount
    from "../../components/pharmacyPOS/SuperAdminPOS/SuperAdminPOSProductDiscountPage/SuperAdminProductDiscountAdd/SuperAdminAddDiscount.tsx";
import ProductDiscountList
    from "../../components/pharmacyPOS/Common/ProductDiscountList/ProductDiscountList.tsx";
import SuperAdminPOSPage from "../../pages/SuperAdminPOS/SuperAdminPOSPage.tsx";
import SuperAdminCashierManagement from "../../pages/SuperAdminPOS/SuperAdminCashierManagement.tsx";

type RouteDefinition = { path: string; element: React.ReactNode }
const AdminAccessRoutes: RouteDefinition[] = [
    {
        path: "",
        element: <SuperAdminPOSDashboardEnhanced />,
    },
    {
        path: "analytics",
        element: <SuperAdminPOSAnalytics />,
    },
    {
        path: "pos",
        element: <SuperAdminPOSPage />,
    },
    {
        path: "cashiers",
        element: <SuperAdminCashierManagement />,
    },
    {
        path: "sales",
        element: <SuperAdminSalesPage />,
    },
    {
        path: "inventory",
        element: <SuperAdminInventoryPage />,
    },
    {
        path: "purchasing",
        element: <SuperAdminPurchasingPage />,
    },
    {
        path: "damage-stock/view",
        element: <SuperAdminDamageStockListPage />,
    },
    {
        path: "damage-stock/add",
        element: <SuperAdminAddDamageStock />,
    },
    {
        path: "stock-movement/transfer",
        element: <SuperAdminStockTransfer />,
    },
    {
        path: "stock-movement/history",
        element: <SuperAdminStockTransferListPage />,
    },
    {
        path: "re-order-stock/list",
        element: <SuperAdminReOrderListPage />,
    },
    {
        path: "re-order-stock/add",
        element: <SuperAdminAddReStock />,
    },
    {
        path: "product-discount/add",
        element: <SuperAdminAddDiscount />,
    },
    {
        path: "product-discount/list",
        element: <ProductDiscountList />,
    },
];

export default AdminAccessRoutes;
