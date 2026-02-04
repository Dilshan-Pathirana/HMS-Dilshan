import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Product } from "../../types/pos/IProduct.ts";

interface CartState {
    items: Product[];
}

const initialState: CartState = {
    items: [],
};

const cartSlice = createSlice({
    name: "cart",
    initialState,
    reducers: {
        addToCart: (state, action: PayloadAction<Product>) => {
            const product = action.payload;
            const existingItem = state.items.find(
                (item) => item.id === product.id,
            );

            if (existingItem) {
                existingItem.quantity = (existingItem.quantity || 0) + 1;
            } else {
                state.items.push({ ...product, quantity: 1 });
            }
        },
        updateQuantity: (
            state,
            action: PayloadAction<{ id: string; quantity: number }>,
        ) => {
            const { id, quantity } = action.payload;
            const item = state.items.find((item) => item.id === id);

            if (item && quantity > 0) {
                item.quantity = quantity;
            }
        },
        removeFromCart: (state, action: PayloadAction<string>) => {
            const productId = action.payload;
            state.items = state.items.filter((item) => item.id !== productId);
        },
        clearCart: (state) => {
            state.items = [];
        },
    },
});

export const { addToCart, updateQuantity, removeFromCart, clearCart } =
    cartSlice.actions;
export default cartSlice.reducer;
