import axios from 'axios';
import React, { useEffect, useState } from "react";
import Spinner from "../../../../assets/Common/Spinner.tsx";
import DataTable from "../../../shared/ui/DataTable/DataTable.tsx";
import { columnsForSupplier } from "../../../../utils/types/pharmacy/Product/IPharmacyProduct.ts";
import { SupplierList } from "../../../../utils/types/pos/IProduct.ts";
import alert from "../../../../utils/alert.ts";
import api from "../../../../utils/api/axios";
import { getAllSuperAdminSuppliers } from "../../../../utils/api/pharmacy/SuperAdminUser/SuperAdminGetAllSuppliers.ts";
import { updateSuperAdminSupplier } from "../../../../utils/api/pharmacy/SuperAdminUser/SuperAdminUpdateSupplier.ts";
import SupplierDetailsModal from "./SupplierDetailsModal.tsx";
import SupplierEditModal from "./SupplierEditModal.tsx";
import { ConfirmAlert } from "../../../../assets/Common/Alert/ConfirmAlert.tsx";
import { deleteSuperAdminSupplier } from "../../../../utils/api/pharmacy/SuperAdminUser/SuperadminDeleteSupplier.ts";

const SupplierListForAdmin: React.FC = () => {
    const [suppliers, setSuppliers] = useState<SupplierList[]>([]);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedSupplier, setSelectedSupplier] =
        useState<SupplierList | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        fetchSuppliersForPharmacist().then();
    }, []);

    const fetchSuppliersForPharmacist = async () => {
        try {
            const response = await getAllSuperAdminSuppliers();

            if (response.data.status === 200) {
                setSuppliers(response.data.suppliers);
                setIsLoading(false);
            } else {
                alert.warn("Failed to fetch supplier list.");
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
        const supplier = suppliers.find((supplier) => supplier.id === id);
        if (supplier) {
            setSelectedSupplier(supplier);
            setIsViewModalOpen(true);
        }
    };

    const handleEdit = (id: string) => {
        const supplier = suppliers.find((supplier) => supplier.id === id);
        if (supplier) {
            setSelectedSupplier(supplier);
            setIsEditModalOpen(true);
        }
    };

    const handleDelete = async (id: string) => {
        const isConfirm = await ConfirmAlert(
            "Are you sure you want to delete this supplier?",
            "Do you really want to delete this supplier?",
        );

        if (isConfirm) {
            try {
                const response = await deleteSuperAdminSupplier(id);

                if (response.status === 200) {
                    alert.success("Supplier deleted successfully");
                    fetchSuppliersForPharmacist();
                } else {
                    alert.error("Failed to delete supplier");
                }
            } catch (error) {
                if (axios.isAxiosError(error)) {
                    alert.error(
                        error.response?.data?.message ||
                            "Failed to delete supplier",
                    );
                } else {
                    alert.error("Unexpected error occurred");
                }
            }
        }
    };

    const saveEditedSupplier = async (updatedSupplier: SupplierList) => {
        try {
            const response = await updateSuperAdminSupplier(
                updatedSupplier.id,
                updatedSupplier,
            );

            if (response.status === 200) {
                alert.success("Supplier updated successfully");
                setIsEditModalOpen(false);
                fetchSuppliersForPharmacist();
            } else {
                alert.error("Failed to update supplier");
            }
        } catch (error) {
            if (axios.isAxiosError(error)) {
                alert.error(
                    error.response?.data?.message ||
                        "Failed to update supplier",
                );
            } else {
                alert.error("Unexpected error occurred");
            }
        }
    };

    return (
        <div className="bg-neutral-100 h-screen overflow-hidden relative">
            <div className="sm:ml-64 h-full">
                <div className="p-6 bg-white rounded-lg mt-16 shadow-lg dark:border-gray-700 h-full">
                    <div className="flex justify-between items-center mb-6 px-6">
                        <h2 className="text-2xl font-semibold text-neutral-800">
                            Supplier List
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
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                            />
                        )}
                    </div>
                </div>
            </div>

            <SupplierDetailsModal
                isOpen={isViewModalOpen}
                supplier={selectedSupplier}
                onClose={() => setIsViewModalOpen(false)}
            />

            <SupplierEditModal
                isOpen={isEditModalOpen}
                supplier={selectedSupplier}
                onClose={() => setIsEditModalOpen(false)}
                onSave={saveEditedSupplier}
            />
        </div>
    );
};

export default SupplierListForAdmin;
