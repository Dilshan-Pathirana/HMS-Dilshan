import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    DollarSign,
    Plus,
    Search,
    Edit,
    Trash2,
    Eye,
    AlertCircle,
    CheckCircle,
    X,
    Save,
    ArrowLeft,
    TrendingUp,
    Briefcase,
    Clock,
    Building2,
    Copy
} from 'lucide-react';

interface Branch {
    id: string;
    center_name: string;
    center_type?: string;
    division?: string;
}

interface SalaryStructure {
    id: string;
    branch_id: string | null;
    grade_code: string;
    title: string;
    description: string;
    min_salary: number;
    max_salary: number;
    // Basic Allowances
    medical_allowance: number;
    transport_allowance: number;
    housing_allowance: number;
    meal_allowance: number;
    other_allowance: number;
    // Extended Allowances
    q_pay: number;
    cost_of_living: number;
    uniform_allowance: number;
    cola_allowance: number;
    attendance_allowance: number;
    telephone_allowance: number;
    professional_allowance: number;
    shift_allowance: number;
    night_duty_allowance: number;
    on_call_allowance: number;
    // Bonuses
    annual_bonus: number;
    performance_bonus: number;
    festival_bonus: number;
    incentive_bonus: number;
    commission_rate: number;
    // Statutory
    epf_applicable: boolean;
    etf_applicable: boolean;
    paye_applicable: boolean;
    // Deductions
    welfare_fund: number;
    insurance_deduction: number;
    max_salary_advance: number;
    max_loan_amount: number;
    // Overtime
    overtime_rate_multiplier: number;
    holiday_rate_multiplier: number;
    status: 'Active' | 'Inactive';
    total_allowances?: number;
    total_bonuses?: number;
    total_deductions?: number;
    average_salary?: number;
    created_at: string;
    updated_at: string;
    branch?: {
        id: string;
        center_name: string;
    };
    creator?: {
        first_name: string;
        last_name: string;
        email: string;
    };
}

interface Stats {
    total: number;
    active: number;
    inactive: number;
    avg_min_salary: number;
    avg_max_salary: number;
    highest_grade: string | null;
    lowest_grade: string | null;
}

const SalaryStructures: React.FC = () => {
    const navigate = useNavigate();
    const [structures, setStructures] = useState<SalaryStructure[]>([]);
    const [filteredStructures, setFilteredStructures] = useState<SalaryStructure[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [selectedBranch, setSelectedBranch] = useState<string>('all');
    const [stats, setStats] = useState<Stats>({
        total: 0, active: 0, inactive: 0,
        avg_min_salary: 0, avg_max_salary: 0,
        highest_grade: null, lowest_grade: null
    });
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [showModal, setShowModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [showCopyModal, setShowCopyModal] = useState(false);
    const [selectedStructure, setSelectedStructure] = useState<SalaryStructure | null>(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copyTargetBranch, setCopyTargetBranch] = useState<string>('');

    const [formData, setFormData] = useState({
        branch_id: '',
        grade_code: '',
        title: '',
        description: '',
        min_salary: '',
        max_salary: '',
        // Basic Allowances
        medical_allowance: '0',
        transport_allowance: '0',
        housing_allowance: '0',
        meal_allowance: '0',
        other_allowance: '0',
        // Extended Allowances
        q_pay: '0',
        cost_of_living: '0',
        uniform_allowance: '0',
        cola_allowance: '0',
        attendance_allowance: '0',
        telephone_allowance: '0',
        professional_allowance: '0',
        shift_allowance: '0',
        night_duty_allowance: '0',
        on_call_allowance: '0',
        // Bonuses
        annual_bonus: '0',
        performance_bonus: '0',
        festival_bonus: '0',
        incentive_bonus: '0',
        commission_rate: '0',
        // Statutory
        epf_applicable: true,
        etf_applicable: true,
        paye_applicable: false,
        // Deductions
        welfare_fund: '0',
        insurance_deduction: '0',
        max_salary_advance: '0',
        max_loan_amount: '0',
        // Overtime
        overtime_rate_multiplier: '1.50',
        holiday_rate_multiplier: '2.00',
        status: 'Active'
    });

    useEffect(() => {
        fetchBranches();
    }, []);

    useEffect(() => {
        fetchStructures();
        fetchStats();
    }, [selectedBranch]);

    useEffect(() => {
        filterStructures();
    }, [structures, searchTerm, selectedStatus]);

    const fetchBranches = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('/api/hrm/super-admin/salary-structures/branches', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.status === 200) {
                setBranches(response.data.branches);
            }
        } catch (error) {
            console.error('Error fetching branches:', error);
        }
    };

    const fetchStructures = async () => {
        try {
            setIsLoading(true);
            const token = localStorage.getItem('token');
            const params: any = {};
            if (selectedBranch !== 'all') {
                params.branch_id = selectedBranch;
            }
            const response = await axios.get('/api/hrm/super-admin/salary-structures', {
                headers: { Authorization: `Bearer ${token}` },
                params
            });
            if (response.data.status === 200) {
                setStructures(response.data.structures);
            }
        } catch (error) {
            console.error('Error fetching salary structures:', error);
            setError('Failed to load salary structures');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const token = localStorage.getItem('token');
            const params: any = {};
            if (selectedBranch !== 'all') {
                params.branch_id = selectedBranch;
            }
            const response = await axios.get('/api/hrm/super-admin/salary-structures/stats', {
                headers: { Authorization: `Bearer ${token}` },
                params
            });
            if (response.data.status === 200) {
                setStats(response.data.stats);
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const filterStructures = () => {
        let filtered = [...structures];

        if (searchTerm) {
            filtered = filtered.filter(s =>
                s.grade_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (s.description && s.description.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }

        if (selectedStatus !== 'all') {
            filtered = filtered.filter(s => s.status === selectedStatus);
        }

        setFilteredStructures(filtered);
    };

    const handleCreateStructure = () => {
        setIsEditMode(false);
        setFormData({
            branch_id: selectedBranch !== 'all' ? selectedBranch : '',
            grade_code: '',
            title: '',
            description: '',
            min_salary: '',
            max_salary: '',
            // Basic Allowances
            medical_allowance: '0',
            transport_allowance: '0',
            housing_allowance: '0',
            meal_allowance: '0',
            other_allowance: '0',
            // Extended Allowances
            q_pay: '0',
            cost_of_living: '0',
            uniform_allowance: '0',
            cola_allowance: '0',
            attendance_allowance: '0',
            telephone_allowance: '0',
            professional_allowance: '0',
            shift_allowance: '0',
            night_duty_allowance: '0',
            on_call_allowance: '0',
            // Bonuses
            annual_bonus: '0',
            performance_bonus: '0',
            festival_bonus: '0',
            incentive_bonus: '0',
            commission_rate: '0',
            // Statutory
            epf_applicable: true,
            etf_applicable: true,
            paye_applicable: false,
            // Deductions
            welfare_fund: '0',
            insurance_deduction: '0',
            max_salary_advance: '0',
            max_loan_amount: '0',
            // Overtime
            overtime_rate_multiplier: '1.50',
            holiday_rate_multiplier: '2.00',
            status: 'Active'
        });
        setShowModal(true);
    };

    const handleEditStructure = (structure: SalaryStructure) => {
        setIsEditMode(true);
        setSelectedStructure(structure);
        setFormData({
            branch_id: structure.branch_id || '',
            grade_code: structure.grade_code,
            title: structure.title,
            description: structure.description || '',
            min_salary: structure.min_salary.toString(),
            max_salary: structure.max_salary.toString(),
            // Basic Allowances
            medical_allowance: (structure.medical_allowance || 0).toString(),
            transport_allowance: (structure.transport_allowance || 0).toString(),
            housing_allowance: (structure.housing_allowance || 0).toString(),
            meal_allowance: (structure.meal_allowance || 0).toString(),
            other_allowance: (structure.other_allowance || 0).toString(),
            // Extended Allowances
            q_pay: (structure.q_pay || 0).toString(),
            cost_of_living: (structure.cost_of_living || 0).toString(),
            uniform_allowance: (structure.uniform_allowance || 0).toString(),
            cola_allowance: (structure.cola_allowance || 0).toString(),
            attendance_allowance: (structure.attendance_allowance || 0).toString(),
            telephone_allowance: (structure.telephone_allowance || 0).toString(),
            professional_allowance: (structure.professional_allowance || 0).toString(),
            shift_allowance: (structure.shift_allowance || 0).toString(),
            night_duty_allowance: (structure.night_duty_allowance || 0).toString(),
            on_call_allowance: (structure.on_call_allowance || 0).toString(),
            // Bonuses
            annual_bonus: (structure.annual_bonus || 0).toString(),
            performance_bonus: (structure.performance_bonus || 0).toString(),
            festival_bonus: (structure.festival_bonus || 0).toString(),
            incentive_bonus: (structure.incentive_bonus || 0).toString(),
            commission_rate: (structure.commission_rate || 0).toString(),
            // Statutory
            epf_applicable: structure.epf_applicable,
            etf_applicable: structure.etf_applicable,
            paye_applicable: structure.paye_applicable || false,
            // Deductions
            welfare_fund: (structure.welfare_fund || 0).toString(),
            insurance_deduction: (structure.insurance_deduction || 0).toString(),
            max_salary_advance: (structure.max_salary_advance || 0).toString(),
            max_loan_amount: (structure.max_loan_amount || 0).toString(),
            // Overtime
            overtime_rate_multiplier: structure.overtime_rate_multiplier.toString(),
            holiday_rate_multiplier: structure.holiday_rate_multiplier.toString(),
            status: structure.status
        });
        setShowModal(true);
    };

    const handleViewStructure = (structure: SalaryStructure) => {
        setSelectedStructure(structure);
        setShowViewModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        try {
            const token = localStorage.getItem('token');
            const url = isEditMode
                ? `/api/hrm/super-admin/salary-structures/${selectedStructure?.id}`
                : '/api/hrm/super-admin/salary-structures';

            const method = isEditMode ? 'put' : 'post';

            const payload = {
                ...formData,
                branch_id: formData.branch_id || null,
                // Salary Range
                min_salary: parseFloat(formData.min_salary),
                max_salary: parseFloat(formData.max_salary),
                // Basic Allowances
                medical_allowance: parseFloat(formData.medical_allowance),
                transport_allowance: parseFloat(formData.transport_allowance),
                housing_allowance: parseFloat(formData.housing_allowance),
                meal_allowance: parseFloat(formData.meal_allowance),
                other_allowance: parseFloat(formData.other_allowance),
                // Extended Allowances
                q_pay: parseFloat(formData.q_pay),
                cost_of_living: parseFloat(formData.cost_of_living),
                uniform_allowance: parseFloat(formData.uniform_allowance),
                cola_allowance: parseFloat(formData.cola_allowance),
                attendance_allowance: parseFloat(formData.attendance_allowance),
                telephone_allowance: parseFloat(formData.telephone_allowance),
                professional_allowance: parseFloat(formData.professional_allowance),
                shift_allowance: parseFloat(formData.shift_allowance),
                night_duty_allowance: parseFloat(formData.night_duty_allowance),
                on_call_allowance: parseFloat(formData.on_call_allowance),
                // Bonuses
                annual_bonus: parseFloat(formData.annual_bonus),
                performance_bonus: parseFloat(formData.performance_bonus),
                festival_bonus: parseFloat(formData.festival_bonus),
                incentive_bonus: parseFloat(formData.incentive_bonus),
                commission_rate: parseFloat(formData.commission_rate),
                // Deductions
                welfare_fund: parseFloat(formData.welfare_fund),
                insurance_deduction: parseFloat(formData.insurance_deduction),
                max_salary_advance: parseFloat(formData.max_salary_advance),
                max_loan_amount: parseFloat(formData.max_loan_amount),
                // Overtime Rates
                overtime_rate_multiplier: parseFloat(formData.overtime_rate_multiplier),
                holiday_rate_multiplier: parseFloat(formData.holiday_rate_multiplier),
            };

            const response = await axios[method](url, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.status === 200 || response.data.status === 201) {
                setShowModal(false);
                fetchStructures();
                fetchStats();
            }
        } catch (error: any) {
            console.error('Error saving salary structure:', error);
            if (error.response?.data?.errors) {
                const errors = Object.values(error.response.data.errors).flat();
                setError(errors.join(', '));
            } else {
                setError('Failed to save salary structure');
            }
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this salary structure?')) return;

        try {
            const token = localStorage.getItem('token');
            await axios.delete(`/api/hrm/super-admin/salary-structures/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchStructures();
            fetchStats();
        } catch (error) {
            console.error('Error deleting salary structure:', error);
            setError('Failed to delete salary structure');
        }
    };

    const handleCopyToBranch = async () => {
        if (!copyTargetBranch) {
            setError('Please select a target branch');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await axios.post('/api/hrm/super-admin/salary-structures/copy-to-branch', {
                source_branch_id: selectedBranch !== 'all' ? selectedBranch : null,
                target_branch_id: copyTargetBranch
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.status === 200) {
                setShowCopyModal(false);
                setCopyTargetBranch('');
                alert(response.data.message);
                fetchStructures();
                fetchStats();
            }
        } catch (error: any) {
            console.error('Error copying structures:', error);
            setError(error.response?.data?.message || 'Failed to copy salary structures');
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

    const getStatusBadge = (status: string) => {
        const colors = status === 'Active'
            ? 'bg-green-100 text-green-800'
            : 'bg-gray-100 text-gray-800';
        return (
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors}`}>
                {status}
            </span>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            {/* Header */}
            <div className="mb-6">
                <button
                    onClick={() => navigate('/super-admin/hrm')}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Dashboard
                </button>
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl">
                            <DollarSign className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">Salary Structures</h1>
                            <p className="text-sm text-gray-500">Configure salary grades, pay scales, and allowances per branch</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {selectedBranch !== 'all' && structures.length > 0 && (
                            <button
                                onClick={() => setShowCopyModal(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-all"
                            >
                                <Copy className="w-5 h-5" />
                                Copy to Branch
                            </button>
                        )}
                        <button
                            onClick={handleCreateStructure}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg hover:from-emerald-600 hover:to-emerald-700 transition-all"
                        >
                            <Plus className="w-5 h-5" />
                            Add Grade
                        </button>
                    </div>
                </div>
            </div>

            {/* Branch Selector */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
                <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-gray-500" />
                        <span className="font-medium text-gray-700">Select Branch:</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setSelectedBranch('all')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                selectedBranch === 'all'
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            All Branches
                        </button>
                        {branches.map((branch) => (
                            <button
                                key={branch.id}
                                onClick={() => setSelectedBranch(branch.id)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                    selectedBranch === branch.id
                                        ? 'bg-emerald-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                {branch.center_name}
                            </button>
                        ))}
                    </div>
                </div>
                {selectedBranch !== 'all' && (
                    <p className="mt-2 text-sm text-gray-500">
                        Showing salary structures for: <span className="font-medium text-emerald-600">
                            {branches.find(b => b.id === selectedBranch)?.center_name}
                        </span>
                    </p>
                )}
            </div>

            {/* Error Alert */}
            {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
                    <AlertCircle className="w-5 h-5" />
                    {error}
                    <button onClick={() => setError(null)} className="ml-auto">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Total Grades</p>
                            <p className="text-2xl font-bold text-gray-800 mt-1">{stats.total}</p>
                        </div>
                        <Briefcase className="w-8 h-8 text-blue-500" />
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Active</p>
                            <p className="text-2xl font-bold text-green-600 mt-1">{stats.active}</p>
                        </div>
                        <CheckCircle className="w-8 h-8 text-green-500" />
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Avg Min Salary</p>
                            <p className="text-2xl font-bold text-emerald-600 mt-1">
                                {formatCurrency(stats.avg_min_salary)}
                            </p>
                        </div>
                        <TrendingUp className="w-8 h-8 text-emerald-500" />
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Avg Max Salary</p>
                            <p className="text-2xl font-bold text-purple-600 mt-1">
                                {formatCurrency(stats.avg_max_salary)}
                            </p>
                        </div>
                        <DollarSign className="w-8 h-8 text-purple-500" />
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by grade code or title..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        />
                    </div>
                    <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    >
                        <option value="all">All Status</option>
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                    </select>
                </div>
            </div>

            {/* Salary Structures Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Grade
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Title
                                </th>
                                {selectedBranch === 'all' && (
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Branch
                                    </th>
                                )}
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Salary Range (LKR)
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Allowances
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    EPF/ETF
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={selectedBranch === 'all' ? 8 : 7} className="px-6 py-8 text-center text-gray-500">
                                        Loading salary structures...
                                    </td>
                                </tr>
                            ) : filteredStructures.length === 0 ? (
                                <tr>
                                    <td colSpan={selectedBranch === 'all' ? 8 : 7} className="px-6 py-8 text-center text-gray-500">
                                        No salary structures found
                                    </td>
                                </tr>
                            ) : (
                                filteredStructures.map((structure) => (
                                    <tr key={structure.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                                                {structure.grade_code}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div>
                                                <div className="font-medium text-gray-900">{structure.title}</div>
                                                {structure.description && (
                                                    <div className="text-sm text-gray-500 line-clamp-1">
                                                        {structure.description}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        {selectedBranch === 'all' && (
                                            <td className="px-6 py-4">
                                                <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                                                    {structure.branch?.center_name || 'Global'}
                                                </span>
                                            </td>
                                        )}
                                        <td className="px-6 py-4 text-gray-600">
                                            {formatCurrency(structure.min_salary)} - {formatCurrency(structure.max_salary)}
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            {formatCurrency(structure.total_allowances || 0)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-1">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                    structure.epf_applicable
                                                        ? 'bg-emerald-100 text-emerald-700'
                                                        : 'bg-gray-100 text-gray-700'
                                                }`}>
                                                    EPF {structure.epf_applicable ? '✓' : '✗'}
                                                </span>
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                    structure.etf_applicable
                                                        ? 'bg-emerald-100 text-emerald-700'
                                                        : 'bg-gray-100 text-gray-700'
                                                }`}>
                                                    ETF {structure.etf_applicable ? '✓' : '✗'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {getStatusBadge(structure.status)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleViewStructure(structure)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="View"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleEditStructure(structure)}
                                                    className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(structure.id)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-2">
                        <DollarSign className="w-5 h-5 text-blue-600" />
                        <h3 className="font-semibold text-blue-800">Basic Salary</h3>
                    </div>
                    <p className="text-sm text-blue-700">
                        Basic salary is used as the base for EPF/ETF calculations and overtime rates.
                    </p>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-2">
                        <DollarSign className="w-5 h-5 text-emerald-600" />
                        <h3 className="font-semibold text-emerald-800">Allowances</h3>
                    </div>
                    <p className="text-sm text-emerald-700">
                        Allowances are fixed monthly additions not subject to EPF/ETF deductions.
                    </p>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-2">
                        <DollarSign className="w-5 h-5 text-purple-600" />
                        <h3 className="font-semibold text-purple-800">EPF/ETF</h3>
                    </div>
                    <p className="text-sm text-purple-700">
                        Statutory contributions: EPF 8%+12%, ETF 3% (employer only).
                    </p>
                </div>
            </div>

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
                    <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                            <h2 className="text-xl font-semibold text-gray-800">
                                {isEditMode ? 'Edit Salary Grade' : 'Create New Salary Grade'}
                            </h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {/* Branch Selection */}
                            <div className="bg-purple-50 rounded-lg p-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <Building2 className="w-4 h-4 inline mr-2" />
                                    Assign to Branch
                                </label>
                                <select
                                    value={formData.branch_id}
                                    onChange={(e) => setFormData({ ...formData, branch_id: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                >
                                    <option value="">Global (All Branches)</option>
                                    {branches.map((branch) => (
                                        <option key={branch.id} value={branch.id}>
                                            {branch.center_name}
                                        </option>
                                    ))}
                                </select>
                                <p className="mt-1 text-xs text-gray-500">
                                    Leave as "Global" to apply this salary grade to all branches, or select a specific branch.
                                </p>
                            </div>

                            {/* Basic Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Grade Code *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.grade_code}
                                        onChange={(e) => setFormData({ ...formData, grade_code: e.target.value.toUpperCase() })}
                                        placeholder="e.g., G1, G2"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                        required
                                        maxLength={10}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Status *
                                    </label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                        required
                                    >
                                        <option value="Active">Active</option>
                                        <option value="Inactive">Inactive</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Title *
                                </label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="e.g., Senior Doctor, Staff Nurse"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Description
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={2}
                                    placeholder="Job roles covered by this grade..."
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                />
                            </div>

                            {/* Salary Range */}
                            <div className="bg-gray-50 rounded-lg p-4">
                                <h3 className="text-sm font-semibold text-gray-700 mb-3">Salary Range (LKR)</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">
                                            Minimum Salary *
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.min_salary}
                                            onChange={(e) => setFormData({ ...formData, min_salary: e.target.value })}
                                            placeholder="e.g., 50000"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                            required
                                            min={0}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">
                                            Maximum Salary *
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.max_salary}
                                            onChange={(e) => setFormData({ ...formData, max_salary: e.target.value })}
                                            placeholder="e.g., 100000"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                            required
                                            min={0}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Basic Allowances */}
                            <div className="bg-emerald-50 rounded-lg p-4">
                                <h3 className="text-sm font-semibold text-gray-700 mb-3">Basic Monthly Allowances (LKR)</h3>
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">Medical</label>
                                        <input
                                            type="number"
                                            value={formData.medical_allowance}
                                            onChange={(e) => setFormData({ ...formData, medical_allowance: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                            min={0}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">Transport</label>
                                        <input
                                            type="number"
                                            value={formData.transport_allowance}
                                            onChange={(e) => setFormData({ ...formData, transport_allowance: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                            min={0}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">Housing</label>
                                        <input
                                            type="number"
                                            value={formData.housing_allowance}
                                            onChange={(e) => setFormData({ ...formData, housing_allowance: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                            min={0}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">Meal/Food</label>
                                        <input
                                            type="number"
                                            value={formData.meal_allowance}
                                            onChange={(e) => setFormData({ ...formData, meal_allowance: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                            min={0}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">Other</label>
                                        <input
                                            type="number"
                                            value={formData.other_allowance}
                                            onChange={(e) => setFormData({ ...formData, other_allowance: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                            min={0}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Extended Allowances */}
                            <div className="bg-teal-50 rounded-lg p-4">
                                <h3 className="text-sm font-semibold text-gray-700 mb-3">Extended Allowances (LKR)</h3>
                                <div className="grid grid-cols-4 gap-3">
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">Q Pay</label>
                                        <input
                                            type="number"
                                            value={formData.q_pay}
                                            onChange={(e) => setFormData({ ...formData, q_pay: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                                            min={0}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">Cost of Living</label>
                                        <input
                                            type="number"
                                            value={formData.cost_of_living}
                                            onChange={(e) => setFormData({ ...formData, cost_of_living: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                                            min={0}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">Uniform</label>
                                        <input
                                            type="number"
                                            value={formData.uniform_allowance}
                                            onChange={(e) => setFormData({ ...formData, uniform_allowance: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                                            min={0}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">COLA</label>
                                        <input
                                            type="number"
                                            value={formData.cola_allowance}
                                            onChange={(e) => setFormData({ ...formData, cola_allowance: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                                            min={0}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">Attendance</label>
                                        <input
                                            type="number"
                                            value={formData.attendance_allowance}
                                            onChange={(e) => setFormData({ ...formData, attendance_allowance: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                                            min={0}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">Telephone</label>
                                        <input
                                            type="number"
                                            value={formData.telephone_allowance}
                                            onChange={(e) => setFormData({ ...formData, telephone_allowance: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                                            min={0}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">Professional</label>
                                        <input
                                            type="number"
                                            value={formData.professional_allowance}
                                            onChange={(e) => setFormData({ ...formData, professional_allowance: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                                            min={0}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">Shift</label>
                                        <input
                                            type="number"
                                            value={formData.shift_allowance}
                                            onChange={(e) => setFormData({ ...formData, shift_allowance: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                                            min={0}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">Night Duty</label>
                                        <input
                                            type="number"
                                            value={formData.night_duty_allowance}
                                            onChange={(e) => setFormData({ ...formData, night_duty_allowance: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                                            min={0}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">On-Call</label>
                                        <input
                                            type="number"
                                            value={formData.on_call_allowance}
                                            onChange={(e) => setFormData({ ...formData, on_call_allowance: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                                            min={0}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Bonuses */}
                            <div className="bg-amber-50 rounded-lg p-4">
                                <h3 className="text-sm font-semibold text-gray-700 mb-3">Bonuses & Incentives (LKR)</h3>
                                <div className="grid grid-cols-5 gap-3">
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">Annual Bonus</label>
                                        <input
                                            type="number"
                                            value={formData.annual_bonus}
                                            onChange={(e) => setFormData({ ...formData, annual_bonus: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                                            min={0}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">Performance</label>
                                        <input
                                            type="number"
                                            value={formData.performance_bonus}
                                            onChange={(e) => setFormData({ ...formData, performance_bonus: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                                            min={0}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">Festival (Avurudu)</label>
                                        <input
                                            type="number"
                                            value={formData.festival_bonus}
                                            onChange={(e) => setFormData({ ...formData, festival_bonus: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                                            min={0}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">Incentive</label>
                                        <input
                                            type="number"
                                            value={formData.incentive_bonus}
                                            onChange={(e) => setFormData({ ...formData, incentive_bonus: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                                            min={0}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">Commission %</label>
                                        <input
                                            type="number"
                                            value={formData.commission_rate}
                                            onChange={(e) => setFormData({ ...formData, commission_rate: e.target.value })}
                                            step="0.5"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                                            min={0}
                                            max={100}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Deductions & Limits */}
                            <div className="bg-rose-50 rounded-lg p-4">
                                <h3 className="text-sm font-semibold text-gray-700 mb-3">Deductions & Limits (LKR)</h3>
                                <div className="grid grid-cols-4 gap-3">
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">Welfare Fund</label>
                                        <input
                                            type="number"
                                            value={formData.welfare_fund}
                                            onChange={(e) => setFormData({ ...formData, welfare_fund: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent text-sm"
                                            min={0}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">Insurance</label>
                                        <input
                                            type="number"
                                            value={formData.insurance_deduction}
                                            onChange={(e) => setFormData({ ...formData, insurance_deduction: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent text-sm"
                                            min={0}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">Max Salary Advance</label>
                                        <input
                                            type="number"
                                            value={formData.max_salary_advance}
                                            onChange={(e) => setFormData({ ...formData, max_salary_advance: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent text-sm"
                                            min={0}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">Max Loan Amount</label>
                                        <input
                                            type="number"
                                            value={formData.max_loan_amount}
                                            onChange={(e) => setFormData({ ...formData, max_loan_amount: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent text-sm"
                                            min={0}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Statutory & Overtime */}
                            <div className="bg-purple-50 rounded-lg p-4">
                                <h3 className="text-sm font-semibold text-gray-700 mb-3">Statutory & Overtime</h3>
                                <div className="grid grid-cols-3 gap-4 mb-4">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.epf_applicable}
                                            onChange={(e) => setFormData({ ...formData, epf_applicable: e.target.checked })}
                                            className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500"
                                        />
                                        <span className="text-sm text-gray-700">EPF (8% + 12%)</span>
                                    </label>
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.etf_applicable}
                                            onChange={(e) => setFormData({ ...formData, etf_applicable: e.target.checked })}
                                            className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500"
                                        />
                                        <span className="text-sm text-gray-700">ETF (3%)</span>
                                    </label>
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.paye_applicable}
                                            onChange={(e) => setFormData({ ...formData, paye_applicable: e.target.checked })}
                                            className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500"
                                        />
                                        <span className="text-sm text-gray-700">PAYE Tax</span>
                                    </label>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">
                                            Overtime Multiplier
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.overtime_rate_multiplier}
                                            onChange={(e) => setFormData({ ...formData, overtime_rate_multiplier: e.target.value })}
                                            step="0.25"
                                            min="1"
                                            max="5"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">
                                            Holiday Multiplier
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.holiday_rate_multiplier}
                                            onChange={(e) => setFormData({ ...formData, holiday_rate_multiplier: e.target.value })}
                                            step="0.25"
                                            min="1"
                                            max="5"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="submit"
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg hover:from-emerald-600 hover:to-emerald-700 transition-all"
                                >
                                    <Save className="w-5 h-5" />
                                    {isEditMode ? 'Update Grade' : 'Create Grade'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* View Modal */}
            {showViewModal && selectedStructure && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
                    <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-bold">
                                    {selectedStructure.grade_code}
                                </span>
                                <h2 className="text-xl font-semibold text-gray-800">{selectedStructure.title}</h2>
                            </div>
                            <button
                                onClick={() => setShowViewModal(false)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-6">
                            {/* Branch Info */}
                            <div className="flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-purple-500" />
                                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                                    {selectedStructure.branch?.center_name || 'Global (All Branches)'}
                                </span>
                            </div>

                            {selectedStructure.description && (
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500 mb-1">Description</h3>
                                    <p className="text-gray-700">{selectedStructure.description}</p>
                                </div>
                            )}

                            {/* Salary Range */}
                            <div className="bg-gray-50 rounded-lg p-4">
                                <h3 className="text-sm font-semibold text-gray-700 mb-3">Salary Range</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-500">Minimum</p>
                                        <p className="text-xl font-bold text-gray-800">
                                            {formatCurrency(selectedStructure.min_salary)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Maximum</p>
                                        <p className="text-xl font-bold text-gray-800">
                                            {formatCurrency(selectedStructure.max_salary)}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Basic Allowances */}
                            <div className="bg-emerald-50 rounded-lg p-4">
                                <h3 className="text-sm font-semibold text-gray-700 mb-3">Basic Monthly Allowances</h3>
                                <div className="grid grid-cols-3 gap-4 text-sm">
                                    <div>
                                        <p className="text-gray-500">Medical</p>
                                        <p className="font-medium text-gray-800">{formatCurrency(selectedStructure.medical_allowance)}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">Transport</p>
                                        <p className="font-medium text-gray-800">{formatCurrency(selectedStructure.transport_allowance)}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">Housing</p>
                                        <p className="font-medium text-gray-800">{formatCurrency(selectedStructure.housing_allowance)}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">Meal/Food</p>
                                        <p className="font-medium text-gray-800">{formatCurrency(selectedStructure.meal_allowance)}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">Other</p>
                                        <p className="font-medium text-gray-800">{formatCurrency(selectedStructure.other_allowance)}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">Total Allowances</p>
                                        <p className="font-bold text-emerald-700">{formatCurrency(selectedStructure.total_allowances || 0)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Extended Allowances */}
                            <div className="bg-teal-50 rounded-lg p-4">
                                <h3 className="text-sm font-semibold text-gray-700 mb-3">Extended Allowances</h3>
                                <div className="grid grid-cols-5 gap-3 text-sm">
                                    <div>
                                        <p className="text-gray-500">Q Pay</p>
                                        <p className="font-medium text-gray-800">{formatCurrency(selectedStructure.q_pay || 0)}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">Cost of Living</p>
                                        <p className="font-medium text-gray-800">{formatCurrency(selectedStructure.cost_of_living || 0)}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">Uniform</p>
                                        <p className="font-medium text-gray-800">{formatCurrency(selectedStructure.uniform_allowance || 0)}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">COLA</p>
                                        <p className="font-medium text-gray-800">{formatCurrency(selectedStructure.cola_allowance || 0)}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">Attendance</p>
                                        <p className="font-medium text-gray-800">{formatCurrency(selectedStructure.attendance_allowance || 0)}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">Telephone</p>
                                        <p className="font-medium text-gray-800">{formatCurrency(selectedStructure.telephone_allowance || 0)}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">Professional</p>
                                        <p className="font-medium text-gray-800">{formatCurrency(selectedStructure.professional_allowance || 0)}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">Shift</p>
                                        <p className="font-medium text-gray-800">{formatCurrency(selectedStructure.shift_allowance || 0)}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">Night Duty</p>
                                        <p className="font-medium text-gray-800">{formatCurrency(selectedStructure.night_duty_allowance || 0)}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">On-Call</p>
                                        <p className="font-medium text-gray-800">{formatCurrency(selectedStructure.on_call_allowance || 0)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Bonuses */}
                            <div className="bg-amber-50 rounded-lg p-4">
                                <h3 className="text-sm font-semibold text-gray-700 mb-3">Bonuses & Incentives</h3>
                                <div className="grid grid-cols-5 gap-3 text-sm">
                                    <div>
                                        <p className="text-gray-500">Annual</p>
                                        <p className="font-medium text-gray-800">{formatCurrency(selectedStructure.annual_bonus || 0)}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">Performance</p>
                                        <p className="font-medium text-gray-800">{formatCurrency(selectedStructure.performance_bonus || 0)}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">Festival</p>
                                        <p className="font-medium text-gray-800">{formatCurrency(selectedStructure.festival_bonus || 0)}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">Incentive</p>
                                        <p className="font-medium text-gray-800">{formatCurrency(selectedStructure.incentive_bonus || 0)}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">Commission</p>
                                        <p className="font-medium text-gray-800">{selectedStructure.commission_rate || 0}%</p>
                                    </div>
                                </div>
                                <div className="mt-3 pt-3 border-t border-amber-200">
                                    <p className="text-gray-500 text-sm">Total Bonuses</p>
                                    <p className="font-bold text-amber-700">{formatCurrency(selectedStructure.total_bonuses || 0)}</p>
                                </div>
                            </div>

                            {/* Deductions & Limits */}
                            <div className="bg-rose-50 rounded-lg p-4">
                                <h3 className="text-sm font-semibold text-gray-700 mb-3">Deductions & Limits</h3>
                                <div className="grid grid-cols-4 gap-3 text-sm">
                                    <div>
                                        <p className="text-gray-500">Welfare Fund</p>
                                        <p className="font-medium text-gray-800">{formatCurrency(selectedStructure.welfare_fund || 0)}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">Insurance</p>
                                        <p className="font-medium text-gray-800">{formatCurrency(selectedStructure.insurance_deduction || 0)}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">Max Advance</p>
                                        <p className="font-medium text-gray-800">{formatCurrency(selectedStructure.max_salary_advance || 0)}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">Max Loan</p>
                                        <p className="font-medium text-gray-800">{formatCurrency(selectedStructure.max_loan_amount || 0)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Statutory */}
                            <div className="bg-purple-50 rounded-lg p-4">
                                <h3 className="text-sm font-semibold text-gray-700 mb-3">Statutory & Overtime</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex items-center gap-2">
                                        {selectedStructure.epf_applicable ? (
                                            <CheckCircle className="w-5 h-5 text-green-500" />
                                        ) : (
                                            <X className="w-5 h-5 text-gray-400" />
                                        )}
                                        <span className="text-sm text-gray-700">EPF (8% + 12%)</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {selectedStructure.etf_applicable ? (
                                            <CheckCircle className="w-5 h-5 text-green-500" />
                                        ) : (
                                            <X className="w-5 h-5 text-gray-400" />
                                        )}
                                        <span className="text-sm text-gray-700">ETF (3%)</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {selectedStructure.paye_applicable ? (
                                            <CheckCircle className="w-5 h-5 text-green-500" />
                                        ) : (
                                            <X className="w-5 h-5 text-gray-400" />
                                        )}
                                        <span className="text-sm text-gray-700">PAYE Tax</span>
                                    </div>
                                    <div></div>
                                    <div>
                                        <p className="text-sm text-gray-500">Overtime Rate</p>
                                        <p className="font-medium text-gray-800">{selectedStructure.overtime_rate_multiplier}x</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Holiday Rate</p>
                                        <p className="font-medium text-gray-800">{selectedStructure.holiday_rate_multiplier}x</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-gray-200">
                                <button
                                    onClick={() => {
                                        setShowViewModal(false);
                                        handleEditStructure(selectedStructure);
                                    }}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg hover:from-emerald-600 hover:to-emerald-700 transition-all"
                                >
                                    <Edit className="w-5 h-5" />
                                    Edit Grade
                                </button>
                                <button
                                    onClick={() => setShowViewModal(false)}
                                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Copy to Branch Modal */}
            {showCopyModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
                        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Copy className="w-5 h-5 text-blue-600" />
                                <h2 className="text-xl font-semibold text-gray-800">Copy Salary Structures</h2>
                            </div>
                            <button
                                onClick={() => {
                                    setShowCopyModal(false);
                                    setCopyTargetBranch('');
                                }}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="bg-blue-50 rounded-lg p-4">
                                <p className="text-sm text-blue-700">
                                    <strong>Source:</strong> {selectedBranch !== 'all' 
                                        ? branches.find(b => b.id === selectedBranch)?.center_name 
                                        : 'Global structures'}
                                </p>
                                <p className="text-sm text-blue-600 mt-1">
                                    {structures.length} salary grade(s) will be copied to the selected branch.
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Select Target Branch *
                                </label>
                                <select
                                    value={copyTargetBranch}
                                    onChange={(e) => setCopyTargetBranch(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                >
                                    <option value="">-- Select Branch --</option>
                                    {branches
                                        .filter(b => b.id !== selectedBranch)
                                        .map((branch) => (
                                            <option key={branch.id} value={branch.id}>
                                                {branch.center_name}
                                            </option>
                                        ))}
                                </select>
                            </div>

                            <p className="text-xs text-gray-500">
                                Note: Existing grade codes in the target branch will be skipped.
                            </p>

                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={handleCopyToBranch}
                                    disabled={!copyTargetBranch}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Copy className="w-5 h-5" />
                                    Copy Structures
                                </button>
                                <button
                                    onClick={() => {
                                        setShowCopyModal(false);
                                        setCopyTargetBranch('');
                                    }}
                                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SalaryStructures;
