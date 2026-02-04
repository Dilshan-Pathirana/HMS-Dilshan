import {Dispatch, SetStateAction} from "react";

export type OTRecord = {
    id: string;
    employee_id: string;
    user_first_name: string;
    user_last_name: string;
    date: string;
    hours_worked: number;
    ot_rate: number;
    total_ot_amount: number;
};

export type OTTableProps = {
    refreshOTs: boolean;
    triggerRefresh: Dispatch<SetStateAction<boolean>>;
};

export interface EditOTModalProps {
    isOpen: boolean;
    otData: {
        id: string;
        employee_id: string;
        date: string;
        hours_worked: number;
        ot_rate: number;
    } | null;
    closeModal: () => void;
    onOTUpdated: () => void;
}


