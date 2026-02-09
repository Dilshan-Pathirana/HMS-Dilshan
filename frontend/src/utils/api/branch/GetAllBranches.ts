import api from "../axios";
import { IBranchData } from "../../types/Branch/IBranchData";

export const getAllBranches = async (): Promise<IBranchData[]> => {
    const data = await api.get<IBranchData[]>("/branches/");
    return Array.isArray(data) ? data : [];
};
