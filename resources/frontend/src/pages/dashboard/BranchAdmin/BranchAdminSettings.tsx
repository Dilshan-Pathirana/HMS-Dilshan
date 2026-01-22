import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../../components/common/Layout/DashboardLayout';
import { BranchAdminSidebar } from '../../../components/common/Layout/BranchAdminSidebar';
import { 
    ChevronDown, ChevronRight, Users,
    Building2, Shield, HeartPulse, CalendarClock, DollarSign,
    CreditCard, Package, Wrench, FileSpreadsheet, Bell,
    Lock, Globe, Database, Zap, Languages, Save, X,
    CheckCircle, AlertCircle, Info, Search, Settings
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SettingCategory {
    id: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    color: string;
    settings: SettingItem[];
}

interface SettingItem {
    id: string;
    label: string;
    type: 'text' | 'select' | 'toggle' | 'number' | 'textarea' | 'date' | 'time';
    value: any;
    options?: string[];
    description?: string;
}

const settingCategories: SettingCategory[] = [
    {
        id: 'organization',
        title: 'Organization & Hospital Profile',
        description: 'Hospital name, logo, registration, and financial year settings',
        icon: <Building2 className="w-6 h-6" />,
        color: 'from-blue-500 to-cyan-600',
        settings: [
            { id: 'hospital_name', label: 'Hospital Name', type: 'text', value: 'City Hospital Branch A' },
            { id: 'registration_moh', label: 'MoH Registration Number', type: 'text', value: 'MOH/2023/1234' },
            { id: 'tax_id', label: 'Tax Identification Number', type: 'text', value: 'TIN123456789' },
            { id: 'currency', label: 'Default Currency', type: 'select', value: 'LKR', options: ['LKR', 'USD', 'EUR'] },
            { id: 'financial_year', label: 'Financial Year Start', type: 'select', value: 'January', options: ['January', 'April', 'July'] },
            { id: 'timezone', label: 'Time Zone', type: 'select', value: 'Asia/Colombo', options: ['Asia/Colombo', 'UTC', 'GMT'] },
            { id: 'working_hours', label: 'Working Hours', type: 'text', value: '08:00 - 18:00' },
        ]
    },
    {
        id: 'security',
        title: 'User, Role & Security Settings',
        description: 'User management, role-based access control, and security policies',
        icon: <Shield className="w-6 h-6" />,
        color: 'from-green-500 to-emerald-600',
        settings: [
            { id: 'mfa_enabled', label: 'Multi-Factor Authentication', type: 'toggle', value: true },
            { id: 'password_min_length', label: 'Minimum Password Length', type: 'number', value: 8 },
            { id: 'password_expiry', label: 'Password Expiry (days)', type: 'number', value: 90 },
            { id: 'session_timeout', label: 'Session Timeout (minutes)', type: 'number', value: 30 },
            { id: 'login_attempts', label: 'Max Login Attempts', type: 'number', value: 3 },
            { id: 'audit_log_retention', label: 'Audit Log Retention (days)', type: 'number', value: 365 },
        ]
    },
    {
        id: 'clinical',
        title: 'Patient & Clinical Settings',
        description: 'Patient ID formats, clinical codes, and medical record settings',
        icon: <HeartPulse className="w-6 h-6" />,
        color: 'from-teal-500 to-cyan-600',
        settings: [
            { id: 'patient_id_format', label: 'Patient ID Format', type: 'text', value: 'PAT-{YYYY}-{NNNN}' },
            { id: 'opd_number_format', label: 'OPD Number Format', type: 'text', value: 'OPD-{YYYY}-{NNNN}' },
            { id: 'ipd_number_format', label: 'IPD Number Format', type: 'text', value: 'IPD-{YYYY}-{NNNN}' },
            { id: 'icd10_enabled', label: 'Enable ICD-10 Diagnosis Codes', type: 'toggle', value: true },
            { id: 'consent_form_language', label: 'Default Consent Form Language', type: 'select', value: 'English', options: ['English', 'Sinhala', 'Tamil'] },
            { id: 'medical_record_lock', label: 'Auto-lock Medical Records (hours)', type: 'number', value: 24 },
        ]
    },
    {
        id: 'appointments',
        title: 'Appointment & Scheduling',
        description: 'Clinic timings, doctor availability, and queue management',
        icon: <CalendarClock className="w-6 h-6" />,
        color: 'from-purple-500 to-violet-600',
        settings: [
            { id: 'default_slot_duration', label: 'Default Slot Duration (minutes)', type: 'number', value: 15 },
            { id: 'max_patients_per_session', label: 'Max Patients per Session', type: 'number', value: 30 },
            { id: 'allow_walkin', label: 'Allow Walk-in Patients', type: 'toggle', value: true },
            { id: 'telemedicine_enabled', label: 'Enable Telemedicine', type: 'toggle', value: false },
            { id: 'advance_booking_days', label: 'Advance Booking Limit (days)', type: 'number', value: 30 },
            { id: 'cancellation_hours', label: 'Cancellation Notice (hours)', type: 'number', value: 24 },
        ]
    },
    {
        id: 'billing',
        title: 'Billing & Financial Settings',
        description: 'Pricing, discounts, payment modes, and credit limits',
        icon: <DollarSign className="w-6 h-6" />,
        color: 'from-emerald-500 to-green-600',
        settings: [
            { id: 'consultation_fee', label: 'Standard Consultation Fee (LKR)', type: 'number', value: 2000 },
            { id: 'allow_discounts', label: 'Allow Discounts', type: 'toggle', value: true },
            { id: 'max_discount_percent', label: 'Maximum Discount (%)', type: 'number', value: 20 },
            { id: 'credit_limit', label: 'Credit Limit (LKR)', type: 'number', value: 50000 },
            { id: 'partial_payment', label: 'Allow Partial Payments', type: 'toggle', value: true },
            { id: 'advance_payment', label: 'Require Advance for IPD', type: 'toggle', value: true },
        ]
    },
    {
        id: 'insurance',
        title: 'Insurance & Corporate Billing',
        description: 'Insurance companies, TPA settings, and claim management',
        icon: <CreditCard className="w-6 h-6" />,
        color: 'from-amber-500 to-orange-600',
        settings: [
            { id: 'auto_claim_submission', label: 'Auto Claim Submission', type: 'toggle', value: false },
            { id: 'preauth_required', label: 'Require Pre-authorization', type: 'toggle', value: true },
            { id: 'claim_settlement_days', label: 'Expected Settlement (days)', type: 'number', value: 30 },
            { id: 'default_copay', label: 'Default Co-pay (%)', type: 'number', value: 10 },
            { id: 'insurance_grace_period', label: 'Policy Grace Period (days)', type: 'number', value: 30 },
        ]
    },
    {
        id: 'statutory',
        title: 'Statutory & Tax Settings (Sri Lanka)',
        description: 'EPF, ETF, PAYE, VAT, and compliance settings',
        icon: <FileSpreadsheet className="w-6 h-6" />,
        color: 'from-red-500 to-pink-600',
        settings: [
            { id: 'epf_employee_rate', label: 'EPF Employee Contribution (%)', type: 'number', value: 8 },
            { id: 'epf_employer_rate', label: 'EPF Employer Contribution (%)', type: 'number', value: 12 },
            { id: 'etf_rate', label: 'ETF Rate (%)', type: 'number', value: 3 },
            { id: 'paye_enabled', label: 'Enable PAYE Deduction', type: 'toggle', value: true },
            { id: 'vat_enabled', label: 'Enable VAT', type: 'toggle', value: false },
            { id: 'statutory_payment_day', label: 'Monthly Payment Day', type: 'number', value: 15 },
        ]
    },
    {
        id: 'payroll',
        title: 'HR & Payroll Settings',
        description: 'Salary components, leave policies, and attendance rules',
        icon: <Users className="w-6 h-6" />,
        color: 'from-cyan-500 to-blue-600',
        settings: [
            { id: 'payroll_cycle', label: 'Payroll Cycle', type: 'select', value: 'Monthly', options: ['Monthly', 'Bi-weekly', 'Weekly'] },
            { id: 'overtime_rate', label: 'Overtime Rate Multiplier', type: 'number', value: 1.5 },
            { id: 'annual_leave_days', label: 'Annual Leave Days', type: 'number', value: 14 },
            { id: 'sick_leave_days', label: 'Sick Leave Days', type: 'number', value: 7 },
            { id: 'late_grace_period', label: 'Late Grace Period (minutes)', type: 'number', value: 15 },
            { id: 'advance_salary_limit', label: 'Advance Salary Limit (%)', type: 'number', value: 50 },
        ]
    },
    {
        id: 'pharmacy',
        title: 'Pharmacy & Inventory',
        description: 'Stock management, reorder levels, and supplier settings',
        icon: <Package className="w-6 h-6" />,
        color: 'from-pink-500 to-rose-600',
        settings: [
            { id: 'batch_tracking', label: 'Enable Batch Tracking', type: 'toggle', value: true },
            { id: 'expiry_alert_days', label: 'Expiry Alert (days before)', type: 'number', value: 90 },
            { id: 'reorder_point', label: 'Default Reorder Point', type: 'number', value: 50 },
            { id: 'controlled_drug_flag', label: 'Mark Controlled Drugs', type: 'toggle', value: true },
            { id: 'price_variance_tolerance', label: 'Price Variance Tolerance (%)', type: 'number', value: 10 },
            { id: 'stock_valuation_method', label: 'Stock Valuation Method', type: 'select', value: 'FIFO', options: ['FIFO', 'LIFO', 'Weighted Average'] },
        ]
    },
    {
        id: 'assets',
        title: 'Asset & Equipment Management',
        description: 'Asset tracking, depreciation, and maintenance schedules',
        icon: <Wrench className="w-6 h-6" />,
        color: 'from-indigo-500 to-purple-600',
        settings: [
            { id: 'depreciation_method', label: 'Depreciation Method', type: 'select', value: 'Straight Line', options: ['Straight Line', 'Declining Balance', 'Units of Production'] },
            { id: 'maintenance_alert_days', label: 'Maintenance Alert (days)', type: 'number', value: 30 },
            { id: 'calibration_required', label: 'Require Calibration Tracking', type: 'toggle', value: true },
            { id: 'warranty_tracking', label: 'Enable Warranty Tracking', type: 'toggle', value: true },
            { id: 'asset_inspection_frequency', label: 'Inspection Frequency (months)', type: 'number', value: 6 },
        ]
    },
    {
        id: 'notifications',
        title: 'Communication & Notifications',
        description: 'SMS, email alerts, and appointment reminders',
        icon: <Bell className="w-6 h-6" />,
        color: 'from-yellow-500 to-amber-600',
        settings: [
            { id: 'sms_enabled', label: 'Enable SMS Notifications', type: 'toggle', value: true },
            { id: 'email_enabled', label: 'Enable Email Notifications', type: 'toggle', value: true },
            { id: 'appointment_reminder_hours', label: 'Appointment Reminder (hours)', type: 'number', value: 24 },
            { id: 'payment_reminder_days', label: 'Payment Reminder (days)', type: 'number', value: 7 },
            { id: 'lab_result_alert', label: 'Critical Lab Result Alert', type: 'toggle', value: true },
            { id: 'statutory_deadline_alert', label: 'Statutory Deadline Alerts', type: 'toggle', value: true },
        ]
    },
    {
        id: 'system',
        title: 'System & Technical Settings',
        description: 'Backup schedules, data retention, and API integrations',
        icon: <Database className="w-6 h-6" />,
        color: 'from-gray-600 to-slate-700',
        settings: [
            { id: 'backup_frequency', label: 'Backup Frequency', type: 'select', value: 'Daily', options: ['Hourly', 'Daily', 'Weekly'] },
            { id: 'data_retention_years', label: 'Data Retention (years)', type: 'number', value: 7 },
            { id: 'encryption_enabled', label: 'Enable Data Encryption', type: 'toggle', value: true },
            { id: 'api_rate_limit', label: 'API Rate Limit (requests/min)', type: 'number', value: 100 },
            { id: 'log_level', label: 'System Log Level', type: 'select', value: 'Info', options: ['Debug', 'Info', 'Warning', 'Error'] },
        ]
    },
    {
        id: 'localization',
        title: 'Localization & Customization',
        description: 'Language, date formats, and branding settings',
        icon: <Languages className="w-6 h-6" />,
        color: 'from-teal-500 to-green-600',
        settings: [
            { id: 'default_language', label: 'Default Language', type: 'select', value: 'English', options: ['English', 'Sinhala', 'Tamil'] },
            { id: 'date_format', label: 'Date Format', type: 'select', value: 'DD/MM/YYYY', options: ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'] },
            { id: 'number_format', label: 'Number Format', type: 'select', value: '1,234.56', options: ['1,234.56', '1.234,56', '1234.56'] },
            { id: 'invoice_footer', label: 'Invoice Footer Text', type: 'textarea', value: 'Thank you for choosing our hospital.' },
            { id: 'report_branding', label: 'Show Hospital Logo on Reports', type: 'toggle', value: true },
        ]
    },
];

export const BranchAdminSettings: React.FC = () => {
    const navigate = useNavigate();
    const [userName, setUserName] = useState('');
    const [branchName, setBranchName] = useState('');
    const [userGender, setUserGender] = useState('');
    const [profileImage, setProfileImage] = useState('');
    const [expandedCategories, setExpandedCategories] = useState<string[]>(['organization']);
    const [searchQuery, setSearchQuery] = useState('');
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

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

    const handleSaveSettings = () => {
        // Implement save logic here
        setSaveSuccess(true);
        setHasUnsavedChanges(false);
        setTimeout(() => setSaveSuccess(false), 3000);
    };

    const filteredCategories = settingCategories.filter(category => {
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return category.title.toLowerCase().includes(query) || 
                   category.description.toLowerCase().includes(query) ||
                   category.settings.some(s => s.label.toLowerCase().includes(query));
        }
        return true;
    });

    const renderSettingInput = (setting: SettingItem) => {
        switch (setting.type) {
            case 'text':
                return (
                    <input
                        type="text"
                        value={setting.value}
                        onChange={() => setHasUnsavedChanges(true)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                );
            case 'number':
                return (
                    <input
                        type="number"
                        value={setting.value}
                        onChange={() => setHasUnsavedChanges(true)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                );
            case 'select':
                return (
                    <select
                        value={setting.value}
                        onChange={() => setHasUnsavedChanges(true)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    >
                        {setting.options?.map(option => (
                            <option key={option} value={option}>{option}</option>
                        ))}
                    </select>
                );
            case 'toggle':
                return (
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={setting.value}
                            onChange={() => setHasUnsavedChanges(true)}
                            className="sr-only peer"
                        />
                        <div className="w-14 h-7 bg-gray-300 peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-500"></div>
                    </label>
                );
            case 'textarea':
                return (
                    <textarea
                        value={setting.value}
                        onChange={() => setHasUnsavedChanges(true)}
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                );
            default:
                return null;
        }
    };

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
                            <h1 className="text-2xl font-bold">System Settings</h1>
                            <p className="text-emerald-100 mt-1">Branch Admin - {branchName}</p>
                        </div>
                        <div className="flex items-center gap-3">
                            {hasUnsavedChanges && (
                                <div className="flex items-center gap-2 px-4 py-2 bg-white/20 text-white rounded-lg">
                                    <AlertCircle className="w-5 h-5" />
                                    <span className="text-sm font-medium">Unsaved changes</span>
                                </div>
                            )}
                            <div className="text-right">
                                <p className="text-emerald-100 text-sm">Today's Date</p>
                                <p className="text-xl font-semibold">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search settings..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        />
                    </div>
                </div>

                {/* Success Message */}
                {saveSuccess && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="text-green-700 font-medium">Settings saved successfully!</span>
                    </div>
                )}

                {/* Settings Categories */}
                <div className="space-y-4">
                    {filteredCategories.map((category) => (
                        <div key={category.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            {/* Category Header */}
                            <button
                                onClick={() => toggleCategory(category.id)}
                                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gradient-to-r hover:from-green-50 hover:to-cyan-50 transition-colors"
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
                                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-sm font-medium rounded-full">
                                        {category.settings.length} settings
                                    </span>
                                    {expandedCategories.includes(category.id) ? (
                                        <ChevronDown className="w-5 h-5 text-gray-400" />
                                    ) : (
                                        <ChevronRight className="w-5 h-5 text-gray-400" />
                                    )}
                                </div>
                            </button>

                            {/* Category Settings */}
                            {expandedCategories.includes(category.id) && (
                                <div className="border-t border-gray-100">
                                    <div className="p-6 bg-gradient-to-r from-green-50 to-cyan-50">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {category.settings.map((setting) => (
                                                <div key={setting.id} className="bg-white rounded-lg p-4 border border-gray-200">
                                                    <div className="flex items-start justify-between mb-3">
                                                        <div className="flex-1">
                                                            <label className="block text-sm font-semibold text-gray-700 mb-1">
                                                                {setting.label}
                                                            </label>
                                                            {setting.description && (
                                                                <p className="text-xs text-gray-500 mb-2">{setting.description}</p>
                                                            )}
                                                        </div>
                                                        {setting.type !== 'toggle' && setting.type !== 'textarea' && (
                                                            <Info className="w-4 h-4 text-gray-400 ml-2" />
                                                        )}
                                                    </div>
                                                    {renderSettingInput(setting)}
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
                        <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">No settings found</h3>
                        <p className="text-gray-500">Try adjusting your search criteria</p>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="sticky bottom-6 bg-white rounded-xl p-4 shadow-lg border border-gray-200 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Lock className="w-4 h-4" />
                        <span>Settings are role-controlled, versioned, and auditable</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setHasUnsavedChanges(false)}
                            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                        >
                            <X className="w-5 h-5" />
                            Cancel
                        </button>
                        <button
                            onClick={handleSaveSettings}
                            className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-cyan-600 text-white rounded-lg hover:from-emerald-600 hover:to-cyan-700 transition-all flex items-center gap-2 shadow-md"
                        >
                            <Save className="w-5 h-5" />
                            Save Changes
                        </button>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};
