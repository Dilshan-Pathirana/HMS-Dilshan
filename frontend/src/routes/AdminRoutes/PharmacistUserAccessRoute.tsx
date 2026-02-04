import React from "react";
import PharmacistUserDashboard from "../../components/pharmacyPOS/PharmacistUserPOS/PharmacistUserPOSDashboard/PharmacistUserDashboard.tsx";
import PharmacistUserSalesPage from "../../components/pharmacyPOS/PharmacistUserPOS/PharmacistUserPOSSalesPage/PharmacistUserSales.tsx";
import PharmacistUserInventoryPage from "../../components/pharmacyPOS/PharmacistUserPOS/PharmacistUserPOSInventoryPage/PharmacistUserInventory.tsx";
import PharmacistUserPurchasingPage from "../../components/pharmacyPOS/PharmacistUserPOS/PharmacistUserPurchasingPage/PharmacistUserPurchasing.tsx";
import PharmacistUserAddDamageStock from "../../components/pharmacyPOS/PharmacistUserPOS/PharmacistUserPOSDamageStock/PharmacistUserDamageStockAdd/PharmacistUserAddDamageStock.tsx";
import PharmacistUserDamageStockListPage from "../../components/pharmacyPOS/PharmacistUserPOS/PharmacistUserPOSDamageStock/PharmacistUserDamageStockList/PharmacistUserDamageStockList.tsx";
import PharmacistUserStockTransfer from "../../components/pharmacyPOS/PharmacistUserPOS/PharmacistUserPOSStockTransfer/PharmacistUserStockTransferAdd/PharmacistUserStockTransfer.tsx";
import PharmacistUserStockTransferListPage from "../../components/pharmacyPOS/PharmacistUserPOS/PharmacistUserPOSStockTransfer/PharmacistUserStockTransferList/PharmacistUserStockTransferList.tsx";
import PharmacistUserAddReStock from "../../components/pharmacyPOS/PharmacistUserPOS/PharmacistUserPOSReStockPage/PharmacistUserReStockAdd/PharmacistUserReStockAdd.tsx";
import PharmacistUserReOrderListPage from "../../components/pharmacyPOS/PharmacistUserPOS/PharmacistUserPOSReStockPage/PharmacistUserReStockList/PharmacistUserReOrderList.tsx";
import PharmacistPendingConsultations from "../../pages/Pharmacy/PharmacistPendingConsultations.tsx";

type RouteDefinition = { path: string; element: React.ReactNode };
const PharmacistUserAccessRoutes: RouteDefinition[] = [
    {
        path: "",
        element: <PharmacistUserDashboard />,
    },
    {
        path: "/sales",
        element: <PharmacistUserSalesPage />,
    },
    {
        path: "/inventory",
        element: <PharmacistUserInventoryPage />,
    },
    {
        path: "/purchasing",
        element: <PharmacistUserPurchasingPage />,
    },
    {
        path: "/damage-stock/view",
        element: <PharmacistUserDamageStockListPage />,
    },
    {
        path: "/damage-stock/add",
        element: <PharmacistUserAddDamageStock />,
    },
    {
        path: "/stock-movement/transfer",
        element: <PharmacistUserStockTransfer />,
    },
    {
        path: "/stock-movement/history",
        element: <PharmacistUserStockTransferListPage />,
    },
    {
        path: "/re-order-stock/list",
        element: <PharmacistUserReOrderListPage />,
    },
    {
        path: "/re-order-stock/add",
        element: <PharmacistUserAddReStock />,
    },
    // Consultations - View paid consultations for medicine dispensing
    {
        path: "/consultations",
        element: <PharmacistPendingConsultations />,
    },
];

export default PharmacistUserAccessRoutes;
