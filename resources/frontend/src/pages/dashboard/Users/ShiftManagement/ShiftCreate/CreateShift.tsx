import { useState, useEffect } from "react";
import { getAllUsers } from "../../../../../utils/api/dashboard/StaffAndUsers/GetAllUsers.ts";
import alert from "../../../../../utils/alert";
import { IUser } from "../../../../../utils/types/users/Iuser.ts";
import { addShift } from "../../../../../utils/api/dashboard/StaffAndUsers/ShiftAdd.ts";
import { dayMap } from "../../../../../utils/types/Dashboard/StaffAndUser/IShift.ts";

interface CreateShiftProps {
    closeModal: () => void;
    onShiftAdded: () => void;
}

const CreateShift: React.FC<CreateShiftProps> = ({
    closeModal,
    onShiftAdded,
}) => {
    const [users, setUsers] = useState<IUser[]>([]);
    const [selectedUser, setSelectedUser] = useState<IUser | null>(null);
    const [selectedDays, setSelectedDays] = useState<string[]>([]);
    const [shiftType, setShiftType] = useState<string>("");
    const [startTime, setStartTime] = useState<string>("");
    const [endTime, setEndTime] = useState<string>("");
    const [notes, setNotes] = useState<string>("");

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await getAllUsers();
                setUsers(response.data.users);
            } catch {
                alert.warn("Error fetching users. Please try again later.");
            }
        };
        fetchUsers();
    }, []);

    const handleDayChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const { value } = event.target;
        if (!selectedDays.includes(value) && value !== "Select day") {
            setSelectedDays([...selectedDays, value]);
        }
    };

    const removeDay = (day: string) => {
        setSelectedDays(selectedDays.filter((d) => d !== day));
    };

    const handleUserChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const userId = event.target.value;
        const user = users.find((u) => u.id === userId) || null;
        setSelectedUser(user);
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        
        // Validation
        if (!selectedUser) {
            alert.error("Please select a user");
            return;
        }
        if (!shiftType) {
            alert.error("Please select a shift type");
            return;
        }
        if (selectedDays.length === 0) {
            alert.error("Please select at least one day");
            return;
        }
        if (!startTime) {
            alert.error("Please enter a start time");
            return;
        }
        if (!endTime) {
            alert.error("Please enter an end time");
            return;
        }
        
        const shiftData = {
            user_id: selectedUser?.id || "",
            branch_id: selectedUser?.branch_id || "",
            days_of_week: JSON.stringify(selectedDays),
            shift_type: shiftType,
            start_time: startTime,
            end_time: endTime,
            notes: notes,
        };
        try {
            const response = await addShift(shiftData);
            if (response.status === 200) {
                const message =
                    response.data.message || "Shift created successfully!";
                alert.success(message);
                closeModal();
                onShiftAdded();
            }
        } catch (error: unknown) {
            const errorMessage =
                (error as { response?: { data?: { message: string } } })
                    ?.response?.data?.message ||
                "Failed to create shift. Please try again.";
            alert.error(errorMessage);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-2/3">
                <h2 className="text-lg font-semibold mb-4">Add Shift</h2>
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Select User
                            </label>
                            <select
                                onChange={handleUserChange}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Select a user</option>
                                {users && users.length > 0 ? (
                                    users.map((user) => (
                                        <option key={user.id} value={user.id}>
                                            {user.first_name} {user.last_name}
                                        </option>
                                    ))
                                ) : (
                                    <option value="" disabled>Loading users...</option>
                                )}
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
                                Shift Type
                            </label>
                            <select
                                value={shiftType}
                                onChange={(e) => setShiftType(e.target.value)}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Select shift type</option>
                                <option value="Night shift">Night shift</option>
                                <option value="Day shift">Day shift</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Day of Week
                            </label>
                            <div className="flex flex-col gap-2">
                                <select
                                    onChange={handleDayChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option>Select day</option>
                                    <option value="1">Sunday</option>
                                    <option value="2">Monday</option>
                                    <option value="3">Tuesday</option>
                                    <option value="4">Wednesday</option>
                                    <option value="5">Thursday</option>
                                    <option value="6">Friday</option>
                                    <option value="7">Saturday</option>
                                </select>
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {selectedDays.map((day) => (
                                        <span
                                            key={day}
                                            className="bg-blue-100 text-blue-600 px-2 py-1 rounded-md text-sm flex items-center"
                                        >
                                            {dayMap[day]}
                                            <button
                                                type="button"
                                                onClick={() => removeDay(day)}
                                                className="ml-2 text-red-500 hover:text-red-700"
                                            >
                                                &times;
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Start Time
                            </label>
                            <input
                                type="time"
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                End Time
                            </label>
                            <input
                                type="time"
                                value={endTime}
                                onChange={(e) => setEndTime(e.target.value)}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Notes
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows={4}
                            placeholder="Enter notes"
                        ></textarea>
                    </div>
                    <div className="flex justify-end">
                        <button
                            type="button"
                            onClick={closeModal}
                            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 mr-2"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 text-white"
                        >
                            Add Shift
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateShift;
