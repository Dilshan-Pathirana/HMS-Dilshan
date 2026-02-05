import api from "../axios";
import { IBranchData } from "../../types/Branch/IBranchData";

// Axios interceptor unwraps response.data, so this returns the data directly
export const getAllBranches = (): Promise<IBranchData[]> => {
    return api.get(`/branches`);
};
