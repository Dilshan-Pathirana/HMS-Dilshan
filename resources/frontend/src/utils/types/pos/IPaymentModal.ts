export interface PaymentModalProps {
    isOpen: boolean;
    total: number;
    totalDiscount: number;
    netTotal: number;
    amountReceived: string;
    setAmountReceived: (value: string) => void;
    handleNumpadClick: (value: string) => void;
    processPayment: () => void;
    closeModal: () => void;
}
