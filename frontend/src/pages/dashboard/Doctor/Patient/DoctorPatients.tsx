import React, { useState, useEffect } from "react";
import {
    Search,
    Filter,
    MoreHorizontal,
    User,
    Users,
    Calendar,
    Phone,
    MapPin,
    FileText,
    Activity,
    ChevronRight,
    Plus,
    Stethoscope,
    Clock,
    AlertCircle
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../../../utils/api/axios";
import { useSelector } from "react-redux";
import { RootState } from "../../../../store";
import { PageHeader } from "../../../../components/ui/PageHeader";

interface Patient {
    _id: string;
    firstName: string;
    lastName: string;
    gender: string;
    dateOfBirth: string;
    contactNumber: string;
    address: string;
    nic: string;
    bloodGroup?: string;
    allergies?: string[];
    chronicConditions?: string[];
}

const DoctorPatients = () => {
    const navigate = useNavigate();
    const [patients, setPatients] = useState<Patient[]>([]);
    const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

    // Fetch patients
    useEffect(() => {
        const fetchPatients = async () => {
            try {
                setIsLoading(true);
                // Using the general patient endpoint for now, ideally filtered by doctor's appointments
                const response = await api.get("/patient/get-all-patients");
                if (response.data) {
                    setPatients(response.data);
                    setFilteredPatients(response.data);
                }
            } catch (error) {
                console.error("Error fetching patients:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPatients();
    }, []);

    // Filter logic
    useEffect(() => {
        const lowerTerm = searchTerm.toLowerCase();
        const filtered = patients.filter(
            (patient) =>
                patient.firstName.toLowerCase().includes(lowerTerm) ||
                patient.lastName.toLowerCase().includes(lowerTerm) ||
                patient.nic.toLowerCase().includes(lowerTerm) ||
                patient.contactNumber.includes(lowerTerm)
        );
        setFilteredPatients(filtered);
    }, [searchTerm, patients]);

    const calculateAge = (dob: string) => {
        if (!dob) return "N/A";
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="My Patients"
                description="View and manage patient medical records and history."
                actions={
                    <button className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-all font-medium shadow-sm hover:shadow-md">
                        <Plus className="h-4 w-4" />
                        Add Patient
                    </button>
                }
            />

            {/* Search and Filter Bar */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-neutral-200 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
                    <input
                        type="text"
                        placeholder="Search by name, NIC, or phone..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex bg-neutral-100 p-1 rounded-lg">
                        <button
                            onClick={() => setViewMode("grid")}
                            className={`p-2 rounded-md transition-all ${viewMode === "grid"
                                ? "bg-white text-primary-600 shadow-sm"
                                : "text-neutral-500 hover:text-neutral-700"
                                }`}
                        >
                            <div className="w-5 h-5 grid grid-cols-2 gap-0.5">
                                <span className="bg-current rounded-[1px]" />
                                <span className="bg-current rounded-[1px]" />
                                <span className="bg-current rounded-[1px]" />
                                <span className="bg-current rounded-[1px]" />
                            </div>
                        </button>
                        <button
                            onClick={() => setViewMode("list")}
                            className={`p-2 rounded-md transition-all ${viewMode === "list"
                                ? "bg-white text-primary-600 shadow-sm"
                                : "text-neutral-500 hover:text-neutral-700"
                                }`}
                        >
                            <div className="w-5 h-5 flex flex-col gap-1 justify-center">
                                <span className="h-0.5 w-full bg-current rounded-full" />
                                <span className="h-0.5 w-full bg-current rounded-full" />
                                <span className="h-0.5 w-full bg-current rounded-full" />
                            </div>
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="bg-white rounded-2xl p-6 border border-neutral-200 shadow-sm animate-pulse">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 bg-neutral-100 rounded-full" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-neutral-100 rounded w-3/4" />
                                    <div className="h-3 bg-neutral-100 rounded w-1/2" />
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div className="h-3 bg-neutral-100 rounded w-full" />
                                <div className="h-3 bg-neutral-100 rounded w-2/3" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : filteredPatients.length > 0 ? (
                viewMode === "grid" ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredPatients.map((patient) => (
                            <div
                                key={patient._id}
                                onClick={() => navigate(`/doctor/patients/${patient._id}`)}
                                className="bg-white rounded-2xl border border-neutral-200 shadow-sm hover:shadow-lg hover:border-primary-200 transition-all cursor-pointer group flex flex-col overflow-hidden"
                            >
                                <div className="p-5 flex-1">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-full bg-primary-50 flex items-center justify-center text-primary-600 font-bold text-lg border-2 border-primary-100">
                                                {patient.firstName[0]}
                                                {patient.lastName[0]}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-neutral-900 group-hover:text-primary-700 transition-colors">
                                                    {patient.firstName} {patient.lastName}
                                                </h3>
                                                <p className="text-xs text-neutral-500 font-medium">
                                                    {calculateAge(patient.dateOfBirth)} Years • {patient.gender}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3 text-sm text-neutral-600">
                                            <Phone className="w-4 h-4 text-neutral-400" />
                                            <span>{patient.contactNumber}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm text-neutral-600">
                                            <MapPin className="w-4 h-4 text-neutral-400" />
                                            <span className="line-clamp-1">{patient.address}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm text-neutral-600">
                                            <Activity className="w-4 h-4 text-neutral-400" />
                                            <span className="line-clamp-1">{patient.bloodGroup || 'Blood Group not set'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="px-5 py-3 bg-neutral-50 border-t border-neutral-100 flex items-center justify-between group-hover:bg-primary-50/50 transition-colors">
                                    <span className="text-xs font-bold text-neutral-500 uppercase tracking-wide group-hover:text-primary-600">View Record</span>
                                    <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-primary-500 transform group-hover:translate-x-1 transition-all" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-neutral-50 border-b border-neutral-100">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase">Patient Name</th>
                                    <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase">Age/Gender</th>
                                    <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase">Contact</th>
                                    <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase">Blood Group</th>
                                    <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100">
                                {filteredPatients.map((patient) => (
                                    <tr
                                        key={patient._id}
                                        onClick={() => navigate(`/doctor/patients/${patient._id}`)}
                                        className="hover:bg-neutral-50 cursor-pointer transition-colors group"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center text-primary-600 font-bold text-xs">
                                                    {patient.firstName[0]}
                                                    {patient.lastName[0]}
                                                </div>
                                                <span className="font-medium text-neutral-900">{patient.firstName} {patient.lastName}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-neutral-600">
                                            {calculateAge(patient.dateOfBirth)} Y / {patient.gender}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-neutral-600">{patient.contactNumber}</td>
                                        <td className="px-6 py-4 text-sm text-neutral-600">
                                            <span className="px-2 py-1 rounded-lg bg-neutral-100 text-neutral-700 text-xs font-bold">
                                                {patient.bloodGroup || 'N/A'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <ChevronRight className="w-4 h-4 text-neutral-300 group-hover:text-primary-500 inline-block" />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )
            ) : (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-neutral-200 shadow-sm text-center">
                    <div className="w-20 h-20 bg-neutral-50 rounded-full flex items-center justify-center mb-4">
                        <Users className="w-10 h-10 text-neutral-300" />
                    </div>
                    <h3 className="text-xl font-bold text-neutral-900 mb-2">No Patients Found</h3>
                    <p className="text-neutral-500 max-w-md mx-auto">
                        We couldn't find any patients matching your search.
                    </p>
                </div>
            )}
        </div>
    );
};

export default DoctorPatients;
