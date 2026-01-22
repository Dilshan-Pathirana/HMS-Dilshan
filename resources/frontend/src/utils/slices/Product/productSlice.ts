import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
    StockInformationStep,
    ProductInformationStep,
    WarrantyStepData,
    SupplierStepData,
} from "../../types/pharmacy/Product/ProdcutCreateForm.ts";
import { ProductState } from "../../types/ISlices.ts";

const initialState: ProductState = {
    product_details: {} as ProductInformationStep,
    suppliers: {
        selectedSupplierId: null,
    },
    warranty: {} as WarrantyStepData,
    product_stock: {} as StockInformationStep,
};

export const productSlice = createSlice({
    name: "product",
    initialState,
    reducers: {
        addNewProduct: (
            state,
            action: PayloadAction<ProductInformationStep>,
        ) => {
            state.product_details = action.payload;
        },
        setSelectedSupplier: (
            state,
            action: PayloadAction<SupplierStepData>,
        ) => {
            state.suppliers.selectedSupplierId = action.payload;
        },

        addNewWarranty: (state, action: PayloadAction<WarrantyStepData>) => {
            state.warranty = action.payload;
        },
        addNewProductStock: (
            state,
            action: PayloadAction<StockInformationStep>,
        ) => {
            state.product_stock = action.payload;
        },
    },
});

export const {
    addNewProduct,
    setSelectedSupplier,
    addNewWarranty,
    addNewProductStock,
} = productSlice.actions;

export default productSlice.reducer;
