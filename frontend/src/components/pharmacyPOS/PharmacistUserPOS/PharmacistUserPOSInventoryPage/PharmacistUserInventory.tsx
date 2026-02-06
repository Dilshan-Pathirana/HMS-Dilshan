import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Product } from "../../../../utils/types/pos/IProduct.ts";
import alert from "../../../../utils/alert.ts";
import PharmacistUserInventoryModal from "./PharmacistUserInventory/PharmacistUserInventoryModal.tsx";
import Spinner from "../../../../assets/Common/Spinner.tsx";
import { getAllProducts } from "../../../../utils/api/pharmacy/PharmacyPOS/PharmacistUserPOS/PharmacistUserGetAllProducts.ts";
import InventoryTable from "../../Common/Tables/InventoryTable.tsx";

export default function PharmacistUserInventoryPage() {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState("");
    const [products, setProducts] = useState<Product[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(
        null,
    );
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchAllProducts = async () => {
            try {
                const response = await getAllProducts();
                if (response.data.status === 200) {
                    setProducts(response.data.products);
                    setIsLoading(false);
                } else {
                    alert.warn("Failed to fetch product list.");
                    setIsLoading(false);
                }
            } catch {
                setIsLoading(false);
                alert.warn("Failed to fetch product list.");
            }
        };
        fetchAllProducts();
    }, []);

    const handleRowClick = (product: Product) => {
        setSelectedProduct(product);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setSelectedProduct(null);
        setIsModalOpen(false);
    };

    return (
        <div className="flex flex-col min-h-screen bg-neutral-100">
            <header className="flex items-center justify-between px-6 py-4 bg-white border-b m-5">
                <div className="flex items-center">
                    <ArrowLeft
                        className="h-6 w-6 text-neutral-500 cursor-pointer"
                        onClick={() => navigate(-1)}
                    />
                    <h1 className="text-2xl font-semibold text-neutral-800 ml-4">
                        Inventory Management
                    </h1>
                </div>
            </header>

            <main className="flex-1 overflow-x-hidden overflow-y-auto bg-neutral-100 p-6">
                <Spinner isLoading={isLoading} />
                {!isLoading && (
                    <InventoryTable
                        products={products}
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                        onRowClick={handleRowClick}
                    />
                )}
            </main>

            {isModalOpen && selectedProduct && (
                <PharmacistUserInventoryModal
                    product={selectedProduct}
                    onClose={closeModal}
                />
            )}
        </div>
    );
}
