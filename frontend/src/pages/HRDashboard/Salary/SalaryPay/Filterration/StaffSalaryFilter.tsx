import React, { useState, useEffect } from "react";
import "react-datepicker/dist/react-datepicker.css";
import DatePicker from "react-datepicker";
import { getAllUsers } from "../../../../../utils/api/dashboard/StaffAndUsers/GetAllUsers.ts";
import {StaffSalaryFilterProps} from "../../../../../utils/types/Salary/IStaffSalaryPay.ts";


const StaffSalaryFilter: React.FC<StaffSalaryFilterProps> = ({
    handleFilter,
}) => {
    const [users, setUsers] = useState<
        { id: string; first_name: string; last_name: string }[]
    >([]);
    const [selectedUser, setSelectedUser] = useState<string | null>(null);
    const [status, setStatus] = useState<string | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await getAllUsers();
                if (response.status === 200) {
                    setUsers(response.data.users || []);
                } else {
                    console.error("Failed to fetch users.");
                }
            } catch (error) {
                console.error("Error fetching users:", error);
            }
        };

        fetchUsers();
    }, []);

    const handleApplyFilter = () => {
        const filters = {
            user_id: selectedUser || null,
            status: status || null,
            month: selectedDate
                ? `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}`
                : null,
        };
        handleFilter(filters);
    };

    const handleResetFilter = () => {
        setSelectedUser(null);
        setStatus(null);
        setSelectedDate(null);
        handleFilter({ user_id: null, status: null, month: null });
    };

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
                <label
                    htmlFor="user"
                    className="block text-sm font-medium text-neutral-700"
                >
                    User
                </label>
                <select
                    id="user"
                    value={selectedUser || ""}
                    onChange={(e) => setSelectedUser(e.target.value)}
                    className="mt-1 block w-full border border-neutral-300 rounded-md shadow-sm py-2 px-3 text-sm focus:ring-primary-500 focus:border-primary-500"
                >
                    <option value="">Select User</option>
                    {users.map((user) => (
                        <option key={user.id} value={user.id}>
                            {`${user.first_name} ${user.last_name}`}
                        </option>
                    ))}
                </select>
            </div>

            <div>
                <label
                    htmlFor="status"
                    className="block text-sm font-medium text-neutral-700"
                >
                    Status
                </label>
                <select
                    id="status"
                    value={status || ""}
                    onChange={(e) => setStatus(e.target.value)}
                    className="mt-1 block w-full border border-neutral-300 rounded-md shadow-sm py-2 px-3 text-sm focus:ring-primary-500 focus:border-primary-500"
                >
                    <option value="">Select Status</option>
                    <option value="paid">Paid</option>
                    <option value="unpaid">Unpaid</option>
                </select>
            </div>

            <div>
                <label
                    htmlFor="date"
                    className="block text-sm font-medium text-neutral-700"
                >
                    Year & Month
                </label>
                <DatePicker
                    selected={selectedDate}
                    onChange={(date) => setSelectedDate(date)}
                    dateFormat="yyyy/MM"
                    showMonthYearPicker
                    className="mt-1 block w-full border border-neutral-300 rounded-md shadow-sm py-2 px-3 text-sm focus:ring-primary-500 focus:border-primary-500"
                />
            </div>

            <div className="flex items-end space-x-2">
                <button
                    onClick={handleApplyFilter}
                    className="w-full bg-primary-500 text-sm font-medium text-white py-2 px-4 rounded-lg shadow-sm hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                    Apply Filter
                </button>
                <button
                    onClick={handleResetFilter}
                    className="w-full bg-gray-500 text-sm font-medium text-white py-2 px-4 rounded-lg shadow-sm hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                    Reset Filter
                </button>
            </div>
        </div>
    );
};

export default StaffSalaryFilter;
