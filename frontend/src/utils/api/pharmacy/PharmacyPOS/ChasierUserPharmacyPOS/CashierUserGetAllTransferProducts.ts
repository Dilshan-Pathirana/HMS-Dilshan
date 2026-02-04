import api from "../../../axios";

export const getAllTransferProducts = () => {
    return api.get("api/cashier-get-transfer-product");
};
