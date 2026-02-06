import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../../../components/common/Layout/DashboardLayout';
import { 
    Users, Calendar, Clock, ChevronLeft, Download, Search,
    DollarSign, TrendingUp, Calculator, CreditCard, Filter, FileText
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { BranchAdminMenuItems } from '../../../../config/branchAdminNavigation';

interface PayrollRecord {
    id: string;
    staffId: string;
    staffName: string;
    department: string;
    role: string;
    baseSalary: number;
    overtime: number;
    deductions: number;
    netPay: number;
    status: 'pending' | 'processed' | 'paid';
    payDate: string;
}

interface PayrollSummary {
    totalPayroll: number;
    totalOvertime: number;
    totalDeductions: number;
    pendingPayments: number;
    processedCount: number;
}

const mockPayrollRecords: PayrollRecord[] = [
    { id: '1', staffId: '1', staffName: 'Dr. Sarah Wilson', department: 'Cardiology', role: 'Doctor', baseSalary: 15000, overtime: 2500, deductions: 1500, netPay: 16000, status: 'paid', payDate: '2025-12-01' },
    { id: '2', staffId: '2', staffName: 'John Doe', department: 'Emergency', role: 'Nurse', baseSalary: 5500, overtime: 800, deductions: 500, netPay: 5800, status: 'processed', payDate: '2025-12-01' },
    { id: '3', staffId: '3', staffName: 'Emily Chen', department: 'Pediatrics', role: 'Doctor', baseSalary: 14000, overtime: 0, deductions: 1200, netPay: 12800, status: 'pending', payDate: '2025-12-01' },
    { id: '4', staffId: '4', staffName: 'Mike Johnson', department: 'Radiology', role: 'Technician', baseSalary: 4500, overtime: 400, deductions: 400, netPay: 4500, status: 'pending', payDate: '2025-12-01' },
];

const mockSummary: PayrollSummary = {
    totalPayroll: 245000,
    totalOvertime: 18500,
    totalDeductions: 22000,
    pendingPayments: 8,
    processedCount: 46,
};

export const PayrollManagement: React.FC = () => {
    const navigate = useNavigate();
    const [userName, setUserName] = useState('');
    const [branchName, setBranchName] = useState('');
    const [branchLogo, setBranchLogo] = useState('');
    const [userGender, setUserGender] = useState('');
    const [profileImage, setProfileImage] = useState('');
    
    const [activeTab, setActiveTab] = useState<'payroll' | 'reports' | 'benefits'>('payroll');
    const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>(mockPayrollRecords);
    const [selectedMonth, setSelectedMonth] = useState('2025-12');
    const [filterDepartment, setFilterDepartment] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
        setUserName(`${userInfo.first_name || ''} ${userInfo.last_name || ''}`);
        setBranchName(userInfo.branch_name || 'Branch');
        setBranchLogo(userInfo.branch_logo || '');
        setUserGender(userInfo.gender || '');
        setProfileImage(userInfo.profile_picture || '');
    }, []);

    const handleProcessPayroll = (id: string) => {
        setPayrollRecords(prev => prev.map(r => 
            r.id === id ? { ...r, status: 'processed' } : r
        ));
        toast.success('Payroll processed successfully');
    };

    const handleMarkPaid = (id: string) => {
        setPayrollRecords(prev => prev.map(r => 
            r.id === id ? { ...r, status: 'paid' } : r
        ));
        toast.success('Payment marked as paid');
    };

    const filteredRecords = payrollRecords.filter(r => {
        if (filterDepartment !== 'all' && r.department !== filterDepartment) return false;
        if (filterStatus !== 'all' && r.status !== filterStatus) return false;
        if (searchQuery && !r.staffName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
    });

    const departments = [...new Set(payrollRecords.map(r => r.department))];

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'paid': return 'bg-green-100 text-green-700';
            case 'processed': return 'bg-blue-100 text-blue-700';
            case 'pending': return 'bg-yellow-100 text-yellow-700';
            default: return 'bg-neutral-100 text-neutral-700';
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' }).format(amount);
    };

    const SidebarMenu = () => (
        <nav className="py-4">
            <div className="px-4 mb-4">
                <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Navigation</h2>
            </div>
            <ul className="space-y-1 px-2">
                {BranchAdminMenuItems.map((item, index) => (
                    <li key={index}>
                        <button
                            onClick={() => navigate(item.path)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                                item.path === '/branch-admin/hrm'
                                    ? 'bg-gradient-to-r from-emerald-500 to-primary-500 text-white shadow-md'
                                    : 'text-neutral-700 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-blue-50'
                            }`}
                        >
                            <span className="flex-shrink-0">{item.icon}</span>
                            <span className="flex-1 font-medium text-left">{item.label}</span>
                        </button>
                    </li>
                ))}
            </ul>
        </nav>
    );

    const tabs = [
        { id: 'payroll', label: 'Payroll Processing', icon: <DollarSign className="w-4 h-4" /> },
        { id: 'reports', label: 'Payroll Reports', icon: <FileText className="w-4 h-4" /> },
        { id: 'benefits', label: 'Tax & Benefits', icon: <Calculator className="w-4 h-4" /> },
    ];

    return (
        <DashboardLayout 
            userName={userName}
            userRole="Branch Admin" 
            profileImage={profileImage}
            sidebarContent={<SidebarMenu />}
            branchName={branchName}
            branchLogo={branchLogo}
            userGender={userGender}
        >
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => navigate('/branch-admin/hrm')}
                            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5 text-neutral-600" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-neutral-800">Payroll & Compensation</h1>
                            <p className="text-neutral-500">Manage salary processing, reports, and benefits</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <input
                            type="month"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                        />
                        <button className="flex items-center gap-2 px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50">
                            <Download className="w-4 h-4" />
                            Export
                        </button>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-neutral-500">Total Payroll</p>
                                <p className="text-xl font-bold text-neutral-800">{formatCurrency(mockSummary.totalPayroll)}</p>
                            </div>
                            <div className="p-3 bg-emerald-100 rounded-lg">
                                <DollarSign className="w-6 h-6 text-emerald-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-neutral-500">Overtime Pay</p>
                                <p className="text-xl font-bold text-primary-500">{formatCurrency(mockSummary.totalOvertime)}</p>
                            </div>
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <Clock className="w-6 h-6 text-primary-500" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-neutral-500">Deductions</p>
                                <p className="text-xl font-bold text-error-600">{formatCurrency(mockSummary.totalDeductions)}</p>
                            </div>
                            <div className="p-3 bg-error-100 rounded-lg">
                                <Calculator className="w-6 h-6 text-error-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-neutral-500">Pending</p>
                                <p className="text-xl font-bold text-orange-600">{mockSummary.pendingPayments}</p>
                            </div>
                            <div className="p-3 bg-orange-100 rounded-lg">
                                <CreditCard className="w-6 h-6 text-orange-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-neutral-500">Processed</p>
                                <p className="text-xl font-bold text-green-600">{mockSummary.processedCount}</p>
                            </div>
                            <div className="p-3 bg-green-100 rounded-lg">
                                <TrendingUp className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-xl shadow-sm border border-neutral-200">
                    <div className="border-b border-neutral-200">
                        <div className="flex overflow-x-auto">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`flex items-center gap-2 px-6 py-4 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${
                                        activeTab === tab.id
                                            ? 'border-emerald-500 text-emerald-600'
                                            : 'border-transparent text-neutral-500 hover:text-neutral-700'
                                    }`}
                                >
                                    {tab.icon}
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="p-6">
                        {/* Payroll Processing Tab */}
                        {activeTab === 'payroll' && (
                            <div className="space-y-4">
                                {/* Filters */}
                                <div className="flex flex-col md:flex-row gap-4">
                                    <div className="flex-1 relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                                        <input
                                            type="text"
                                            placeholder="Search by staff name..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                        />
                                    </div>
                                    <select
                                        value={filterDepartment}
                                        onChange={(e) => setFilterDepartment(e.target.value)}
                                        className="px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                    >
                                        <option value="all">All Departments</option>
                                        {departments.map(dept => (
                                            <option key={dept} value={dept}>{dept}</option>
                                        ))}
                                    </select>
                                    <select
                                        value={filterStatus}
                                        onChange={(e) => setFilterStatus(e.target.value)}
                                        className="px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                    >
                                        <option value="all">All Status</option>
                                        <option value="pending">Pending</option>
                                        <option value="processed">Processed</option>
                                        <option value="paid">Paid</option>
                                    </select>
                                </div>

                                {/* Payroll Table */}
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-neutral-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase">Staff</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase">Role</th>
                                                <th className="px-4 py-3 text-right text-xs font-semibold text-neutral-600 uppercase">Base Salary</th>
                                                <th className="px-4 py-3 text-right text-xs font-semibold text-neutral-600 uppercase">Overtime</th>
                                                <th className="px-4 py-3 text-right text-xs font-semibold text-neutral-600 uppercase">Deductions</th>
                                                <th className="px-4 py-3 text-right text-xs font-semibold text-neutral-600 uppercase">Net Pay</th>
                                                <th className="px-4 py-3 text-center text-xs font-semibold text-neutral-600 uppercase">Status</th>
                                                <th className="px-4 py-3 text-center text-xs font-semibold text-neutral-600 uppercase">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {filteredRecords.map(record => (
                                                <tr key={record.id} className="hover:bg-neutral-50">
                                                    <td className="px-4 py-3">
                                                        <div>
                                                            <p className="font-medium text-neutral-800">{record.staffName}</p>
                                                            <p className="text-sm text-neutral-500">{record.department}</p>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-neutral-600">{record.role}</td>
                                                    <td className="px-4 py-3 text-right font-medium">{formatCurrency(record.baseSalary)}</td>
                                                    <td className="px-4 py-3 text-right text-primary-500">+{formatCurrency(record.overtime)}</td>
                                                    <td className="px-4 py-3 text-right text-error-600">-{formatCurrency(record.deductions)}</td>
                                                    <td className="px-4 py-3 text-right font-bold text-neutral-800">{formatCurrency(record.netPay)}</td>
                                                    <td className="px-4 py-3 text-center">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusStyle(record.status)}`}>
                                                            {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        {record.status === 'pending' && (
                                                            <button 
                                                                onClick={() => handleProcessPayroll(record.id)}
                                                                className="px-3 py-1 bg-primary-500 text-white rounded text-sm hover:bg-primary-500"
                                                            >
                                                                Process
                                                            </button>
                                                        )}
                                                        {record.status === 'processed' && (
                                                            <button 
                                                                onClick={() => handleMarkPaid(record.id)}
                                                                className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                                                            >
                                                                Mark Paid
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Payroll Reports Tab */}
                        {activeTab === 'reports' && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="border border-neutral-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="p-2 bg-blue-100 rounded-lg">
                                                <FileText className="w-5 h-5 text-primary-500" />
                                            </div>
                                            <h4 className="font-semibold text-neutral-800">Monthly Payroll Summary</h4>
                                        </div>
                                        <p className="text-sm text-neutral-500 mb-3">Overview of all payroll transactions for the month</p>
                                        <button className="flex items-center gap-2 text-sm text-primary-500 hover:underline">
                                            <Download className="w-4 h-4" /> Download Report
                                        </button>
                                    </div>
                                    <div className="border border-neutral-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="p-2 bg-green-100 rounded-lg">
                                                <TrendingUp className="w-5 h-5 text-green-600" />
                                            </div>
                                            <h4 className="font-semibold text-neutral-800">Department Breakdown</h4>
                                        </div>
                                        <p className="text-sm text-neutral-500 mb-3">Payroll costs by department</p>
                                        <button className="flex items-center gap-2 text-sm text-primary-500 hover:underline">
                                            <Download className="w-4 h-4" /> Download Report
                                        </button>
                                    </div>
                                    <div className="border border-neutral-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="p-2 bg-purple-100 rounded-lg">
                                                <Calculator className="w-5 h-5 text-purple-600" />
                                            </div>
                                            <h4 className="font-semibold text-neutral-800">Tax Report</h4>
                                        </div>
                                        <p className="text-sm text-neutral-500 mb-3">Tax deductions and contributions</p>
                                        <button className="flex items-center gap-2 text-sm text-primary-500 hover:underline">
                                            <Download className="w-4 h-4" /> Download Report
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Tax & Benefits Tab */}
                        {activeTab === 'benefits' && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="border border-neutral-200 rounded-lg p-4">
                                        <h4 className="font-semibold text-neutral-800 mb-4">Tax Deductions Summary</h4>
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center">
                                                <span className="text-neutral-600">Income Tax</span>
                                                <span className="font-medium">{formatCurrency(12500)}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-neutral-600">Social Security</span>
                                                <span className="font-medium">{formatCurrency(5500)}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-neutral-600">Medicare</span>
                                                <span className="font-medium">{formatCurrency(2500)}</span>
                                            </div>
                                            <div className="border-t pt-3 flex justify-between items-center">
                                                <span className="font-semibold text-neutral-800">Total Taxes</span>
                                                <span className="font-bold text-neutral-800">{formatCurrency(20500)}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="border border-neutral-200 rounded-lg p-4">
                                        <h4 className="font-semibold text-neutral-800 mb-4">Benefits Contributions</h4>
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center">
                                                <span className="text-neutral-600">Health Insurance</span>
                                                <span className="font-medium">{formatCurrency(8500)}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-neutral-600">Dental Insurance</span>
                                                <span className="font-medium">{formatCurrency(1500)}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-neutral-600">401(k) Matching</span>
                                                <span className="font-medium">{formatCurrency(4500)}</span>
                                            </div>
                                            <div className="border-t pt-3 flex justify-between items-center">
                                                <span className="font-semibold text-neutral-800">Total Benefits</span>
                                                <span className="font-bold text-neutral-800">{formatCurrency(14500)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};
