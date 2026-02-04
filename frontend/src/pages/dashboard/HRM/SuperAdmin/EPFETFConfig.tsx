import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, ArrowLeft, Save, Info, CheckCircle } from 'lucide-react';

const EPFETFConfig: React.FC = () => {
    const navigate = useNavigate();
    const [config, setConfig] = useState({
        epfEmployeeRate: 8,
        epfEmployerRate: 12,
        etfEmployerRate: 3,
        epfNumber: 'EPF/2024/001234',
        etfNumber: 'ETF/2024/005678',
        effectiveFrom: '2024-01-01',
        paymentDueDate: 15,
        autoCalculate: true
    });

    const handleSave = () => {
        // Save configuration
        alert('EPF/ETF configuration saved successfully!');
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/super-admin/hrm')}
                            className="p-2 hover:bg-gray-200 rounded-lg"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">EPF / ETF Configuration</h1>
                            <p className="text-gray-500">Configure Sri Lanka statutory contribution rates</p>
                        </div>
                    </div>
                </div>

                {/* Info Banner */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                    <div className="flex items-start gap-3">
                        <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                        <div>
                            <h3 className="font-semibold text-blue-800">Sri Lanka Statutory Rates</h3>
                            <p className="text-sm text-blue-700 mt-1">
                                As per Sri Lanka labor law, EPF contributions are mandatory: <strong>8% employee + 12% employer</strong>. 
                                ETF is employer-only at <strong>3%</strong>. These rates apply to the basic salary only.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* EPF Configuration */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Shield className="w-5 h-5 text-blue-600" />
                            </div>
                            <h2 className="text-lg font-semibold text-gray-800">EPF (Employees' Provident Fund)</h2>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Employee Contribution Rate (%)
                                </label>
                                <input
                                    type="number"
                                    value={config.epfEmployeeRate}
                                    onChange={(e) => setConfig({ ...config, epfEmployeeRate: Number(e.target.value) })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                                <p className="text-xs text-gray-500 mt-1">Standard rate: 8%</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Employer Contribution Rate (%)
                                </label>
                                <input
                                    type="number"
                                    value={config.epfEmployerRate}
                                    onChange={(e) => setConfig({ ...config, epfEmployerRate: Number(e.target.value) })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                                <p className="text-xs text-gray-500 mt-1">Standard rate: 12%</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    EPF Registration Number
                                </label>
                                <input
                                    type="text"
                                    value={config.epfNumber}
                                    onChange={(e) => setConfig({ ...config, epfNumber: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* ETF Configuration */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-emerald-100 rounded-lg">
                                <Shield className="w-5 h-5 text-emerald-600" />
                            </div>
                            <h2 className="text-lg font-semibold text-gray-800">ETF (Employees' Trust Fund)</h2>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Employer Contribution Rate (%)
                                </label>
                                <input
                                    type="number"
                                    value={config.etfEmployerRate}
                                    onChange={(e) => setConfig({ ...config, etfEmployerRate: Number(e.target.value) })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                />
                                <p className="text-xs text-gray-500 mt-1">Standard rate: 3% (employer only)</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    ETF Registration Number
                                </label>
                                <input
                                    type="text"
                                    value={config.etfNumber}
                                    onChange={(e) => setConfig({ ...config, etfNumber: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                />
                            </div>

                            <div className="bg-emerald-50 p-4 rounded-lg">
                                <p className="text-sm text-emerald-700">
                                    <strong>Note:</strong> ETF is an employer-only contribution. 
                                    No deduction from employee salary.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* General Settings */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-6">General Settings</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Effective From Date
                            </label>
                            <input
                                type="date"
                                value={config.effectiveFrom}
                                onChange={(e) => setConfig({ ...config, effectiveFrom: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Monthly Payment Due Date
                            </label>
                            <select
                                value={config.paymentDueDate}
                                onChange={(e) => setConfig({ ...config, paymentDueDate: Number(e.target.value) })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                {[...Array(28)].map((_, i) => (
                                    <option key={i + 1} value={i + 1}>{i + 1}th of each month</option>
                                ))}
                            </select>
                            <p className="text-xs text-gray-500 mt-1">Deadline for submitting EPF/ETF to authorities</p>
                        </div>
                    </div>

                    <div className="mt-6">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={config.autoCalculate}
                                onChange={(e) => setConfig({ ...config, autoCalculate: e.target.checked })}
                                className="w-5 h-5 text-emerald-500 rounded focus:ring-emerald-500"
                            />
                            <span className="text-gray-700">
                                Auto-calculate EPF/ETF during payroll processing
                            </span>
                        </label>
                    </div>
                </div>

                {/* Calculation Example */}
                <div className="bg-gray-100 rounded-xl p-6 mt-6">
                    <h3 className="font-semibold text-gray-800 mb-4">Calculation Example</h3>
                    <p className="text-sm text-gray-600 mb-4">For a basic salary of <strong>LKR 100,000</strong>:</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white p-4 rounded-lg">
                            <p className="text-sm text-gray-500">EPF (Employee)</p>
                            <p className="text-xl font-bold text-blue-600">LKR 8,000</p>
                            <p className="text-xs text-gray-500">8% of basic salary</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg">
                            <p className="text-sm text-gray-500">EPF (Employer)</p>
                            <p className="text-xl font-bold text-blue-600">LKR 12,000</p>
                            <p className="text-xs text-gray-500">12% of basic salary</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg">
                            <p className="text-sm text-gray-500">ETF (Employer)</p>
                            <p className="text-xl font-bold text-emerald-600">LKR 3,000</p>
                            <p className="text-xs text-gray-500">3% of basic salary</p>
                        </div>
                    </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end mt-6">
                    <button
                        onClick={handleSave}
                        className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
                    >
                        <Save className="w-5 h-5" />
                        Save Configuration
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EPFETFConfig;
