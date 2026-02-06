import React, { useState, useEffect } from "react";
import { getAllUsers } from "../../../../../utils/api/dashboard/StaffAndUsers/GetAllUsers";
import { IUser } from "../../../../../utils/types/users/Iuser";
import alert from "../../../../../utils/alert";
import axios from "axios";
import {
    dayMap,
    EditShiftModalProps,
} from "../../../../../utils/types/Dashboard/StaffAndUser/IShift.ts";
import { updateShift } from "../../../../../utils/api/dashboard/StaffAndUsers/ShiftUpdate.ts";

const EditShiftModal: React.FC<EditShiftModalProps> = ({
    isOpen,
    shift,
    onClose,
    onShiftUpdated,
}) => {
    const [users, setUsers] = useState<IUser[]>([]);
    const [selectedUser, setSelectedUser] = useState<IUser | null>(null);
    const [selectedDays, setSelectedDays] = useState<string[]>([]);
    const [shiftType, setShiftType] = useState<string>("");
    const [startTime, setStartTime] = useState<string>("");
    const [endTime, setEndTime] = useState<string>("");
    const [notes, setNotes] = useState<string>("");

    useEffect(() => {
        if (!shift) return;
        setSelectedDays(JSON.parse(shift.days_of_week));
        setShiftType(shift.shift_type);
        setStartTime(shift.start_time);
        setEndTime(shift.end_time);
        setNotes(shift.notes || "");

        const fetchUsers = async () => {
            try {
                const response = await getAllUsers();
                const usersList = response.data.users;
                setUsers(usersList);
                const user = usersList.find(
                    (u: IUser) => u.id === shift.user_id,
                );
                setSelectedUser(user || null);
            } catch {
                alert.warn("Error fetching users. Please try again later.");
            }
        };

        fetchUsers();
    }, [shift]);

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
        const user = users.find((u: IUser) => u.id === userId) || null;
        setSelectedUser(user);
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        const formatTime = (time: string): string => {
            const [hours, minutes] = time.split(":");
            return `${parseInt(hours, 10)}:${minutes}`;
        };

        const shiftData = {
            user_id: selectedUser?.id || "",
            branch_id: selectedUser?.branch_id || "",
            shift_type: shiftType,
            days_of_week: JSON.stringify(selectedDays),
            start_time: formatTime(startTime),
            end_time: formatTime(endTime),
            notes: notes,
        };

        try {
            const response = await updateShift({ ...shiftData, id: shift.id });
            if (response.status === 200) {
                alert.success("Shift updated successfully!");
                onClose();
                onShiftUpdated();
            }
        } catch (error) {
            if (axios.isAxiosError(error)) {
                alert.error(
                    error.response?.data?.message ||
                        "Failed to update shift. Please check the details and try again.",
                );
            } else {
                alert.error("An unexpected error occurred.");
            }
        }
    };

    if (!isOpen || !shift) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-2/3">
                <h2 className="text-lg font-semibold mb-4">Edit Shift</h2>
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2">
                                Select User
                            </label>
                            <select
                                onChange={handleUserChange}
                                value={selectedUser?.id || ""}
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
                                Shift Type
                            </label>
                            <select
                                value={shiftType}
                                onChange={(e) => setShiftType(e.target.value)}
                                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                            >
                                <option value="Night shift">Night shift</option>
                                <option value="Day shift">Day shift</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2">
                                Day of Week
                            </label>
                            <div className="flex flex-col gap-2">
                                <select
                                    onChange={handleDayChange}
                                    className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                                >
                                    <option>Select day</option>
                                    {Object.keys(dayMap).map((key) => (
                                        <option key={key} value={key}>
                                            {dayMap[key]}
                                        </option>
                                    ))}
                                </select>
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {selectedDays.map((day) => (
                                        <span
                                            key={day}
                                            className="bg-blue-100 text-primary-500 px-2 py-1 rounded-md text-sm flex items-center"
                                        >
                                            {dayMap[day]}
                                            <button
                                                type="button"
                                                onClick={() => removeDay(day)}
                                                className="ml-2 text-error-500 hover:text-red-700"
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
                            <label className="block text-sm font-medium text-neutral-700 mb-2">
                                Start Time
                            </label>
                            <input
                                type="time"
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2">
                                End Time
                            </label>
                            <input
                                type="time"
                                value={endTime}
                                onChange={(e) => setEndTime(e.target.value)}
                                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                        </div>
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                            Notes
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                            rows={4}
                            placeholder="Enter notes"
                        ></textarea>
                    </div>
                    <div className="flex justify-end">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 bg-neutral-300 text-neutral-700 rounded-md hover:bg-gray-400 mr-2"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-primary-500 rounded-lg hover:bg-primary-600 text-white"
                        >
                            Update Shift
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditShiftModal;
