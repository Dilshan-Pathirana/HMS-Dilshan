import { useState, useEffect } from "react";
import Spinner from "../../../../../assets/Common/Spinner.tsx";
import Pagination from "../../../../../components/pharmacyPOS/Common/Pagination.tsx";
import alert from "../../../../../utils/alert";
import {
    getAllStaffSalaryPay,
    getFilteredStaffSalaryPay,
} from "../../../../../utils/api/Sallary/GetAllStaffSalariesPay.ts";
import { IStaffSalaryPay } from "../../../../../utils/types/Salary/IStaffSalaryPay.ts";
import StaffSalaryPayViewModal from "./StaffSalaryPayViewModal";
import { updateSalaryStatus } from "../../../../../utils/api/Sallary/UpdateStaffSalaryPay.ts";
import StaffSalaryTable from "./StaffSalaryTable.tsx";
import StaffSalaryFilter from "../Filterration/StaffSalaryFilter.tsx";
import {
    exportToExcel,
    exportToPDF,
} from "../../../../../utils/ExportUtils/ExportUtils.ts";
import { handlePrint } from "../SalaryPayDocumentatiion/StaffSalaryPrint.tsx";

const StaffSalaryPayTable = () => {
    const [salaryPayData, setSalaryPayData] = useState<IStaffSalaryPay[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [viewModalContent, setViewModalContent] =
        useState<IStaffSalaryPay | null>(null);

    const rowsPerPage = 10;

    useEffect(() => {
        const fetchSalaryPay = async () => {
            try {
                setIsLoading(true);
                const response = await getAllStaffSalaryPay();
                if (response.status === 200) {
                    setSalaryPayData(response.data.staffSalaryPay || []);
                } else {
                    alert.warn("Failed to fetch salary payments.");
                }
            } catch (error) {
                console.error("Error:", error);
                alert.error(
                    "An error occurred while fetching salary payments.",
                );
            } finally {
                setIsLoading(false);
            }
        };
        fetchSalaryPay();
    }, []);

    const totalPages = Math.ceil(salaryPayData.length / rowsPerPage);
    const paginatedData = salaryPayData.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage,
    );

    const handlePageChange = (newPage: number) => setCurrentPage(newPage);

    const handleStatusUpdate = async (id: string, status: string) => {
        try {
            const response = await updateSalaryStatus({ id, status });
            if (response.status === 200) {
                alert.success(
                    status === "paid"
                        ? "Salary Paid successfully."
                        : "Salary Unpaid successfully.",
                );
                const updatedResponse = await getAllStaffSalaryPay();
                if (updatedResponse.status === 200) {
                    setSalaryPayData(updatedResponse.data.staffSalaryPay || []);
                } else {
                    alert.warn("Failed to refresh salary payments.");
                }
            } else {
                alert.warn(
                    status === "paid"
                        ? "Failed salary as Paid."
                        : "Failed salary as Unpaid.",
                );
            }
        } catch (error) {
            console.error("Error:", error);
            alert.error(
                status === "paid"
                    ? "An error occurred while marking salary as Paid."
                    : "An error occurred while marking salary as Unpaid.",
            );
        }
    };

    const handleView = (salaryPay: IStaffSalaryPay) => {
        setViewModalContent(salaryPay);
    };

    const closeViewModal = () => setViewModalContent(null);

    const handleFilter = async (filters: {
        user_id?: string | null;
        status?: string | null;
        month?: string | null;
    }) => {
        try {
            setIsLoading(true);
            const response = await getFilteredStaffSalaryPay(filters);
            if (response.status === 200) {
                setSalaryPayData(response.data.staffSalaryPay || []);
            } else {
                alert.warn("Failed to fetch filtered salary payments.");
            }
        } catch (error) {
            console.error("Error fetching filtered data:", error);
            alert.error("An error occurred while fetching filtered data.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white shadow rounded-lg p-4">
            <Spinner isLoading={isLoading} />
            <div className="p-4">
                <StaffSalaryFilter handleFilter={handleFilter} />
            </div>
            {!isLoading && (
                <>
                    <StaffSalaryTable
                        paginatedData={paginatedData}
                        handleView={handleView}
                        handlePrint={handlePrint}
                        handleStatusUpdate={handleStatusUpdate}
                    />
                    <div className="flex justify-between mt-4">
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={handlePageChange}
                        />
                        <div>
                            <button
                                className="bg-green-500 text-white px-4 py-2 rounded"
                                onClick={() => exportToPDF(salaryPayData)}
                            >
                                Download PDF
                            </button>
                            <button
                                className="bg-primary-500 text-white px-4 py-2 rounded ml-2"
                                onClick={() => exportToExcel(salaryPayData)}
                            >
                                Download Excel
                            </button>
                        </div>
                    </div>
                </>
            )}
            <StaffSalaryPayViewModal
                isOpen={!!viewModalContent}
                salaryPay={viewModalContent}
                onClose={closeViewModal}
            />
        </div>
    );
};

export default StaffSalaryPayTable;
