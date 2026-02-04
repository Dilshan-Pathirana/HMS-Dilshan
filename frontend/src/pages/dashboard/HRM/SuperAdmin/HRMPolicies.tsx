import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, ArrowLeft, Plus, Edit, Trash2, CheckCircle, AlertCircle } from 'lucide-react';

const HRMPolicies: React.FC = () => {
    const navigate = useNavigate();

    const policies = [
        { id: 1, name: 'Leave Policy', description: 'Annual, casual, medical, and no-pay leave rules', status: 'active', lastUpdated: '2024-01-15' },
        { id: 2, name: 'Overtime Policy', description: 'Overtime calculation, approval, and payment rules', status: 'active', lastUpdated: '2024-01-10' },
        { id: 3, name: 'Attendance Policy', description: 'Clock-in/out rules, late marks, and absences', status: 'active', lastUpdated: '2024-01-08' },
        { id: 4, name: 'Dress Code Policy', description: 'Uniform and professional attire requirements', status: 'active', lastUpdated: '2023-12-20' },
        { id: 5, name: 'Harassment Prevention Policy', description: 'Workplace harassment prevention and reporting', status: 'active', lastUpdated: '2023-11-15' },
        { id: 6, name: 'Probation Policy', description: 'Probation period rules and confirmation process', status: 'active', lastUpdated: '2023-10-01' },
    ];

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-6xl mx-auto">
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
                            <h1 className="text-2xl font-bold text-gray-800">HR Policies</h1>
                            <p className="text-gray-500">Manage system-wide HR policies and guidelines</p>
                        </div>
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600">
                        <Plus className="w-4 h-4" />
                        Add Policy
                    </button>
                </div>

                {/* Policies List */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Policy Name</th>
                                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Description</th>
                                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Status</th>
                                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Last Updated</th>
                                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {policies.map((policy) => (
                                    <tr key={policy.id} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-blue-100 rounded-lg">
                                                    <FileText className="w-4 h-4 text-blue-600" />
                                                </div>
                                                <span className="font-medium text-gray-800">{policy.name}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-gray-600">{policy.description}</td>
                                        <td className="py-4 px-6">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                policy.status === 'active' 
                                                    ? 'bg-emerald-100 text-emerald-700' 
                                                    : 'bg-gray-100 text-gray-700'
                                            }`}>
                                                {policy.status === 'active' ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-gray-500">{policy.lastUpdated}</td>
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
            </div>
        </div>
    );
};

export default HRMPolicies;
