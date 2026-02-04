import api from "../../../axios";

export const getAllTransferProducts = () => {
    return api.get("api/pharmacist-get-transfer-product");
};
