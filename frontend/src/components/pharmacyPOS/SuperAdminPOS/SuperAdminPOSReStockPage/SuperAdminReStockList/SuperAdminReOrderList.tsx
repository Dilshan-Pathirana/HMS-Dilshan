import axios from 'axios';
import { useEffect, useState } from "react";
import SuperAdminReOrderTable from "./reStockList/SuperAdminReOrderTable.tsx";
import api from "../../../../../utils/api/axios";
import alert from "../../../../../utils/alert.ts";
import { ReOrderStockProduct } from "../../../../../utils/types/pos/IProduct.ts";
import { getAllTRenewedStock } from "../../../../../utils/api/pharmacy/PharmacyPOS/SuperAdminPharmacyPOS/SuperAdminGetAllRenewedStock.ts";
import Spinner from "../../../../../assets/Common/Spinner.tsx";

export default function SuperAdminReOrderListPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [reorderStockList, setReorderStockList] = useState<
        ReOrderStockProduct[]
    >([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchReorderStock = async () => {
            try {
                const response = await getAllTRenewedStock();

                if (response.data.status === 200) {
                    setReorderStockList(response.data.product_stock_event);
                } else {
                    alert.warn("Failed to fetch product list.");
                }
            } catch (error) {
                if (axios.isAxiosError(error)) {
                    alert.warn(
                        "Failed to fetch product list: " + error.message,
                    );
                } else {
                    alert.warn("Failed to fetch product list.");
                }
            }
            setIsLoading(false);
        };
        fetchReorderStock();
    }, []);

    return (
        <div className="p-6 pb-32">
            <Spinner isLoading={isLoading} />
            {!isLoading && (
                <SuperAdminReOrderTable
                    products={reorderStockList}
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                />
            )}
        </div>
    );
}
