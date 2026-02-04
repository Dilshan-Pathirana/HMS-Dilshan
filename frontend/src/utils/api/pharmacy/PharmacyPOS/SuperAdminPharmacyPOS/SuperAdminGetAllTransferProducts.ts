import api from "../../../axios";

export const getAllTransferProducts = () => {
    return api.get("api/get-transfer-product");
};
