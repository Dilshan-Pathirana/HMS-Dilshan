import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    FaUser,
    FaStethoscope,
    FaMapMarkerAlt,
    FaCalendarAlt,
    FaSearch,
    FaTimes,
} from "react-icons/fa";
import { MultiSelect } from "react-multi-select-component";
import api from "../../../utils/api/axios";
import {
    Branch,
    Doctor,
    MultiSelectOption,
} from "../../../utils/types/Appointment/IAppointment.ts";
import { getAllBranches } from "../../../utils/api/branch/GetAllBranches";
import { getAllDoctorUsers } from "../../../utils/api/dashboard/StaffAndUsers/GetAllDoctorUsers";
import { specializationOptions } from "../../../utils/api/user/DoctorData";
import { daysOfWeek } from "../../../utils/types/Website/dateUtils.ts";

const DoctorFilterWeb = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState<Doctor[]>([]);
    const [branchOptions, setBranchOptions] = useState<MultiSelectOption[]>([]);
    const [selectedDoctors, setSelectedDoctors] = useState<MultiSelectOption[]>(
        [],
    );
    const [selectedBranches, setSelectedBranches] = useState<
        MultiSelectOption[]
    >([]);
    const [selectedSpecializations, setSelectedSpecializations] = useState<
        MultiSelectOption[]
    >([]);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [doctorUsersDropDownOptions, setDoctorUsersDropDownOptions] =
        useState<MultiSelectOption[]>([]);

    useEffect(() => {
        const fetchDoctors = async () => {
            try {
                const response = await getAllDoctorUsers();
                if (response.status === 200) {
                    // Check if response.data is an array (new API) or object with doctors key (legacy)
                    const doctorsData = Array.isArray(response.data) ? response.data : response.data.doctors;
                    setUsers(doctorsData || []);
                }
            } catch (error) {
                console.error("Failed to fetch doctors:", error);
            }
        };

        const fetchBranches = async () => {
            try {
                const response = await getAllBranches();
                if (response.status === 200) {
                    // Check if response.data is an array (new API) or object with branches key (legacy)
                    const branchesData = Array.isArray(response.data) ? response.data : response.data.branches;

                    const branchOptions = (branchesData || []).map(
                        (branch: Branch) => ({
                            label: branch.center_name,
                            value: branch.id,
                        }),
                    );
                    setBranchOptions(branchOptions);
                }
            } catch (error) {
                console.error("Failed to fetch branches:", error);
            }
        };

        fetchDoctors();
        fetchBranches();
    }, []);

    useEffect(() => {
        doctorUsersCreateForSelector();
    }, [users]);

    const handleApplyFilter = async () => {
        const filters = {
            branch_id:
                selectedBranches.length > 0 ? selectedBranches[0].value : null,
            doctor_id:
                selectedDoctors.length > 0 ? selectedDoctors[0].value : null,
            areas_of_specialization:
                selectedSpecializations.length > 0
                    ? selectedSpecializations[0].value
                    : null,
            date: selectedDate ? daysOfWeek[selectedDate.getDay()] : null,
        };

        try {
            const response = await api.get("/get-doctor-schedules", {
                params: filters,
            });
            if (response.status === 200) {
                navigate("/doctor-schedule", {
                    state: { doctorSchedules: response.data.doctorSchedules },
                });
            } else {
                console.warn(
                    "Failed to fetch schedules:",
                    response.data.message,
                );
            }
        } catch (error) {
            console.error("Error fetching schedules:", error);
        }
    };

    const doctorUsersCreateForSelector = (): void => {
        const doctorUsersOptions = users.map((user) => ({
            label: `${user.first_name} ${user.last_name}`,
            value: user.user_id,
        }));

        setDoctorUsersDropDownOptions(doctorUsersOptions);
    };

    const hasFilters = selectedDoctors.length > 0 || selectedBranches.length > 0 || selectedSpecializations.length > 0 || selectedDate !== null;

    const handleClearFilters = () => {
        setSelectedDoctors([]);
        setSelectedBranches([]);
        setSelectedSpecializations([]);
        setSelectedDate(null);
        // Reset the date input field
        const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
        if (dateInput) dateInput.value = '';
    };

    return (
        <div className="bg-gradient-to-br from-white via-blue-50 to-white p-4 rounded-xl shadow-lg border border-blue-100 backdrop-blur-sm relative z-10">
            <div className="flex flex-wrap items-end justify-between gap-3 relative">
                <div className="flex flex-col w-full md:w-1/5 group relative">
                    <label className="text-gray-700 font-semibold mb-2 flex items-center text-sm transition-colors duration-300 group-hover:text-blue-600">
                        <div className="w-6 h-6 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center mr-2 shadow-sm group-hover:shadow-md transition-all duration-300">
                            <FaUser className="text-blue-600 w-3 h-3" />
                        </div>
                        Doctor Schedule
                    </label>
                    <div className="relative">
                        <div className="dropdown-container">
                            <MultiSelect
                                options={doctorUsersDropDownOptions}
                                value={selectedDoctors}
                                onChange={(selected: MultiSelectOption[]) => {
                                    setSelectedDoctors(selected.slice(-1));
                                }}
                                labelledBy="DoctorSchedule"
                                className="w-full bg-white border border-gray-200 hover:border-blue-300 focus:border-blue-500 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 text-sm dropdown-up"
                                hasSelectAll={false}
                                disableSearch={false}
                                overrideStrings={{
                                    selectSomeItems: "Select Doctor...",
                                    allItemsAreSelected: "All Doctors Selected",
                                    selectAll: "Select All",
                                    search: "Search Doctors",
                                }}
                            />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-transparent opacity-0 hover:opacity-100 rounded-lg pointer-events-none transition-opacity duration-300"></div>
                    </div>
                </div>

                <div className="flex flex-col w-full md:w-1/5 group">
                    <label className="text-gray-700 font-semibold mb-2 flex items-center text-sm transition-colors duration-300 group-hover:text-blue-600">
                        <div className="w-6 h-6 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center mr-2 shadow-sm group-hover:shadow-md transition-all duration-300">
                            <FaMapMarkerAlt className="text-blue-600 w-3 h-3" />
                        </div>
                        Branch
                    </label>
                    <div className="relative">
                        <MultiSelect
                            options={branchOptions}
                            value={selectedBranches}
                            onChange={(selected: MultiSelectOption[]) =>
                                setSelectedBranches(selected.slice(-1))
                            }
                            labelledBy="Select Branch"
                            className="w-full bg-white border border-gray-200 hover:border-blue-300 focus:border-blue-500 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 text-sm"
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-transparent opacity-0 hover:opacity-100 rounded-xl pointer-events-none transition-opacity duration-300"></div>
                    </div>
                </div>

                <div className="flex flex-col w-full md:w-1/5 group">
                    <label className="text-gray-700 font-semibold mb-2 flex items-center text-sm transition-colors duration-300 group-hover:text-blue-600">
                        <div className="w-6 h-6 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center mr-2 shadow-sm group-hover:shadow-md transition-all duration-300">
                            <FaStethoscope className="text-blue-600 w-3 h-3" />
                        </div>
                        Specialization
                    </label>
                    <div className="relative">
                        <MultiSelect
                            options={specializationOptions}
                            value={selectedSpecializations}
                            onChange={(selected: MultiSelectOption[]) =>
                                setSelectedSpecializations(selected.slice(-1))
                            }
                            labelledBy="Select Specialization"
                            className="w-full bg-white border border-gray-200 hover:border-blue-300 focus:border-blue-500 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 text-sm"
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-transparent opacity-0 hover:opacity-100 rounded-xl pointer-events-none transition-opacity duration-300"></div>
                    </div>
                </div>

                <div className="flex flex-col w-full md:w-1/5 group">
                    <label className="text-gray-700 font-semibold mb-2 flex items-center text-sm transition-colors duration-300 group-hover:text-blue-600">
                        <div className="w-6 h-6 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center mr-2 shadow-sm group-hover:shadow-md transition-all duration-300">
                            <FaCalendarAlt className="text-blue-600 w-3 h-3" />
                        </div>
                        Date
                    </label>
                    <div className="relative">
                        <input
                            type="date"
                            className="w-full px-3 py-2 bg-white border border-gray-200 hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 text-gray-700 text-sm outline-none"
                            min={new Date().toISOString().split('T')[0]}
                            max={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                            onChange={(e) =>
                                setSelectedDate(new Date(e.target.value))
                            }
                        />
                        <p className="text-xs text-gray-500 mt-1">You can book up to 30 days in advance</p>
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-transparent opacity-0 hover:opacity-100 rounded-xl pointer-events-none transition-opacity duration-300"></div>
                    </div>
                </div>

                <div className="w-full md:w-auto flex items-end gap-2">
                    {hasFilters && (
                        <button
                            onClick={handleClearFilters}
                            className="group relative overflow-hidden bg-gradient-to-r from-gray-500 via-gray-600 to-gray-700 hover:from-gray-600 hover:via-gray-700 hover:to-gray-800 text-white px-4 py-2 rounded-lg font-semibold flex items-center justify-center transition-all duration-300 shadow-md hover:shadow-lg border border-gray-400 hover:border-gray-300 text-sm"
                        >
                            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                            <div className="flex items-center space-x-2 relative z-10">
                                <FaTimes className="w-3 h-3 group-hover:scale-110 transition-transform duration-300" />
                                <span>Clear</span>
                            </div>
                        </button>
                    )}
                    <button
                        onClick={handleApplyFilter}
                        className="group relative overflow-hidden bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 hover:from-blue-700 hover:via-blue-800 hover:to-blue-900 text-white px-5 py-2 rounded-lg font-semibold flex items-center justify-center w-full md:w-auto transition-all duration-300 shadow-md hover:shadow-lg border border-blue-500 hover:border-blue-400 text-sm"
                    >
                        <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                        <div className="flex items-center space-x-2 relative z-10">
                            <FaSearch className="w-3 h-3 group-hover:scale-110 transition-transform duration-300" />
                            <span>Search</span>
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 transform -skew-x-12 group-hover:animate-pulse"></div>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DoctorFilterWeb;
