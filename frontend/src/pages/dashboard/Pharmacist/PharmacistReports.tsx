import React, { useState } from 'react';
import {
    BarChart3, FileText, Download, Calendar, Filter,
    TrendingUp, Pill, Package, User, DollarSign,
    Clock, AlertTriangle, CheckCircle, RefreshCw
} from 'lucide-react';

interface ReportType {
    id: string;
    name: string;
    description: string;
    category: 'operational' | 'inventory' | 'compliance';
    icon: React.ReactNode;
}

export const PharmacistReports: React.FC = () => {
    const [selectedReport, setSelectedReport] = useState<string>('daily-dispensing');
    const [dateFrom, setDateFrom] = useState('2025-12-01');
    const [dateTo, setDateTo] = useState('2025-12-18');
    const [loading, setLoading] = useState(false);

    const reportTypes: ReportType[] = [
        // Operational Reports
        { id: 'daily-dispensing', name: 'Daily Dispensing Report', description: 'All medicines dispensed today', category: 'operational', icon: <Pill className="w-5 h-5" /> },
        { id: 'patient-wise', name: 'Patient-wise Medicine Report', description: 'Medicines issued per patient', category: 'operational', icon: <User className="w-5 h-5" /> },
        { id: 'doctor-wise', name: 'Doctor-wise Prescription Report', description: 'Prescriptions by doctor', category: 'operational', icon: <FileText className="w-5 h-5" /> },
        { id: 'generic-brand', name: 'Generic vs Brand Usage', description: 'Comparison of generic and brand medicines', category: 'operational', icon: <TrendingUp className="w-5 h-5" /> },
        // Inventory Reports
        { id: 'stock-balance', name: 'Stock Balance Report', description: 'Current stock levels', category: 'inventory', icon: <Package className="w-5 h-5" /> },
        { id: 'expiry', name: 'Expiry & Near-Expiry Report', description: 'Medicines expiring soon', category: 'inventory', icon: <AlertTriangle className="w-5 h-5" /> },
        { id: 'movement', name: 'Fast/Slow Moving Drugs', description: 'Drug movement analysis', category: 'inventory', icon: <TrendingUp className="w-5 h-5" /> },
        { id: 'variance', name: 'Stock Variance Report', description: 'Stock discrepancies', category: 'inventory', icon: <BarChart3 className="w-5 h-5" /> },
        // Compliance Reports
        { id: 'controlled', name: 'Controlled Drug Usage', description: 'Controlled substance tracking', category: 'compliance', icon: <CheckCircle className="w-5 h-5" /> },
        { id: 'expired-destroyed', name: 'Expired & Destroyed Drugs', description: 'Expired medicine disposal', category: 'compliance', icon: <AlertTriangle className="w-5 h-5" /> },
        { id: 'audit-trail', name: 'Pharmacy Audit Trail', description: 'Complete activity log', category: 'compliance', icon: <Clock className="w-5 h-5" /> },
    ];

    const generateReport = () => {
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            alert('Report generated successfully!');
        }, 1500);
    };

    const exportReport = (format: 'pdf' | 'excel') => {
        alert(`Exporting report as ${format.toUpperCase()}...`);
    };

    const groupedReports = {
        operational: reportTypes.filter(r => r.category === 'operational'),
        inventory: reportTypes.filter(r => r.category === 'inventory'),
        compliance: reportTypes.filter(r => r.category === 'compliance')
    };

    return (
        <div className="ml-0 md:ml-64 pt-24 min-h-screen bg-neutral-50">
            <div className="p-6">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
                        <BarChart3 className="w-7 h-7 text-primary-500" />
                        Reports & Analytics
                    </h1>
                    <p className="text-neutral-600">Generate and export pharmacy reports</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Report Selection */}
                    <div className="lg:col-span-1 space-y-4">
                        {/* Operational Reports */}
                        <div className="bg-white rounded-lg shadow p-4">
                            <h3 className="font-semibold text-neutral-900 mb-3 flex items-center gap-2">
                                <Pill className="w-5 h-5 text-green-600" />
                                Operational Reports
                            </h3>
                            <div className="space-y-2">
                                {groupedReports.operational.map(report => (
                                    <button
                                        key={report.id}
                                        onClick={() => setSelectedReport(report.id)}
                                        className={`w-full text-left p-3 rounded-lg transition-colors ${
                                            selectedReport === report.id
                                                ? 'bg-blue-50 border-2 border-primary-500'
                                                : 'bg-neutral-50 hover:bg-neutral-100 border-2 border-transparent'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            {report.icon}
                                            <span className="font-medium text-neutral-900">{report.name}</span>
                                        </div>
                                        <p className="text-xs text-neutral-500 mt-1 ml-7">{report.description}</p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Inventory Reports */}
                        <div className="bg-white rounded-lg shadow p-4">
                            <h3 className="font-semibold text-neutral-900 mb-3 flex items-center gap-2">
                                <Package className="w-5 h-5 text-purple-600" />
                                Inventory Reports
                            </h3>
                            <div className="space-y-2">
                                {groupedReports.inventory.map(report => (
                                    <button
                                        key={report.id}
                                        onClick={() => setSelectedReport(report.id)}
                                        className={`w-full text-left p-3 rounded-lg transition-colors ${
                                            selectedReport === report.id
                                                ? 'bg-blue-50 border-2 border-primary-500'
                                                : 'bg-neutral-50 hover:bg-neutral-100 border-2 border-transparent'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            {report.icon}
                                            <span className="font-medium text-neutral-900">{report.name}</span>
                                        </div>
                                        <p className="text-xs text-neutral-500 mt-1 ml-7">{report.description}</p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Compliance Reports */}
                        <div className="bg-white rounded-lg shadow p-4">
                            <h3 className="font-semibold text-neutral-900 mb-3 flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-error-600" />
                                Compliance Reports
                            </h3>
                            <div className="space-y-2">
                                {groupedReports.compliance.map(report => (
                                    <button
                                        key={report.id}
                                        onClick={() => setSelectedReport(report.id)}
                                        className={`w-full text-left p-3 rounded-lg transition-colors ${
                                            selectedReport === report.id
                                                ? 'bg-blue-50 border-2 border-primary-500'
                                                : 'bg-neutral-50 hover:bg-neutral-100 border-2 border-transparent'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            {report.icon}
                                            <span className="font-medium text-neutral-900">{report.name}</span>
                                        </div>
                                        <p className="text-xs text-neutral-500 mt-1 ml-7">{report.description}</p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Report Configuration & Preview */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="font-semibold text-neutral-900 mb-4">
                                {reportTypes.find(r => r.id === selectedReport)?.name}
                            </h3>

                            {/* Date Range */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-2">From Date</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
                                        <input
                                            type="date"
                                            className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                            value={dateFrom}
                                            onChange={(e) => setDateFrom(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-2">To Date</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
                                        <input
                                            type="date"
                                            className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                            value={dateTo}
                                            onChange={(e) => setDateTo(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-wrap gap-3 mb-6">
                                <button
                                    onClick={generateReport}
                                    disabled={loading}
                                    className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50"
                                >
                                    {loading ? (
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <BarChart3 className="w-4 h-4" />
                                    )}
                                    Generate Report
                                </button>
                                <button
                                    onClick={() => exportReport('pdf')}
                                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                                >
                                    <Download className="w-4 h-4" />
                                    Export PDF
                                </button>
                                <button
                                    onClick={() => exportReport('excel')}
                                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                >
                                    <Download className="w-4 h-4" />
                                    Export Excel
                                </button>
                            </div>

                            {/* Sample Report Preview */}
                            <div className="border border-neutral-200 rounded-lg p-6 bg-neutral-50">
                                <h4 className="font-medium text-neutral-900 mb-4">Report Preview</h4>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-4 gap-4">
                                        <div className="bg-white p-4 rounded-lg text-center">
                                            <p className="text-2xl font-bold text-primary-500">156</p>
                                            <p className="text-sm text-neutral-600">Total Items</p>
                                        </div>
                                        <div className="bg-white p-4 rounded-lg text-center">
                                            <p className="text-2xl font-bold text-green-600">LKR 45,680</p>
                                            <p className="text-sm text-neutral-600">Total Value</p>
                                        </div>
                                        <div className="bg-white p-4 rounded-lg text-center">
                                            <p className="text-2xl font-bold text-purple-600">48</p>
                                            <p className="text-sm text-neutral-600">Patients Served</p>
                                        </div>
                                        <div className="bg-white p-4 rounded-lg text-center">
                                            <p className="text-2xl font-bold text-orange-600">3</p>
                                            <p className="text-sm text-neutral-600">Pending</p>
                                        </div>
                                    </div>
                                    <p className="text-center text-neutral-500 text-sm">
                                        Click "Generate Report" to view full report data
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PharmacistReports;
