import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import BranchCardList from "../components/BranchCardList.tsx";
import { getAllBranches } from "../../../../utils/api/branch/GetAllBranches.ts";
import { IBranchData } from "../../../../utils/types/Branch/IBranchData.ts";
import Spinner from "../../../../assets/Common/Spinner.tsx";
import { Search } from "lucide-react";
import api from "../../../../utils/api/axios";
import alert from "../../../../utils/alert.ts";

const BranchView = () => {
    const navigate = useNavigate();
    const [branches, setBranches] = useState<IBranchData[]>([]);
    const [filteredBranches, setFilteredBranches] = useState<IBranchData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const fetchBranches = async () => {
            try {
                const data = await getAllBranches();
                setBranches(data || []);
                setFilteredBranches(data || []);
            } catch (error) {
                console.error("Failed to fetch branches", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchBranches();
    }, []);

    useEffect(() => {
        const results = branches.filter(branch =>
            branch.center_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            branch.register_number.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredBranches(results);
    }, [searchTerm, branches]);

    const handleViewDetails = (branch: IBranchData) => {
        navigate(`/dashboard/branches/${branch.id}`);
    };

    const handleManageBranch = (branch: IBranchData) => {
        navigate(`/dashboard/branches/${branch.id}/manage`);
    };

    const handleAssignStaff = (branch: IBranchData) => {
        navigate(`/dashboard/branches/${branch.id}/assign`);
    };

    const handleDeleteBranch = async (branch: IBranchData) => {
        const ok = window.confirm(
            `Delete branch "${branch.center_name}"? Staff and pharmacies will be unassigned (not deleted).`,
        );
        if (!ok) return;

        try {
            await api.delete(`/branches/${branch.id}`);
            alert.success("Branch deleted successfully");
            setBranches((prev) => prev.filter((b) => b.id !== branch.id));
            setFilteredBranches((prev) => prev.filter((b) => b.id !== branch.id));
        } catch (e: any) {
            const msg = e?.response?.data?.detail || e?.message || "Failed to delete branch";
            alert.error(msg);
        }
    };

    if (isLoading) return <Spinner isLoading={true} />;

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-neutral-800 tracking-tight">Branches</h1>
                    <p className="text-neutral-500 mt-1">View details for all registered branches</p>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input
                        type="text"
                        placeholder="Search branches..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none w-full md:w-64 transition-all"
                    />
                </div>
            </div>

            <BranchCardList
                branches={filteredBranches}
                onViewDetails={handleViewDetails}
                onManageBranch={handleManageBranch}
                onAssignStaff={handleAssignStaff}
                onDeleteBranch={handleDeleteBranch}
            />
        </div>
    );
};

export default BranchView;
