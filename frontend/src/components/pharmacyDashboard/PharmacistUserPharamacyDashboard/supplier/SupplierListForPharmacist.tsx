import axios from 'axios';
import React, { useEffect, useState } from "react";
import Spinner from "../../../../assets/Common/Spinner.tsx";
import DataTable from "../../../shared/ui/DataTable/DataTable.tsx";
import { columnsForSupplier } from "../../../../utils/types/pharmacy/Product/IPharmacyProduct.ts";
import { SupplierList } from "../../../../utils/types/pos/IProduct.ts";
import { getAllPharmacistSuppliers } from "../../../../utils/api/pharmacy/PharmacistUser/PharmasistGetAllProducts.ts";
import alert from "../../../../utils/alert.ts";
import api from "../../../../utils/api/axios";

const SupplierListForPharmacist: React.FC = () => {
    const [suppliers, setSuppliers] = useState<SupplierList[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<SupplierList | null>(
        null,
    );
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        fetchSuppliersForPharmacist().then();
    }, []);

    console.log(isModalOpen, selectedProduct);
    const fetchSuppliersForPharmacist = async () => {
        try {
            const response = await getAllPharmacistSuppliers();

            if (response.data.status === 200) {
                setSuppliers(response.data.suppliers);
                setIsLoading(false);
            } else {
                alert.warn("Failed to fetch product list.");
                setIsLoading(false);
            }
        } catch (error) {
            setIsLoading(false);
            if (axios.isAxiosError(error)) {
                alert.warn("Error fetching suppliers");
            } else {
                alert.error("Unexpected error:");
            }
        }
    };

    const handleViewDetails = (id: string) => {
        const product = suppliers.find((product) => product.id === id);
        if (product) {
            setSelectedProduct(product);
            setIsModalOpen(true);
        }
    };

    return (
        <div className="bg-gray-100 h-screen overflow-hidden relative">
            <div className="sm:ml-64 h-full">
                <div className="p-6 bg-white rounded-lg mt-16 shadow-lg dark:border-gray-700 h-full">
                    <div className="flex justify-between items-center mb-6 px-6">
                        <h2 className="text-2xl font-semibold text-gray-800">
                            Product List
                        </h2>
                    </div>

                    <div className="overflow-y-auto max-h-[calc(100vh-200px)] w-full px-6">
                        {isLoading ? (
                            <Spinner isLoading={isLoading} />
                        ) : (
                            <DataTable
                                data={suppliers}
                                columns={columnsForSupplier}
                                enableActions={true}
                                onViewDetails={handleViewDetails}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SupplierListForPharmacist;
