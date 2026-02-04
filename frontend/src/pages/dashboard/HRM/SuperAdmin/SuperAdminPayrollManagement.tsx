import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    DollarSign, ArrowLeft, Download, Calendar, Users, TrendingUp, Shield,
    Search, RefreshCw, Loader2, AlertCircle, FileText, CheckCircle,
    ChevronLeft, ChevronRight, Eye, Printer, Filter, X, Building2
} from 'lucide-react';
import api from "../../../../utils/api/axios";
import { toast } from 'react-toastify';

interface StaffPayroll {
    id: string;
    name: string;
    role: string;
    branch: string;
    basic: number;
    allowances: number;
    overtime: number;
    gross: number;
    epfEmployee: number;
    epfEmployer: number;
    etfEmployer: number;
    net: number;
}

interface PayrollSummary {
    staffCount: number;
    totalBasic: number;
    totalAllowances: number;
    totalOvertime: number;
    totalGross: number;
    totalEPFEmployee: number;
    totalEPFEmployer: number;
    totalETFEmployer: number;
    totalDeductions: number;
    totalNet: number;
    totalEmployerCost: number;
}

interface PayrollData {
    month: string;
    monthName: string;
    summary: PayrollSummary;
    staff: StaffPayroll[];
}

interface Branch {
    id: string;
    center_name: string;
}

const SuperAdminPayrollManagement: React.FC = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [payrollData, setPayrollData] = useState<PayrollData | null>(null);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
    const [selectedBranch, setSelectedBranch] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState<string>('all');
    const [branchFilter, setBranchFilter] = useState<string>('all');
    const [isProcessing, setIsProcessing] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedStaff, setSelectedStaff] = useState<StaffPayroll | null>(null);

    useEffect(() => {
        fetchBranches();
    }, []);

    useEffect(() => {
        fetchPayrollData();
    }, [selectedMonth, selectedBranch]);

    const fetchBranches = async () => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await api.get('/hrm/super-admin/salary-structures/branches', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.status === 200) {
                setBranches(response.data.branches || []);
            }
        } catch (err) {
            console.error('Error fetching branches:', err);
        }
    };

    const fetchPayrollData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('authToken');
            const params: any = { month: selectedMonth };
            if (selectedBranch !== 'all') {
                params.branch_id = selectedBranch;
            }
            
            const response = await api.get('/hrm/super-admin/payroll', {
                headers: { Authorization: `Bearer ${token}` },
                params
            });
            
            if (response.data.status === 200) {
                setPayrollData(response.data.payroll);
            } else {
                setError(response.data.message || 'Failed to fetch payroll data');
            }
        } catch (err: any) {
            console.error('Error fetching payroll:', err);
            setError(err.response?.data?.message || 'Failed to fetch payroll data');
        } finally {
            setIsLoading(false);
        }
    };

    const handleProcessPayroll = async () => {
        const branchName = selectedBranch === 'all' 
            ? 'all branches' 
            : branches.find(b => b.id === selectedBranch)?.center_name || 'selected branch';
            
        if (!window.confirm(`Are you sure you want to process payroll for ${branchName} for ${payrollData?.monthName || selectedMonth}? This will generate payslips for all staff.`)) {
            return;
        }
        
        setIsProcessing(true);
        try {
            const token = localStorage.getItem('authToken');
            const data: any = { month: selectedMonth };
            if (selectedBranch !== 'all') {
                data.branch_id = selectedBranch;
            }
            
            const response = await api.post('/hrm/super-admin/generate-payslips', 
                data,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            if (response.data.status === 200) {
                toast.success(response.data.message || 'Payroll processed successfully!');
                fetchPayrollData();
            } else {
                toast.error(response.data.message || 'Failed to process payroll');
            }
        } catch (err: any) {
            console.error('Error processing payroll:', err);
            toast.error(err.response?.data?.message || 'Failed to process payroll');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleExportCSV = () => {
        if (!payrollData?.staff) return;
        
        const headers = ['Name', 'Role', 'Branch', 'Basic Salary', 'Allowances', 'Overtime', 'Gross', 'EPF (Employee)', 'Net Salary'];
        const rows = payrollData.staff.map(s => [
            s.name,
            s.role,
            s.branch,
            s.basic.toFixed(2),
            s.allowances.toFixed(2),
            s.overtime.toFixed(2),
            s.gross.toFixed(2),
            s.epfEmployee.toFixed(2),
            s.net.toFixed(2)
        ]);
        
        const branchName = selectedBranch === 'all' ? 'All-Branches' : branches.find(b => b.id === selectedBranch)?.center_name || 'Branch';
        const csvContent = [
            `Payroll Report - ${payrollData.monthName} - ${branchName}`,
            '',
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `payroll-${branchName}-${selectedMonth}.csv`;
        link.click();
        window.URL.revokeObjectURL(url);
        toast.success('Payroll exported successfully!');
    };

    const handlePrint = () => {
        window.print();
    };

    const formatCurrency = (amount: number) => {
        return `LKR ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const changeMonth = (direction: 'prev' | 'next') => {
        const date = new Date(selectedMonth + '-01');
        if (direction === 'prev') {
            date.setMonth(date.getMonth() - 1);
        } else {
            date.setMonth(date.getMonth() + 1);
        }
        setSelectedMonth(date.toISOString().slice(0, 7));
    };

    const uniqueRoles = payrollData?.staff 
        ? [...new Set(payrollData.staff.map(s => s.role))]
        : [];

    const uniqueBranches = payrollData?.staff 
        ? [...new Set(payrollData.staff.map(s => s.branch))]
        : [];

    const filteredStaff = payrollData?.staff?.filter(s => {
        const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            s.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            s.branch.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = roleFilter === 'all' || s.role === roleFilter;
        const matchesBranch = branchFilter === 'all' || s.branch === branchFilter;
        return matchesSearch && matchesRole && matchesBranch;
    }) || [];

    const viewStaffDetail = (staff: StaffPayroll) => {
        setSelectedStaff(staff);
        setShowDetailModal(true);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-emerald-500 mx-auto mb-4" />
                    <p className="text-gray-600">Loading payroll data...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center max-w-md">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <p className="text-red-600 mb-4">{error}</p>
                    <button 
                        onClick={fetchPayrollData}
                        className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    const summary = payrollData?.summary || {
        staffCount: 0,
        totalBasic: 0,
        totalAllowances: 0,
        totalOvertime: 0,
        totalGross: 0,
        totalEPFEmployee: 0,
        totalEPFEmployer: 0,
        totalETFEmployer: 0,
        totalDeductions: 0,
        totalNet: 0,
        totalEmployerCost: 0
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6 print:p-0 print:bg-white">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6 print:hidden">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/super-admin/hrm')}
                            className="p-2 hover:bg-gray-200 rounded-lg"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">Payroll Management</h1>
                            <p className="text-gray-500">View and manage payroll across all branches</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={fetchPayrollData}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                            title="Refresh"
                        >
                            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                        </button>
                        <button
                            onClick={handlePrint}
                            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                            <Printer className="w-4 h-4" />
                            Print
                        </button>
                        <button
                            onClick={handleExportCSV}
                            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                            <Download className="w-4 h-4" />
                            Export CSV
                        </button>
                        <button
                            onClick={handleProcessPayroll}
                            disabled={isProcessing}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50"
                        >
                            {isProcessing ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="w-4 h-4" />
                                    Process Payroll
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Print Header */}
                <div className="hidden print:block mb-6">
                    <h1 className="text-2xl font-bold text-center">Payroll Report</h1>
                    <p className="text-center text-gray-600">{payrollData?.monthName}</p>
                    {selectedBranch !== 'all' && (
                        <p className="text-center text-gray-500">
                            {branches.find(b => b.id === selectedBranch)?.center_name}
                        </p>
                    )}
                </div>

                {/* Filters */}
                <div className="flex items-center justify-center gap-4 mb-6 print:hidden">
                    {/* Month Selector */}
                    <button
                        onClick={() => changeMonth('prev')}
                        className="p-2 hover:bg-gray-200 rounded-lg"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg">
                        <Calendar className="w-5 h-5 text-gray-400" />
                        <input
                            type="month"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="border-0 focus:ring-0 p-0"
                        />
                    </div>
                    <button
                        onClick={() => changeMonth('next')}
                        className="p-2 hover:bg-gray-200 rounded-lg"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>

                    {/* Branch Filter */}
                    <div className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg">
                        <Building2 className="w-5 h-5 text-gray-400" />
                        <select
                            value={selectedBranch}
                            onChange={(e) => setSelectedBranch(e.target.value)}
                            className="border-0 focus:ring-0 p-0 min-w-[150px]"
                        >
                            <option value="all">All Branches</option>
                            {branches.map(branch => (
                                <option key={branch.id} value={branch.id}>
                                    {branch.center_name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Users className="w-5 h-5 text-blue-600" />
                            </div>
                            <span className="text-gray-500 text-sm">Total Staff</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-800">{summary.staffCount}</p>
                        <p className="text-xs text-gray-400 mt-1">
                            {selectedBranch === 'all' ? 'All branches' : 'Selected branch'}
                        </p>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-emerald-100 rounded-lg">
                                <DollarSign className="w-5 h-5 text-emerald-600" />
                            </div>
                            <span className="text-gray-500 text-sm">Gross Payroll</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-800">{formatCurrency(summary.totalGross)}</p>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <Shield className="w-5 h-5 text-purple-600" />
                            </div>
                            <span className="text-gray-500 text-sm">EPF/ETF Total</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-800">
                            {formatCurrency(summary.totalEPFEmployee + summary.totalEPFEmployer + summary.totalETFEmployer)}
                        </p>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-orange-100 rounded-lg">
                                <TrendingUp className="w-5 h-5 text-orange-600" />
                            </div>
                            <span className="text-gray-500 text-sm">Net Payable</span>
                        </div>
                        <p className="text-2xl font-bold text-emerald-600">{formatCurrency(summary.totalNet)}</p>
                    </div>
                </div>

                {/* Detailed Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">Earnings Breakdown</h2>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center pb-3 border-b">
                                <span className="text-gray-600">Basic Salary</span>
                                <span className="font-semibold text-gray-800">{formatCurrency(summary.totalBasic)}</span>
                            </div>
                            <div className="flex justify-between items-center pb-3 border-b">
                                <span className="text-gray-600">Allowances</span>
                                <span className="font-semibold text-gray-800">{formatCurrency(summary.totalAllowances)}</span>
                            </div>
                            <div className="flex justify-between items-center pb-3 border-b">
                                <span className="text-gray-600">Overtime</span>
                                <span className="font-semibold text-gray-800">{formatCurrency(summary.totalOvertime)}</span>
                            </div>
                            <div className="flex justify-between items-center pt-2">
                                <span className="font-medium text-gray-700">Total Earnings</span>
                                <span className="font-bold text-emerald-600 text-lg">{formatCurrency(summary.totalGross)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">Deductions & Contributions</h2>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center pb-3 border-b">
                                <span className="text-gray-600">EPF (Employee 8%)</span>
                                <span className="font-semibold text-red-600">- {formatCurrency(summary.totalEPFEmployee)}</span>
                            </div>
                            <div className="flex justify-between items-center pb-3 border-b">
                                <span className="text-gray-600">Other Deductions</span>
                                <span className="font-semibold text-red-600">- {formatCurrency(summary.totalDeductions - summary.totalEPFEmployee)}</span>
                            </div>
                            <div className="bg-blue-50 p-3 rounded-lg">
                                <p className="text-sm text-blue-700 font-medium mb-2">Employer Contributions</p>
                                <div className="flex justify-between text-sm">
                                    <span className="text-blue-600">EPF (12%)</span>
                                    <span className="text-blue-800">{formatCurrency(summary.totalEPFEmployer)}</span>
                                </div>
                                <div className="flex justify-between text-sm mt-1">
                                    <span className="text-blue-600">ETF (3%)</span>
                                    <span className="text-blue-800">{formatCurrency(summary.totalETFEmployer)}</span>
                                </div>
                            </div>
                            <div className="flex justify-between items-center pt-2 bg-gray-50 p-3 rounded-lg">
                                <span className="font-medium text-gray-700">Total Employer Cost</span>
                                <span className="font-bold text-purple-600 text-lg">{formatCurrency(summary.totalEmployerCost)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Search and Filter */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4 print:hidden">
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex-1 min-w-[200px]">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search by name, role or branch..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Filter className="w-4 h-4 text-gray-400" />
                            <select
                                value={roleFilter}
                                onChange={(e) => setRoleFilter(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                            >
                                <option value="all">All Roles</option>
                                {uniqueRoles.map(role => (
                                    <option key={role} value={role}>{role}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-gray-400" />
                            <select
                                value={branchFilter}
                                onChange={(e) => setBranchFilter(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                            >
                                <option value="all">All Branches</option>
                                {uniqueBranches.map(branch => (
                                    <option key={branch} value={branch}>{branch}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Staff Payroll Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-4 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-800">
                            Staff Payroll Details ({filteredStaff.length} staff)
                        </h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Staff</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Branch</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Role</th>
                                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Basic</th>
                                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Allowances</th>
                                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">OT</th>
                                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Gross</th>
                                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">EPF (8%)</th>
                                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Net Salary</th>
                                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-500 print:hidden">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredStaff.length === 0 ? (
                                    <tr>
                                        <td colSpan={10} className="py-8 text-center text-gray-500">
                                            <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                                            <p>No staff payroll records found</p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredStaff.map((staff, index) => (
                                        <tr key={staff.id} className={`border-b border-gray-100 hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                                            <td className="py-3 px-4">
                                                <div className="font-medium text-gray-800">{staff.name}</div>
                                                <div className="text-xs text-gray-500">ID: {staff.id.substring(0, 8)}</div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-1.5">
                                                    <Building2 className="w-3.5 h-3.5 text-gray-400" />
                                                    <span className="text-sm text-gray-700">{staff.branch}</span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                                    {staff.role}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-right text-gray-700">{formatCurrency(staff.basic)}</td>
                                            <td className="py-3 px-4 text-right text-gray-700">{formatCurrency(staff.allowances)}</td>
                                            <td className="py-3 px-4 text-right text-gray-700">
                                                {staff.overtime > 0 ? (
                                                    <span className="text-amber-600">{formatCurrency(staff.overtime)}</span>
                                                ) : (
                                                    '-'
                                                )}
                                            </td>
                                            <td className="py-3 px-4 text-right font-medium text-gray-800">{formatCurrency(staff.gross)}</td>
                                            <td className="py-3 px-4 text-right text-red-600">-{formatCurrency(staff.epfEmployee)}</td>
                                            <td className="py-3 px-4 text-right font-bold text-emerald-600">{formatCurrency(staff.net)}</td>
                                            <td className="py-3 px-4 text-center print:hidden">
                                                <button
                                                    onClick={() => viewStaffDetail(staff)}
                                                    className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded"
                                                    title="View Details"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                            {filteredStaff.length > 0 && (
                                <tfoot className="bg-gray-100 font-semibold">
                                    <tr>
                                        <td colSpan={2} className="py-3 px-4 text-gray-700">Totals</td>
                                        <td className="py-3 px-4 text-right text-gray-800">
                                            {formatCurrency(filteredStaff.reduce((sum, s) => sum + s.basic, 0))}
                                        </td>
                                        <td className="py-3 px-4 text-right text-gray-800">
                                            {formatCurrency(filteredStaff.reduce((sum, s) => sum + s.allowances, 0))}
                                        </td>
                                        <td className="py-3 px-4 text-right text-gray-800">
                                            {formatCurrency(filteredStaff.reduce((sum, s) => sum + s.overtime, 0))}
                                        </td>
                                        <td className="py-3 px-4 text-right text-gray-800">
                                            {formatCurrency(filteredStaff.reduce((sum, s) => sum + s.gross, 0))}
                                        </td>
                                        <td className="py-3 px-4 text-right text-red-600">
                                            -{formatCurrency(filteredStaff.reduce((sum, s) => sum + s.epfEmployee, 0))}
                                        </td>
                                        <td className="py-3 px-4 text-right text-emerald-600">
                                            {formatCurrency(filteredStaff.reduce((sum, s) => sum + s.net, 0))}
                                        </td>
                                        <td className="print:hidden"></td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>
                </div>

                {/* Branch-wise Summary (if all branches selected) */}
                {selectedBranch === 'all' && payrollData?.staff && payrollData.staff.length > 0 && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-6">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">Branch-wise Breakdown</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Branch</th>
                                        <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">Staff Count</th>
                                        <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Total Payroll</th>
                                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">% of Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[...new Set(payrollData.staff.map(s => s.branch))].map((branchName) => {
                                        const branchStaff = payrollData.staff.filter(s => s.branch === branchName);
                                        const branchTotal = branchStaff.reduce((sum, s) => sum + s.net, 0);
                                        const percentage = summary.totalNet > 0 ? (branchTotal / summary.totalNet) * 100 : 0;
                                        
                                        return (
                                            <tr key={branchName} className="border-b border-gray-100 hover:bg-gray-50">
                                                <td className="py-3 px-4 font-medium text-gray-800">{branchName}</td>
                                                <td className="py-3 px-4 text-center text-gray-600">{branchStaff.length}</td>
                                                <td className="py-3 px-4 text-right text-gray-600">{formatCurrency(branchTotal)}</td>
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-24 bg-gray-200 rounded-full h-2">
                                                            <div 
                                                                className="bg-emerald-500 h-2 rounded-full transition-all duration-300" 
                                                                style={{ width: `${Math.min(percentage, 100)}%` }}
                                                            ></div>
                                                        </div>
                                                        <span className="text-sm text-gray-600 w-12">{percentage.toFixed(1)}%</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Staff Detail Modal */}
            {showDetailModal && selectedStaff && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 print:hidden">
                    <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-4 border-b">
                            <h3 className="text-lg font-semibold text-gray-800">Payroll Details</h3>
                            <button onClick={() => setShowDetailModal(false)} className="p-1 hover:bg-gray-100 rounded">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6">
                            <div className="mb-6 pb-4 border-b">
                                <h4 className="font-semibold text-gray-800 text-lg">{selectedStaff.name}</h4>
                                <p className="text-gray-500">{selectedStaff.role} • {selectedStaff.branch}</p>
                                <p className="text-sm text-gray-400">{payrollData?.monthName}</p>
                            </div>
                            
                            <div className="mb-6">
                                <h5 className="font-medium text-gray-700 mb-3">Earnings</h5>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Basic Salary</span>
                                        <span className="font-medium">{formatCurrency(selectedStaff.basic)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Allowances</span>
                                        <span className="font-medium">{formatCurrency(selectedStaff.allowances)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Overtime</span>
                                        <span className="font-medium">{formatCurrency(selectedStaff.overtime)}</span>
                                    </div>
                                    <div className="flex justify-between pt-2 border-t">
                                        <span className="font-medium text-gray-700">Gross Salary</span>
                                        <span className="font-bold text-gray-800">{formatCurrency(selectedStaff.gross)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="mb-6">
                                <h5 className="font-medium text-gray-700 mb-3">Deductions</h5>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">EPF (Employee 8%)</span>
                                        <span className="font-medium text-red-600">-{formatCurrency(selectedStaff.epfEmployee)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                                <h5 className="font-medium text-blue-800 mb-3">Employer Contributions</h5>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-blue-700">EPF (Employer 12%)</span>
                                        <span className="font-medium text-blue-800">{formatCurrency(selectedStaff.epfEmployer)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-blue-700">ETF (Employer 3%)</span>
                                        <span className="font-medium text-blue-800">{formatCurrency(selectedStaff.etfEmployer)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 bg-emerald-50 rounded-lg">
                                <div className="flex justify-between items-center">
                                    <span className="font-semibold text-emerald-800">Net Salary</span>
                                    <span className="text-2xl font-bold text-emerald-600">{formatCurrency(selectedStaff.net)}</span>
                                </div>
                            </div>
                        </div>
                        <div className="p-4 border-t flex justify-end">
                            <button
                                onClick={() => setShowDetailModal(false)}
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @media print {
                    .print\\:hidden { display: none !important; }
                    .print\\:block { display: block !important; }
                    .print\\:p-0 { padding: 0 !important; }
                    .print\\:bg-white { background: white !important; }
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                }
            `}</style>
        </div>
    );
};

export default SuperAdminPayrollManagement;
