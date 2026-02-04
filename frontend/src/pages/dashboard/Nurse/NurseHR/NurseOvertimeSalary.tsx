import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    DollarSign, ArrowLeft, Clock, Download, FileText, Calendar,
    TrendingUp, Loader2, ChevronLeft, ChevronRight, Eye, Activity
} from 'lucide-react';
import api from "../../../../utils/api/axios";
import { toast } from 'react-toastify';

interface OvertimeRecord {
    id: string;
    date: string;
    hoursWorked: number;
    otRate: number;
    totalAmount: number;
    status: 'pending' | 'approved' | 'paid';
}

interface SalaryBreakdown {
    basicSalary: number;
    allocationAmount: number;
    hourlyRate: number;
    maxHours: number;
}

const NurseOvertimeSalary: React.FC = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
    const [overtimeRecords, setOvertimeRecords] = useState<OvertimeRecord[]>([]);
    const [salaryBreakdown, setSalaryBreakdown] = useState<SalaryBreakdown | null>(null);

    useEffect(() => {
        fetchData();
    }, [selectedMonth]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('authToken');
            const [overtimeRes, salaryRes] = await Promise.all([
                api.get('/hrm/cashier/overtime', {
                    headers: { Authorization: `Bearer ${token}` },
                    params: { month: selectedMonth }
                }),
                api.get('/hrm/cashier/salary-structure', {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);

            if (overtimeRes.data.status === 200) {
                setOvertimeRecords(overtimeRes.data.overtime || []);
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

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center sm:ml-64 pt-20">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-teal-500 mx-auto mb-4" />
                    <p className="text-gray-600">Loading salary data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-teal-50/30 p-6 sm:ml-64 pt-20">
            {/* Header */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                <div className="flex items-center gap-4 mb-6">
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
                            <h1 className="text-2xl font-bold text-gray-800">Overtime & Salary</h1>
                            <p className="text-gray-600 text-sm mt-1">View your overtime hours, night duty allowance, and salary details</p>
                        </div>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg p-4 text-white">
                        <p className="text-teal-100 text-sm mb-1">Total OT (This Month)</p>
                        <p className="text-3xl font-bold">{totalOvertimeHours.toFixed(1)}</p>
                        <p className="text-teal-100 text-xs">hours</p>
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

            {/* Salary Structure */}
            {salaryBreakdown && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-teal-500" />
                        Your Salary Structure
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-gray-50 rounded-lg p-4">
                            <p className="text-gray-500 text-sm mb-1">Basic Salary</p>
                            <p className="text-xl font-bold text-gray-800">{formatCurrency(salaryBreakdown.basicSalary)}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                            <p className="text-gray-500 text-sm mb-1">Allowances</p>
                            <p className="text-xl font-bold text-gray-800">{formatCurrency(salaryBreakdown.allocationAmount)}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                            <p className="text-gray-500 text-sm mb-1">OT Rate (Per Hour)</p>
                            <p className="text-xl font-bold text-teal-600">{formatCurrency(salaryBreakdown.hourlyRate)}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                            <p className="text-gray-500 text-sm mb-1">Max Working Hours</p>
                            <p className="text-xl font-bold text-gray-800">{salaryBreakdown.maxHours} hrs</p>
                        </div>
                    </div>
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-800">
                            <strong>OT Calculation:</strong> Hourly Rate = Basic Salary ÷ (26 days × 8 hours). 
                            Night duty and double shifts may have higher rates (1.5x or 2x).
                        </p>
                    </div>
                </div>
            )}

            {/* Month Selector */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => changeMonth('prev')}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5 text-gray-600" />
                        </button>
                        <div className="flex items-center gap-2 px-4 py-2 bg-teal-50 rounded-lg">
                            <Calendar className="w-4 h-4 text-teal-600" />
                            <span className="font-medium text-teal-900">{getMonthName(selectedMonth)}</span>
                        </div>
                        <button
                            onClick={() => changeMonth('next')}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <ChevronRight className="w-5 h-5 text-gray-600" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Overtime Records */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-teal-500" />
                        Overtime Records - {getMonthName(selectedMonth)}
                    </h2>
                    <div className="text-sm text-gray-600">
                        Total: <span className="font-semibold text-teal-600">{totalOvertimeHours.toFixed(1)} hrs</span>
                        {' / '}
                        <span className="font-semibold text-blue-600">{formatCurrency(totalOvertimeAmount)}</span>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Date</th>
                                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Hours</th>
                                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Rate</th>
                                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Total</th>
                                <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {overtimeRecords.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-8 text-center text-gray-500">
                                        <Clock className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                                        <p>No overtime records for this month</p>
                                    </td>
                                </tr>
                            ) : (
                                overtimeRecords.map((ot, index) => (
                                    <tr key={ot.id} className={`border-b border-gray-100 hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                                        <td className="py-3 px-4 text-gray-700">{formatDate(ot.date)}</td>
                                        <td className="py-3 px-4 text-right font-medium text-teal-600">
                                            {ot.hoursWorked.toFixed(1)} hrs
                                        </td>
                                        <td className="py-3 px-4 text-right text-gray-700">{formatCurrency(ot.otRate)}</td>
                                        <td className="py-3 px-4 text-right font-bold text-blue-600">
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

            {/* Quick Links */}
            <div className="bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl shadow-lg p-6 text-white">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold mb-2">View Your Payslips</h3>
                        <p className="text-teal-100 text-sm">
                            Download salary slips and view your full payment history with EPF/ETF breakdown
                        </p>
                    </div>
                    <button
                        onClick={() => navigate('/nurse-dashboard/hr/payslips')}
                        className="flex items-center gap-2 bg-white text-teal-600 px-6 py-2 rounded-lg font-medium hover:bg-teal-50 transition-colors"
                    >
                        <FileText className="w-4 h-4" />
                        View Payslips
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NurseOvertimeSalary;
