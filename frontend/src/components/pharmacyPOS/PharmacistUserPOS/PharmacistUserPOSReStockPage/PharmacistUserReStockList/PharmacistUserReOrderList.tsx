import axios from 'axios';
import { useEffect, useState } from "react";
import PharmacistUserReOrderTable from "./reStockList/PharmacistUserReOrderTable.tsx";
import api from "../../../../../utils/api/axios";
import alert from "../../../../../utils/alert.ts";
import { ReOrderStockProduct } from "../../../../../utils/types/pos/IProduct.ts";
import Spinner from "../../../../../assets/Common/Spinner.tsx";
import { getAllTRenewedStock } from "../../../../../utils/api/pharmacy/PharmacyPOS/PharmacistUserPOS/PharmacistUserGetAllRenewedStock.ts";

export default function PharmacistUserReOrderListPage() {
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
                <PharmacistUserReOrderTable
                    products={reorderStockList}
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                />
            )}
        </div>
    );
}
