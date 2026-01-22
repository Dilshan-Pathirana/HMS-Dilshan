import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";
import authReducer from "./utils/slices/auth/authSlice.tsx";
import productReducer from "./utils/slices/Product/productSlice.ts";
import cartReducer from "./utils/slices/cart/cartSlice.ts";
import orderReducer from "./utils/slices/order/orderSlice.ts";
import sessionAnswersReducer from "./utils/slices/sessionAnswers/sessionAnswersSlice.ts";
import doctorScheduleReducer from "./utils/slices/doctorSchedule/doctorScheduleSlice.ts";
import paymentReducer from "./utils/slices/payment/paymentSlice.ts";

const persistConfig = {
    key: "root",
    version: 1,
    storage,
    whitelist: [
        "auth",
        "product",
        "cart",
        "order",
        "sessionAnswers",
        "doctorSchedule",
        "payment",
    ],
};

const rootReducer = combineReducers({
    auth: authReducer,
    product: productReducer,
    cart: cartReducer,
    order: orderReducer,
    sessionAnswers: sessionAnswersReducer,
    doctorSchedule: doctorScheduleReducer,
    payment: paymentReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

const store = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: false,
        }),
});

const persistor = persistStore(store);

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
export { store, persistor };
