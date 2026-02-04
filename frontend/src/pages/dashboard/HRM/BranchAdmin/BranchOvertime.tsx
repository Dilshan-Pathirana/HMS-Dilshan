import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Clock, ArrowLeft, DollarSign, Users, Plus, Search, RefreshCw, 
    Loader2, AlertCircle, Calendar, Trash2, X, TrendingUp,
    ChevronLeft, ChevronRight
} from 'lucide-react';
import api from "../../../../utils/api/axios";
import { toast } from 'react-toastify';

interface OvertimeRecord {
    id: string;
    employeeId: string;
    employeeName: string;
    role: string;
    branch: string;
    date: string;
    hoursWorked: number;
    otRate: number;
    totalAmount: number;
    createdAt: string;
}

interface EmployeeSummary {
    userId: string;
    name: string;
    role: string;
    branch: string;
    totalHours: number;
    totalAmount: number;
}

interface OvertimeSummary {
    totalHours: number;
    totalAmount: number;
    employeeCount: number;
    recordCount: number;
}

interface StaffMember {
    id: string;
    name: string;
    role: string;
    department?: string;
}

const BranchOvertime: React.FC = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [records, setRecords] = useState<OvertimeRecord[]>([]);
    const [byEmployee, setByEmployee] = useState<EmployeeSummary[]>([]);
    const [summary, setSummary] = useState<OvertimeSummary>({ totalHours: 0, totalAmount: 0, employeeCount: 0, recordCount: 0 });
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'records' | 'summary'>('records');
    
    // Add Overtime Modal
    const [showAddModal, setShowAddModal] = useState(false);
    const [staffList, setStaffList] = useState<StaffMember[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [newOT, setNewOT] = useState({
        employee_id: '',
        date: new Date().toISOString().split('T')[0],
        hours_worked: '',
        reason: ''
    });
    
    // Delete confirmation
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        fetchOvertimeData();
    }, [selectedMonth]);

    const fetchOvertimeData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('authToken');
            const response = await api.get('/hrm/branch-admin/overtime', {
                headers: { Authorization: `Bearer ${token}` },
                params: { month: selectedMonth }
            });
            
            if (response.data.status === 200) {
                const data = response.data.overtime;
                setSummary(data.summary);
                setRecords(data.records || []);
                setByEmployee(data.byEmployee || []);
            } else {
                setError(response.data.message || 'Failed to fetch overtime data');
            }
        } catch (err: any) {
            console.error('Error fetching overtime:', err);
            setError(err.response?.data?.message || 'Failed to fetch overtime data');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchStaffList = async () => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await api.get('/hrm/branch-admin/staff', {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (response.data.status === 200) {
                setStaffList(response.data.staff || []);
            }
        } catch (err) {
            console.error('Error fetching staff:', err);
        }
    };

    const handleAddOvertime = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newOT.employee_id || !newOT.hours_worked) {
            toast.error('Please fill all required fields');
            return;
        }
        
        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('authToken');
            const response = await api.post('/hrm/branch-admin/overtime', {
                employee_id: newOT.employee_id,
                date: newOT.date,
                hours_worked: parseFloat(newOT.hours_worked),
                reason: newOT.reason
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (response.data.status === 201) {
                toast.success('Overtime recorded successfully');
                setShowAddModal(false);
                setNewOT({ employee_id: '', date: new Date().toISOString().split('T')[0], hours_worked: '', reason: '' });
                fetchOvertimeData();
            } else {
                toast.error(response.data.message || 'Failed to record overtime');
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to record overtime');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteOvertime = async () => {
        if (!deleteId) return;
        
        setIsDeleting(true);
        try {
            const token = localStorage.getItem('authToken');
            const response = await api.delete(`/hrm/branch-admin/overtime/${deleteId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (response.data.status === 200) {
                toast.success('Overtime entry deleted');
                setDeleteId(null);
                fetchOvertimeData();
            } else {
                toast.error(response.data.message || 'Failed to delete');
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to delete overtime entry');
        } finally {
            setIsDeleting(false);
        }
    };

    const openAddModal = () => {
        fetchStaffList();
        setShowAddModal(true);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR', minimumFractionDigits: 0 }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric'
        });
    };

    const getInitials = (name: string) => {
        if (!name) return 'NA';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    const changeMonth = (delta: number) => {
        const date = new Date(selectedMonth + '-01');
        date.setMonth(date.getMonth() + delta);
        setSelectedMonth(date.toISOString().slice(0, 7));
    };

    const filteredRecords = records.filter(r => 
        r.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.role?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredSummary = byEmployee.filter(e => 
        e.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.role?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate('/branch-admin/hrm')} className="p-2 hover:bg-gray-200 rounded-lg transition-colors">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">Overtime Management</h1>
                            <p className="text-gray-500">Track and manage employee overtime hours</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={fetchOvertimeData} className="flex items-center gap-2 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>
                        <button onClick={openAddModal} className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors">
                            <Plus className="w-4 h-4" />
                            Record Overtime
                        </button>
                    </div>
                </div>

                {/* Month Selector */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
                    <div className="flex items-center justify-between">
                        <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-gray-100 rounded-lg">
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <div className="flex items-center gap-3">
                            <Calendar className="w-5 h-5 text-gray-500" />
                            <input 
                                type="month" 
                                value={selectedMonth} 
                                onChange={(e) => setSelectedMonth(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            />
                        </div>
                        <button onClick={() => changeMonth(1)} className="p-2 hover:bg-gray-100 rounded-lg">
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-gray-500 text-sm">Total OT Hours</span>
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <Clock className="w-5 h-5 text-purple-600" />
                            </div>
                        </div>
                        <p className="text-2xl font-bold text-gray-800">{summary.totalHours} hrs</p>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-gray-500 text-sm">Total OT Cost</span>
                            <div className="p-2 bg-emerald-100 rounded-lg">
                                <DollarSign className="w-5 h-5 text-emerald-600" />
                            </div>
                        </div>
                        <p className="text-2xl font-bold text-emerald-600">{formatCurrency(summary.totalAmount)}</p>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-gray-500 text-sm">Employees with OT</span>
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Users className="w-5 h-5 text-blue-600" />
                            </div>
                        </div>
                        <p className="text-2xl font-bold text-gray-800">{summary.employeeCount}</p>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-gray-500 text-sm">OT Records</span>
                            <div className="p-2 bg-orange-100 rounded-lg">
                                <TrendingUp className="w-5 h-5 text-orange-600" />
                            </div>
                        </div>
                        <p className="text-2xl font-bold text-gray-800">{summary.recordCount}</p>
                    </div>
                </div>

                {/* OT Rate Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                    <h3 className="font-semibold text-blue-800 mb-2">Overtime Calculation</h3>
                    <p className="text-sm text-blue-700">
                        OT Rate = Hourly Rate × 150%. Overtime is calculated for hours exceeding standard shift duration.
                        Only Branch Admin can record and manage overtime entries.
                    </p>
                </div>

                {/* Filters and View Toggle */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex-1 min-w-[250px] max-w-md">
                            <div className="relative">
                                <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input 
                                    type="text" 
                                    placeholder="Search by employee name or role..." 
                                    value={searchTerm} 
                                    onChange={(e) => setSearchTerm(e.target.value)} 
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" 
                                />
                            </div>
                        </div>
                        <div className="flex items-center bg-gray-100 rounded-lg p-1">
                            <button 
                                onClick={() => setViewMode('records')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    viewMode === 'records' ? 'bg-white shadow text-emerald-600' : 'text-gray-600 hover:text-gray-800'
                                }`}
                            >
                                All Records
                            </button>
                            <button 
                                onClick={() => setViewMode('summary')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    viewMode === 'summary' ? 'bg-white shadow text-emerald-600' : 'text-gray-600 hover:text-gray-800'
                                }`}
                            >
                                By Employee
                            </button>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-red-500" />
                        <span className="text-red-700">{error}</span>
                    </div>
                )}

                {isLoading ? (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                        <span className="ml-3 text-gray-600">Loading overtime data...</span>
                    </div>
                ) : viewMode === 'records' ? (
                    /* Records View */
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        {filteredRecords.length > 0 ? (
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Employee</th>
                                        <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Date</th>
                                        <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Hours</th>
                                        <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Rate/Hr</th>
                                        <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Amount</th>
                                        <th className="text-right py-4 px-6 text-sm font-medium text-gray-500">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredRecords.map((record) => (
                                        <tr key={record.id} className="border-b border-gray-100 hover:bg-gray-50">
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                                                        {getInitials(record.employeeName)}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-800">{record.employeeName}</p>
                                                        <p className="text-xs text-gray-500">{record.role}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-gray-600">{formatDate(record.date)}</td>
                                            <td className="py-4 px-6">
                                                <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-sm font-medium">
                                                    {record.hoursWorked} hrs
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-gray-600">{formatCurrency(record.otRate)}</td>
                                            <td className="py-4 px-6 font-semibold text-emerald-600">{formatCurrency(record.totalAmount)}</td>
                                            <td className="py-4 px-6 text-right">
                                                <button 
                                                    onClick={() => setDeleteId(record.id)}
                                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="p-12 text-center">
                                <Clock className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                                <p className="text-gray-500 text-lg">No overtime records for this month</p>
                                <p className="text-gray-400 text-sm mt-1">Click "Record Overtime" to add new entries</p>
                            </div>
                        )}
                    </div>
                ) : (
                    /* Summary by Employee View */
                    <div className="space-y-4">
                        {filteredSummary.length > 0 ? (
                            filteredSummary.map((emp) => (
                                <div key={emp.userId} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                                                {getInitials(emp.name)}
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-gray-800">{emp.name}</h3>
                                                <p className="text-sm text-gray-500">{emp.role} • {emp.branch}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-8">
                                            <div className="text-right">
                                                <p className="text-sm text-gray-500">Total Hours</p>
                                                <p className="text-xl font-bold text-purple-600">{emp.totalHours} hrs</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm text-gray-500">Total Amount</p>
                                                <p className="text-xl font-bold text-emerald-600">{formatCurrency(emp.totalAmount)}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                                <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                                <p className="text-gray-500 text-lg">No overtime data for this month</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Add Overtime Modal */}
                {showAddModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
                            <div className="p-6 border-b border-gray-200">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold text-gray-800">Record Overtime</h3>
                                    <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                            <form onSubmit={handleAddOvertime} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Employee <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={newOT.employee_id}
                                        onChange={(e) => setNewOT({ ...newOT, employee_id: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                        required
                                    >
                                        <option value="">Select Employee</option>
                                        {staffList.map((staff) => (
                                            <option key={staff.id} value={staff.id}>
                                                {staff.name} ({staff.role})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Date <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        value={newOT.date}
                                        onChange={(e) => setNewOT({ ...newOT, date: e.target.value })}
                                        max={new Date().toISOString().split('T')[0]}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Hours Worked <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        step="0.5"
                                        min="0.5"
                                        max="12"
                                        value={newOT.hours_worked}
                                        onChange={(e) => setNewOT({ ...newOT, hours_worked: e.target.value })}
                                        placeholder="e.g., 2.5"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                        required
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Minimum 0.5 hrs, Maximum 12 hrs</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Reason (Optional)</label>
                                    <textarea
                                        value={newOT.reason}
                                        onChange={(e) => setNewOT({ ...newOT, reason: e.target.value })}
                                        placeholder="Reason for overtime..."
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                        rows={3}
                                    />
                                </div>
                                <div className="flex items-center justify-end gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowAddModal(false)}
                                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50"
                                    >
                                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                        Record Overtime
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Delete Confirmation Modal */}
                {deleteId && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
                            <div className="p-6">
                                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Trash2 className="w-6 h-6 text-red-600" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-800 text-center mb-2">Delete Overtime Entry?</h3>
                                <p className="text-gray-500 text-center mb-6">
                                    This action cannot be undone. The overtime record will be permanently deleted.
                                </p>
                                <div className="flex items-center justify-center gap-3">
                                    <button
                                        onClick={() => setDeleteId(null)}
                                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleDeleteOvertime}
                                        disabled={isDeleting}
                                        className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
                                    >
                                        {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BranchOvertime;
