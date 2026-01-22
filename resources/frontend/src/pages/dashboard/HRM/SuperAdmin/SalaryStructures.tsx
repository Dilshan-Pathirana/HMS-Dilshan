import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DollarSign, ArrowLeft, Plus, Edit, Trash2, Save } from 'lucide-react';

interface SalaryGrade {
    id: number;
    grade: string;
    title: string;
    minSalary: number;
    maxSalary: number;
    allowances: {
        medical: number;
        transport: number;
        housing: number;
    };
    epfApplicable: boolean;
}

const SalaryStructures: React.FC = () => {
    const navigate = useNavigate();
    const [isAddingNew, setIsAddingNew] = useState(false);

    const salaryGrades: SalaryGrade[] = [
        { id: 1, grade: 'G1', title: 'Executive / Manager', minSalary: 150000, maxSalary: 250000, allowances: { medical: 15000, transport: 10000, housing: 20000 }, epfApplicable: true },
        { id: 2, grade: 'G2', title: 'Senior Staff', minSalary: 100000, maxSalary: 150000, allowances: { medical: 10000, transport: 8000, housing: 15000 }, epfApplicable: true },
        { id: 3, grade: 'G3', title: 'Doctor', minSalary: 120000, maxSalary: 200000, allowances: { medical: 12000, transport: 10000, housing: 18000 }, epfApplicable: true },
        { id: 4, grade: 'G4', title: 'Nurse', minSalary: 60000, maxSalary: 100000, allowances: { medical: 8000, transport: 6000, housing: 10000 }, epfApplicable: true },
        { id: 5, grade: 'G5', title: 'Pharmacist', minSalary: 70000, maxSalary: 110000, allowances: { medical: 8000, transport: 6000, housing: 10000 }, epfApplicable: true },
        { id: 6, grade: 'G6', title: 'Support Staff', minSalary: 40000, maxSalary: 60000, allowances: { medical: 5000, transport: 4000, housing: 5000 }, epfApplicable: true },
        { id: 7, grade: 'G7', title: 'Trainee / Intern', minSalary: 25000, maxSalary: 40000, allowances: { medical: 3000, transport: 3000, housing: 0 }, epfApplicable: false },
    ];

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
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
                            <h1 className="text-2xl font-bold text-gray-800">Salary Structures</h1>
                            <p className="text-gray-500">Configure salary grades, pay scales, and allowances</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => setIsAddingNew(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
                    >
                        <Plus className="w-4 h-4" />
                        Add Grade
                    </button>
                </div>

                {/* Salary Grades */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Grade</th>
                                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Title</th>
                                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Salary Range (LKR)</th>
                                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Medical</th>
                                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Transport</th>
                                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Housing</th>
                                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">EPF/ETF</th>
                                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {salaryGrades.map((grade) => (
                                    <tr key={grade.id} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="py-4 px-6">
                                            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                                                {grade.grade}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 font-medium text-gray-800">{grade.title}</td>
                                        <td className="py-4 px-6 text-gray-600">
                                            {grade.minSalary.toLocaleString()} - {grade.maxSalary.toLocaleString()}
                                        </td>
                                        <td className="py-4 px-6 text-gray-600">{grade.allowances.medical.toLocaleString()}</td>
                                        <td className="py-4 px-6 text-gray-600">{grade.allowances.transport.toLocaleString()}</td>
                                        <td className="py-4 px-6 text-gray-600">{grade.allowances.housing.toLocaleString()}</td>
                                        <td className="py-4 px-6">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                grade.epfApplicable 
                                                    ? 'bg-emerald-100 text-emerald-700' 
                                                    : 'bg-gray-100 text-gray-700'
                                            }`}>
                                                {grade.epfApplicable ? 'Yes' : 'No'}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-2">
                                                <button className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
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
            </div>
        </div>
    );
};

export default SalaryStructures;
