import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    DollarSign, ArrowLeft, Clock, Download, FileText, Calendar,
    TrendingUp, Loader2, ChevronLeft, ChevronRight, Eye
} from 'lucide-react';
import api from "../../../utils/api/axios";
import { toast } from 'react-toastify';

interface OvertimeRecord {
    id: string;
    date: string;
    hoursWorked: number;
    otRate: number;
    totalAmount: number;
    status: 'pending' | 'approved' | 'paid';
}

interface Payslip {
    id: string;
    month: string;
    basicSalary: number;
    allowances: number;
    overtime: number;
    grossSalary: number;
    epfEmployee: number;
    epfEmployer: number;
    etfEmployer: number;
    otherDeductions: number;
    netSalary: number;
    paymentDate: string;
    status: 'generated' | 'paid';
}

interface SalaryBreakdown {
    basicSalary: number;
    allocationAmount: number;
    hourlyRate: number;
    maxHours: number;
}

const CashierOvertimeAndSalary: React.FC = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
    const [overtimeRecords, setOvertimeRecords] = useState<OvertimeRecord[]>([]);
    const [payslips, setPayslips] = useState<Payslip[]>([]);
    const [salaryBreakdown, setSalaryBreakdown] = useState<SalaryBreakdown | null>(null);
    const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

    useEffect(() => {
        fetchData();
    }, [selectedMonth]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('authToken');
            const [overtimeRes, payslipsRes, salaryRes] = await Promise.all([
                api.get('/hrm/cashier/overtime', {
                    headers: { Authorization: `Bearer ${token}` },
                    params: { month: selectedMonth }
                }),
                api.get('/hrm/cashier/payslips', {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                api.get('/hrm/cashier/salary-structure', {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);

            if (overtimeRes.data.status === 200) {
                setOvertimeRecords(overtimeRes.data.overtime || []);
            }
            if (payslipsRes.data.status === 200) {
                setPayslips(payslipsRes.data.payslips || []);
            }
            if (salaryRes.data.status === 200) {
                setSalaryBreakdown(salaryRes.data.salary);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Failed to load salary data');
        } finally {
            setIsLoading(false);
        }
    };

    const downloadPayslip = async (payslipId: string) => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await api.get(`/hrm/cashier/payslip/${payslipId}/download`, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob'
            });

            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `payslip-${payslipId}.pdf`;
            link.click();
            window.URL.revokeObjectURL(url);
            toast.success('Payslip downloaded successfully!');
        } catch (error) {
            console.error('Error downloading payslip:', error);
            toast.error('Failed to download payslip');
        }
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

    const getMonthName = (monthString: string) => {
        const date = new Date(monthString + '-01');
        return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    };

    const formatCurrency = (amount: number) => {
        return `LKR ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const totalOvertimeHours = overtimeRecords.reduce((sum, ot) => sum + ot.hoursWorked, 0);
    const totalOvertimeAmount = overtimeRecords.reduce((sum, ot) => sum + ot.totalAmount, 0);
    const approvedOvertimeAmount = overtimeRecords
        .filter(ot => ot.status === 'approved' || ot.status === 'paid')
        .reduce((sum, ot) => sum + ot.totalAmount, 0);

    const viewPayslipDetail = (payslip: Payslip) => {
        setSelectedPayslip(payslip);
        setShowDetailModal(true);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-emerald-500 mx-auto mb-4" />
                    <p className="text-neutral-600">Loading salary data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50/30 p-6">
            {/* Header */}
            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6 mb-6">
                <div className="flex items-center gap-4 mb-6">
                    <button
                        onClick={() => navigate('/pos/hr')}
                        className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-neutral-600" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-neutral-800">Overtime & Salary</h1>
                        <p className="text-neutral-600 text-sm mt-1">View your overtime hours and salary details</p>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg p-4 text-white">
                        <p className="text-emerald-100 text-sm mb-1">Total OT (This Month)</p>
                        <p className="text-3xl font-bold">{totalOvertimeHours.toFixed(1)}</p>
                        <p className="text-emerald-100 text-xs">hours</p>
                    </div>
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-4 text-white">
                        <p className="text-blue-100 text-sm mb-1">OT Earnings</p>
                        <p className="text-2xl font-bold">{formatCurrency(approvedOvertimeAmount)}</p>
                        <p className="text-blue-100 text-xs">approved</p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-4 text-white">
                        <p className="text-purple-100 text-sm mb-1">Basic Salary</p>
                        <p className="text-2xl font-bold">
                            {salaryBreakdown ? formatCurrency(salaryBreakdown.basicSalary) : '-'}
                        </p>
                        <p className="text-purple-100 text-xs">per month</p>
                    </div>
                    <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg p-4 text-white">
                        <p className="text-amber-100 text-sm mb-1">Hourly Rate</p>
                        <p className="text-2xl font-bold">
                            {salaryBreakdown ? formatCurrency(salaryBreakdown.hourlyRate) : '-'}
                        </p>
                        <p className="text-amber-100 text-xs">per hour</p>
                    </div>
                </div>
            </div>

            {/* Month Selector */}
            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4 mb-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => changeMonth('prev')}
                            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5 text-neutral-600" />
                        </button>
                        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-lg">
                            <Calendar className="w-4 h-4 text-emerald-600" />
                            <span className="font-medium text-emerald-900">{getMonthName(selectedMonth)}</span>
                        </div>
                        <button
                            onClick={() => changeMonth('next')}
                            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                        >
                            <ChevronRight className="w-5 h-5 text-neutral-600" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Overtime Records */}
            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden mb-6">
                <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-neutral-800 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-emerald-500" />
                        Overtime Records - {getMonthName(selectedMonth)}
                    </h2>
                    <div className="text-sm text-neutral-600">
                        Total: <span className="font-semibold text-emerald-600">{totalOvertimeHours.toFixed(1)} hrs</span>
                        {' / '}
                        <span className="font-semibold text-primary-500">{formatCurrency(totalOvertimeAmount)}</span>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-neutral-50 border-b border-neutral-200">
                            <tr>
                                <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">Date</th>
                                <th className="text-right py-3 px-4 text-sm font-medium text-neutral-500">Hours</th>
                                <th className="text-right py-3 px-4 text-sm font-medium text-neutral-500">Rate</th>
                                <th className="text-right py-3 px-4 text-sm font-medium text-neutral-500">Total</th>
                                <th className="text-center py-3 px-4 text-sm font-medium text-neutral-500">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {overtimeRecords.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-8 text-center text-neutral-500">
                                        <Clock className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                                        <p>No overtime records for this month</p>
                                    </td>
                                </tr>
                            ) : (
                                overtimeRecords.map((ot, index) => (
                                    <tr key={ot.id} className={`border-b border-gray-100 hover:bg-neutral-50 ${index % 2 === 0 ? 'bg-white' : 'bg-neutral-50/50'}`}>
                                        <td className="py-3 px-4 text-neutral-700">{formatDate(ot.date)}</td>
                                        <td className="py-3 px-4 text-right font-medium text-emerald-600">
                                            {ot.hoursWorked.toFixed(1)} hrs
                                        </td>
                                        <td className="py-3 px-4 text-right text-neutral-700">{formatCurrency(ot.otRate)}</td>
                                        <td className="py-3 px-4 text-right font-bold text-primary-500">
                                            {formatCurrency(ot.totalAmount)}
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                                                ot.status === 'paid' ? 'bg-green-100 text-green-800' :
                                                ot.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                                                'bg-amber-100 text-amber-800'
                                            }`}>
                                                {ot.status.charAt(0).toUpperCase() + ot.status.slice(1)}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Payslips */}
            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
                <div className="p-4 border-b border-neutral-200">
                    <h2 className="text-lg font-semibold text-neutral-800 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-primary-500" />
                        My Payslips
                    </h2>
                </div>
                <div className="divide-y divide-gray-100">
                    {payslips.length === 0 ? (
                        <div className="py-8 text-center text-neutral-500">
                            <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                            <p>No payslips available</p>
                        </div>
                    ) : (
                        payslips.map((payslip) => (
                            <div key={payslip.id} className="p-4 hover:bg-neutral-50 transition-colors">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="font-semibold text-neutral-800 text-lg">
                                                {getMonthName(payslip.month)}
                                            </h3>
                                            <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                                                payslip.status === 'paid' 
                                                    ? 'bg-green-100 text-green-800' 
                                                    : 'bg-blue-100 text-blue-800'
                                            }`}>
                                                {payslip.status.charAt(0).toUpperCase() + payslip.status.slice(1)}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                                            <div>
                                                <p className="text-xs text-neutral-500">Basic Salary</p>
                                                <p className="font-medium text-neutral-800">{formatCurrency(payslip.basicSalary)}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-neutral-500">Overtime</p>
                                                <p className="font-medium text-emerald-600">{formatCurrency(payslip.overtime)}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-neutral-500">Gross Salary</p>
                                                <p className="font-medium text-primary-500">{formatCurrency(payslip.grossSalary)}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-neutral-500">Net Salary</p>
                                                <p className="font-bold text-purple-600 text-lg">{formatCurrency(payslip.netSalary)}</p>
                                            </div>
                                        </div>
                                        <p className="text-xs text-neutral-500">
                                            Payment Date: {formatDate(payslip.paymentDate)}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 ml-4">
                                        <button
                                            onClick={() => viewPayslipDetail(payslip)}
                                            className="p-2 text-primary-500 hover:bg-blue-50 rounded-lg transition-colors"
                                            title="View Details"
                                        >
                                            <Eye className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => downloadPayslip(payslip.id)}
                                            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
                                        >
                                            <Download className="w-4 h-4" />
                                            Download
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Payslip Detail Modal */}
            {showDetailModal && selectedPayslip && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-neutral-200 flex items-center justify-between sticky top-0 bg-white">
                            <h2 className="text-xl font-bold text-neutral-800">
                                Payslip Details - {getMonthName(selectedPayslip.month)}
                            </h2>
                            <button
                                onClick={() => setShowDetailModal(false)}
                                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5 text-neutral-600" />
                            </button>
                        </div>
                        <div className="p-6">
                            {/* Earnings */}
                            <div className="mb-6">
                                <h3 className="font-semibold text-neutral-800 mb-3 flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4 text-green-500" />
                                    Earnings
                                </h3>
                                <div className="space-y-2 bg-green-50 p-4 rounded-lg">
                                    <div className="flex justify-between">
                                        <span className="text-neutral-600">Basic Salary</span>
                                        <span className="font-medium text-neutral-800">{formatCurrency(selectedPayslip.basicSalary)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-neutral-600">Allowances</span>
                                        <span className="font-medium text-neutral-800">{formatCurrency(selectedPayslip.allowances)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-neutral-600">Overtime</span>
                                        <span className="font-medium text-emerald-600">{formatCurrency(selectedPayslip.overtime)}</span>
                                    </div>
                                    <div className="flex justify-between pt-2 border-t border-green-200">
                                        <span className="font-semibold text-neutral-800">Gross Salary</span>
                                        <span className="font-bold text-green-700">{formatCurrency(selectedPayslip.grossSalary)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Deductions */}
                            <div className="mb-6">
                                <h3 className="font-semibold text-neutral-800 mb-3 flex items-center gap-2">
                                    <DollarSign className="w-4 h-4 text-error-500" />
                                    Deductions
                                </h3>
                                <div className="space-y-2 bg-error-50 p-4 rounded-lg">
                                    <div className="flex justify-between">
                                        <span className="text-neutral-600">EPF (Employee 8%)</span>
                                        <span className="font-medium text-error-600">- {formatCurrency(selectedPayslip.epfEmployee)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-neutral-600">Other Deductions</span>
                                        <span className="font-medium text-error-600">- {formatCurrency(selectedPayslip.otherDeductions)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Employer Contributions */}
                            <div className="mb-6">
                                <h3 className="font-semibold text-neutral-800 mb-3 flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-primary-500" />
                                    Employer Contributions (For your information)
                                </h3>
                                <div className="space-y-2 bg-blue-50 p-4 rounded-lg">
                                    <div className="flex justify-between">
                                        <span className="text-neutral-600">EPF (Employer 12%)</span>
                                        <span className="font-medium text-primary-500">{formatCurrency(selectedPayslip.epfEmployer)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-neutral-600">ETF (3%)</span>
                                        <span className="font-medium text-primary-500">{formatCurrency(selectedPayslip.etfEmployer)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Net Salary */}
                            <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-lg text-white">
                                <div className="flex justify-between items-center">
                                    <span className="text-purple-100 text-lg">Net Salary (Take Home)</span>
                                    <span className="font-bold text-3xl">{formatCurrency(selectedPayslip.netSalary)}</span>
                                </div>
                                <p className="text-purple-100 text-sm mt-2">
                                    Paid on: {formatDate(selectedPayslip.paymentDate)}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CashierOvertimeAndSalary;
