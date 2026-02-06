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
                // Response is already IBranchData[] from axios interceptor
                const branchOptions = (response || []).map(
                    (branch: Branch) => ({
                        label: branch.center_name,
                        value: branch.id,
                    }),
                );
                setBranchOptions(branchOptions);
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
        <div className="bg-white/80 backdrop-blur-xl p-6 rounded-2xl shadow-xl border border-white/50 relative z-10 w-full min-w-full">
            <div className="flex items-center gap-2 mb-6">
                <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center text-primary-600">
                    <FaCalendarAlt className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-neutral-900">Book an Appointment</h3>
                    <p className="text-sm text-neutral-500">Find the right doctor for you</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-1.5 group">
                    <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider flex items-center gap-2">
                        <FaUser className="text-primary-400" /> Select Doctor...
                    </label>
                    <div className="relative">
                        <MultiSelect
                            options={doctorUsersDropDownOptions}
                            value={selectedDoctors}
                            onChange={(selected: MultiSelectOption[]) => {
                                setSelectedDoctors(selected.slice(-1));
                            }}
                            labelledBy="DoctorSchedule"
                            className="custom-multiselect w-full"
                            hasSelectAll={false}
                            disableSearch={false}
                            overrideStrings={{
                                selectSomeItems: "Choose a Doctor",
                                allItemsAreSelected: "All Doctors Selected",
                                selectAll: "Select All",
                                search: "Search Doctors",
                            }}
                        />
                    </div>
                </div>

                <div className="space-y-1.5 group">
                    <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider flex items-center gap-2">
                        <FaMapMarkerAlt className="text-primary-400" /> Branch
                    </label>
                    <div className="relative">
                        <MultiSelect
                            options={branchOptions}
                            value={selectedBranches}
                            onChange={(selected: MultiSelectOption[]) =>
                                setSelectedBranches(selected.slice(-1))
                            }
                            labelledBy="Select Branch"
                            className="custom-multiselect w-full"
                            overrideStrings={{
                                selectSomeItems: "Select Branch...",
                            }}
                        />
                    </div>
                </div>

                <div className="space-y-1.5 group">
                    <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider flex items-center gap-2">
                        <FaStethoscope className="text-primary-400" /> Specialization
                    </label>
                    <div className="relative">
                        <MultiSelect
                            options={specializationOptions}
                            value={selectedSpecializations}
                            onChange={(selected: MultiSelectOption[]) =>
                                setSelectedSpecializations(selected.slice(-1))
                            }
                            labelledBy="Select Specialization"
                            className="custom-multiselect w-full"
                            overrideStrings={{
                                selectSomeItems: "Select...",
                            }}
                        />
                    </div>
                </div>

                <div className="space-y-1.5 group">
                    <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider flex items-center gap-2">
                        <FaCalendarAlt className="text-primary-400" /> Date
                    </label>
                    <div className="relative">
                        <input
                            type="date"
                            className="w-full h-[42px] px-3 bg-white border border-neutral-200 hover:border-primary-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 rounded-lg transition-all text-neutral-700 text-sm outline-none"
                            min={new Date().toISOString().split('T')[0]}
                            max={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                            onChange={(e) =>
                                setSelectedDate(new Date(e.target.value))
                            }
                        />
                    </div>
                </div>
            </div>

            <div className="mt-2 flex justify-end items-center">
                <p className="text-xs text-neutral-400 mr-auto italic">
                    * You can book up to 30 days in advance
                </p>
                <div className="flex gap-3">
                    {hasFilters && (
                        <button
                            onClick={handleClearFilters}
                            className="px-4 py-2 rounded-lg text-sm font-medium text-neutral-600 hover:bg-neutral-100 transition-colors flex items-center gap-2"
                        >
                            <FaTimes /> Clear
                        </button>
                    )}
                    <button
                        onClick={handleApplyFilter}
                        className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-2.5 rounded-lg font-semibold shadow-lg shadow-primary-500/30 hover:shadow-primary-600/40 transition-all flex items-center gap-2 transform active:scale-95"
                    >
                        <FaSearch /> Search Availability
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DoctorFilterWeb;
