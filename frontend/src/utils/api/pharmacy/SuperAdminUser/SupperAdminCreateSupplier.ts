import api from "../../axios";

export const createSuperAdminSupplier = (supplierInfo: any) => {
    return api.post('api/create-supplier',supplierInfo);
}

export const createPharmacistSupplier = (supplierInfo: any) => {
    return api.post('api/create-pharmacist-supplier',supplierInfo);
}
