import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { Calendar, Filter, RefreshCw } from "lucide-react";
import api from "../../../utils/api/axios";
import { RootState } from "../../../store";

interface BranchItem {
    id: string;
    center_name: string;
}

interface DoctorItem {
    id: string;
    first_name: string;
    last_name: string;
}

interface SessionItem {
    id: string;
    session_date: string;
    start_time: string;
    end_time: string;
    doctor_id: string;
    doctor_name: string;
    branch_id: string;
    branch_name: string;
    appointment_count: number;
    status: string;
}

const PatientSessionsList: React.FC = () => {
    const userRole = useSelector((state: RootState) => state.auth.userRole);
    const [sessions, setSessions] = useState<SessionItem[]>([]);
    const [branches, setBranches] = useState<BranchItem[]>([]);
    const [doctors, setDoctors] = useState<DoctorItem[]>([]);
    const [filters, setFilters] = useState({
        branch_id: "",
        doctor_id: "",
        session_date: "",
    });
    const [loading, setLoading] = useState(false);

    const roleName = useMemo(() => {
        const map: Record<number, string> = {
            1: "super_admin",
            2: "branch_admin",
            3: "doctor",
            4: "nurse",
            5: "patient",
        };
        return map[userRole] || "user";
    }, [userRole]);

    const canFilterBranch = roleName === "super_admin";
    const canFilterDoctor = roleName === "super_admin" || roleName === "branch_admin";

    const loadFilters = async () => {
        try {
            const branchResponse: any = await api.get("/get-branches");
            const branchList = branchResponse?.branches || [];
            setBranches(branchList);
        } catch {
            setBranches([]);
        }

        try {
            const doctorResponse: any = await api.get("/doctors/");
            const doctorList = Array.isArray(doctorResponse) ? doctorResponse : [];
            setDoctors(doctorList);
        } catch {
            setDoctors([]);
        }
    };

    const fetchSessions = async () => {
        setLoading(true);
        try {
            const params: Record<string, string> = {};
            if (filters.branch_id) params.branch_id = filters.branch_id;
            if (filters.doctor_id) params.doctor_id = filters.doctor_id;
            if (filters.session_date) params.session_date = filters.session_date;

            const response: any = await api.get("/sessions", { params });
            setSessions(Array.isArray(response) ? response : []);
        } catch {
            setSessions([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadFilters();
    }, []);

    useEffect(() => {
        fetchSessions();
    }, [filters.branch_id, filters.doctor_id, filters.session_date]);

    return (
        <div className="p-3 sm:p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900">Patient Session Management</h1>
                    <p className="text-sm text-neutral-500">Sessions that have appointments scheduled</p>
                </div>
                <button
                    onClick={fetchSessions}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-neutral-200 text-neutral-700 hover:bg-neutral-50"
                >
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                </button>
            </div>

            <div className="bg-white rounded-2xl border border-neutral-200 p-4 mb-6">
                <div className="flex flex-wrap items-end gap-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-neutral-600">
                        <Filter className="w-4 h-4" />
                        Filters
                    </div>

                    {canFilterBranch && (
                        <div className="w-full sm:w-auto">
                            <label className="block text-xs font-medium text-neutral-500 mb-1">Branch</label>
                            <select
                                value={filters.branch_id}
                                onChange={(e) => setFilters((prev) => ({ ...prev, branch_id: e.target.value }))}
                                className="border border-neutral-300 rounded-lg px-3 py-2 text-sm w-full sm:min-w-[200px] sm:w-auto"
                            >
                                <option value="">All Branches</option>
                                {branches.map((b) => (
                                    <option key={b.id} value={b.id}>
                                        {b.center_name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {canFilterDoctor && (
                        <div className="w-full sm:w-auto">
                            <label className="block text-xs font-medium text-neutral-500 mb-1">Doctor</label>
                            <select
                                value={filters.doctor_id}
                                onChange={(e) => setFilters((prev) => ({ ...prev, doctor_id: e.target.value }))}
                                className="border border-neutral-300 rounded-lg px-3 py-2 text-sm w-full sm:min-w-[200px] sm:w-auto"
                            >
                                <option value="">All Doctors</option>
                                {doctors.map((d) => (
                                    <option key={d.id} value={d.id}>
                                        Dr. {d.first_name} {d.last_name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="w-full sm:w-auto">
                        <label className="block text-xs font-medium text-neutral-500 mb-1">Date</label>
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-neutral-400" />
                            <input
                                type="date"
                                value={filters.session_date}
                                onChange={(e) => setFilters((prev) => ({ ...prev, session_date: e.target.value }))}
                                className="border border-neutral-300 rounded-lg px-3 py-2 text-sm"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-neutral-200 overflow-x-auto">
                {loading ? (
                    <div className="p-6 text-sm text-neutral-500">Loading sessions...</div>
                ) : sessions.length === 0 ? (
                    <div className="p-6 text-sm text-neutral-500">No sessions found for the current filters.</div>
                ) : (
                    <table className="w-full text-sm min-w-[700px]">
                        <thead className="bg-neutral-50 text-neutral-500 uppercase text-xs">
                            <tr>
                                <th className="text-left px-4 py-3">Date</th>
                                <th className="text-left px-4 py-3">Time</th>
                                <th className="text-left px-4 py-3">Doctor</th>
                                <th className="text-left px-4 py-3">Branch</th>
                                <th className="text-left px-4 py-3">Appointments</th>
                                <th className="text-left px-4 py-3">Status</th>
                                <th className="text-right px-4 py-3">Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100">
                            {sessions.map((session) => (
                                <tr key={session.id} className="hover:bg-neutral-50">
                                    <td className="px-4 py-3 font-medium text-neutral-900">{session.session_date}</td>
                                    <td className="px-4 py-3 text-neutral-700">
                                        {session.start_time} - {session.end_time}
                                    </td>
                                    <td className="px-4 py-3 text-neutral-700">{session.doctor_name}</td>
                                    <td className="px-4 py-3 text-neutral-700">{session.branch_name}</td>
                                    <td className="px-4 py-3 text-neutral-700">{session.appointment_count}</td>
                                    <td className="px-4 py-3 text-neutral-700 capitalize">{session.status}</td>
                                    <td className="px-4 py-3 text-right">
                                        <Link
                                            to={session.id}
                                            className="text-emerald-600 hover:text-emerald-700 font-medium"
                                        >
                                            View
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default PatientSessionsList;
