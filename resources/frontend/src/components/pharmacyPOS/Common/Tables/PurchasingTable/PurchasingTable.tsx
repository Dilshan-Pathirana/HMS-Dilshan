import React, { useState, useEffect } from "react";
import axios from "axios";
import alert from "../../../../../utils/alert.ts";
import { PurchasingTableProps } from "../../../../../utils/types/pos/IPurchasing.ts";
import PurchasingTableFilterControls from "./PurchasingTableFilterControls.tsx";
import SuperAdminTable from "../../../SuperAdminPOS/SuperAdminPurchasingPage/SuperAdminPurchasing/SuperAdminTable.tsx";
import Pagination from "../../Pagination.tsx";
import { getAllFilterPurchasingData } from "../../../../../utils/api/pharmacy/PharmacyPOS/Common/FilterPurchasingDataGetAll.ts";
import * as XLSX from "xlsx/xlsx.mjs";
import {useUserRole} from "../../../../../utils/state/checkAuthenticatedUserStates.ts";
const PurchasingTable: React.FC<PurchasingTableProps> = ({
    purchasing = [],
    searchTerm,
    setSearchTerm,
    onRowClick,
}) => {
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 10;

    const [selectedDate, setSelectedDate] = useState<string>("");
    const [selectedMonth, setSelectedMonth] = useState<string>("");
    const [selectedYear, setSelectedYear] = useState<string>("");
    const [filteredData, setFilteredData] = useState<
        Array<(typeof purchasing)[0]>
    >([]);
    const userRole = useUserRole();

    useEffect(() => {
        fetchPurchasingDetails().then();
    }, [selectedDate, selectedMonth, selectedYear, purchasing]);

    const fetchPurchasingDetails = async () => {
        try {
            const response = await getAllFilterPurchasingData(
                userRole,
                selectedMonth,
                selectedYear,
                selectedDate,
            );

            if (response.data && response.data.purchasing) {
                const dataArray = Array.isArray(response.data.purchasing)
                    ? response.data.purchasing
                    : Object.values(response.data.purchasing);

                setFilteredData(dataArray);
            } else {
                console.error(
                    "Unexpected API response structure:",
                    response.data,
                );
                setFilteredData([]);
            }
        } catch (error) {
            if (axios.isAxiosError(error)) {
                alert.warn("Error fetching purchasing details");
            } else {
                alert.error("Unexpected error:");
            }
            setFilteredData([]);
        }
    };

    const searchedData = filteredData.filter((item) =>
        item.invoice_id.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    const totalPages = Math.ceil(searchedData.length / rowsPerPage);

    const paginatedPurchasing = searchedData.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage,
    );

    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage);
    };

    const exportSelectedRows = () => {
        const ws = XLSX.utils.json_to_sheet(filteredData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "SelectedRows");
        XLSX.writeFile(wb, "report" + ".xlsx");
    };

    return (
        <div className="bg-white shadow rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Purchasing Records</h2>
            </div>

            <PurchasingTableFilterControls
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
                selectedMonth={selectedMonth}
                setSelectedMonth={setSelectedMonth}
                selectedYear={selectedYear}
                setSelectedYear={setSelectedYear}
                setCurrentPage={setCurrentPage}
                exportSelectedRows={exportSelectedRows}
            />

            <SuperAdminTable
                data={paginatedPurchasing}
                onRowClick={onRowClick}
            />

            {searchedData.length > 0 && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                />
            )}
        </div>
    );
};

export default PurchasingTable;
