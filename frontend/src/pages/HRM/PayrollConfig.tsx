import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from "../../utils/api/axios";
import {
    ArrowLeft,
    Save,
    RefreshCw,
    Building2,
    Clock,
    Calendar,
    Percent,
    Calculator,
    AlertCircle,
    CheckCircle,
    Info,
    Copy,
    X,
    Moon,
    FileText,
    Settings,
    Users,
    CreditCard
} from 'lucide-react';

interface Branch {
    id: string;
    center_name: string;
}

interface PayrollConfigData {
    id?: string;
    branch_id?: string | null;
    // Pay Period
    pay_period: string;
    pay_day: number;
    pay_cycle_start: string;
    // Working Hours
    standard_hours_per_day: number;
    standard_hours_per_week: number;
    standard_days_per_month: number;
    // Overtime
    overtime_rate: number;
    weekend_rate: number;
    holiday_rate: number;
    night_shift_allowance: number;
    night_shift_rate: number;
    night_shift_start: string;
    night_shift_end: string;
    max_overtime_hours_per_day: number;
    max_overtime_hours_per_week: number;
    // Attendance
    grace_period_minutes: number;
    half_day_threshold_hours: number;
    late_deduction_per_minute: number;
    absent_deduction_multiplier: number;
    // Leave
    unpaid_leave_deduction: boolean;
    unpaid_leave_rate: number;
    // Salary Components
    include_allowances_in_basic: boolean;
    include_allowances_in_epf: boolean;
    include_ot_in_epf: boolean;
    // Tax
    auto_calculate_paye: boolean;
    tax_free_threshold: number;
    // Rounding
    rounding_method: string;
    rounding_precision: number;
    // Currency
    currency_code: string;
    currency_symbol: string;
    // Payslip
    show_ytd_on_payslip: boolean;
    show_leave_balance_on_payslip: boolean;
    show_loan_balance_on_payslip: boolean;
    payslip_template: string;
    // Approval
    require_payroll_approval: boolean;
    approval_levels: number;
    // Meta
    is_active?: boolean;
    branch?: {
        id: string;
        center_name: string;
    };
}

const defaultConfig: PayrollConfigData = {
    pay_period: 'monthly',
    pay_day: 25,
    pay_cycle_start: '1',
    standard_hours_per_day: 8,
    standard_hours_per_week: 45,
    standard_days_per_month: 26,
    overtime_rate: 1.5,
    weekend_rate: 2.0,
    holiday_rate: 2.5,
    night_shift_allowance: 500,
    night_shift_rate: 1.1,
    night_shift_start: '22:00',
    night_shift_end: '06:00',
    max_overtime_hours_per_day: 4,
    max_overtime_hours_per_week: 16,
    grace_period_minutes: 15,
    half_day_threshold_hours: 4,
    late_deduction_per_minute: 0,
    absent_deduction_multiplier: 1.0,
    unpaid_leave_deduction: true,
    unpaid_leave_rate: 1.0,
    include_allowances_in_basic: false,
    include_allowances_in_epf: false,
    include_ot_in_epf: false,
    auto_calculate_paye: true,
    tax_free_threshold: 100000,
    rounding_method: 'normal',
    rounding_precision: 2,
    currency_code: 'LKR',
    currency_symbol: 'Rs.',
    show_ytd_on_payslip: true,
    show_leave_balance_on_payslip: true,
    show_loan_balance_on_payslip: true,
    payslip_template: 'default',
    require_payroll_approval: true,
    approval_levels: 2,
};

const payPeriodOptions = [
    { value: 'weekly', label: 'Weekly' },
    { value: 'bi-weekly', label: 'Bi-Weekly (Fortnightly)' },
    { value: 'monthly', label: 'Monthly' },
];

const roundingOptions = [
    { value: 'normal', label: 'Normal (0.5 up)' },
    { value: 'up', label: 'Always Round Up' },
    { value: 'down', label: 'Always Round Down' },
    { value: 'none', label: 'No Rounding' },
];

const templateOptions = [
    { value: 'default', label: 'Default Template' },
    { value: 'detailed', label: 'Detailed Template' },
    { value: 'simple', label: 'Simple Template' },
    { value: 'compact', label: 'Compact Template' },
];

const PayrollConfig: React.FC = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [selectedBranch, setSelectedBranch] = useState<string>('global');
    const [config, setConfig] = useState<PayrollConfigData>(defaultConfig);
    const [isDefault, setIsDefault] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<string>('pay-period');
    
    // Copy modal
    const [showCopyModal, setShowCopyModal] = useState(false);
    const [copyTargetBranch, setCopyTargetBranch] = useState('');

    // Calculator
    const [showCalculator, setShowCalculator] = useState(false);
    const [calcSalary, setCalcSalary] = useState(50000);
    const [calcOtHours, setCalcOtHours] = useState(10);
    const [calcResult, setCalcResult] = useState<any>(null);

    useEffect(() => {
        fetchBranches();
    }, []);

    useEffect(() => {
        fetchConfig();
    }, [selectedBranch]);

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
            const branchParam = selectedBranch !== 'global' ? `?branch_id=${selectedBranch}` : '?branch_id=global';
            const response = await api.get(`/hrm/super-admin/payroll-config${branchParam}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.status === 200) {
                const configData = response.data.config;
                setConfig({
                    ...defaultConfig,
                    ...configData,
                    night_shift_start: configData.night_shift_start?.substring(0, 5) || '22:00',
                    night_shift_end: configData.night_shift_end?.substring(0, 5) || '06:00',
                });
                setIsDefault(response.data.isDefault || false);
            }
        } catch (error) {
            console.error('Error fetching config:', error);
            setConfig(defaultConfig);
            setIsDefault(true);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setIsSaving(true);
            setError(null);
            const token = localStorage.getItem('token');
            
            await api.post('/hrm/super-admin/payroll-config', {
                ...config,
                branch_id: selectedBranch === 'global' ? '' : selectedBranch,
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            setSuccess('Payroll configuration saved successfully');
            setIsDefault(false);
            fetchConfig();
        } catch (error: any) {
            setError(error.response?.data?.message || 'Failed to save configuration');
        } finally {
            setIsSaving(false);
        }
    };

    const handleReset = async () => {
        try {
            setIsSaving(true);
            const token = localStorage.getItem('token');
            
            await api.post('/hrm/super-admin/payroll-config/reset', {
                branch_id: selectedBranch === 'global' ? '' : selectedBranch,
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            setSuccess('Configuration reset to Sri Lanka defaults');
            fetchConfig();
        } catch (error: any) {
            setError(error.response?.data?.message || 'Failed to reset configuration');
        } finally {
            setIsSaving(false);
        }
    };

    const handleCopy = async () => {
        if (!copyTargetBranch) {
            setError('Please select a target branch');
            return;
        }

        try {
            setIsSaving(true);
            const token = localStorage.getItem('token');
            
            await api.post('/hrm/super-admin/payroll-config/copy-to-branch', {
                source_branch_id: selectedBranch === 'global' ? '' : selectedBranch,
                target_branch_id: copyTargetBranch,
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            setSuccess('Configuration copied successfully');
            setShowCopyModal(false);
            setCopyTargetBranch('');
        } catch (error: any) {
            setError(error.response?.data?.message || 'Failed to copy configuration');
        } finally {
            setIsSaving(false);
        }
    };

    const calculatePreview = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await api.post('/hrm/super-admin/payroll-config/calculate', {
                branch_id: selectedBranch === 'global' ? '' : selectedBranch,
                monthly_salary: calcSalary,
                ot_hours: calcOtHours,
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (response.data.status === 200) {
                setCalcResult(response.data.calculations);
            }
        } catch (error) {
            console.error('Error calculating preview:', error);
        }
    };

    // Clear messages
    useEffect(() => {
        if (success || error) {
            const timer = setTimeout(() => {
                setSuccess(null);
                setError(null);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [success, error]);

    const tabs = [
        { id: 'pay-period', label: 'Pay Period', icon: Calendar },
        { id: 'working-hours', label: 'Working Hours', icon: Clock },
        { id: 'overtime', label: 'Overtime', icon: Percent },
        { id: 'attendance', label: 'Attendance', icon: Users },
        { id: 'components', label: 'Components', icon: CreditCard },
        { id: 'payslip', label: 'Payslip', icon: FileText },
        { id: 'approval', label: 'Approval', icon: Settings },
    ];

    return (
        <div className="min-h-screen bg-neutral-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => navigate('/super-admin/hrm')}
                                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <div>
                                <h1 className="text-2xl font-bold text-neutral-900">Payroll Configuration</h1>
                                <p className="text-sm text-neutral-500">Configure payroll settings and rules</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            <button
                                onClick={() => setShowCalculator(true)}
                                className="flex items-center px-4 py-2 text-neutral-700 bg-neutral-100 rounded-lg hover:bg-neutral-200 transition-colors"
                            >
                                <Calculator className="w-4 h-4 mr-2" />
                                Calculator
                            </button>
                            <button
                                onClick={() => setShowCopyModal(true)}
                                className="flex items-center px-4 py-2 text-neutral-700 bg-neutral-100 rounded-lg hover:bg-neutral-200 transition-colors"
                            >
                                <Copy className="w-4 h-4 mr-2" />
                                Copy to Branch
                            </button>
                            <button
                                onClick={handleReset}
                                disabled={isSaving}
                                className="flex items-center px-4 py-2 text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors"
                            >
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Reset to Defaults
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="flex items-center px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50"
                            >
                                {isSaving ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4 mr-2" />
                                        Save Configuration
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Alerts */}
            {(success || error) && (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
                    {success && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
                            <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                            <span className="text-green-700">{success}</span>
                        </div>
                    )}
                    {error && (
                        <div className="bg-error-50 border border-red-200 rounded-lg p-4 flex items-center">
                            <AlertCircle className="w-5 h-5 text-error-500 mr-3" />
                            <span className="text-red-700">{error}</span>
                        </div>
                    )}
                </div>
            )}

            {/* Branch Selector */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <Building2 className="w-5 h-5 text-neutral-400" />
                            <div>
                                <label className="block text-sm font-medium text-neutral-700">Configuration Scope</label>
                                <select
                                    value={selectedBranch}
                                    onChange={(e) => setSelectedBranch(e.target.value)}
                                    className="mt-1 px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 min-w-[250px]"
                                >
                                    <option value="global">Global (Default for all branches)</option>
                                    {branches.map(branch => (
                                        <option key={branch.id} value={branch.id}>{branch.center_name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        {isDefault && (
                            <div className="flex items-center px-3 py-1 bg-yellow-100 text-yellow-700 rounded-lg text-sm">
                                <Info className="w-4 h-4 mr-2" />
                                Using default configuration
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm border">
                        {/* Tabs */}
                        <div className="border-b px-4">
                            <div className="flex space-x-1 overflow-x-auto">
                                {tabs.map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex items-center px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                                            activeTab === tab.id
                                                ? 'border-primary-500 text-primary-500'
                                                : 'border-transparent text-neutral-500 hover:text-neutral-700'
                                        }`}
                                    >
                                        <tab.icon className="w-4 h-4 mr-2" />
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Tab Content */}
                        <div className="p-6">
                            {/* Pay Period Tab */}
                            {activeTab === 'pay-period' && (
                                <div className="space-y-6">
                                    <h3 className="text-lg font-medium text-neutral-900">Pay Period Settings</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-neutral-700 mb-1">Pay Period</label>
                                            <select
                                                value={config.pay_period}
                                                onChange={(e) => setConfig({ ...config, pay_period: e.target.value })}
                                                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                            >
                                                {payPeriodOptions.map(opt => (
                                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-neutral-700 mb-1">Pay Day (of month)</label>
                                            <input
                                                type="number"
                                                value={config.pay_day}
                                                onChange={(e) => setConfig({ ...config, pay_day: parseInt(e.target.value) || 25 })}
                                                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                                min="1"
                                                max="31"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-neutral-700 mb-1">Pay Cycle Starts On</label>
                                            <input
                                                type="text"
                                                value={config.pay_cycle_start}
                                                onChange={(e) => setConfig({ ...config, pay_cycle_start: e.target.value })}
                                                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                                placeholder="1"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-neutral-700 mb-1">Currency Code</label>
                                            <input
                                                type="text"
                                                value={config.currency_code}
                                                onChange={(e) => setConfig({ ...config, currency_code: e.target.value })}
                                                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-neutral-700 mb-1">Currency Symbol</label>
                                            <input
                                                type="text"
                                                value={config.currency_symbol}
                                                onChange={(e) => setConfig({ ...config, currency_symbol: e.target.value })}
                                                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Working Hours Tab */}
                            {activeTab === 'working-hours' && (
                                <div className="space-y-6">
                                    <h3 className="text-lg font-medium text-neutral-900">Working Hours Settings</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-neutral-700 mb-1">Standard Hours/Day</label>
                                            <input
                                                type="number"
                                                value={config.standard_hours_per_day}
                                                onChange={(e) => setConfig({ ...config, standard_hours_per_day: parseFloat(e.target.value) || 8 })}
                                                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                                step="0.5"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-neutral-700 mb-1">Standard Hours/Week</label>
                                            <input
                                                type="number"
                                                value={config.standard_hours_per_week}
                                                onChange={(e) => setConfig({ ...config, standard_hours_per_week: parseFloat(e.target.value) || 45 })}
                                                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                                step="0.5"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-neutral-700 mb-1">Working Days/Month</label>
                                            <input
                                                type="number"
                                                value={config.standard_days_per_month}
                                                onChange={(e) => setConfig({ ...config, standard_days_per_month: parseFloat(e.target.value) || 26 })}
                                                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                                step="0.5"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Overtime Tab */}
                            {activeTab === 'overtime' && (
                                <div className="space-y-6">
                                    <h3 className="text-lg font-medium text-neutral-900">Overtime Settings</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-neutral-700 mb-1">Normal OT Rate (×)</label>
                                            <input
                                                type="number"
                                                value={config.overtime_rate}
                                                onChange={(e) => setConfig({ ...config, overtime_rate: parseFloat(e.target.value) || 1.5 })}
                                                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                                step="0.1"
                                                min="1"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-neutral-700 mb-1">Weekend Rate (×)</label>
                                            <input
                                                type="number"
                                                value={config.weekend_rate}
                                                onChange={(e) => setConfig({ ...config, weekend_rate: parseFloat(e.target.value) || 2 })}
                                                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                                step="0.1"
                                                min="1"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-neutral-700 mb-1">Holiday Rate (×)</label>
                                            <input
                                                type="number"
                                                value={config.holiday_rate}
                                                onChange={(e) => setConfig({ ...config, holiday_rate: parseFloat(e.target.value) || 2.5 })}
                                                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                                step="0.1"
                                                min="1"
                                            />
                                        </div>
                                    </div>

                                    <h4 className="text-md font-medium text-neutral-900 flex items-center mt-6">
                                        <Moon className="w-4 h-4 mr-2" /> Night Shift Settings
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-neutral-700 mb-1">Night Shift Allowance ({config.currency_symbol})</label>
                                            <input
                                                type="number"
                                                value={config.night_shift_allowance}
                                                onChange={(e) => setConfig({ ...config, night_shift_allowance: parseFloat(e.target.value) || 0 })}
                                                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-neutral-700 mb-1">Night Rate (×)</label>
                                            <input
                                                type="number"
                                                value={config.night_shift_rate}
                                                onChange={(e) => setConfig({ ...config, night_shift_rate: parseFloat(e.target.value) || 1.1 })}
                                                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                                step="0.1"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-neutral-700 mb-1">Night Starts</label>
                                            <input
                                                type="time"
                                                value={config.night_shift_start}
                                                onChange={(e) => setConfig({ ...config, night_shift_start: e.target.value })}
                                                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-neutral-700 mb-1">Night Ends</label>
                                            <input
                                                type="time"
                                                value={config.night_shift_end}
                                                onChange={(e) => setConfig({ ...config, night_shift_end: e.target.value })}
                                                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-neutral-700 mb-1">Max OT Hours/Day</label>
                                            <input
                                                type="number"
                                                value={config.max_overtime_hours_per_day}
                                                onChange={(e) => setConfig({ ...config, max_overtime_hours_per_day: parseFloat(e.target.value) || 4 })}
                                                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-neutral-700 mb-1">Max OT Hours/Week</label>
                                            <input
                                                type="number"
                                                value={config.max_overtime_hours_per_week}
                                                onChange={(e) => setConfig({ ...config, max_overtime_hours_per_week: parseFloat(e.target.value) || 16 })}
                                                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Attendance Tab */}
                            {activeTab === 'attendance' && (
                                <div className="space-y-6">
                                    <h3 className="text-lg font-medium text-neutral-900">Attendance Settings</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-neutral-700 mb-1">Grace Period (minutes)</label>
                                            <input
                                                type="number"
                                                value={config.grace_period_minutes}
                                                onChange={(e) => setConfig({ ...config, grace_period_minutes: parseInt(e.target.value) || 15 })}
                                                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                            />
                                            <p className="text-xs text-neutral-500 mt-1">Allowed late arrival without deduction</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-neutral-700 mb-1">Half Day Threshold (hours)</label>
                                            <input
                                                type="number"
                                                value={config.half_day_threshold_hours}
                                                onChange={(e) => setConfig({ ...config, half_day_threshold_hours: parseInt(e.target.value) || 4 })}
                                                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                            />
                                            <p className="text-xs text-neutral-500 mt-1">Hours worked to count as half day</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-neutral-700 mb-1">Late Deduction/Minute ({config.currency_symbol})</label>
                                            <input
                                                type="number"
                                                value={config.late_deduction_per_minute}
                                                onChange={(e) => setConfig({ ...config, late_deduction_per_minute: parseFloat(e.target.value) || 0 })}
                                                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-neutral-700 mb-1">Absent Deduction (× daily rate)</label>
                                            <input
                                                type="number"
                                                value={config.absent_deduction_multiplier}
                                                onChange={(e) => setConfig({ ...config, absent_deduction_multiplier: parseFloat(e.target.value) || 1 })}
                                                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                                step="0.1"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                                        <div>
                                            <p className="font-medium text-neutral-900">Deduct for Unpaid Leave</p>
                                            <p className="text-sm text-neutral-500">Automatically deduct salary for unpaid leave days</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={config.unpaid_leave_deduction}
                                                onChange={(e) => setConfig({ ...config, unpaid_leave_deduction: e.target.checked })}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                                        </label>
                                    </div>
                                </div>
                            )}

                            {/* Components Tab */}
                            {activeTab === 'components' && (
                                <div className="space-y-6">
                                    <h3 className="text-lg font-medium text-neutral-900">Salary Component Settings</h3>
                                    
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                                            <div>
                                                <p className="font-medium text-neutral-900">Include Allowances in Basic</p>
                                                <p className="text-sm text-neutral-500">Merge allowances into basic salary</p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={config.include_allowances_in_basic}
                                                    onChange={(e) => setConfig({ ...config, include_allowances_in_basic: e.target.checked })}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                                            </label>
                                        </div>

                                        <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                                            <div>
                                                <p className="font-medium text-neutral-900">Include Allowances in EPF Calculation</p>
                                                <p className="text-sm text-neutral-500">Apply EPF contribution on allowances</p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={config.include_allowances_in_epf}
                                                    onChange={(e) => setConfig({ ...config, include_allowances_in_epf: e.target.checked })}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                                            </label>
                                        </div>

                                        <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                                            <div>
                                                <p className="font-medium text-neutral-900">Include OT in EPF Calculation</p>
                                                <p className="text-sm text-neutral-500">Apply EPF contribution on overtime pay</p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={config.include_ot_in_epf}
                                                    onChange={(e) => setConfig({ ...config, include_ot_in_epf: e.target.checked })}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                                            </label>
                                        </div>

                                        <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                                            <div>
                                                <p className="font-medium text-neutral-900">Auto Calculate PAYE Tax</p>
                                                <p className="text-sm text-neutral-500">Automatically calculate income tax</p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={config.auto_calculate_paye}
                                                    onChange={(e) => setConfig({ ...config, auto_calculate_paye: e.target.checked })}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                                            </label>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                                        <div>
                                            <label className="block text-sm font-medium text-neutral-700 mb-1">Tax Free Threshold ({config.currency_symbol})</label>
                                            <input
                                                type="number"
                                                value={config.tax_free_threshold}
                                                onChange={(e) => setConfig({ ...config, tax_free_threshold: parseFloat(e.target.value) || 100000 })}
                                                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                            />
                                            <p className="text-xs text-neutral-500 mt-1">Monthly income below this is tax-free</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-neutral-700 mb-1">Rounding Method</label>
                                            <select
                                                value={config.rounding_method}
                                                onChange={(e) => setConfig({ ...config, rounding_method: e.target.value })}
                                                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                            >
                                                {roundingOptions.map(opt => (
                                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Payslip Tab */}
                            {activeTab === 'payslip' && (
                                <div className="space-y-6">
                                    <h3 className="text-lg font-medium text-neutral-900">Payslip Settings</h3>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-neutral-700 mb-1">Payslip Template</label>
                                        <select
                                            value={config.payslip_template}
                                            onChange={(e) => setConfig({ ...config, payslip_template: e.target.value })}
                                            className="w-full max-w-md px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                        >
                                            {templateOptions.map(opt => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                                            <div>
                                                <p className="font-medium text-neutral-900">Show YTD on Payslip</p>
                                                <p className="text-sm text-neutral-500">Display year-to-date totals</p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={config.show_ytd_on_payslip}
                                                    onChange={(e) => setConfig({ ...config, show_ytd_on_payslip: e.target.checked })}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                                            </label>
                                        </div>

                                        <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                                            <div>
                                                <p className="font-medium text-neutral-900">Show Leave Balance on Payslip</p>
                                                <p className="text-sm text-neutral-500">Display remaining leave days</p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={config.show_leave_balance_on_payslip}
                                                    onChange={(e) => setConfig({ ...config, show_leave_balance_on_payslip: e.target.checked })}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                                            </label>
                                        </div>

                                        <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                                            <div>
                                                <p className="font-medium text-neutral-900">Show Loan Balance on Payslip</p>
                                                <p className="text-sm text-neutral-500">Display outstanding loan amounts</p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={config.show_loan_balance_on_payslip}
                                                    onChange={(e) => setConfig({ ...config, show_loan_balance_on_payslip: e.target.checked })}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Approval Tab */}
                            {activeTab === 'approval' && (
                                <div className="space-y-6">
                                    <h3 className="text-lg font-medium text-neutral-900">Approval Settings</h3>
                                    
                                    <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                                        <div>
                                            <p className="font-medium text-neutral-900">Require Payroll Approval</p>
                                            <p className="text-sm text-neutral-500">Payroll must be approved before processing</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={config.require_payroll_approval}
                                                onChange={(e) => setConfig({ ...config, require_payroll_approval: e.target.checked })}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                                        </label>
                                    </div>

                                    {config.require_payroll_approval && (
                                        <div className="max-w-md">
                                            <label className="block text-sm font-medium text-neutral-700 mb-1">Number of Approval Levels</label>
                                            <input
                                                type="number"
                                                value={config.approval_levels}
                                                onChange={(e) => setConfig({ ...config, approval_levels: parseInt(e.target.value) || 1 })}
                                                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                                min="1"
                                                max="5"
                                            />
                                            <p className="text-xs text-neutral-500 mt-1">Number of approvers required (1-5)</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Calculator Modal */}
            {showCalculator && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-3">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <Calculator className="w-5 h-5 text-primary-500" />
                                </div>
                                <h3 className="text-lg font-bold text-neutral-900">Salary Calculator</h3>
                            </div>
                            <button onClick={() => setShowCalculator(false)} className="p-1 hover:bg-neutral-100 rounded">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">Monthly Salary ({config.currency_symbol})</label>
                                <input
                                    type="number"
                                    value={calcSalary}
                                    onChange={(e) => setCalcSalary(parseInt(e.target.value) || 0)}
                                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">OT Hours</label>
                                <input
                                    type="number"
                                    value={calcOtHours}
                                    onChange={(e) => setCalcOtHours(parseInt(e.target.value) || 0)}
                                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                                />
                            </div>
                            <button
                                onClick={calculatePreview}
                                className="w-full py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
                            >
                                Calculate
                            </button>

                            {calcResult && (
                                <div className="mt-4 p-4 bg-neutral-50 rounded-lg space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-neutral-600">Daily Rate:</span>
                                        <span className="font-medium">{config.currency_symbol} {calcResult.daily_rate?.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-neutral-600">Hourly Rate:</span>
                                        <span className="font-medium">{config.currency_symbol} {calcResult.hourly_rate?.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-neutral-600">OT Amount:</span>
                                        <span className="font-medium">{config.currency_symbol} {calcResult.normal_ot_amount?.toLocaleString()}</span>
                                    </div>
                                    <div className="border-t pt-2 flex justify-between">
                                        <span className="font-medium text-neutral-900">Total OT:</span>
                                        <span className="font-bold text-primary-500">{config.currency_symbol} {calcResult.total_ot?.toLocaleString()}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Copy Modal */}
            {showCopyModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                        <div className="flex items-center space-x-4 mb-4">
                            <div className="p-3 bg-purple-100 rounded-full">
                                <Copy className="w-6 h-6 text-purple-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-neutral-900">Copy Configuration</h3>
                                <p className="text-sm text-neutral-500">Copy to another branch</p>
                            </div>
                        </div>

                        <div className="mb-6">
                            <p className="text-sm text-neutral-600 mb-4">
                                Copy configuration from <strong>{selectedBranch === 'global' ? 'Global' : branches.find(b => b.id === selectedBranch)?.center_name}</strong> to:
                            </p>
                            <select
                                value={copyTargetBranch}
                                onChange={(e) => setCopyTargetBranch(e.target.value)}
                                className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                            >
                                <option value="">Select target branch...</option>
                                {branches.filter(b => b.id !== selectedBranch).map(branch => (
                                    <option key={branch.id} value={branch.id}>{branch.center_name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => {
                                    setShowCopyModal(false);
                                    setCopyTargetBranch('');
                                }}
                                className="px-4 py-2 text-neutral-700 bg-neutral-100 rounded-lg hover:bg-neutral-200"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCopy}
                                disabled={isSaving || !copyTargetBranch}
                                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                            >
                                {isSaving ? 'Copying...' : 'Copy'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PayrollConfig;
