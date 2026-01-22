import axios from "axios";

export const getAllTransferProducts = () => {
    return axios.get("api/cashier-get-transfer-product");
};
