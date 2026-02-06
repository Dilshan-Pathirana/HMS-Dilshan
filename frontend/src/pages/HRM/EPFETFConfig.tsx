import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from "../../utils/api/axios";
import {
    Shield,
    ArrowLeft,
    Save,
    Info,
    CheckCircle,
    History,
    Calculator,
    RefreshCw,
    AlertCircle,
    X,
    Building,
    Building2,
    Copy
} from 'lucide-react';

interface Branch {
    id: string;
    center_name: string;
}

interface EPFETFConfigData {
    id: string | null;
    branch_id?: string | null;
    epf_employee_rate: number;
    epf_employer_rate: number;
    etf_employer_rate: number;
    epf_registration_number: string;
    etf_registration_number: string;
    company_name: string;
    company_address: string;
    company_contact: string;
    effective_from: string;
    payment_due_date: number;
    auto_calculate: boolean;
    is_active: boolean;
    branch?: {
        id: string;
        center_name: string;
    };
}

interface RateHistory {
    id: string;
    old_epf_employee_rate: number;
    new_epf_employee_rate: number;
    old_epf_employer_rate: number;
    new_epf_employer_rate: number;
    old_etf_employer_rate: number;
    new_etf_employer_rate: number;
    effective_from: string;
    change_reason: string;
    created_at: string;
    changed_by?: {
        first_name: string;
        last_name: string;
    };
}

interface Calculation {
    basic_salary: number;
    epf_employee: number;
    epf_employer: number;
    etf_employer: number;
    total_epf: number;
    total_employer_contribution: number;
    net_salary_after_epf: number;
}

const EPFETFConfig: React.FC = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [history, setHistory] = useState<RateHistory[]>([]);
    const [calculatorSalary, setCalculatorSalary] = useState<string>('100000');
    const [calculation, setCalculation] = useState<Calculation | null>(null);
    
    // Branch support
    const [branches, setBranches] = useState<Branch[]>([]);
    const [selectedBranch, setSelectedBranch] = useState<string>('global');
    const [allConfigs, setAllConfigs] = useState<EPFETFConfigData[]>([]);

    const [config, setConfig] = useState<EPFETFConfigData>({
        id: null,
        branch_id: null,
        epf_employee_rate: 8,
        epf_employer_rate: 12,
        etf_employer_rate: 3,
        epf_registration_number: '',
        etf_registration_number: '',
        company_name: '',
        company_address: '',
        company_contact: '',
        effective_from: new Date().toISOString().split('T')[0],
        payment_due_date: 15,
        auto_calculate: true,
        is_active: true
    });

    const [changeReason, setChangeReason] = useState('');

    useEffect(() => {
        fetchBranches();
    }, []);

    useEffect(() => {
        fetchConfig();
    }, [selectedBranch]);

    useEffect(() => {
        // Auto-calculate preview when rates change
        if (calculatorSalary) {
            calculatePreview();
        }
    }, [config.epf_employee_rate, config.epf_employer_rate, config.etf_employer_rate, calculatorSalary]);

    const fetchBranches = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await api.get('/hrm/super-admin/salary-structures/branches', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.status === 200) {
                setBranches(response.data.branches || []);
            }
        } catch (error) {
            console.error('Error fetching branches:', error);
        }
    };

    const fetchConfig = async () => {
        try {
            setIsLoading(true);
            const token = localStorage.getItem('token');
            const branchParam = selectedBranch === 'global' ? '' : `?branch_id=${selectedBranch}`;
            const response = await api.get(`/hrm/super-admin/epf-etf-config${branchParam}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.status === 200) {
                const configData = response.data.config;
                // Ensure branch_id is set correctly
                if (selectedBranch !== 'global' && !configData.branch_id) {
                    configData.branch_id = selectedBranch;
                }
                // Format effective_from date to yyyy-MM-dd for input[type="date"]
                if (configData.effective_from && configData.effective_from.includes('T')) {
                    configData.effective_from = configData.effective_from.split('T')[0];
                }
                // Normalize null values to empty strings to prevent controlled/uncontrolled warnings
                const normalizedConfig: EPFETFConfigData = {
                    id: configData.id || null,
                    branch_id: configData.branch_id || null,
                    epf_employee_rate: configData.epf_employee_rate ?? 8,
                    epf_employer_rate: configData.epf_employer_rate ?? 12,
                    etf_employer_rate: configData.etf_employer_rate ?? 3,
                    epf_registration_number: configData.epf_registration_number || '',
                    etf_registration_number: configData.etf_registration_number || '',
                    company_name: configData.company_name || '',
                    company_address: configData.company_address || '',
                    company_contact: configData.company_contact || '',
                    effective_from: configData.effective_from || new Date().toISOString().split('T')[0],
                    payment_due_date: configData.payment_due_date ?? 15,
                    auto_calculate: configData.auto_calculate ?? true,
                    is_active: configData.is_active ?? true,
                    branch: configData.branch
                };
                setConfig(normalizedConfig);
            }
        } catch (error) {
            console.error('Error fetching config:', error);
            setError('Failed to load configuration');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchAllConfigs = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await api.get('/hrm/super-admin/epf-etf-config/all', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.status === 200) {
                setAllConfigs(response.data.configs || []);
            }
        } catch (error) {
            console.error('Error fetching all configs:', error);
        }
    };

    const fetchHistory = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await api.get('/hrm/super-admin/epf-etf-config/history', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.status === 200) {
                setHistory(response.data.history);
                setShowHistoryModal(true);
            }
        } catch (error) {
            console.error('Error fetching history:', error);
        }
    };

    const calculatePreview = async () => {
        const salary = parseFloat(calculatorSalary);
        if (isNaN(salary) || salary <= 0) return;

        // Calculate locally for instant feedback
        const epfEmployee = Math.round(salary * (config.epf_employee_rate / 100) * 100) / 100;
        const epfEmployer = Math.round(salary * (config.epf_employer_rate / 100) * 100) / 100;
        const etfEmployer = Math.round(salary * (config.etf_employer_rate / 100) * 100) / 100;

        setCalculation({
            basic_salary: salary,
            epf_employee: epfEmployee,
            epf_employer: epfEmployer,
            etf_employer: etfEmployer,
            total_epf: epfEmployee + epfEmployer,
            total_employer_contribution: epfEmployer + etfEmployer,
            net_salary_after_epf: salary - epfEmployee,
        });
    };

    const handleSave = async () => {
        setIsSaving(true);
        setError(null);
        setSuccess(null);

        try {
            const token = localStorage.getItem('token');
            const payload = {
                ...config,
                branch_id: selectedBranch === 'global' ? null : selectedBranch,
                change_reason: changeReason || 'Configuration update'
            };
            const response = await api.post('/hrm/super-admin/epf-etf-config', payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.status === 200) {
                const branchName = selectedBranch === 'global' 
                    ? 'Global' 
                    : branches.find(b => b.id === selectedBranch)?.center_name || 'Branch';
                setSuccess(`EPF/ETF configuration saved successfully for ${branchName}!`);
                setConfig(response.data.config);
                setChangeReason('');
            }
        } catch (error: any) {
            console.error('Error saving config:', error);
            if (error.response?.data?.errors) {
                const errors = Object.values(error.response.data.errors).flat();
                setError(errors.join(', '));
            } else {
                setError('Failed to save configuration');
            }
        } finally {
            setIsSaving(false);
        }
    };

    const handleReset = async () => {
        if (!confirm('Are you sure you want to reset to default Sri Lanka rates (EPF 8%+12%, ETF 3%)?')) return;

        try {
            const token = localStorage.getItem('token');
            const response = await api.post('/hrm/super-admin/epf-etf-config/reset', {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.status === 200) {
                setSuccess('Reset to default Sri Lanka rates successfully!');
                fetchConfig();
            }
        } catch (error) {
            console.error('Error resetting:', error);
            setError('Failed to reset configuration');
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-LK', {
            style: 'currency',
            currency: 'LKR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
                <div className="text-neutral-500">Loading configuration...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-50 p-6">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/super-admin/hrm')}
                            className="p-2 hover:bg-neutral-200 rounded-lg"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-neutral-800">EPF / ETF Configuration</h1>
                            <p className="text-neutral-500">Configure Sri Lanka statutory contribution rates</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={fetchHistory}
                            className="flex items-center gap-2 px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50"
                        >
                            <History className="w-4 h-4" />
                            Rate History
                        </button>
                        <button
                            onClick={handleReset}
                            className="flex items-center gap-2 px-4 py-2 border border-orange-300 text-orange-700 rounded-lg hover:bg-orange-50"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Reset to Default
                        </button>
                    </div>
                </div>

                {/* Branch Selector */}
                <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4 mb-6">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-primary-500" />
                            <span className="font-medium text-neutral-700">Branch:</span>
                        </div>
                        <select
                            value={selectedBranch}
                            onChange={(e) => setSelectedBranch(e.target.value)}
                            className="flex-1 max-w-xs px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        >
                            <option value="global">🌐 Global (All Branches)</option>
                            {branches.map((branch) => (
                                <option key={branch.id} value={branch.id}>
                                    🏥 {branch.center_name}
                                </option>
                            ))}
                        </select>
                        <div className="text-sm text-neutral-500">
                            {selectedBranch === 'global' 
                                ? 'Editing global configuration (applies to all branches without specific config)'
                                : 'Editing branch-specific configuration'}
                        </div>
                    </div>
                </div>

                {/* Alerts */}
                {error && (
                    <div className="mb-4 p-4 bg-error-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
                        <AlertCircle className="w-5 h-5" />
                        {error}
                        <button onClick={() => setError(null)} className="ml-auto">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {success && (
                    <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
                        <CheckCircle className="w-5 h-5" />
                        {success}
                        <button onClick={() => setSuccess(null)} className="ml-auto">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {/* Info Banner */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                    <div className="flex items-start gap-3">
                        <Info className="w-5 h-5 text-primary-500 mt-0.5" />
                        <div>
                            <h3 className="font-semibold text-blue-800">Sri Lanka Statutory Rates</h3>
                            <p className="text-sm text-blue-700 mt-1">
                                As per Sri Lanka labor law, EPF contributions are mandatory: <strong>8% employee + 12% employer</strong>. 
                                ETF is employer-only at <strong>3%</strong>. These rates apply to the basic salary only.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* EPF Configuration */}
                    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Shield className="w-5 h-5 text-primary-500" />
                            </div>
                            <h2 className="text-lg font-semibold text-neutral-800">EPF</h2>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-2">
                                    Employee Rate (%)
                                </label>
                                <input
                                    type="number"
                                    value={config.epf_employee_rate}
                                    onChange={(e) => setConfig({ ...config, epf_employee_rate: Number(e.target.value) })}
                                    step="0.01"
                                    min="0"
                                    max="100"
                                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                />
                                <p className="text-xs text-neutral-500 mt-1">Deducted from employee salary</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-2">
                                    Employer Rate (%)
                                </label>
                                <input
                                    type="number"
                                    value={config.epf_employer_rate}
                                    onChange={(e) => setConfig({ ...config, epf_employer_rate: Number(e.target.value) })}
                                    step="0.01"
                                    min="0"
                                    max="100"
                                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                />
                                <p className="text-xs text-neutral-500 mt-1">Paid by hospital</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-2">
                                    EPF Registration No.
                                </label>
                                <input
                                    type="text"
                                    value={config.epf_registration_number}
                                    onChange={(e) => setConfig({ ...config, epf_registration_number: e.target.value })}
                                    placeholder="EPF/2024/001234"
                                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* ETF Configuration */}
                    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-emerald-100 rounded-lg">
                                <Shield className="w-5 h-5 text-emerald-600" />
                            </div>
                            <h2 className="text-lg font-semibold text-neutral-800">ETF</h2>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-2">
                                    Employer Rate (%)
                                </label>
                                <input
                                    type="number"
                                    value={config.etf_employer_rate}
                                    onChange={(e) => setConfig({ ...config, etf_employer_rate: Number(e.target.value) })}
                                    step="0.01"
                                    min="0"
                                    max="100"
                                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                />
                                <p className="text-xs text-neutral-500 mt-1">Employer only contribution</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-2">
                                    ETF Registration No.
                                </label>
                                <input
                                    type="text"
                                    value={config.etf_registration_number}
                                    onChange={(e) => setConfig({ ...config, etf_registration_number: e.target.value })}
                                    placeholder="ETF/2024/005678"
                                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                />
                            </div>

                            <div className="bg-emerald-50 p-3 rounded-lg">
                                <p className="text-sm text-emerald-700">
                                    <strong>Note:</strong> ETF is employer-only. No deduction from employee.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Live Calculator */}
                    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <Calculator className="w-5 h-5 text-purple-600" />
                            </div>
                            <h2 className="text-lg font-semibold text-neutral-800">Calculator</h2>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-2">
                                    Basic Salary (LKR)
                                </label>
                                <input
                                    type="number"
                                    value={calculatorSalary}
                                    onChange={(e) => setCalculatorSalary(e.target.value)}
                                    min="0"
                                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                />
                            </div>

                            {calculation && (
                                <div className="space-y-2 pt-2 border-t border-neutral-200">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-neutral-600">EPF (Employee {config.epf_employee_rate}%)</span>
                                        <span className="font-medium text-error-600">-{formatCurrency(calculation.epf_employee)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-neutral-600">EPF (Employer {config.epf_employer_rate}%)</span>
                                        <span className="font-medium text-primary-500">{formatCurrency(calculation.epf_employer)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-neutral-600">ETF (Employer {config.etf_employer_rate}%)</span>
                                        <span className="font-medium text-emerald-600">{formatCurrency(calculation.etf_employer)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm pt-2 border-t border-neutral-200">
                                        <span className="text-neutral-700 font-medium">Net After EPF</span>
                                        <span className="font-bold text-neutral-800">{formatCurrency(calculation.net_salary_after_epf)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-neutral-700 font-medium">Total Employer Cost</span>
                                        <span className="font-bold text-purple-700">{formatCurrency(calculation.total_employer_contribution)}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Company Details & General Settings */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                    {/* Company Details */}
                    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-neutral-100 rounded-lg">
                                <Building className="w-5 h-5 text-neutral-600" />
                            </div>
                            <h2 className="text-lg font-semibold text-neutral-800">Company Details</h2>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-2">
                                    Company Name
                                </label>
                                <input
                                    type="text"
                                    value={config.company_name}
                                    onChange={(e) => setConfig({ ...config, company_name: e.target.value })}
                                    placeholder="Cure Hospital Network"
                                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-2">
                                    Address
                                </label>
                                <input
                                    type="text"
                                    value={config.company_address}
                                    onChange={(e) => setConfig({ ...config, company_address: e.target.value })}
                                    placeholder="Colombo, Sri Lanka"
                                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-2">
                                    Contact Number
                                </label>
                                <input
                                    type="text"
                                    value={config.company_contact}
                                    onChange={(e) => setConfig({ ...config, company_contact: e.target.value })}
                                    placeholder="+94 11 234 5678"
                                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* General Settings */}
                    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
                        <h2 className="text-lg font-semibold text-neutral-800 mb-6">General Settings</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-2">
                                    Effective From Date
                                </label>
                                <input
                                    type="date"
                                    value={config.effective_from}
                                    onChange={(e) => setConfig({ ...config, effective_from: e.target.value })}
                                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-2">
                                    Monthly Payment Due Date
                                </label>
                                <select
                                    value={config.payment_due_date}
                                    onChange={(e) => setConfig({ ...config, payment_due_date: Number(e.target.value) })}
                                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                >
                                    {[...Array(28)].map((_, i) => (
                                        <option key={i + 1} value={i + 1}>{i + 1}th of each month</option>
                                    ))}
                                </select>
                                <p className="text-xs text-neutral-500 mt-1">Deadline for submitting EPF/ETF</p>
                            </div>

                            <label className="flex items-center gap-3 cursor-pointer mt-4">
                                <input
                                    type="checkbox"
                                    checked={config.auto_calculate}
                                    onChange={(e) => setConfig({ ...config, auto_calculate: e.target.checked })}
                                    className="w-5 h-5 text-emerald-500 rounded focus:ring-emerald-500"
                                />
                                <span className="text-neutral-700">
                                    Auto-calculate EPF/ETF during payroll
                                </span>
                            </label>

                            <div className="pt-4">
                                <label className="block text-sm font-medium text-neutral-700 mb-2">
                                    Change Reason (for audit)
                                </label>
                                <input
                                    type="text"
                                    value={changeReason}
                                    onChange={(e) => setChangeReason(e.target.value)}
                                    placeholder="e.g., Annual rate revision"
                                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end mt-6">
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-50"
                    >
                        <Save className="w-5 h-5" />
                        {isSaving ? 'Saving...' : 'Save Configuration'}
                    </button>
                </div>
            </div>

            {/* History Modal */}
            {showHistoryModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
                    <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[80vh] overflow-hidden">
                        <div className="sticky top-0 bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between">
                            <h2 className="text-xl font-semibold text-neutral-800">Rate Change History</h2>
                            <button
                                onClick={() => setShowHistoryModal(false)}
                                className="p-2 hover:bg-neutral-100 rounded-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto max-h-[60vh]">
                            {history.length === 0 ? (
                                <p className="text-neutral-500 text-center py-8">No rate changes recorded yet.</p>
                            ) : (
                                <div className="space-y-4">
                                    {history.map((item) => (
                                        <div key={item.id} className="border border-neutral-200 rounded-lg p-4">
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <p className="text-sm text-neutral-500">
                                                        {new Date(item.created_at).toLocaleDateString()} at {new Date(item.created_at).toLocaleTimeString()}
                                                    </p>
                                                    {item.changed_by && (
                                                        <p className="text-xs text-neutral-400">
                                                            By: {item.changed_by.first_name} {item.changed_by.last_name}
                                                        </p>
                                                    )}
                                                </div>
                                                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                                                    Effective: {new Date(item.effective_from).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-3 gap-4 text-sm">
                                                <div>
                                                    <p className="text-neutral-500">EPF Employee</p>
                                                    <p className="font-medium">
                                                        {item.old_epf_employee_rate}% → {item.new_epf_employee_rate}%
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-neutral-500">EPF Employer</p>
                                                    <p className="font-medium">
                                                        {item.old_epf_employer_rate}% → {item.new_epf_employer_rate}%
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-neutral-500">ETF Employer</p>
                                                    <p className="font-medium">
                                                        {item.old_etf_employer_rate}% → {item.new_etf_employer_rate}%
                                                    </p>
                                                </div>
                                            </div>
                                            {item.change_reason && (
                                                <p className="mt-2 text-sm text-neutral-600 italic">
                                                    Reason: {item.change_reason}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EPFETFConfig;
