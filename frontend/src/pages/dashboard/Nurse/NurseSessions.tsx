import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, MapPin, User, ChevronRight } from 'lucide-react';
import { patientSessionApi, SessionListItem } from '../../../services/patientSessionService';

const NurseSessions: React.FC = () => {
    const navigate = useNavigate();
    const [sessions, setSessions] = useState<SessionListItem[]>([]);
    const [allSessions, setAllSessions] = useState<SessionListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    // default to Today
    const today = new Date().toISOString().slice(0, 10);
    const [filterDate, setFilterDate] = useState(today);
    const [filterDoctor, setFilterDoctor] = useState('');
    const [filterBranch, setFilterBranch] = useState('');

    useEffect(() => {
        loadSessions();
    }, [filterDate, filterDoctor, filterBranch]);

    const loadSessions = async () => {
        setLoading(true);
        try {
            const params: { session_date?: string; doctor_id?: string; branch_id?: string } = {};
            if (filterDate) params.session_date = filterDate;
            if (filterDoctor) params.doctor_id = filterDoctor;
            if (filterBranch) params.branch_id = filterBranch;

            const data = await patientSessionApi.getMySessions(params);
            setSessions(data);
            if (allSessions.length === 0) {
                const unfiltered = await patientSessionApi.getMySessions();
                setAllSessions(unfiltered);
            }
        } catch (err) {
            console.error(err);
            setError("Failed to load assigned sessions");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
        </div>
    );

    if (error) return (
        <div className="p-4 bg-red-50 text-red-600 rounded-lg">
            {error}
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-800">My Sessions</h1>
                    <p className="text-neutral-500">View and manage your assigned patient sessions</p>
                </div>
            </div>

            <div className="bg-white border border-neutral-200 rounded-xl p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setFilterDate(today)}
                        className={`px-3 py-2 rounded-lg text-sm border ${filterDate === today ? 'bg-emerald-50 border-emerald-200' : 'border-neutral-300'}`}>
                        Today
                    </button>
                    <button
                        onClick={() => setFilterDate('')}
                        className={`px-3 py-2 rounded-lg text-sm border ${filterDate === '' ? 'bg-emerald-50 border-emerald-200' : 'border-neutral-300'}`}>
                        Upcoming
                    </button>
                </div>
                <select
                    value={filterDoctor}
                    onChange={(e) => setFilterDoctor(e.target.value)}
                    className="px-3 py-2 border border-neutral-300 rounded-lg text-sm"
                >
                    <option value="">All Doctors</option>
                    {[...new Map(allSessions.map((s) => [s.doctor_id, s])).values()].map((s) => (
                        <option key={s.doctor_id} value={s.doctor_id}>{s.doctor_name}</option>
                    ))}
                </select>
                <select
                    value={filterBranch}
                    onChange={(e) => setFilterBranch(e.target.value)}
                    className="px-3 py-2 border border-neutral-300 rounded-lg text-sm"
                >
                    <option value="">All Branches</option>
                    {[...new Map(allSessions.map((s) => [s.branch_id, s])).values()].map((s) => (
                        <option key={s.branch_id} value={s.branch_id}>{s.branch_name}</option>
                    ))}
                </select>
            </div>

            {sessions.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-neutral-200">
                    <p className="text-neutral-500">No sessions assigned to you yet.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sessions.map((session) => (
                        <div
                            key={session.id}
                            onClick={() => navigate(`/nurse-dashboard/patient-sessions/${session.id}`)}
                            className="bg-white rounded-xl border border-neutral-200 p-6 hover:shadow-md transition-shadow cursor-pointer group"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-semibold text-neutral-900 line-clamp-1" title={session.doctor_name}>
                                        {session.doctor_name}
                                    </h3>
                                    <div className="flex items-center gap-1 text-sm text-neutral-500 mt-1">
                                        <MapPin className="w-3 h-3" />
                                        <span>{session.branch_name}</span>
                                    </div>
                                </div>
                                <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${session.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                                        session.status === 'active' ? 'bg-emerald-100 text-emerald-800' : // Assuming 'active' or 'in_progress'
                                            session.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                                                'bg-purple-100 text-purple-800'
                                    }`}>
                                    {session.status.replace('_', ' ')}
                                </span>
                            </div>

                            <div className="space-y-3 mb-6">
                                <div className="flex items-center gap-2 text-sm text-neutral-600">
                                    <Calendar className="w-4 h-4 text-neutral-400" />
                                    <span>{new Date(session.session_date).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-neutral-600">
                                    <Clock className="w-4 h-4 text-neutral-400" />
                                    <span>{session.start_time} - {session.end_time}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-neutral-600">
                                    <User className="w-4 h-4 text-neutral-400" />
                                    <span>{session.appointment_count} Patients</span>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-neutral-100 flex items-center justify-between text-sm font-medium">
                                <span className="text-emerald-600 group-hover:text-emerald-700">Manage Queue</span>
                                <ChevronRight className="w-4 h-4 text-emerald-600 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default NurseSessions;
