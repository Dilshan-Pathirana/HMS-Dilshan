import axios from 'axios';
import { useEffect, useState } from "react";
import api from "../../../../utils/api/axios";
import alert from "../../../../utils/alert.ts";
import {
    DashboardDetails,
    DashboardDetailsInitialValues,
} from "../../../../utils/types/pos/IDashboardDetails.ts";
import PrescriptionsFilledCard from "./Cards/PrescriptionsFilledCard.tsx";
import QuickActionsCard from "./Cards/QuickActionsCard.tsx";
import InventoryItemsCard from "./Cards/InventoryItemsCard.tsx";
import TotalSalesCard from "../../Common/TotalSalesCard.tsx";
import Spinner from "../../../../assets/Common/Spinner.tsx";
import {
    getAllDashboardDetails
} from "../../../../utils/api/pharmacy/PharmacyPOS/ChasierUserPharmacyPOS/CashierUserGetAllDashboardDetails.ts";

const CashierUserDashboardPage = () => {
    const [dashboardDetails, setDashboardDetails] = useState<DashboardDetails>(
        DashboardDetailsInitialValues,
    );
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchDashboardDetails = async () => {
            try {
                const response = await getAllDashboardDetails();
                if (response.data.status === 200) {
                    setDashboardDetails(response.data.dashboard_details);
                    setIsLoading(false);
                }
            } catch (error) {
                setIsLoading(false);
                if (axios.isAxiosError(error)) {
                    alert.warn("Error fetching dashboard details");
                } else {
                    alert.error("Unexpected error:");
                }
            }
        };

        fetchDashboardDetails();
    }, []);

    const totalSales = Number(dashboardDetails.total_sales);
    const totalProducts = Number(dashboardDetails.total_products);

    return (
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
            <Spinner isLoading={isLoading} />
            {!isLoading && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                    <TotalSalesCard totalSales={totalSales} />
                    <InventoryItemsCard totalProducts={totalProducts} />
                    <PrescriptionsFilledCard />
                </div>
            )}
            <QuickActionsCard />
        </main>
    );
};

export default CashierUserDashboardPage;
