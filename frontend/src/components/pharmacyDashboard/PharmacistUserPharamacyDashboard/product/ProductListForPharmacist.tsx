import axios from 'axios';
import { useState, useEffect } from "react";
import api from "../../../../utils/api/axios";
import { Product } from "../../../../utils/types/pos/IProduct.ts";
import DataTable from "../../../shared/ui/DataTable/DataTable.tsx";
import alert from "../../../../utils/alert.ts";
import { columns } from "../../../../utils/types/pharmacy/Product/IPharmacyProduct.ts";
import ProductDetailsModalForPharmacist from "./ProductDetailsModalForPharmacist.tsx";
import { getAllPharmacistProducts } from "../../../../utils/api/pharmacy/PharmacistUser/PharmasistGetAllProducts.ts";
import Spinner from "../../../../assets/Common/Spinner.tsx";

const ProductListForPharmacist = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(
        null,
    );
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const response = await getAllPharmacistProducts();

            if (response.data.status === 200) {
                setProducts(response.data.products);
                setIsLoading(false);
            } else {
                alert.warn("Failed to fetch product list.");
                setIsLoading(false);
            }
        } catch (error) {
            setIsLoading(false);
            if (axios.isAxiosError(error)) {
                alert.warn("Error fetching products");
            } else {
                alert.error("Unexpected error:");
            }
        }
    };

    const handleViewDetails = (id: string) => {
        const product = products.find((product) => product.id === id);
        if (product) {
            setSelectedProduct(product);
            setIsModalOpen(true);
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedProduct(null);
    };

    return (
        <div className="bg-neutral-100 h-screen overflow-hidden relative">
            <div className="sm:ml-64 h-full">
                <div className="p-6 bg-white rounded-lg mt-16 shadow-lg dark:border-gray-700 h-full">
                    <div className="flex justify-between items-center mb-6 px-6">
                        <h2 className="text-2xl font-semibold text-neutral-800">
                            Product List
                        </h2>
                    </div>

                    <div className="overflow-y-auto max-h-[calc(100vh-200px)] w-full px-6">
                        {isLoading ? (
                            <Spinner isLoading={isLoading} />
                        ) : (
                            <DataTable
                                data={products}
                                columns={columns}
                                enableActions={true}
                                onViewDetails={handleViewDetails}
                            />
                        )}

                        {isModalOpen && selectedProduct && (
                            <ProductDetailsModalForPharmacist
                                isOpen={isModalOpen}
                                product={selectedProduct}
                                onClose={handleCloseModal}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductListForPharmacist;
