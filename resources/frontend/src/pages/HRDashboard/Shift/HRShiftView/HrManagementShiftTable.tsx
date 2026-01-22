import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import alert from "../../../../utils/alert";
import Spinner from "../../../../assets/Common/Spinner";
import Pagination from "../../../../components/pharmacyPOS/Common/Pagination";
import {
    dayMap,
    Shift,
} from "../../../../utils/types/Dashboard/StaffAndUser/IShift";
import {
    getAllCashierShifts,
    getAllPharmacistShifts,
} from "../../../../utils/api/dashboard/StaffAndUsers/CashierAndPharmacistGetAllShift.ts";

const HrManagementShiftTable: React.FC<{ userRole: number }> = ({
    userRole,
}) => {
    const [shifts, setShifts] = useState<Shift[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 10;

    const userId = useSelector(
        (state: { auth: { userId: string } }) => state.auth.userId,
    );

    useEffect(() => {
        const fetchShifts = async () => {
            if (!userId) {
                alert.error("User ID is missing.");
                return;
            }

            try {
                setIsLoading(true);
                const response =
                    userRole === 6
                        ? await getAllCashierShifts(userId)
                        : await getAllPharmacistShifts(userId);

                if (response.status === 200) {
                    setShifts(response.data.shifts);
                } else {
                    alert.warn(
                        response.data.message || "Failed to fetch shifts.",
                    );
                }
            } catch (error) {
                alert.error("An error occurred while fetching shift data.");
                console.error("Error fetching shifts:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchShifts();
    }, [userId, userRole]);

    const filteredShifts = shifts.filter(
        (shift) =>
            shift.user_first_name
                .toLowerCase()
                .includes(searchTerm.toLowerCase()) ||
            shift.user_last_name
                .toLowerCase()
                .includes(searchTerm.toLowerCase()) ||
            shift.branch_center_name
                .toLowerCase()
                .includes(searchTerm.toLowerCase()),
    );

    const totalPages = Math.ceil(filteredShifts.length / rowsPerPage);
    const paginatedShifts = filteredShifts.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage,
    );

    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage);
    };

    return (
        <div className="bg-white shadow rounded-lg p-4">
            <Spinner isLoading={isLoading} />
            {!isLoading && (
                <>
                    <div className="flex items-center space-x-2 mb-4">
                        <div className="relative w-1/2">
                            <input
                                type="text"
                                placeholder="Search by name or branch..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="border border-gray-300 rounded pl-4 pr-4 py-2 w-full"
                            />
                        </div>
                    </div>

                    <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                {[
                                    "First Name",
                                    "Last Name",
                                    "Branch Name",
                                    "Shift Type",
                                    "Days",
                                    "Start Time",
                                    "End Time",
                                    "Notes",
                                ].map((header) => (
                                    <th
                                        key={header}
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                    >
                                        {header}
                                    </th>
                                ))}
                            </tr>
                        </thead>

                        <tbody className="bg-white divide-y divide-gray-200">
                            {paginatedShifts.map((shift) => (
                                <tr key={shift.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {shift.user_first_name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {shift.user_last_name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {shift.branch_center_name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {shift.shift_type}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {typeof shift.days_of_week === "string"
                                            ? JSON.parse(shift.days_of_week)
                                                  .map(
                                                      (day: string) =>
                                                          dayMap[day],
                                                  )
                                                  .join(", ")
                                            : "N/A"}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {shift.start_time}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {shift.end_time}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {shift.notes || "N/A"}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                    />
                </>
            )}
        </div>
    );
};

export default HrManagementShiftTable;
