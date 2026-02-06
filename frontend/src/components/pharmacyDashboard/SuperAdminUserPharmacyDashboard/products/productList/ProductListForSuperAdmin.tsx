import axios from 'axios';
import { useState, useEffect } from "react";
import api from "../../../../../utils/api/axios";
import { Product } from "../../../../../utils/types/pos/IProduct.ts";
import DataTable from "../../../../shared/ui/DataTable/DataTable.tsx";
import ProductCreateModal from "../../../SuperAdminUserPharmacyDashboard/products/productCreate/ProductCreateModal.tsx";
import {
    ProductBasicDetails,
    ProductStockDetails,
    ProductSupplierDetails,
    ProductWarrantyDetails,
} from "../../../../../utils/form/formFieldsAttributes/ProductCreateFormFields.ts";
import alert from "../../../../../utils/alert.ts";
import { columns } from "../../../../../utils/types/pharmacy/Product/IPharmacyProduct.ts";
import { mapProductToFormData } from "../../../../../utils/types/pharmacy/Product/productFormMapper.ts";
import ProductDetailsModalForSuperAdmin from "./ProductDetailsModalForSuperAdmin.tsx";
import { getAllSuperAdminProducts } from "../../../../../utils/api/pharmacy/SuperAdminUser/SuperAdminGetAllProducts.ts";
import { deleteSuperAdminProduct } from "../../../../../utils/api/pharmacy/SuperAdminUser/SuperadminDeleteProduct.ts";
import Spinner from "../../../../../assets/Common/Spinner.tsx";
import { ConfirmAlert } from "../../../../../assets/Common/Alert/ConfirmAlert.tsx";

const ProductListForSuperAdmin = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(
        null,
    );
    const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const [editData, setEditData] = useState({
        stepOne: ProductBasicDetails,
        stepTwo: ProductSupplierDetails,
        stepThree: ProductWarrantyDetails,
        stepFour: ProductStockDetails,
    });

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const response = await getAllSuperAdminProducts();

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

    const handleEdit = (id: string) => {
        const productToEdit = products.find((product) => product.id === id);

        if (productToEdit) {
            setSelectedProduct(productToEdit);
            const formData = mapProductToFormData(productToEdit);
            setEditData(formData);
            setIsEditModalOpen(true);
        }
    };

    const handleDelete = async (id: string) => {
        const isConfirm = await ConfirmAlert(
            "Are you need delete this product?",
            "Do you really want to delete the product?",
        );

        if (isConfirm) {
            try {
                const response = await deleteSuperAdminProduct(id);
                if (response.data.status === 200) {
                    setProducts((prevProducts) =>
                        prevProducts.filter((product) => product.id !== id),
                    );
                    alert.success(
                        response.data.message || "Product successfully deleted",
                    );
                } else {
                    alert.error("Failed to delete product");
                }
            } catch (error) {
                alert.warn("");
                if (axios.isAxiosError(error)) {
                    alert.warn("Error deleting product");
                } else {
                    alert.error("Unexpected error:");
                }
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

    const closeEditModal = () => {
        setIsEditModalOpen(false);
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
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                                onViewDetails={handleViewDetails}
                            />
                        )}

                        {isModalOpen && selectedProduct && (
                            <ProductDetailsModalForSuperAdmin
                                isOpen={isModalOpen}
                                product={selectedProduct}
                                onClose={handleCloseModal}
                            />
                        )}

                        <ProductCreateModal
                            isOpen={isEditModalOpen}
                            onClose={closeEditModal}
                            initialData={editData}
                            isEditing={true}
                            productId={selectedProduct?.id}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductListForSuperAdmin;
