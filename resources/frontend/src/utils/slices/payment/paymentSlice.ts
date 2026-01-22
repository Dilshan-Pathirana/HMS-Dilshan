import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface PaymentData {
    amount: number;
    currency: string;
    items: string;
    orderId: string;
    hashedSecret: string;
    amountFormatted: string;
    hash: string;
}

interface PaymentState {
    paymentData: PaymentData | null;
}

const initialState: PaymentState = {
    paymentData: null,
};

const paymentSlice = createSlice({
    name: "payment",
    initialState,
    reducers: {
        setPaymentData: (state, action: PayloadAction<PaymentData>) => {
            state.paymentData = action.payload;
        },
        clearPaymentData: (state) => {
            state.paymentData = null;
        },
    },
});

export const { setPaymentData, clearPaymentData } = paymentSlice.actions;
export default paymentSlice.reducer;
