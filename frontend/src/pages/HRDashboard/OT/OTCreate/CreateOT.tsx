import { useState, useEffect } from "react";
import alert from "../../../../utils/alert";
import { IUser } from "../../../../utils/types/users/Iuser.ts";
import { addOT } from "../../../../utils/api/OT/AddOT.ts";
import api from "../../../../utils/api/axios";
import axios from "axios";
import { getAllUsersWithSalary } from "../../../../utils/api/OT/GetAllUsersWithSalary.ts";

const CreateEmployeeOT: React.FC<{
    closeModal: () => void;
    onOtAdded: () => void;
}> = ({ closeModal, onOtAdded }) => {
    const [users, setUsers] = useState<IUser[]>([]);
    const [selectedUser, setSelectedUser] = useState<IUser | null>(null);
    const [selectedDate, setSelectedDate] = useState<string>("");
    const [hoursWorked, setHoursWorked] = useState<number | undefined>(
        undefined,
    );
    const [otRate, setOtRate] = useState<number | undefined>(undefined);
    const [totalOtAmount, setTotalOtAmount] = useState<number>(0);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await getAllUsersWithSalary();
                setUsers(response.data.users);
            } catch (err: unknown) {
                if (err instanceof Error) {
                    alert.warn(`Error fetching users: ${err.message}`);
                } else {
                    alert.warn(
                        "An unknown error occurred while fetching users.",
                    );
                }
            }
        };
        fetchUsers();
    }, []);

    const calculateTotalOtAmount = (hours?: number, rate?: number) => {
        if (hours !== undefined && rate !== undefined) {
            setTotalOtAmount(hours * rate);
        } else {
            setTotalOtAmount(0);
        }
    };

    const handleHoursWorkedChange = (
        e: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const value =
            e.target.value === "" ? undefined : parseFloat(e.target.value);
        setHoursWorked(value);

        if (value !== undefined && selectedUser) {
            const maxHoursAvailable =
                selectedUser.maximum_hours_can_work -
                selectedUser.total_hours_worked_current_month;

            if (value > maxHoursAvailable) {
                setErrorMessage(
                    `Can only work ${maxHoursAvailable} more hours this month.`,
                );
            } else {
                setErrorMessage(null);
            }
        }

        calculateTotalOtAmount(value, otRate);
    };

    const handleUserChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const userId = event.target.value;
        const user = users.find((u) => u.id === userId) || null;
        setSelectedUser(user);
        if (user) {
            setOtRate(user.rate_for_hour);

            if (user) {
                const maxHoursAvailable =
                    user.maximum_hours_can_work -
                    user.total_hours_worked_current_month;

                if (hoursWorked && hoursWorked > maxHoursAvailable) {
                    setErrorMessage(
                        `Can only work ${maxHoursAvailable} more hours this month.`,
                    );
                } else {
                    setErrorMessage(null);
                }
            }
        }
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!selectedUser) {
            alert.warn("Please select a user.");
            return;
        }

        if (!selectedDate) {
            alert.warn("Please select a date.");
            return;
        }

        if (hoursWorked === undefined || otRate === undefined) {
            alert.warn(
                "Please enter valid values for Hours Worked and OT Rate.",
            );
            return;
        }

        const payload = {
            employee_id: selectedUser.id,
            date: selectedDate,
            hours_worked: hoursWorked,
            ot_rate: otRate,
        };

        try {
            const response = await addOT(payload);

            if (response.status === 200) {
                alert.success(response.data.message);
                onOtAdded();
                closeModal();
            } else if (response.status === 500 && response.data?.message) {
                alert.warn(response.data.message);
            } else {
                alert.warn("Unexpected response from the server.");
            }
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                const backendMessage =
                    (err as any).response?.data?.message || "An unknown error occurred.";
                if ((err as any).response?.status === 500) {
                    alert.warn(backendMessage);
                } else {
                    alert.error(backendMessage);
                }
            } else {
                alert.error("An unexpected error occurred.");
            }
        }
    };
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-2/3">
                <h2 className="text-lg font-semibold mb-4">Add Overtime</h2>
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2">
                                Select User
                            </label>
                            <select
                                onChange={handleUserChange}
                                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                            >
                                <option value="">Select a user</option>
                                {users.map((user) => (
                                    <option key={user.id} value={user.id}>
                                        {user.first_name} {user.last_name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2">
                                Branch
                            </label>
                            <input
                                type="text"
                                value={selectedUser?.center_name || ""}
                                readOnly
                                className="w-full px-3 py-2 border border-neutral-300 rounded-md bg-neutral-100 focus:outline-none"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2">
                                Date
                            </label>
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) =>
                                    setSelectedDate(e.target.value)
                                }
                                min={
                                    new Date(
                                        new Date().getFullYear(),
                                        new Date().getMonth(),
                                        1,
                                    )
                                        .toISOString()
                                        .split("T")[0]
                                }
                                max={new Date().toISOString().split("T")[0]}
                                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2">
                                Hours Worked
                            </label>
                            <input
                                type="number"
                                value={hoursWorked ?? ""}
                                onChange={handleHoursWorkedChange}
                                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                                min="0"
                            />
                        </div>
                    </div>
                    {errorMessage && (
                        <div className="text-error-500 text-sm mb-4">
                            {errorMessage}
                        </div>
                    )}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2">
                                OT Per Hour
                            </label>
                            <input
                                type="number"
                                value={otRate ?? ""}
                                readOnly
                                className="w-full px-3 py-2 border border-neutral-300 rounded-md bg-neutral-100 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2">
                                Total OT Amount
                            </label>
                            <input
                                type="text"
                                value={totalOtAmount.toFixed(2)}
                                readOnly
                                className="w-full px-3 py-2 border border-neutral-300 rounded-md bg-neutral-100 focus:outline-none"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <button
                            type="button"
                            className="px-4 py-2 bg-neutral-300 text-neutral-700 rounded-md hover:bg-gray-400 mr-2"
                            onClick={closeModal}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-primary-500 rounded-lg hover:bg-primary-600 text-white"
                            disabled={!!errorMessage}
                        >
                            Add Overtime
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateEmployeeOT;
