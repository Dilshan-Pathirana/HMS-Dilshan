import React, { useEffect, useState } from "react";
import axios from "axios";
import { IProductDiscount } from "../../../../utils/types/pos/IProduct.ts";
import api from "../../../../utils/api/axios";
import alert from "../../../../utils/alert.ts";
import { getAllProductDiscount } from "../../../../utils/api/pharmacy/PharmacyPOS/SuperAdminPharmacyPOS/SuperAdminProductDiscount.ts";
import Header from "../../SuperAdminPOS/SuperAdminPOSDamageStock/SuperAdminDamageStockList/Cards/Header.tsx";
import Spinner from "../../../../assets/Common/Spinner.tsx";
import ProductDiscountTable from "./ProductDiscountTable.tsx";
import {useSelector} from "react-redux";
import {AuthState} from "../../../../utils/types/auth";

const ProductDiscountList: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [productDiscount, setProductDiscount] = useState<IProductDiscount[]>(
        [],
    );
    const [isLoading, setIsLoading] = useState(true);
    const userRole = useSelector(
        (state: { auth: AuthState }) => state.auth.userRole,
    );

    useEffect(() => {
        fetProductDiscountDetails().then();
    }, []);

    const fetProductDiscountDetails = async () => {
        try {
            const response = await getAllProductDiscount(userRole);

            if (response?.data.status === 200) {
                setProductDiscount(response.data.products_discounts);
                setIsLoading(false);
            } else {
                alert.warn("Failed to fetch product list.");
                setIsLoading(false);
            }
        } catch (error) {
            setIsLoading(false);
            if (axios.isAxiosError(error)) {
                alert.warn("Failed to fetch product list: " + error.message);
            } else {
                alert.warn("Failed to fetch product list.");
            }
        }
    };

    return (
        <div className="p-6 pb-10">
            <Header />
            <Spinner isLoading={isLoading} />
            {!isLoading && (
                <ProductDiscountTable
                    products={productDiscount}
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                />
            )}
        </div>
    );
};

export default ProductDiscountList;
