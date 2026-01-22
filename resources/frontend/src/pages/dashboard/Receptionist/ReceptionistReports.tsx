import React, { useState, useEffect } from 'react';
import { 
    ClipboardList, 
    Calendar, 
    Users, 
    UserPlus, 
    XCircle,
    Download,
    RefreshCw,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import receptionistService from '../../../services/receptionistService';

type ReportType = 'registrations' | 'appointments' | 'no-shows' | 'walk-ins';

interface ReportData {
    date?: string;
    start_date?: string;
    end_date?: string;
    total?: number;
    registrations?: any[];
    appointments?: any[];
    no_shows?: any[];
    walk_ins?: any[];
    walk_ins_count?: number;
    appointments_count?: number;
    stats?: {
        total: number;
        pending: number;
        confirmed: number;
        completed: number;
        cancelled: number;
        no_show: number;
    };
}

const ReceptionistReports: React.FC = () => {
    const [reportType, setReportType] = useState<ReportType>('registrations');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [startDate, setStartDate] = useState(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [reportData, setReportData] = useState<ReportData | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchReport();
    }, [reportType, selectedDate, startDate, endDate]);

    const fetchReport = async () => {
        setLoading(true);
        try {
            let data: ReportData;
            switch (reportType) {
                case 'registrations':
                    data = await receptionistService.getDailyRegistrationsReport(selectedDate);
                    break;
                case 'appointments':
                    data = await receptionistService.getAppointmentsReport(selectedDate);
                    break;
                case 'no-shows':
                    data = await receptionistService.getNoShowsReport(startDate, endDate);
                    break;
                case 'walk-ins':
                    data = await receptionistService.getWalkInsReport(selectedDate);
                    break;
                default:
                    data = {};
            }
            setReportData(data);
        } catch (error) {
            console.error('Error fetching report:', error);
            setReportData(null);
        } finally {
            setLoading(false);
        }
    };

    const changeDate = (days: number) => {
        const date = new Date(selectedDate);
        date.setDate(date.getDate() + days);
        setSelectedDate(date.toISOString().split('T')[0]);
    };

    const exportToCsv = () => {
        if (!reportData) return;

        let csvContent = '';
        let filename = '';

        switch (reportType) {
            case 'registrations':
                filename = `registrations_${selectedDate}.csv`;
                csvContent = 'Patient ID,Name,Phone,Gender,Age,Registered At\n';
                (reportData.registrations || []).forEach((r: any) => {
                    csvContent += `${r.patient_id},${r.name},${r.phone},${r.gender},${r.age || '-'},${r.created_at}\n`;
                });
                break;
            case 'appointments':
                filename = `appointments_${selectedDate}.csv`;
                csvContent = 'Appointment #,Patient,Doctor,Time,Status\n';
                (reportData.appointments || []).forEach((a: any) => {
                    csvContent += `${a.appointment_number || a.id},${a.patient_name},${a.doctor_name},${a.appointment_time},${a.status}\n`;
                });
                break;
            case 'no-shows':
                filename = `no_shows_${startDate}_to_${endDate}.csv`;
                csvContent = 'Date,Patient,Phone,Doctor,Appointment Time\n';
                (reportData.no_shows || []).forEach((n: any) => {
                    csvContent += `${n.appointment_date},${n.patient_name},${n.patient_phone},${n.doctor_name},${n.appointment_time}\n`;
                });
                break;
            case 'walk-ins':
                filename = `walk_ins_${selectedDate}.csv`;
                csvContent = 'Visit #,Patient,Doctor,Time,Status\n';
                (reportData.walk_ins || []).forEach((w: any) => {
                    csvContent += `${w.visit_number},${w.patient_name},${w.doctor_name || '-'},${w.created_at},${w.status}\n`;
                });
                break;
        }

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
    };

    const reportTabs = [
        { id: 'registrations', label: 'Daily Registrations', icon: <UserPlus className="w-4 h-4" /> },
        { id: 'appointments', label: 'Appointments', icon: <Calendar className="w-4 h-4" /> },
        { id: 'no-shows', label: 'No-Shows', icon: <XCircle className="w-4 h-4" /> },
        { id: 'walk-ins', label: 'Walk-ins', icon: <Users className="w-4 h-4" /> },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600">
                            <ClipboardList className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-800">Reports</h1>
                            <p className="text-sm text-gray-500">View daily statistics and reports</p>
                        </div>
                    </div>
                    <button
                        onClick={exportToCsv}
                        disabled={!reportData || loading}
                        className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-blue-500 text-white rounded-lg hover:from-emerald-600 hover:to-blue-600 transition-all font-medium disabled:opacity-50"
                    >
                        <Download className="w-4 h-4 inline mr-2" />
                        Export CSV
                    </button>
                </div>
            </div>

            {/* Report Tabs */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2">
                <div className="flex flex-wrap gap-2">
                    {reportTabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setReportType(tab.id as ReportType)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                                reportType === tab.id
                                    ? 'bg-indigo-500 text-white'
                                    : 'text-gray-600 hover:bg-gray-100'
                            }`}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Date Selection */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                {reportType === 'no-shows' ? (
                    <div className="flex items-center gap-4 flex-wrap">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">From:</span>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">To:</span>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <button
                            onClick={fetchReport}
                            className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600"
                        >
                            <RefreshCw className="w-4 h-4 inline mr-2" />
                            Refresh
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => changeDate(-1)}
                            className="p-2 hover:bg-gray-100 rounded-lg"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        />
                        <button
                            onClick={() => changeDate(1)}
                            className="p-2 hover:bg-gray-100 rounded-lg"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                            className="px-3 py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg"
                        >
                            Today
                        </button>
                    </div>
                )}
            </div>

            {/* Report Content */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                    </div>
                ) : !reportData ? (
                    <div className="text-center py-12 text-gray-500">
                        <ClipboardList className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No data available</p>
                    </div>
                ) : (
                    <>
                        {/* Stats Summary */}
                        {reportType === 'appointments' && reportData.stats && (
                            <div className="p-6 border-b">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">Summary</h3>
                                <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                                        <p className="text-2xl font-bold text-gray-800">{reportData.stats.total}</p>
                                        <p className="text-xs text-gray-500">Total</p>
                                    </div>
                                    <div className="text-center p-3 bg-yellow-50 rounded-lg">
                                        <p className="text-2xl font-bold text-yellow-600">{reportData.stats.pending}</p>
                                        <p className="text-xs text-gray-500">Pending</p>
                                    </div>
                                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                                        <p className="text-2xl font-bold text-blue-600">{reportData.stats.confirmed}</p>
                                        <p className="text-xs text-gray-500">Confirmed</p>
                                    </div>
                                    <div className="text-center p-3 bg-green-50 rounded-lg">
                                        <p className="text-2xl font-bold text-green-600">{reportData.stats.completed}</p>
                                        <p className="text-xs text-gray-500">Completed</p>
                                    </div>
                                    <div className="text-center p-3 bg-red-50 rounded-lg">
                                        <p className="text-2xl font-bold text-red-600">{reportData.stats.cancelled}</p>
                                        <p className="text-xs text-gray-500">Cancelled</p>
                                    </div>
                                    <div className="text-center p-3 bg-gray-100 rounded-lg">
                                        <p className="text-2xl font-bold text-gray-600">{reportData.stats.no_show}</p>
                                        <p className="text-xs text-gray-500">No Show</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {reportType === 'walk-ins' && (
                            <div className="p-6 border-b">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                                        <p className="text-3xl font-bold text-yellow-600">{reportData.walk_ins_count || 0}</p>
                                        <p className="text-sm text-gray-600">Walk-ins</p>
                                    </div>
                                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                                        <p className="text-3xl font-bold text-blue-600">{reportData.appointments_count || 0}</p>
                                        <p className="text-sm text-gray-600">Scheduled Appointments</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Data Table */}
                        <div className="overflow-x-auto">
                            {reportType === 'registrations' && (
                                <>
                                    <div className="p-4 border-b flex items-center justify-between">
                                        <h3 className="font-semibold text-gray-800">Patients Registered</h3>
                                        <span className="text-sm text-gray-500">Total: {reportData.total || (reportData.registrations || []).length}</span>
                                    </div>
                                    <table className="w-full">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient ID</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gender</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Age</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {(reportData.registrations || []).map((r: any, idx: number) => (
                                                <tr key={idx} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 text-sm font-medium text-indigo-600">{r.patient_id}</td>
                                                    <td className="px-6 py-4 text-sm text-gray-800">{r.name}</td>
                                                    <td className="px-6 py-4 text-sm text-gray-600">{r.phone}</td>
                                                    <td className="px-6 py-4 text-sm text-gray-600 capitalize">{r.gender}</td>
                                                    <td className="px-6 py-4 text-sm text-gray-600">{r.age || '-'}</td>
                                                    <td className="px-6 py-4 text-sm text-gray-500">
                                                        {new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </td>
                                                </tr>
                                            ))}
                                            {(reportData.registrations || []).length === 0 && (
                                                <tr>
                                                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                                        No registrations for this date
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </>
                            )}

                            {reportType === 'appointments' && (
                                <>
                                    <div className="p-4 border-b">
                                        <h3 className="font-semibold text-gray-800">Appointments List</h3>
                                    </div>
                                    <table className="w-full">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Doctor</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {(reportData.appointments || []).map((a: any, idx: number) => (
                                                <tr key={idx} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 text-sm font-medium text-gray-800">{a.appointment_time}</td>
                                                    <td className="px-6 py-4 text-sm text-gray-800">{a.patient_name}</td>
                                                    <td className="px-6 py-4 text-sm text-gray-600">Dr. {a.doctor_name}</td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                            a.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                            a.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                                            a.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                                                            'bg-yellow-100 text-yellow-700'
                                                        }`}>
                                                            {a.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                            {(reportData.appointments || []).length === 0 && (
                                                <tr>
                                                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                                                        No appointments for this date
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </>
                            )}

                            {reportType === 'no-shows' && (
                                <>
                                    <div className="p-4 border-b flex items-center justify-between">
                                        <h3 className="font-semibold text-gray-800">No-Show Patients</h3>
                                        <span className="text-sm text-gray-500">Total: {reportData.total || (reportData.no_shows || []).length}</span>
                                    </div>
                                    <table className="w-full">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Doctor</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {(reportData.no_shows || []).map((n: any, idx: number) => (
                                                <tr key={idx} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 text-sm text-gray-800">{n.appointment_date}</td>
                                                    <td className="px-6 py-4 text-sm text-gray-800">{n.patient_name}</td>
                                                    <td className="px-6 py-4 text-sm text-gray-600">{n.patient_phone}</td>
                                                    <td className="px-6 py-4 text-sm text-gray-600">Dr. {n.doctor_name}</td>
                                                    <td className="px-6 py-4 text-sm text-gray-600">{n.appointment_time}</td>
                                                </tr>
                                            ))}
                                            {(reportData.no_shows || []).length === 0 && (
                                                <tr>
                                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                                        No no-shows in this period
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </>
                            )}

                            {reportType === 'walk-ins' && (
                                <>
                                    <div className="p-4 border-b">
                                        <h3 className="font-semibold text-gray-800">Walk-in Visits</h3>
                                    </div>
                                    <table className="w-full">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Visit #</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Doctor</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {(reportData.walk_ins || []).map((w: any, idx: number) => (
                                                <tr key={idx} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 text-sm font-medium text-indigo-600">{w.visit_number}</td>
                                                    <td className="px-6 py-4 text-sm text-gray-800">{w.patient_name}</td>
                                                    <td className="px-6 py-4 text-sm text-gray-600">{w.doctor_name ? `Dr. ${w.doctor_name}` : '-'}</td>
                                                    <td className="px-6 py-4 text-sm text-gray-600">
                                                        {new Date(w.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                            w.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                            'bg-yellow-100 text-yellow-700'
                                                        }`}>
                                                            {w.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                            {(reportData.walk_ins || []).length === 0 && (
                                                <tr>
                                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                                        No walk-ins for this date
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default ReceptionistReports;
