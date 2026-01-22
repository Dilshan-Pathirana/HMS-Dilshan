import { useEffect, useState } from "react";
import SuperAdminTransferStockTable from "./transferStockList/SuperAdminTransferStockTable.tsx";
import axios from "axios";
import alert from "../../../../../utils/alert.ts";
import { TransferedProduct } from "../../../../../utils/types/pos/IProduct.ts";
import Header from "./Cards/Header.tsx";
import { getAllTransferProducts } from "../../../../../utils/api/pharmacy/PharmacyPOS/SuperAdminPharmacyPOS/SuperAdminGetAllTransferProducts.ts";
import Spinner from "../../../../../assets/Common/Spinner.tsx";

export default function SuperAdminStockTransferListPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [transferedStockList, setTransferedStockList] = useState<
        TransferedProduct[]
    >([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchTransferedStock = async () => {
            try {
                const response = await getAllTransferProducts();

                if (response.data.status === 200) {
                    setTransferedStockList(response.data.product_stock_event);
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
        fetchTransferedStock();
    }, []);

    return (
        <div className="p-6 pb-32">
            <Header />
            <Spinner isLoading={isLoading} />
            {!isLoading && (
                <SuperAdminTransferStockTable
                    products={transferedStockList}
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                />
            )}
        </div>
    );
}
