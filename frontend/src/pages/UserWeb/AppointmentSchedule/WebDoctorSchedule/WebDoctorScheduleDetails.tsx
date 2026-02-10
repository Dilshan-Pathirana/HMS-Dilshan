import { Link, useLocation, useNavigate } from "react-router-dom";
import Footer from "../../Footer.tsx";
import NavBar from "../../NavBar.tsx";
import DoctorFilterWeb from "../DoctorFilterWeb.tsx";
import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../../../store";
import Spinner from "../../../../assets/Common/Spinner.tsx";
import api from "../../../../utils/api/axios";
import alert from "../../../../utils/alert.ts";

type AvailabilityResult = {
    date: string;
    branch_id: string;
    branch_name: string;
    doctor_id: string;
    doctor_name: string;
    specialisation: string;
    time_slots: string[];
};

type SearchParams = {
    doctor_id: string | null;
    branch_id: string | null;
    specialisation: string | null;
    date: string | null;
};

const WebDoctorScheduleDetails = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { isAuthenticated, userRole } = useSelector((state: RootState) => state.auth);
    const searchResults: AvailabilityResult[] =
        location.state?.searchResults || [];
    const searchParams: SearchParams | undefined =
        location.state?.searchParams;

    const [isLoading, setIsLoading] = useState(true);
    const [selected, setSelected] = useState<{
        date: string;
        branch_id: string;
        branch_name: string;
        doctor_id: string;
        doctor_name: string;
        specialisation: string;
        time: string;
    } | null>(null);

    const [patient, setPatient] = useState({
        first_name: "",
        last_name: "",
        phone: "",
        nic: "",
        email: "",
        address: "",
    });
    const [isBooking, setIsBooking] = useState(false);
    const canBook = isAuthenticated && userRole === 5;

    useEffect(() => {
        setTimeout(() => {
            setIsLoading(false);
        }, 1000);
    }, []);

    const groupBy = <T,>(
        items: T[],
        keyFn: (item: T) => string,
    ): Record<string, T[]> => {
        return items.reduce<Record<string, T[]>>((acc, item) => {
            const key = keyFn(item);
            (acc[key] ||= []).push(item);
            return acc;
        }, {});
    };

    const handleBook = async () => {
        if (!canBook) {
            navigate("/login");
            return;
        }
        if (!selected) return;

        if (!patient.first_name.trim() || !patient.last_name.trim() || !patient.phone.trim()) {
            alert.warn("Please fill in patient name and phone.");
            return;
        }

        setIsBooking(true);
        try {
            await api.post("/appointments/book", {
                doctor_id: selected.doctor_id,
                branch_id: selected.branch_id,
                specialisation: selected.specialisation,
                date: selected.date,
                time: selected.time,
                patient: {
                    first_name: patient.first_name,
                    last_name: patient.last_name,
                    phone: patient.phone,
                    nic: patient.nic || null,
                    email: patient.email || null,
                    address: patient.address || null,
                },
            });

            alert.success("Appointment confirmed");
            setSelected(null);
            setPatient({
                first_name: "",
                last_name: "",
                phone: "",
                nic: "",
                email: "",
                address: "",
            });
        } catch (e: any) {
            const msg = e?.response?.data?.detail || e?.message || "Failed to book appointment";
            alert.error(msg);
        } finally {
            setIsBooking(false);
        }
    };

    let content: React.ReactNode;
    if (isLoading) {
        content = (
            <div className="flex justify-center mt-6">
                <Spinner isLoading={isLoading} />
            </div>
        );
    } else if (searchResults.length === 0) {
        content = (
            <div className="text-center text-neutral-500 mt-20 text-lg">
                No doctor schedules found. Please try adjusting your search
                criteria.
            </div>
        );
    } else {
        const byDate = groupBy(searchResults, (r) => r.date);
        const dates = Object.keys(byDate).sort();

        const hasDateFilter = Boolean(searchParams?.date);

        content = (
            <div className="mt-8 space-y-6">
                {!canBook && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
                        <div className="font-semibold">Log in as a patient to book</div>
                        <div className="text-sm mt-1">
                            You can browse doctors and available sessions, but booking is only for registered patients.
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                            <Link
                                to="/login"
                                className="px-4 py-2 rounded-md bg-primary-600 text-white"
                            >
                                Log in
                            </Link>
                            <Link
                                to="/signup"
                                className="px-4 py-2 rounded-md border border-amber-300 text-amber-900"
                            >
                                Sign up
                            </Link>
                        </div>
                    </div>
                )}
                {hasDateFilter ? (
                    dates.map((d) => {
                        const dateItems = byDate[d];
                        const byBranch = groupBy(dateItems, (r) => `${r.branch_id}__${r.branch_name}`);
                        const branchKeys = Object.keys(byBranch).sort();
                        return (
                            <div key={d} className="bg-white rounded-xl border border-neutral-200 p-4">
                                <div className="text-lg font-bold text-neutral-900">{d}</div>
                                <div className="mt-4 space-y-5">
                                    {branchKeys.map((bk) => {
                                        const [bid, bname] = bk.split("__");
                                        const branchItems = byBranch[bk];
                                        const byDoctor = groupBy(branchItems, (r) => `${r.doctor_id}__${r.doctor_name}__${r.specialisation}`);
                                        const doctorKeys = Object.keys(byDoctor).sort();
                                        return (
                                            <div key={bk} className="border-t border-neutral-100 pt-4">
                                                <div className="text-sm font-semibold text-neutral-700">{bname}</div>
                                                <div className="mt-3 space-y-4">
                                                    {doctorKeys.map((dk) => {
                                                        const [did, dname, spec] = dk.split("__");
                                                        const item = byDoctor[dk][0];
                                                        return (
                                                            <div key={dk} className="rounded-lg border border-neutral-200 p-3">
                                                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                                                                    <div>
                                                                        <div className="font-semibold text-neutral-900">{dname}</div>
                                                                        <div className="text-xs text-neutral-500">{spec}</div>
                                                                    </div>
                                                                    <div className="flex flex-wrap gap-2">
                                                                        {(item.time_slots || []).map((t) => (
                                                                            <button
                                                                                key={t}
                                                                                type="button"
                                                                                className={`px-3 py-1.5 text-sm border rounded-md ${
                                                                                    canBook
                                                                                        ? "border-neutral-200 hover:bg-neutral-50"
                                                                                        : "border-neutral-200 text-neutral-400 cursor-not-allowed"
                                                                                }`}
                                                                                onClick={() =>
                                                                                    canBook &&
                                                                                    setSelected({
                                                                                        date: d,
                                                                                        branch_id: bid,
                                                                                        branch_name: bname,
                                                                                        doctor_id: did,
                                                                                        doctor_name: dname,
                                                                                        specialisation: spec,
                                                                                        time: t,
                                                                                    })
                                                                                }
                                                                                disabled={!canBook}
                                                                            >
                                                                                {t}
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })
                ) : (
                    // No date provided: group by (doctor/branch/specialisation) then list dates+slots
                    (() => {
                        const byKey = groupBy(
                            searchResults,
                            (r) => `${r.doctor_id}__${r.doctor_name}__${r.branch_id}__${r.branch_name}__${r.specialisation}`,
                        );
                        const keys = Object.keys(byKey).sort();
                        return keys.map((k) => {
                            const [did, dname, bid, bname, spec] = k.split("__");
                            const items = byKey[k].slice().sort((a, b) => a.date.localeCompare(b.date));
                            return (
                                <div key={k} className="bg-white rounded-xl border border-neutral-200 p-4">
                                    <div className="font-bold text-neutral-900">{dname}</div>
                                    <div className="text-sm text-neutral-600 mt-1">{bname}</div>
                                    <div className="text-xs text-neutral-500 mt-1">{spec}</div>
                                    <div className="mt-4 space-y-3">
                                        {items.map((it) => (
                                            <div key={`${it.date}-${k}`} className="border-t border-neutral-100 pt-3">
                                                <div className="text-sm font-semibold text-neutral-800">{it.date}</div>
                                                <div className="mt-2 flex flex-wrap gap-2">
                                                    {(it.time_slots || []).map((t) => (
                                                        <button
                                                            key={t}
                                                            type="button"
                                                            className={`px-3 py-1.5 text-sm border rounded-md ${
                                                                canBook
                                                                    ? "border-neutral-200 hover:bg-neutral-50"
                                                                    : "border-neutral-200 text-neutral-400 cursor-not-allowed"
                                                            }`}
                                                            onClick={() =>
                                                                canBook &&
                                                                setSelected({
                                                                    date: it.date,
                                                                    branch_id: bid,
                                                                    branch_name: bname,
                                                                    doctor_id: did,
                                                                    doctor_name: dname,
                                                                    specialisation: spec,
                                                                    time: t,
                                                                })
                                                            }
                                                            disabled={!canBook}
                                                        >
                                                            {t}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        });
                    })()
                )}

                {selected && canBook && (
                    <div className="bg-white rounded-xl border border-neutral-200 p-4">
                        <div className="font-bold text-neutral-900">Confirm Appointment</div>
                        <div className="text-sm text-neutral-600 mt-1">
                            {selected.date} • {selected.branch_name} • {selected.doctor_name} • {selected.specialisation} • {selected.time}
                        </div>

                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                            <input
                                className="w-full px-3 py-2 border border-neutral-200 rounded-md"
                                placeholder="First name"
                                value={patient.first_name}
                                onChange={(e) => setPatient((p) => ({ ...p, first_name: e.target.value }))}
                            />
                            <input
                                className="w-full px-3 py-2 border border-neutral-200 rounded-md"
                                placeholder="Last name"
                                value={patient.last_name}
                                onChange={(e) => setPatient((p) => ({ ...p, last_name: e.target.value }))}
                            />
                            <input
                                className="w-full px-3 py-2 border border-neutral-200 rounded-md"
                                placeholder="Phone"
                                value={patient.phone}
                                onChange={(e) => setPatient((p) => ({ ...p, phone: e.target.value }))}
                            />
                            <input
                                className="w-full px-3 py-2 border border-neutral-200 rounded-md"
                                placeholder="NIC (optional)"
                                value={patient.nic}
                                onChange={(e) => setPatient((p) => ({ ...p, nic: e.target.value }))}
                            />
                            <input
                                className="w-full px-3 py-2 border border-neutral-200 rounded-md"
                                placeholder="Email (optional)"
                                value={patient.email}
                                onChange={(e) => setPatient((p) => ({ ...p, email: e.target.value }))}
                            />
                            <input
                                className="w-full px-3 py-2 border border-neutral-200 rounded-md"
                                placeholder="Address (optional)"
                                value={patient.address}
                                onChange={(e) => setPatient((p) => ({ ...p, address: e.target.value }))}
                            />
                        </div>

                        <div className="mt-4 flex gap-3 justify-end">
                            <button
                                type="button"
                                className="px-4 py-2 rounded-md border border-neutral-200"
                                onClick={() => setSelected(null)}
                                disabled={isBooking}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="px-4 py-2 rounded-md bg-primary-600 text-white disabled:opacity-50"
                                onClick={handleBook}
                                disabled={isBooking}
                            >
                                {isBooking ? "Confirming..." : "Confirm"}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen">
            <NavBar />

            <div className="mt-24 mb-10 px-4 md:px-8 flex-grow">
                <DoctorFilterWeb />
                {content}
            </div>
            <Footer />
        </div>
    );
};

export default WebDoctorScheduleDetails;
