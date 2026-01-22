import { AppDispatch } from "../../../store.tsx";
import React from "react";
import { IPatientDetailsForSales } from "../users/IPatient.ts";
import { Product } from "./IProduct.ts";

export interface BillModalProps {
    isOpen: boolean;
    cart: any;
    total: number;
    totalDiscount: number;
    netTotal: number;
    amountReceived: string;
    change: number;
    customerName?: string;
    setCustomerDetails: React.Dispatch<
        React.SetStateAction<ICustomerDetailsForBill>
    >;
    closeModal: () => void;
    dispatch: AppDispatch;
}

export interface BillPrintProps {
    orderId: string;
    soldTo?: string;
    date: string;
    time: string;
    salesPerson: string;
    register: string;
    orderType: string;
    cart: Product[];
    total: number;
    totalDiscount: number;
    netTotal: number;
    amountReceived: number;
    change: number;
}

interface IProductDetailsForBill {
    product_id: string;
    qty: number;
    price: number;
}

export interface IBillPurchasing {
    products: IProductDetailsForBill[];
    cashier_id: string;
    total_discount_amount: number;
    total_amount: number;
    net_total: number;
    amount_received: number;
    remain_amount: number;
    customer_id?: string;
    customer_name?: string;
    contact_number?: string;
}

export interface NotRegisterCustomerDetailsSectionProps {
    customerDetails: ICustomerDetailsForBill;
    isShowCustomerAddFields: boolean;
    handleNotRegisterCustomerChanges: (
        event: React.ChangeEvent<HTMLInputElement>,
    ) => void;
}

export interface ICustomerDetailsForBill {
    customer_id?: string;
    customer_name?: string;
    contact_number?: string;
}

export interface ISalesHeaderCardProps {
    patientsDetails: IPatientDetailsForSales[];
    customerDetails: ICustomerDetailsForBill;
    setCustomerDetails: React.Dispatch<
        React.SetStateAction<ICustomerDetailsForBill>
    >;
    setIsReachedMaximumStock: React.Dispatch<React.SetStateAction<boolean>>;
}
