import api from "../../axios";
import {SupplierList} from "../../../types/pos/IProduct.ts";
export const updateSuperAdminSupplier = (supplierId: string, updatedSupplierDetails: SupplierList) => {
    return api.post(`api/update-supplier/${supplierId}`, updatedSupplierDetails);
};
