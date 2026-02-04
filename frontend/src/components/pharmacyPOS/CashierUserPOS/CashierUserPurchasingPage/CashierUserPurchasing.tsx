import axios from 'axios';
import { useEffect, useState } from "react";
import api from "../../../../utils/api/axios";
import alert from "../../../../utils/alert.ts";
import { Purchasing } from "../../../../utils/types/pos/IPurchasing.ts";
import PurchasingHeader from "./PurchasingCard/PurchasingHeader.tsx";
import Spinner from "../../../../assets/Common/Spinner.tsx";
import { getAllPurchasing } from "../../../../utils/api/pharmacy/PharmacyPOS/ChasierUserPharmacyPOS/CashierUserGetAllPurchasing.ts";
import PurchasingDetailsModal from "../../Common/Modal/PurchasingDetailsModal.tsx";
import PurchasingTable from "../../Common/Tables/PurchasingTable/PurchasingTable.tsx";

export default function CashierUserPurchasingPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [purchasing, setPurchasing] = useState<Purchasing[]>([]);
    const [selectedPurchasing, setSelectedPurchasing] =
        useState<Purchasing | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchAllPurchasing = async () => {
            try {
                const response = await getAllPurchasing();

                if (response.data.status === 200) {
                    setPurchasing(response.data.purchasing);
                    setIsLoading(false);
                } else {
                    alert.warn("Failed to fetch purchasing list.");
                    setIsLoading(false);
                }
            } catch (error) {
                setIsLoading(false);
                if (axios.isAxiosError(error)) {
                    alert.warn(
                        "Failed to fetch purchasing list: " + error.message,
                    );
                } else {
                    alert.warn("Failed to fetch purchasing list.");
                }
            }
        };

        fetchAllPurchasing();
    }, []);

    const handleRowClick = (product: Purchasing) => {
        setSelectedPurchasing(product);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setSelectedPurchasing(null);
        setIsModalOpen(false);
    };

    return (
        <div className="flex flex-col min-h-screen bg-gray-100">
            <PurchasingHeader />
            <main className="flex-1 overflow-x-hidden bg-gray-100 p-6">
                <Spinner isLoading={isLoading} />
                {!isLoading && (
                    <PurchasingTable
                        purchasing={purchasing}
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                        onRowClick={handleRowClick}
                    />
                )}
            </main>

            {isModalOpen && selectedPurchasing && (
                <PurchasingDetailsModal
                    purchasing={selectedPurchasing}
                    onClose={closeModal}
                />
            )}
        </div>
    );
}
