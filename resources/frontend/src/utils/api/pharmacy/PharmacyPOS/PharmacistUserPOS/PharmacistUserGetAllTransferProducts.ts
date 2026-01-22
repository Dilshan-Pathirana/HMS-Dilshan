import axios from "axios";

export const getAllTransferProducts = () => {
    return axios.get("api/pharmacist-get-transfer-product");
};
