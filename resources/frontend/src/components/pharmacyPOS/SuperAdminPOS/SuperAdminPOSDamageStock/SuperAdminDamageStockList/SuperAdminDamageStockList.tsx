import { useEffect, useState } from "react";
import SuperAdminDamageStockTable from "./damageStockList/SuperAdminDamageStockTable.tsx";
import alert from "../../../../../utils/alert.ts";
import { DamagedProduct } from "../../../../../utils/types/pos/IProduct.ts";
import Header from "./Cards/Header.tsx";
import { getAllDamageStockDetails } from "../../../../../utils/api/pharmacy/PharmacyPOS/SuperAdminPharmacyPOS/SuperAdminGetAllDamagedStock.ts";
import axios from "axios";
import Spinner from "../../../../../assets/Common/Spinner.tsx";

export default function SuperAdminDamageStockListPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [damagedProducts, setDamagedProducts] = useState<DamagedProduct[]>(
        [],
    );
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchDamageStock = async () => {
            try {
                const response = await getAllDamageStockDetails();

                if (response.data.status === 200) {
                    setDamagedProducts(response.data.product_stock_event);
                    setIsLoading(false);
                } else {
                    alert.warn("Failed to fetch product list.");
                    setIsLoading(false);
                }
            } catch (error) {
                setIsLoading(false);
                if (axios.isAxiosError(error)) {
                    alert.warn(
                        "Failed to fetch product list: " + error.message,
                    );
                } else {
                    alert.warn("Failed to fetch product list.");
                }
            }
        };

        fetchDamageStock();
    }, []);

    return (
        <div className="p-6 pb-10">
            <Header />
            <Spinner isLoading={isLoading} />
            {!isLoading && (
                <SuperAdminDamageStockTable
                    products={damagedProducts}
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                />
            )}
        </div>
    );
}
