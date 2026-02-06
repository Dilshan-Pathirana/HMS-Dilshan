import React, { useState, useEffect } from "react";
import api from "../../../../utils/api/axios";
import { Plus, Trash2, Calendar, Clock, User, X, Search, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface IUser {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    center_name?: string;
    branch_id: string;
}

interface IShift {
    id: string;
    user_id: string;
    branch_id: string;
    shift_type: string;
    days_of_week: string;
    start_time: string;
    end_time: string;
    notes: string | null;
    user_first_name?: string;
    user_last_name?: string;
    branch_center_name?: string;
}

const dayMap: { [key: string]: string } = {
    "1": "Sunday",
    "2": "Monday",
    "3": "Tuesday",
    "4": "Wednesday",
    "5": "Thursday",
    "6": "Friday",
    "7": "Saturday",
};

const ShiftManagement: React.FC = () => {
    const navigate = useNavigate();
    const [shifts, setShifts] = useState<IShift[]>([]);
    const [users, setUsers] = useState<IUser[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [userRole, setUserRole] = useState<number>(0);
    const [userBranchId, setUserBranchId] = useState<string>("");
    const [shiftTypes, setShiftTypes] = useState<string[]>(["Day shift", "Night shift"]);
    const [customShiftType, setCustomShiftType] = useState("");
    const [showCustomInput, setShowCustomInput] = useState(false);
    const [shiftTypeTimings, setShiftTypeTimings] = useState<{ [key: string]: { start_time: string; end_time: string } }>({});

    const [formData, setFormData] = useState({
        user_id: "",
        branch_id: "",
        shift_type: "",
        days_of_week: [] as string[],
        start_time: "",
        end_time: "",
        notes: "",
    });

    useEffect(() => {
        // Get logged-in user info
        const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
        setUserRole(userInfo.role_as || 0);
        setUserBranchId(userInfo.branch_id || "");

        fetchShifts();
        fetchUsers();
    }, []);

    const fetchShifts = async () => {
        try {
            setLoading(true);
            const response = await api.get("/hr/shifts");
            console.log("Shifts response:", response.data);

            // Handle response - could be response.data.data or response.data.shifts
            const fetchedShifts = response.data.data?.shifts || response.data.data || response.data.shifts || [];
            console.log("Fetched shifts:", fetchedShifts);
            setShifts(fetchedShifts);

            // Extract unique shift types from existing shifts
            const uniqueShiftTypes = Array.from(
                new Set(fetchedShifts.map((shift: IShift) => shift.shift_type).filter(Boolean))
            ) as string[];

            // Merge with default shift types
            const allShiftTypes = Array.from(
                new Set([...shiftTypes, ...uniqueShiftTypes])
            );
            setShiftTypes(allShiftTypes);

            // Create a mapping of shift types to their timings
            const timingsMap: { [key: string]: { start_time: string; end_time: string } } = {};
            fetchedShifts.forEach((shift: IShift) => {
                if (shift.shift_type && shift.start_time && shift.end_time) {
                    // Store the first occurrence of each shift type's timing
                    if (!timingsMap[shift.shift_type]) {
                        timingsMap[shift.shift_type] = {
                            start_time: shift.start_time,
                            end_time: shift.end_time
                        };
                    }
                }
            });
            setShiftTypeTimings(timingsMap);
        } catch (error: any) {
            console.error("Error fetching shifts:", error);
            showNotification("Failed to load shifts", "error");
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            const response = await api.get("/users");
            setUsers(response.data.users || []);
        } catch (error: any) {
            console.error("Error fetching users:", error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.user_id) {
            showNotification("Please select a user", "error");
            return;
        }
        if (!formData.shift_type) {
            showNotification("Please select shift type", "error");
            return;
        }
        if (formData.days_of_week.length === 0) {
            showNotification("Please select at least one day", "error");
            return;
        }
        if (!formData.start_time || !formData.end_time) {
            showNotification("Please enter start and end times", "error");
            return;
        }

        try {
            const selectedUser = users.find((u) => u.id === formData.user_id);
            const shiftData = {
                user_id: formData.user_id,
                branch_id: selectedUser?.branch_id || "",
                shift_type: formData.shift_type,
                days_of_week: JSON.stringify(formData.days_of_week),
                start_time: formData.start_time,
                end_time: formData.end_time,
                notes: formData.notes,
            };

            await api.post("/hr/shifts", shiftData);

            // Add new shift type to the list if it's not already there
            if (!shiftTypes.includes(formData.shift_type)) {
                setShiftTypes([...shiftTypes, formData.shift_type]);
            }

            showNotification("Shift created successfully!", "success");
            setIsModalOpen(false);
            resetForm();
            fetchShifts();
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || "Failed to create shift";
            showNotification(errorMessage, "error");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this shift?")) return;

        try {
            await api.delete(`/delete-shift/${id}`);
            showNotification("Shift deleted successfully", "success");
            fetchShifts();
        } catch (error: any) {
            showNotification("Failed to delete shift", "error");
        }
    };

    const handleDayToggle = (day: string) => {
        setFormData((prev) => ({
            ...prev,
            days_of_week: prev.days_of_week.includes(day)
                ? prev.days_of_week.filter((d) => d !== day)
                : [...prev.days_of_week, day],
        }));
    };

    const resetForm = () => {
        setFormData({
            user_id: "",
            branch_id: "",
            shift_type: "",
            days_of_week: [],
            start_time: "",
            end_time: "",
            notes: "",
        });
        setSearchTerm("");
        setCustomShiftType("");
        setShowCustomInput(false);
    };

    const handleAddCustomShiftType = () => {
        if (customShiftType.trim() && !shiftTypes.includes(customShiftType.trim())) {
            const newShiftType = customShiftType.trim();
            setShiftTypes([...shiftTypes, newShiftType]);
            setFormData({ ...formData, shift_type: newShiftType });
            setCustomShiftType("");
            setShowCustomInput(false);
        }
    };

    const showNotification = (message: string, type: "success" | "error") => {
        alert(message);
    };

    // Filter users based on role
    // Super Admin (role_as = 1) sees all users
    // Branch Admin (role_as = 2) sees only users from their branch
    const filteredUsers = users.filter((user) => {
        // First apply role-based branch filter
        const matchesBranch = userRole === 1 || user.branch_id === userBranchId;

        // Then apply search filter
        const matchesSearch =
            user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase());

        return matchesBranch && matchesSearch;
    });

    const selectedUser = users.find((u) => u.id === formData.user_id);

    return (
        <div className="min-h-screen bg-neutral-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate(-1)}
                                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                                title="Go back"
                            >
                                <ArrowLeft className="w-6 h-6 text-neutral-700" />
                            </button>
                            <div>
                                <h1 className="text-3xl font-bold text-neutral-900">Shift Management</h1>
                                <p className="text-neutral-600 mt-1">Create and manage staff work schedules</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="flex items-center gap-2 px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors shadow-lg hover:shadow-xl"
                        >
                            <Plus className="w-5 h-5" />
                            Add Shift
                        </button>
                    </div>
                </div>

                {/* Shifts List */}
                {loading ? (
                    <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
                        <p className="text-neutral-600 mt-4">Loading shifts...</p>
                    </div>
                ) : shifts.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                        <Calendar className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-neutral-900 mb-2">No shifts scheduled</h3>
                        <p className="text-neutral-600 mb-4">Get started by creating your first shift</p>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
                        >
                            <Plus className="w-4 h-4" />
                            Add First Shift
                        </button>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {shifts.map((shift) => {
                            const days = JSON.parse(shift.days_of_week || "[]");
                            return (
                                <div
                                    key={shift.id}
                                    className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-3">
                                                <User className="w-5 h-5 text-primary-500" />
                                                <h3 className="text-lg font-semibold text-neutral-900">
                                                    {shift.user_first_name} {shift.user_last_name}
                                                </h3>
                                                <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
                                                    {shift.shift_type}
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div className="flex items-center gap-2 text-neutral-600">
                                                    <Clock className="w-4 h-4" />
                                                    <span>
                                                        {shift.start_time} - {shift.end_time}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 text-neutral-600">
                                                    <Calendar className="w-4 h-4" />
                                                    <span>{days.map((d: string) => dayMap[d]).join(", ")}</span>
                                                </div>
                                            </div>
                                            {shift.notes && (
                                                <p className="mt-3 text-sm text-neutral-600 bg-neutral-50 p-3 rounded">
                                                    {shift.notes}
                                                </p>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => handleDelete(shift.id)}
                                            className="ml-4 p-2 text-error-600 hover:bg-error-50 rounded-lg transition-colors"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Add Shift Modal */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
                        <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="sticky top-0 bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between">
                                <h2 className="text-2xl font-bold text-neutral-900">Add New Shift</h2>
                                <button
                                    onClick={() => {
                                        setIsModalOpen(false);
                                        resetForm();
                                    }}
                                    className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-6">
                                {/* User Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                                        Select Staff Member *
                                    </label>
                                    <div className="relative mb-2">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
                                        <input
                                            type="text"
                                            placeholder="Search by name or email..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div className="border border-neutral-300 rounded-lg max-h-48 overflow-y-auto">
                                        {filteredUsers.length === 0 ? (
                                            <div className="p-4 text-center text-neutral-500">No users found</div>
                                        ) : (
                                            filteredUsers.map((user) => (
                                                <div
                                                    key={user.id}
                                                    onClick={() =>
                                                        setFormData({ ...formData, user_id: user.id })
                                                    }
                                                    className={`p-3 cursor-pointer hover:bg-neutral-50 border-b border-gray-100 ${
                                                        formData.user_id === user.id ? "bg-blue-50" : ""
                                                    }`}
                                                >
                                                    <div className="font-medium text-neutral-900">
                                                        {user.first_name} {user.last_name}
                                                    </div>
                                                    <div className="text-sm text-neutral-500">{user.email}</div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                {/* Branch Display */}
                                {selectedUser && (
                                    <div>
                                        <label className="block text-sm font-medium text-neutral-700 mb-2">Branch</label>
                                        <input
                                            type="text"
                                            value={selectedUser.center_name || ""}
                                            readOnly
                                            className="w-full px-4 py-2 border border-neutral-300 rounded-lg bg-neutral-50"
                                        />
                                    </div>
                                )}

                                {/* Shift Type */}
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                                        Shift Type *
                                    </label>
                                    {!showCustomInput ? (
                                        <div className="space-y-2">
                                            <select
                                                value={formData.shift_type}
                                                onChange={(e) => {
                                                    if (e.target.value === "custom") {
                                                        setShowCustomInput(true);
                                                        setFormData({ ...formData, shift_type: "" });
                                                    } else {
                                                        const selectedType = e.target.value;
                                                        const timings = shiftTypeTimings[selectedType];

                                                        // Auto-populate times if they exist for this shift type
                                                        if (timings) {
                                                            setFormData({
                                                                ...formData,
                                                                shift_type: selectedType,
                                                                start_time: timings.start_time,
                                                                end_time: timings.end_time
                                                            });
                                                        } else {
                                                            setFormData({ ...formData, shift_type: selectedType });
                                                        }
                                                    }
                                                }}
                                                required
                                                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                            >
                                                <option value="">Select shift type</option>
                                                {shiftTypes.map((type) => (
                                                    <option key={type} value={type}>
                                                        {type}
                                                        {shiftTypeTimings[type] && ` (${shiftTypeTimings[type].start_time} - ${shiftTypeTimings[type].end_time})`}
                                                    </option>
                                                ))}
                                                <option value="custom" className="text-primary-500 font-medium">
                                                    + Add Custom Shift Type
                                                </option>
                                            </select>
                                        </div>
                                    ) : (
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={customShiftType}
                                                onChange={(e) => setCustomShiftType(e.target.value)}
                                                placeholder="Enter custom shift type..."
                                                className="flex-1 px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                                autoFocus
                                            />
                                            <button
                                                type="button"
                                                onClick={handleAddCustomShiftType}
                                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                            >
                                                Add
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setShowCustomInput(false);
                                                    setCustomShiftType("");
                                                }}
                                                className="px-4 py-2 bg-neutral-300 text-neutral-700 rounded-lg hover:bg-gray-400"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Days of Week */}
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                                        Days of Week *
                                    </label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {Object.entries(dayMap).map(([key, label]) => (
                                            <button
                                                key={key}
                                                type="button"
                                                onClick={() => handleDayToggle(key)}
                                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                                    formData.days_of_week.includes(key)
                                                        ? "bg-primary-500 text-white"
                                                        : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                                                }`}
                                            >
                                                {label.substring(0, 3)}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Time Selection */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                                            Start Time *
                                        </label>
                                        <input
                                            type="time"
                                            value={formData.start_time}
                                            onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                                            required
                                            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                                            End Time *
                                        </label>
                                        <input
                                            type="time"
                                            value={formData.end_time}
                                            onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                                            required
                                            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>

                                {/* Notes */}
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-2">Notes</label>
                                    <textarea
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        rows={3}
                                        placeholder="Add any additional notes..."
                                        className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    />
                                </div>

                                {/* Actions */}
                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsModalOpen(false);
                                            resetForm();
                                        }}
                                        className="flex-1 px-6 py-3 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 font-medium transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 font-medium transition-colors"
                                    >
                                        Create Shift
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ShiftManagement;
