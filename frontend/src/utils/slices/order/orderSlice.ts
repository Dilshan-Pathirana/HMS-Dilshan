import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { OrderDetails } from "../../types/ISlices";

const initialState: OrderDetails[] = [];

const orderSlice = createSlice({
    name: "order",
    initialState,
    reducers: {
        saveOrder: (state, action: PayloadAction<OrderDetails>) => {
            state.push(action.payload);
        },
    },
});

export const { saveOrder } = orderSlice.actions;
export default orderSlice.reducer;
