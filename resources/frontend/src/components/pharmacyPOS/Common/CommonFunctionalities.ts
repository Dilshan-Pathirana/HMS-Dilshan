import { Product } from "../../../utils/types/pos/IProduct.ts";
import { addToCart } from "../../../utils/slices/cart/cartSlice.ts";
import { AppDispatch } from "../../../store.tsx";
import { ICustomerDetailsForBill } from "../../../utils/types/pos/IBillModalprops.ts";
import { IPatientDetailsForSales } from "../../../utils/types/users/IPatient.ts";
import { useMemo } from "react";
export const isReachedMaximumQuantity = (
    itemId: string,
    maximumReachedProduct: string,
    isReachedMaximumStock: boolean,
) => maximumReachedProduct === itemId && isReachedMaximumStock;

export const handleAddToCart = (product: Product, dispatch: AppDispatch) => {
    dispatch(addToCart(product));
};

export const getCustomerName = (
    customerDetails: ICustomerDetailsForBill,
    patientsDetails: IPatientDetailsForSales[],
): string => {
    if (customerDetails.customer_id !== "") {
        const patient = patientsDetails.find(
            (patient: IPatientDetailsForSales) =>
                patient.id === customerDetails.customer_id,
        );
        return patient?.first_name || "walk-in customer";
    }
    return customerDetails.customer_name
        ? customerDetails.customer_name
        : "walk-in customer";
};

export const showDiscount = (item: Product) => {
    return item.discount_amount
        ? `${item.discount_amount.toFixed(2)}`
        : item.discount_percentage
          ? `${item.discount_percentage}%`
          : 0;
};

export const getDiscountProductVise = (item: Product) => {
    return item.discount_amount
        ? `${item.discount_amount.toFixed(2)}`
        : item.discount_percentage
          ? `${item.discount_percentage.toFixed(2)}`
          : 0;
};

export const calculateFinalPrice = (item: Product) => {
    const basePrice = item.unit_selling_price * (item.quantity || 1);

    if (item.discount_type === "amount" && item.discount_amount) {
        return basePrice - item.discount_amount * (item.quantity || 1);
    } else if (
        item.discount_type === "percentage" &&
        item.discount_percentage
    ) {
        return basePrice * (1 - item.discount_percentage / 100);
    }

    return basePrice;
};

export const useProductFilter = (products: Product[], searchTerm: string) => {
    return useMemo(() => {
        const lowerCaseSearchTerm = searchTerm.toLowerCase();

        return products.filter(
            (product) =>
                product.item_code.toLowerCase().includes(lowerCaseSearchTerm) ||
                product.item_name.toLowerCase().includes(lowerCaseSearchTerm) ||
                product.generic_name
                    .toLowerCase()
                    .includes(lowerCaseSearchTerm) ||
                product.brand_name
                    .toLowerCase()
                    .includes(lowerCaseSearchTerm) ||
                product.category.toLowerCase().includes(lowerCaseSearchTerm) ||
                (product.barcode &&
                    product.barcode
                        .toLowerCase()
                        .includes(lowerCaseSearchTerm)),
        );
    }, [products, searchTerm]);
};
