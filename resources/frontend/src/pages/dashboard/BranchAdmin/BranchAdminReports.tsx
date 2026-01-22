import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../../components/common/Layout/DashboardLayout';
import { BranchAdminSidebar } from '../../../components/common/Layout/BranchAdminSidebar';
import { 
    Download, Eye, Users, FileText, BarChart3,
    Filter, Search, ChevronDown, ChevronRight,
    DollarSign, TrendingUp, Activity, Briefcase,
    ClipboardList, Package, Wrench, Shield, Lock,
    PieChart, LineChart, Printer, FileSpreadsheet,
    Building2, UserCheck, Receipt, CreditCard,
    Pill, Ambulance, HeartPulse, AlertTriangle,
    CheckCircle, Clock, FileCheck, FileWarning
} from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

interface ReportCategory {
    id: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    color: string;
    reports: SubReport[];
}

interface SubReport {
    id: string;
    name: string;
    description: string;
    type: 'table' | 'chart' | 'document';
}

const reportCategories: ReportCategory[] = [
    {
        id: 'financial',
        title: 'Financial & Accounting Reports',
        description: 'Revenue, expenditure, profitability and accounting reports',
        icon: <DollarSign className="w-6 h-6" />,
        color: 'from-green-500 to-emerald-600',
        reports: [
            { id: 'revenue-daily', name: 'Daily Revenue Summary', description: 'Daily revenue breakdown', type: 'table' },
            { id: 'revenue-monthly', name: 'Monthly Revenue Summary', description: 'Monthly revenue analysis', type: 'chart' },
            { id: 'revenue-department', name: 'Revenue by Department', description: 'OPD, IPD, Lab, Pharmacy revenue', type: 'chart' },
            { id: 'revenue-doctor', name: 'Revenue by Doctor', description: 'Doctor-wise revenue analysis', type: 'table' },
            { id: 'payment-methods', name: 'Payment Methods Report', description: 'Cash vs Card vs Online', type: 'chart' },
            { id: 'receivables', name: 'Outstanding Receivables', description: 'Pending payments report', type: 'table' },
            { id: 'expenditure', name: 'Department Expenditure', description: 'Department-wise expenses', type: 'table' },
            { id: 'supplies', name: 'Medical Supplies Expenses', description: 'Consumables cost report', type: 'table' },
            { id: 'profit-loss', name: 'Profit & Loss Statement', description: 'P&L report', type: 'document' },
            { id: 'balance-sheet', name: 'Balance Sheet', description: 'Financial position statement', type: 'document' },
        ]
    },
    {
        id: 'patient',
        title: 'Patient Reports',
        description: 'OPD, IPD, clinical and administrative patient reports',
        icon: <HeartPulse className="w-6 h-6" />,
        color: 'from-blue-500 to-blue-600',
        reports: [
            { id: 'opd-daily', name: 'Daily OPD Attendance', description: 'Daily outpatient visits', type: 'table' },
            { id: 'opd-doctor', name: 'OPD by Doctor', description: 'Doctor-wise OPD visits', type: 'table' },
            { id: 'demographics', name: 'Patient Demographics', description: 'Age, gender, location analysis', type: 'chart' },
            { id: 'new-repeat', name: 'New vs Repeat Patients', description: 'Patient type analysis', type: 'chart' },
            { id: 'admission', name: 'Admission & Discharge Report', description: 'Daily admissions/discharges', type: 'table' },
            { id: 'bed-occupancy', name: 'Bed Occupancy Report', description: 'Bed utilization analysis', type: 'chart' },
            { id: 'avg-stay', name: 'Average Length of Stay', description: 'ALOS by department', type: 'table' },
            { id: 'diagnosis', name: 'Diagnosis-wise Report', description: 'Disease distribution', type: 'chart' },
            { id: 'procedures', name: 'Procedure & Surgery Report', description: 'Surgical procedures log', type: 'table' },
            { id: 'lab-tests', name: 'Lab Test Utilization', description: 'Laboratory usage report', type: 'table' },
        ]
    },
    {
        id: 'billing',
        title: 'Billing & Insurance Reports',
        description: 'Billing summaries, invoices and insurance claims',
        icon: <Receipt className="w-6 h-6" />,
        color: 'from-purple-500 to-purple-600',
        reports: [
            { id: 'billing-summary', name: 'Patient-wise Billing', description: 'Individual billing summary', type: 'table' },
            { id: 'invoice-register', name: 'Invoice Register', description: 'All invoices log', type: 'table' },
            { id: 'unpaid-bills', name: 'Unpaid Bills Report', description: 'Pending payments', type: 'table' },
            { id: 'insurance-submitted', name: 'Insurance Claims Submitted', description: 'Claims sent to insurance', type: 'table' },
            { id: 'insurance-approved', name: 'Claims Approved/Rejected', description: 'Insurance claim status', type: 'table' },
            { id: 'tpa-claims', name: 'TPA-wise Claims', description: 'Third-party administrator summary', type: 'table' },
            { id: 'discounts', name: 'Write-off & Discount Report', description: 'Discounts given', type: 'table' },
        ]
    },
    {
        id: 'hr',
        title: 'Staff & HR Reports',
        description: 'Staff records, attendance, leave and roster reports',
        icon: <Users className="w-6 h-6" />,
        color: 'from-cyan-500 to-cyan-600',
        reports: [
            { id: 'staff-master', name: 'Employee Master List', description: 'Complete staff directory', type: 'table' },
            { id: 'staff-category', name: 'Staff by Category', description: 'Doctors, nurses, admin breakdown', type: 'chart' },
            { id: 'dept-allocation', name: 'Department-wise Staff', description: 'Staff allocation report', type: 'table' },
            { id: 'license-expiry', name: 'License Expiry Report', description: 'SLMC, Nursing Council licenses', type: 'table' },
            { id: 'attendance', name: 'Daily Attendance Report', description: 'Staff attendance log', type: 'table' },
            { id: 'overtime', name: 'Overtime Report', description: 'Overtime hours tracking', type: 'table' },
            { id: 'leave-balance', name: 'Leave Balance Report', description: 'Available leaves per staff', type: 'table' },
            { id: 'absenteeism', name: 'Absenteeism Report', description: 'Staff absence tracking', type: 'table' },
            { id: 'duty-roster', name: 'Shift & Duty Roster', description: 'Staff schedule report', type: 'table' },
        ]
    },
    {
        id: 'payroll',
        title: 'Salary & Payroll Reports',
        description: 'Payroll summaries, salary slips and payment reports',
        icon: <CreditCard className="w-6 h-6" />,
        color: 'from-amber-500 to-amber-600',
        reports: [
            { id: 'payroll-monthly', name: 'Monthly Payroll Summary', description: 'Complete payroll report', type: 'document' },
            { id: 'salary-slip', name: 'Employee Salary Slip', description: 'Individual salary breakdown', type: 'document' },
            { id: 'salary-components', name: 'Salary Components Report', description: 'Basic, allowances, deductions', type: 'table' },
            { id: 'overtime-payment', name: 'Overtime Payment Report', description: 'Overtime compensation', type: 'table' },
            { id: 'incentives', name: 'Incentives & Commission', description: 'Doctor/consultant incentives', type: 'table' },
            { id: 'advances', name: 'Advances & Loan Deductions', description: 'Staff advance payments', type: 'table' },
            { id: 'dept-payroll', name: 'Payroll Cost by Department', description: 'Department-wise payroll', type: 'table' },
        ]
    },
    {
        id: 'compliance',
        title: 'Statutory & Compliance Reports',
        description: 'EPF, ETF, PAYE, tax and regulatory reports',
        icon: <Shield className="w-6 h-6" />,
        color: 'from-red-500 to-red-600',
        reports: [
            { id: 'epf-contribution', name: 'EPF Contribution Report', description: 'Employee + Employer EPF', type: 'document' },
            { id: 'etf-contribution', name: 'ETF Contribution Report', description: 'ETF payments', type: 'document' },
            { id: 'epf-schedule', name: 'EPF Monthly Schedule', description: 'Monthly EPF payment schedule', type: 'table' },
            { id: 'epf-ledger', name: 'EPF Ledger', description: 'Employee-wise EPF ledger', type: 'table' },
            { id: 'paye-deduction', name: 'PAYE Tax Deduction', description: 'Income tax deductions', type: 'table' },
            { id: 'paye-submission', name: 'PAYE Submission Report', description: 'Monthly/annual tax filing', type: 'document' },
            { id: 'wht-report', name: 'Withholding Tax Report', description: 'WHT summary', type: 'table' },
            { id: 'vat-report', name: 'VAT Report', description: 'Value Added Tax report', type: 'table' },
        ]
    },
    {
        id: 'pharmacy',
        title: 'Pharmacy & Inventory Reports',
        description: 'Stock, expiry, consumption and purchase reports',
        icon: <Pill className="w-6 h-6" />,
        color: 'from-pink-500 to-pink-600',
        reports: [
            { id: 'stock-balance', name: 'Stock Balance Report', description: 'Current inventory levels', type: 'table' },
            { id: 'expiry-drugs', name: 'Expiry & Near-Expiry Report', description: 'Drugs expiring soon', type: 'table' },
            { id: 'drug-consumption', name: 'Drug Consumption Report', description: 'Usage statistics', type: 'table' },
            { id: 'purchase-grn', name: 'Purchase & GRN Report', description: 'Goods receipt notes', type: 'table' },
            { id: 'supplier-purchase', name: 'Supplier-wise Purchase', description: 'Vendor purchase summary', type: 'table' },
            { id: 'moving-items', name: 'Fast/Slow Moving Items', description: 'Inventory movement analysis', type: 'chart' },
            { id: 'stock-valuation', name: 'Stock Valuation Report', description: 'Inventory value report', type: 'table' },
        ]
    },
    {
        id: 'assets',
        title: 'Equipment & Asset Management',
        description: 'Fixed assets, equipment inventory and maintenance',
        icon: <Wrench className="w-6 h-6" />,
        color: 'from-indigo-500 to-indigo-600',
        reports: [
            { id: 'asset-register', name: 'Fixed Asset Register', description: 'Complete asset list', type: 'table' },
            { id: 'equipment-inventory', name: 'Medical Equipment Inventory', description: 'Equipment tracking', type: 'table' },
            { id: 'maintenance-schedule', name: 'Maintenance Schedule', description: 'Calibration & maintenance', type: 'table' },
            { id: 'breakdown-history', name: 'Breakdown & Repair History', description: 'Equipment repairs log', type: 'table' },
            { id: 'depreciation', name: 'Depreciation Report', description: 'Asset depreciation', type: 'table' },
        ]
    },
    {
        id: 'management',
        title: 'Management & Decision Support',
        description: 'KPIs, performance metrics and dashboards',
        icon: <PieChart className="w-6 h-6" />,
        color: 'from-teal-500 to-teal-600',
        reports: [
            { id: 'kpi-dashboard', name: 'Hospital Performance Dashboard', description: 'Key performance indicators', type: 'chart' },
            { id: 'turnover-ratio', name: 'Patient Turnover Ratio', description: 'Bed turnover analysis', type: 'chart' },
            { id: 'doctor-productivity', name: 'Doctor Productivity Report', description: 'Doctor performance metrics', type: 'table' },
            { id: 'dept-efficiency', name: 'Department Efficiency Report', description: 'Department performance', type: 'chart' },
            { id: 'cost-per-patient', name: 'Cost per Patient/Bed', description: 'Cost analysis', type: 'table' },
            { id: 'management-summary', name: 'Monthly Management Summary', description: 'Executive summary report', type: 'document' },
        ]
    },
    {
        id: 'audit',
        title: 'Security & Audit Reports',
        description: 'User access, activity logs and system reports',
        icon: <Lock className="w-6 h-6" />,
        color: 'from-gray-600 to-gray-700',
        reports: [
            { id: 'user-access', name: 'User Access & Role Report', description: 'System user permissions', type: 'table' },
            { id: 'login-activity', name: 'Login & Activity Log', description: 'User login history', type: 'table' },
            { id: 'audit-trail', name: 'Data Modification Audit Trail', description: 'Data change tracking', type: 'table' },
            { id: 'system-health', name: 'System Health Report', description: 'Backup & system status', type: 'table' },
        ]
    },
    {
        id: 'regulatory',
        title: 'Regulatory & Accreditation',
        description: 'Compliance, incident and regulatory reports',
        icon: <FileCheck className="w-6 h-6" />,
        color: 'from-orange-500 to-orange-600',
        reports: [
            { id: 'moh-compliance', name: 'Ministry of Health Reports', description: 'MoH compliance reports', type: 'document' },
            { id: 'phsrc-reports', name: 'PHSRC Reports', description: 'Private health sector reports', type: 'document' },
            { id: 'infection-control', name: 'Infection Control Report', description: 'Infection tracking', type: 'table' },
            { id: 'mortality', name: 'Mortality & Morbidity Report', description: 'Patient outcomes', type: 'table' },
            { id: 'incident-reports', name: 'Incident Reports', description: 'Safety incidents log', type: 'table' },
        ]
    },
];

export const BranchAdminReports: React.FC = () => {
    const navigate = useNavigate();
    const [userName, setUserName] = useState('');
    const [branchName, setBranchName] = useState('');
    const [userGender, setUserGender] = useState('');
    const [profileImage, setProfileImage] = useState('');

    const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [selectedCategory, setSelectedCategory] = useState('all');

    useEffect(() => {
        const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
        
        setUserName(`${userInfo.first_name || ''} ${userInfo.last_name || ''}`);
        setBranchName(userInfo.branch_center_name || userInfo.branch_name || 'Branch');
        setUserGender(userInfo.gender || '');
        setProfileImage(userInfo.profile_picture || '');
    }, []);

    const toggleCategory = (categoryId: string) => {
        setExpandedCategories(prev => 
            prev.includes(categoryId) 
                ? prev.filter(id => id !== categoryId)
                : [...prev, categoryId]
        );
    };

    const handleGenerateReport = (reportId: string, reportName: string) => {
        alert(`Generating ${reportName}...\nDate Range: ${dateRange.start || 'Not set'} to ${dateRange.end || 'Not set'}`);
        // Here you would implement the actual report generation logic
    };

    const filteredCategories = reportCategories.filter(category => {
        if (selectedCategory !== 'all' && category.id !== selectedCategory) return false;
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return category.title.toLowerCase().includes(query) || 
                   category.description.toLowerCase().includes(query) ||
                   category.reports.some(r => r.name.toLowerCase().includes(query));
        }
        return true;
    });

    return (
        <DashboardLayout
            userName={userName}
            userRole="Branch Admin"
            branchName={branchName}
            userGender={userGender}
            profileImage={profileImage}
            sidebarContent={<BranchAdminSidebar />}
        >
            <div className="space-y-6">
                {/* Header */}
                <div className="bg-gradient-to-r from-emerald-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold">Reports & Analytics</h1>
                            <p className="text-emerald-100 mt-1">Branch Admin - {branchName}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-emerald-100 text-sm">Today's Date</p>
                            <p className="text-xl font-semibold">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        </div>
                    </div>
                </div>

                {/* Filters Section */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Search reports..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="all">All Categories</option>
                            {reportCategories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.title}</option>
                            ))}
                        </select>
                        <input
                            type="date"
                            value={dateRange.start}
                            onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Start Date"
                        />
                        <input
                            type="date"
                            value={dateRange.end}
                            onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="End Date"
                        />
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm">Total Categories</p>
                                <p className="text-2xl font-bold text-gray-800">{reportCategories.length}</p>
                            </div>
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <FileText className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm">Available Reports</p>
                                <p className="text-2xl font-bold text-gray-800">
                                    {reportCategories.reduce((sum, cat) => sum + cat.reports.length, 0)}
                                </p>
                            </div>
                            <div className="p-3 bg-green-100 rounded-lg">
                                <BarChart3 className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm">Generated Today</p>
                                <p className="text-2xl font-bold text-gray-800">24</p>
                            </div>
                            <div className="p-3 bg-purple-100 rounded-lg">
                                <Download className="w-6 h-6 text-purple-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm">Scheduled Reports</p>
                                <p className="text-2xl font-bold text-gray-800">8</p>
                            </div>
                            <div className="p-3 bg-orange-100 rounded-lg">
                                <Clock className="w-6 h-6 text-orange-600" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Report Categories */}
                <div className="space-y-4">
                    {filteredCategories.map((category) => (
                        <div key={category.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            {/* Category Header */}
                            <button
                                onClick={() => toggleCategory(category.id)}
                                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-xl bg-gradient-to-br ${category.color} text-white`}>
                                        {category.icon}
                                    </div>
                                    <div className="text-left">
                                        <h3 className="text-lg font-bold text-gray-800">{category.title}</h3>
                                        <p className="text-sm text-gray-500">{category.description}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
                                        {category.reports.length} reports
                                    </span>
                                    {expandedCategories.includes(category.id) ? (
                                        <ChevronDown className="w-5 h-5 text-gray-400" />
                                    ) : (
                                        <ChevronRight className="w-5 h-5 text-gray-400" />
                                    )}
                                </div>
                            </button>

                            {/* Category Reports */}
                            {expandedCategories.includes(category.id) && (
                                <div className="border-t border-gray-100">
                                    <div className="p-6 bg-gray-50">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {category.reports.map((report) => (
                                                <div key={report.id} className="bg-white rounded-lg p-4 border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all">
                                                    <div className="flex items-start justify-between mb-3">
                                                        <div className="flex-1">
                                                            <h4 className="font-semibold text-gray-800 mb-1">{report.name}</h4>
                                                            <p className="text-sm text-gray-500">{report.description}</p>
                                                        </div>
                                                        <span className={`px-2 py-1 text-xs rounded-full ${
                                                            report.type === 'table' ? 'bg-blue-100 text-blue-700' :
                                                            report.type === 'chart' ? 'bg-green-100 text-green-700' :
                                                            'bg-purple-100 text-purple-700'
                                                        }`}>
                                                            {report.type}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => handleGenerateReport(report.id, report.name)}
                                                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                            View
                                                        </button>
                                                        <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                                                            <Download className="w-4 h-4 text-gray-600" />
                                                        </button>
                                                        <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                                                            <Printer className="w-4 h-4 text-gray-600" />
                                                        </button>
                                                        <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                                                            <FileSpreadsheet className="w-4 h-4 text-gray-600" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* No Results */}
                {filteredCategories.length === 0 && (
                    <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-100">
                        <FileWarning className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">No reports found</h3>
                        <p className="text-gray-500">Try adjusting your search or filter criteria</p>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};
