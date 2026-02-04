import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    DollarSign, ArrowLeft, Download, Eye, Printer, Calendar, Shield,
    Loader2, FileText, TrendingUp, X, ChevronLeft, ChevronRight, Activity
} from 'lucide-react';
import api from "../../../../utils/api/axios";
import { toast } from 'react-toastify';

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

const NursePayslips: React.FC = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [payslips, setPayslips] = useState<Payslip[]>([]);
    const [salaryBreakdown, setSalaryBreakdown] = useState<SalaryBreakdown | null>(null);
    const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('authToken');
            const [payslipsRes, salaryRes] = await Promise.all([
                api.get('/hrm/cashier/payslips', {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                api.get('/hrm/cashier/salary-structure', {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);

            if (payslipsRes.data.status === 200) {
                setPayslips(payslipsRes.data.payslips || []);
            }
            if (salaryRes.data.status === 200) {
                setSalaryBreakdown(salaryRes.data.salary);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Failed to load payslip data');
        } finally {
            setIsLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return `LKR ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const getMonthName = (monthString: string) => {
        const date = new Date(monthString + '-01');
        return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    };

    const viewPayslipDetail = (payslip: Payslip) => {
        setSelectedPayslip(payslip);
        setShowDetailModal(true);
    };

    const downloadPayslip = async (payslipId: string) => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await api.get(`/hrm/cashier/payslip/${payslipId}/download`, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob'
            });

            const blob = new Blob([response.data], { type: 'text/html' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `payslip-${payslipId}.html`;
            link.click();
            window.URL.revokeObjectURL(url);
            toast.success('Payslip downloaded successfully!');
        } catch (error) {
            console.error('Error downloading payslip:', error);
            toast.error('Failed to download payslip');
        }
    };

    const printPayslip = (payslip: Payslip) => {
        const printContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Payslip - ${getMonthName(payslip.month)}</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; background: white; }
                    .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #0d9488; padding-bottom: 20px; }
                    .header h1 { color: #0d9488; font-size: 28px; margin-bottom: 5px; }
                    .header p { color: #666; font-size: 14px; }
                    .header .month { font-size: 18px; color: #333; margin-top: 10px; font-weight: 600; }
                    .section { margin-bottom: 25px; }
                    .section h3 { font-size: 16px; color: #333; margin-bottom: 15px; padding-bottom: 8px; border-bottom: 2px solid #e5e7eb; }
                    .section.earnings h3 { border-color: #10b981; }
                    .section.deductions h3 { border-color: #ef4444; }
                    .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f3f4f6; }
                    .row:last-child { border-bottom: none; }
                    .row.total { background: #f9fafb; padding: 12px; margin-top: 10px; border-radius: 6px; font-weight: 600; }
                    .earnings .amount { color: #10b981; }
                    .deductions .amount { color: #ef4444; }
                    .employer-info { background: #eff6ff; padding: 15px; border-radius: 8px; margin-top: 15px; }
                    .employer-info h4 { font-size: 14px; color: #1e40af; margin-bottom: 10px; }
                    .net-salary { background: linear-gradient(135deg, #0d9488, #0891b2); color: white; padding: 25px; border-radius: 12px; text-align: center; margin-top: 25px; }
                    .net-salary label { font-size: 14px; opacity: 0.9; }
                    .net-salary .amount { font-size: 32px; font-weight: 700; margin-top: 5px; }
                    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; }
                    .footer p { font-size: 11px; color: #999; }
                    @media print { .net-salary { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>CURE.LK - Nursing Department</h1>
                    <p>Healthcare Management System</p>
                    <div class="month">Payslip for ${getMonthName(payslip.month)}</div>
                </div>
                
                <div class="section earnings">
                    <h3>💰 Earnings</h3>
                    <div class="row"><span>Basic Salary</span><span class="amount">${formatCurrency(payslip.basicSalary)}</span></div>
                    <div class="row"><span>Allowances (Shift/Night Duty)</span><span class="amount">${formatCurrency(payslip.allowances)}</span></div>
                    <div class="row"><span>Overtime</span><span class="amount">${formatCurrency(payslip.overtime)}</span></div>
                    <div class="row total"><span>Gross Salary</span><span class="amount">${formatCurrency(payslip.grossSalary)}</span></div>
                </div>
                
                <div class="section deductions">
                    <h3>📉 Deductions</h3>
                    <div class="row"><span>EPF (Employee 8%)</span><span class="amount">- ${formatCurrency(payslip.epfEmployee)}</span></div>
                    ${payslip.otherDeductions > 0 ? `<div class="row"><span>Other Deductions</span><span class="amount">- ${formatCurrency(payslip.otherDeductions)}</span></div>` : ''}
                    <div class="row total"><span>Total Deductions</span><span class="amount">- ${formatCurrency(payslip.epfEmployee + payslip.otherDeductions)}</span></div>
                </div>
                
                <div class="employer-info">
                    <h4>🏢 Employer Contributions (For your information)</h4>
                    <div class="row"><span>EPF (Employer 12%)</span><span>${formatCurrency(payslip.epfEmployer)}</span></div>
                    <div class="row"><span>ETF (3%)</span><span>${formatCurrency(payslip.etfEmployer)}</span></div>
                </div>
                
                <div class="net-salary">
                    <label>Net Salary (Take Home)</label>
                    <div class="amount">${formatCurrency(payslip.netSalary)}</div>
                </div>
                
                <div class="footer">
                    <p>This is a computer-generated payslip and does not require a signature.</p>
                    <p>Generated on ${new Date().toLocaleString()}</p>
                </div>
            </body>
            </html>
        `;

        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(printContent);
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => { printWindow.print(); }, 250);
        }
    };

    const latestPayslip = payslips[0];
    const filteredPayslips = payslips.filter(p => p.month.startsWith(selectedYear.toString()));
    const years = [...new Set(payslips.map(p => parseInt(p.month.split('-')[0])))].sort((a, b) => b - a);

    const annualTotals = filteredPayslips.reduce((acc, p) => ({
        gross: acc.gross + p.grossSalary,
        deductions: acc.deductions + p.epfEmployee + p.otherDeductions,
        net: acc.net + p.netSalary,
        overtime: acc.overtime + p.overtime
    }), { gross: 0, deductions: 0, net: 0, overtime: 0 });

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center sm:ml-64 pt-20">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-teal-500 mx-auto mb-4" />
                    <p className="text-gray-600">Loading payslips...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-teal-50/30 p-6 sm:ml-64 pt-20">
            {/* Header */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/nurse-dashboard/hr')}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 text-gray-600" />
                        </button>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-teal-100 rounded-lg">
                                <Activity className="w-6 h-6 text-teal-600" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-800">My Payslips</h1>
                                <p className="text-gray-600 text-sm mt-1">View, download and print your monthly payslips</p>
                            </div>
                        </div>
                    </div>
                    {years.length > 0 && (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setSelectedYear(prev => prev - 1)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                disabled={!years.includes(selectedYear - 1)}
                            >
                                <ChevronLeft className="w-5 h-5 text-gray-600" />
                            </button>
                            <div className="px-4 py-2 bg-teal-50 rounded-lg">
                                <span className="font-medium text-teal-900">{selectedYear}</span>
                            </div>
                            <button
                                onClick={() => setSelectedYear(prev => prev + 1)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                disabled={selectedYear >= new Date().getFullYear()}
                            >
                                <ChevronRight className="w-5 h-5 text-gray-600" />
                            </button>
                        </div>
                    )}
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg p-4 text-white">
                        <p className="text-teal-100 text-sm mb-1">Total Payslips</p>
                        <p className="text-3xl font-bold">{filteredPayslips.length}</p>
                        <p className="text-teal-100 text-xs">in {selectedYear}</p>
                    </div>
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-4 text-white">
                        <p className="text-blue-100 text-sm mb-1">YTD Gross</p>
                        <p className="text-xl font-bold">{formatCurrency(annualTotals.gross)}</p>
                        <p className="text-blue-100 text-xs">total earnings</p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-4 text-white">
                        <p className="text-purple-100 text-sm mb-1">YTD Net</p>
                        <p className="text-xl font-bold">{formatCurrency(annualTotals.net)}</p>
                        <p className="text-purple-100 text-xs">take home</p>
                    </div>
                    <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg p-4 text-white">
                        <p className="text-amber-100 text-sm mb-1">YTD Overtime</p>
                        <p className="text-xl font-bold">{formatCurrency(annualTotals.overtime)}</p>
                        <p className="text-amber-100 text-xs">extra earnings</p>
                    </div>
                </div>
            </div>

            {/* Latest Payslip Preview */}
            {latestPayslip && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-teal-100 rounded-xl">
                                <DollarSign className="w-6 h-6 text-teal-600" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-gray-800">Latest Payslip</h2>
                                <p className="text-sm text-gray-500">{getMonthName(latestPayslip.month)}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => viewPayslipDetail(latestPayslip)} className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                                <Eye className="w-4 h-4" /> View
                            </button>
                            <button onClick={() => printPayslip(latestPayslip)} className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                                <Printer className="w-4 h-4" /> Print
                            </button>
                            <button onClick={() => downloadPayslip(latestPayslip.id)} className="flex items-center gap-2 px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors">
                                <Download className="w-4 h-4" /> Download
                            </button>
                        </div>
                    </div>

                    {/* Payslip Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-green-50 rounded-lg p-5">
                            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-green-600" /> Earnings
                            </h3>
                            <div className="space-y-3">
                                <div className="flex justify-between"><span className="text-gray-600">Basic Salary</span><span className="font-medium text-gray-800">{formatCurrency(latestPayslip.basicSalary)}</span></div>
                                <div className="flex justify-between"><span className="text-gray-600">Allowances</span><span className="font-medium text-gray-800">{formatCurrency(latestPayslip.allowances)}</span></div>
                                <div className="flex justify-between"><span className="text-gray-600">Overtime</span><span className="font-medium text-emerald-600">{formatCurrency(latestPayslip.overtime)}</span></div>
                                <div className="flex justify-between pt-3 border-t border-green-200"><span className="font-semibold">Gross Salary</span><span className="font-bold text-green-700">{formatCurrency(latestPayslip.grossSalary)}</span></div>
                            </div>
                        </div>
                        <div className="bg-red-50 rounded-lg p-5">
                            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                <DollarSign className="w-4 h-4 text-red-600" /> Deductions
                            </h3>
                            <div className="space-y-3">
                                <div className="flex justify-between"><span className="text-gray-600">EPF (Employee 8%)</span><span className="font-medium text-red-600">- {formatCurrency(latestPayslip.epfEmployee)}</span></div>
                                <div className="flex justify-between pt-3 border-t border-red-200"><span className="font-semibold">Total Deductions</span><span className="font-bold text-red-600">- {formatCurrency(latestPayslip.epfEmployee + latestPayslip.otherDeductions)}</span></div>
                            </div>
                            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                                <div className="flex items-center gap-2 text-blue-700 mb-2"><Shield className="w-4 h-4" /><span className="text-sm font-medium">Employer Contributions</span></div>
                                <p className="text-xs text-blue-600">EPF (12%): {formatCurrency(latestPayslip.epfEmployer)} | ETF (3%): {formatCurrency(latestPayslip.etfEmployer)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Net Salary */}
                    <div className="mt-6 p-5 bg-gradient-to-r from-teal-500 to-cyan-600 rounded-xl text-white">
                        <div className="flex justify-between items-center">
                            <div>
                                <span className="text-teal-100 text-lg">Net Salary (Take Home)</span>
                                <p className="text-teal-200 text-sm mt-1">Paid on {formatDate(latestPayslip.paymentDate)}</p>
                            </div>
                            <span className="text-4xl font-bold">{formatCurrency(latestPayslip.netSalary)}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Payslip History */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-teal-500" /> Payslip History - {selectedYear}
                    </h2>
                </div>
                
                {filteredPayslips.length === 0 ? (
                    <div className="py-12 text-center text-gray-500">
                        <FileText className="w-16 h-16 mx-auto mb-3 text-gray-300" />
                        <p className="text-lg font-medium">No payslips found</p>
                        <p className="text-sm">No payslips available for {selectedYear}</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Month</th>
                                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Gross Salary</th>
                                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Deductions</th>
                                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Net Salary</th>
                                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredPayslips.map((payslip, index) => (
                                    <tr key={payslip.id} className={`border-b border-gray-100 hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-3">
                                                <Calendar className="w-4 h-4 text-gray-400" />
                                                <span className="font-medium text-gray-800">{getMonthName(payslip.month)}</span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-right text-gray-700">{formatCurrency(payslip.grossSalary)}</td>
                                        <td className="py-3 px-4 text-right text-red-600">- {formatCurrency(payslip.epfEmployee + payslip.otherDeductions)}</td>
                                        <td className="py-3 px-4 text-right font-bold text-teal-600">{formatCurrency(payslip.netSalary)}</td>
                                        <td className="py-3 px-4 text-center">
                                            <span className={`px-2 py-1 text-xs rounded-full font-medium ${payslip.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                                                {payslip.status === 'paid' ? 'Paid' : 'Generated'}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex items-center justify-center gap-1">
                                                <button onClick={() => viewPayslipDetail(payslip)} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Eye className="w-4 h-4" /></button>
                                                <button onClick={() => printPayslip(payslip)} className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg"><Printer className="w-4 h-4" /></button>
                                                <button onClick={() => downloadPayslip(payslip.id)} className="p-2 text-gray-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg"><Download className="w-4 h-4" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Payslip Detail Modal */}
            {showDetailModal && selectedPayslip && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
                            <div>
                                <h2 className="text-xl font-bold text-gray-800">Payslip Details</h2>
                                <p className="text-gray-500">{getMonthName(selectedPayslip.month)}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => printPayslip(selectedPayslip)} className="p-2 hover:bg-gray-100 rounded-lg"><Printer className="w-5 h-5 text-gray-600" /></button>
                                <button onClick={() => setShowDetailModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-600" /></button>
                            </div>
                        </div>
                        <div className="p-6">
                            <div className="mb-6">
                                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-green-500" /> Earnings</h3>
                                <div className="space-y-2 bg-green-50 p-4 rounded-lg">
                                    <div className="flex justify-between"><span className="text-gray-600">Basic Salary</span><span className="font-medium">{formatCurrency(selectedPayslip.basicSalary)}</span></div>
                                    <div className="flex justify-between"><span className="text-gray-600">Allowances</span><span className="font-medium">{formatCurrency(selectedPayslip.allowances)}</span></div>
                                    <div className="flex justify-between"><span className="text-gray-600">Overtime</span><span className="font-medium text-emerald-600">{formatCurrency(selectedPayslip.overtime)}</span></div>
                                    <div className="flex justify-between pt-2 border-t border-green-200"><span className="font-semibold">Gross Salary</span><span className="font-bold text-green-700">{formatCurrency(selectedPayslip.grossSalary)}</span></div>
                                </div>
                            </div>

                            <div className="mb-6">
                                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2"><DollarSign className="w-4 h-4 text-red-500" /> Deductions</h3>
                                <div className="space-y-2 bg-red-50 p-4 rounded-lg">
                                    <div className="flex justify-between"><span className="text-gray-600">EPF (Employee 8%)</span><span className="font-medium text-red-600">- {formatCurrency(selectedPayslip.epfEmployee)}</span></div>
                                </div>
                            </div>

                            <div className="mb-6">
                                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2"><FileText className="w-4 h-4 text-blue-500" /> Employer Contributions</h3>
                                <div className="space-y-2 bg-blue-50 p-4 rounded-lg">
                                    <div className="flex justify-between"><span className="text-gray-600">EPF (Employer 12%)</span><span className="font-medium text-blue-600">{formatCurrency(selectedPayslip.epfEmployer)}</span></div>
                                    <div className="flex justify-between"><span className="text-gray-600">ETF (3%)</span><span className="font-medium text-blue-600">{formatCurrency(selectedPayslip.etfEmployer)}</span></div>
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-teal-500 to-cyan-600 p-6 rounded-lg text-white">
                                <div className="flex justify-between items-center">
                                    <span className="text-teal-100 text-lg">Net Salary (Take Home)</span>
                                    <span className="font-bold text-3xl">{formatCurrency(selectedPayslip.netSalary)}</span>
                                </div>
                            </div>

                            <div className="mt-6 flex justify-end gap-3">
                                <button onClick={() => printPayslip(selectedPayslip)} className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                                    <Printer className="w-4 h-4" /> Print Payslip
                                </button>
                                <button onClick={() => downloadPayslip(selectedPayslip.id)} className="flex items-center gap-2 px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600">
                                    <Download className="w-4 h-4" /> Download
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NursePayslips;
