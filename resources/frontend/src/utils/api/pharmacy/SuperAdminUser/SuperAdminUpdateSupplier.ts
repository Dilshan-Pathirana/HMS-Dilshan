import axios from 'axios';
import {SupplierList} from "../../../types/pos/IProduct.ts";
export const updateSuperAdminSupplier = (supplierId: string, updatedSupplierDetails: SupplierList) => {
    return axios.post(`api/update-supplier/${supplierId}`, updatedSupplierDetails);
};
