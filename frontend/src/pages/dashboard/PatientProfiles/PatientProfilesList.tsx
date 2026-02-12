import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { ArrowLeft, Calendar, Filter, RefreshCw } from "lucide-react";
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

interface PatientItem {
    id: string;
    user?: {
        first_name?: string;
        last_name?: string;
        email?: string;
    } | null;
    patient_profile?: {
        sex?: string;
        age?: number;
        height_cm?: number;
        weight_kg?: number;
    } | null;
}

const PatientProfilesList: React.FC = () => {
    const userRole = useSelector((state: RootState) => state.auth.userRole);
    const navigate = useNavigate();
    const [patients, setPatients] = useState<PatientItem[]>([]);
    const [branches, setBranches] = useState<BranchItem[]>([]);
    const [doctors, setDoctors] = useState<DoctorItem[]>([]);
    const [filters, setFilters] = useState({
        name: "",
        branch_id: "",
        doctor_id: "",
        date: "",
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
            setBranches(branchResponse?.branches || []);
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

    const fetchPatients = async () => {
        setLoading(true);
        try {
            const params: Record<string, string> = { include_profile: "true" };
            if (filters.name) params.name = filters.name;
            if (filters.branch_id) params.branch_id = filters.branch_id;
            if (filters.doctor_id) params.doctor_id = filters.doctor_id;
            if (filters.date) params.date = filters.date;

            const response: any = await api.get("/patients", { params });
            setPatients(Array.isArray(response) ? response : []);
        } catch {
            setPatients([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadFilters();
    }, []);

    useEffect(() => {
        fetchPatients();
    }, [filters.name, filters.branch_id, filters.doctor_id, filters.date]);

    return (
        <div className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                    {userRole === 2 && (
                        <button
                            onClick={() => navigate('/branch-admin/dashboard')}
                            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                            title="Back to Dashboard"
                        >
                            <ArrowLeft className="w-5 h-5 text-neutral-500" />
                        </button>
                    )}
                    <div>
                        <h1 className="text-2xl font-bold text-neutral-900">Patient Profiles</h1>
                        <p className="text-sm text-neutral-500">Search and review patient profiles</p>
                    </div>
                </div>
                <button
                    onClick={fetchPatients}
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

                    <div>
                        <label className="block text-xs font-medium text-neutral-500 mb-1">Name</label>
                        <input
                            value={filters.name}
                            onChange={(e) => setFilters((prev) => ({ ...prev, name: e.target.value }))}
                            className="border border-neutral-300 rounded-lg px-3 py-2 text-sm"
                            placeholder="Search by name"
                        />
                    </div>

                    {canFilterBranch && (
                        <div>
                            <label className="block text-xs font-medium text-neutral-500 mb-1">Branch</label>
                            <select
                                value={filters.branch_id}
                                onChange={(e) => setFilters((prev) => ({ ...prev, branch_id: e.target.value }))}
                                className="border border-neutral-300 rounded-lg px-3 py-2 text-sm min-w-[200px]"
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
                        <div>
                            <label className="block text-xs font-medium text-neutral-500 mb-1">Doctor</label>
                            <select
                                value={filters.doctor_id}
                                onChange={(e) => setFilters((prev) => ({ ...prev, doctor_id: e.target.value }))}
                                className="border border-neutral-300 rounded-lg px-3 py-2 text-sm min-w-[200px]"
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

                    <div>
                        <label className="block text-xs font-medium text-neutral-500 mb-1">Date</label>
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-neutral-400" />
                            <input
                                type="date"
                                value={filters.date}
                                onChange={(e) => setFilters((prev) => ({ ...prev, date: e.target.value }))}
                                className="border border-neutral-300 rounded-lg px-3 py-2 text-sm"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
                {loading ? (
                    <div className="p-6 text-sm text-neutral-500">Loading patient profiles...</div>
                ) : patients.length === 0 ? (
                    <div className="p-6 text-sm text-neutral-500">No patient profiles found.</div>
                ) : (
                    <table className="w-full text-sm">
                        <thead className="bg-neutral-50 text-neutral-500 uppercase text-xs">
                            <tr>
                                <th className="text-left px-4 py-3">Patient</th>
                                <th className="text-left px-4 py-3">Sex</th>
                                <th className="text-left px-4 py-3">Age</th>
                                <th className="text-left px-4 py-3">Height</th>
                                <th className="text-left px-4 py-3">Weight</th>
                                <th className="text-right px-4 py-3">Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100">
                            {patients.map((patient) => (
                                <tr key={patient.id} className="hover:bg-neutral-50">
                                    <td className="px-4 py-3 font-medium text-neutral-900">
                                        {patient.user?.first_name} {patient.user?.last_name}
                                    </td>
                                    <td className="px-4 py-3 text-neutral-700">
                                        {patient.patient_profile?.sex || "-"}
                                    </td>
                                    <td className="px-4 py-3 text-neutral-700">
                                        {patient.patient_profile?.age ?? "-"}
                                    </td>
                                    <td className="px-4 py-3 text-neutral-700">
                                        {patient.patient_profile?.height_cm ?? "-"}
                                    </td>
                                    <td className="px-4 py-3 text-neutral-700">
                                        {patient.patient_profile?.weight_kg ?? "-"}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <Link
                                            to={patient.id}
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

export default PatientProfilesList;
