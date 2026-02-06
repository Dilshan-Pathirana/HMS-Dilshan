import { useEffect, useState } from "react";
import api from "../../../../utils/api/axios";
import axios from "axios";
import alert from "../../../../utils/alert.ts";
import PurchasingTable from "../../Common/Tables/PurchasingTable/PurchasingTable.tsx";
import PurchasingDetailsModal from "../../Common/Modal/PurchasingDetailsModal.tsx";
import { Purchasing } from "../../../../utils/types/pos/IPurchasing.ts";
import { getAllPurchasing } from "../../../../utils/api/pharmacy/PharmacyPOS/SuperAdminPharmacyPOS/SuperAdminGetAllPurchasing.ts";
import PurchasingHeader from "./PurchasingCard/PurchasingHeader.tsx";
import Spinner from "../../../../assets/Common/Spinner.tsx";

export default function SuperAdminPurchasingPage() {
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
        <div className="flex flex-col min-h-screen bg-neutral-100">
            <PurchasingHeader />
            <main className="flex-1 overflow-x-hidden bg-neutral-100 p-6">
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
