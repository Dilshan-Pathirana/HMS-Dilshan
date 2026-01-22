import axios from "axios";

export const getAllTransferProducts = () => {
    return axios.get("api/get-transfer-product");
};
