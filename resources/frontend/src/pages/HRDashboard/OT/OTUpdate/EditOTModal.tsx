import { useState, useEffect } from "react";
import alert from "../../../../utils/alert";
import { IUser } from "../../../../utils/types/users/Iuser";
import { updateOT } from "../../../../utils/api/OT/UpdateOT";
import { EditOTModalProps } from "../../../../utils/types/OT/Iot.ts";
import { getAllUsersWithSalary } from "../../../../utils/api/OT/GetAllUsersWithSalary.ts";

const EditOTModal: React.FC<EditOTModalProps> = ({
    isOpen,
    otData,
    closeModal,
    onOTUpdated,
}) => {
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
        if (otData) {
            const user = users.find((u) => u.id === otData.employee_id) || null;
            setSelectedUser(user);
            setSelectedDate(otData.date);
            setHoursWorked(otData.hours_worked);
            setOtRate(otData.ot_rate);
            calculateTotalOtAmount(otData.hours_worked, otData.ot_rate);
        }
    }, [otData, users]);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await getAllUsersWithSalary();
                setUsers(response.data.users);
            } catch {
                alert.warn("Error fetching users. Please try again later.");
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
                (selectedUser.total_hours_worked_current_month -
                    (otData?.hours_worked || 0));

            if (value > maxHoursAvailable) {
                setErrorMessage(
                    `You can only add up to ${maxHoursAvailable} hours this month.`,
                );
            } else {
                setErrorMessage(null);
            }
        }

        calculateTotalOtAmount(value, otRate);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (
            !selectedUser ||
            !selectedDate ||
            hoursWorked === undefined ||
            otRate === undefined
        ) {
            alert.warn("Please fill in all fields.");
            return;
        }

        const payload = {
            employee_id: selectedUser.id,
            date: selectedDate,
            hours_worked: hoursWorked,
            ot_rate: otRate,
        };

        try {
            const response = await updateOT(otData?.id || "", payload);
            if (response.status === 200) {
                alert.success("Overtime record updated successfully!");
                onOTUpdated();
                closeModal();
            }
        } catch (error: unknown) {
            alert.error(
                error instanceof Error
                    ? error.message
                    : "Failed to update overtime record.",
            );
        }
    };

    if (!isOpen || !otData) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-2/3">
                <h2 className="text-lg font-semibold mb-4">Edit Overtime</h2>
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Select User
                            </label>
                            <select
                                value={selectedUser?.id || ""}
                                onChange={(e) =>
                                    setSelectedUser(
                                        users.find(
                                            (u) => u.id === e.target.value,
                                        ) || null,
                                    )
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 focus:outline-none"
                                disabled
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
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Branch
                            </label>
                            <input
                                type="text"
                                value={selectedUser?.center_name || ""}
                                readOnly
                                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 focus:outline-none"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Date
                            </label>
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) =>
                                    setSelectedDate(e.target.value)
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Hours Worked
                            </label>
                            <input
                                type="number"
                                value={hoursWorked ?? ""}
                                onChange={handleHoursWorkedChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                min="0"
                            />
                        </div>
                    </div>
                    {errorMessage && (
                        <div className="text-red-500 text-sm mb-4">
                            {errorMessage}
                        </div>
                    )}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                OT Per Hour
                            </label>
                            <input
                                type="number"
                                value={otRate ?? ""}
                                readOnly
                                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Total OT Amount
                            </label>
                            <input
                                type="text"
                                value={totalOtAmount.toFixed(2)}
                                readOnly
                                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 focus:outline-none"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <button
                            type="button"
                            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 mr-2"
                            onClick={closeModal}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 text-white"
                        >
                            Update Overtime
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditOTModal;
