import React, { useState, useEffect } from 'react';
import api from "../../../../../utils/api/axios";
import { X } from 'lucide-react';

interface ResignationModalProps {
    isOpen: boolean;
    userId: string;
    userName: string;
    onClose: () => void;
    onSuccess: () => void;
}

interface ResignationReasons {
    [key: string]: string;
}

const ResignationModal: React.FC<ResignationModalProps> = ({
    isOpen,
    userId,
    userName,
    onClose,
    onSuccess,
}) => {
    const [reasons, setReasons] = useState<ResignationReasons>({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [formData, setFormData] = useState({
        resignation_date: new Date().toISOString().split('T')[0],
        last_working_date: '',
        reason: '',
        reason_details: '',
        final_salary: '',
        pending_leaves_payment: '0',
        deductions: '0',
        notes: '',
    });

    useEffect(() => {
        if (isOpen) {
            fetchReasons();
            // Set default last working date to 30 days from now
            const defaultLastDate = new Date();
            defaultLastDate.setDate(defaultLastDate.getDate() + 30);
            setFormData(prev => ({
                ...prev,
                last_working_date: defaultLastDate.toISOString().split('T')[0],
            }));
        }
    }, [isOpen]);

    const fetchReasons = async () => {
        // Use static reasons instead of failing API call
        setReasons({
            personal_reasons: 'Personal Reasons',
            better_opportunity: 'Better Job Opportunity',
            relocation: 'Relocation',
            health_issues: 'Health Issues',
            family_reasons: 'Family Reasons',
            career_change: 'Career Change',
            retirement: 'Retirement',
            termination: 'Termination by Employer',
            contract_end: 'Contract End',
            misconduct: 'Misconduct',
            performance_issues: 'Performance Issues',
            other: 'Other',
        });
    };

    const calculateTotalPay = (): number => {
        const finalSalary = parseFloat(formData.final_salary) || 0;
        const pendingLeaves = parseFloat(formData.pending_leaves_payment) || 0;
        const deductions = parseFloat(formData.deductions) || 0;
        return finalSalary + pendingLeaves - deductions;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const token = localStorage.getItem('token');
            const payload = {
                user_id: userId,
                ...formData,
                final_salary: parseFloat(formData.final_salary) || 0,
                pending_leaves_payment: parseFloat(formData.pending_leaves_payment) || 0,
                deductions: parseFloat(formData.deductions) || 0,
            };

            await api.post('http://127.0.0.1:8000/api/resignations', payload, {
                headers: { Authorization: `Bearer ${token}` },
            });

            setSuccess(true);
            setTimeout(() => {
                onSuccess();
                onClose();
                setSuccess(false);
                resetForm();
            }, 1500);
        } catch (err: any) {
            const errorMessage = err.response?.data?.errors
                ? Object.values(err.response.data.errors).flat().join(', ')
                : err.response?.data?.message || 'Failed to create resignation record';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            resignation_date: new Date().toISOString().split('T')[0],
            last_working_date: '',
            reason: '',
            reason_details: '',
            final_salary: '',
            pending_leaves_payment: '0',
            deductions: '0',
            notes: '',
        });
        setError(null);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Record Resignation / Termination</h2>
                        <p className="text-sm text-gray-500 mt-1">For: {userName}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {success && (
                        <div className="p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg flex items-center gap-2">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span className="font-medium">Resignation recorded successfully!</span>
                        </div>
                    )}

                    {error && (
                        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                            {error}
                        </div>
                    )}

                    {/* Dates Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Resignation Date *
                            </label>
                            <input
                                type="date"
                                required
                                value={formData.resignation_date}
                                onChange={(e) => setFormData({ ...formData, resignation_date: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Last Working Date *
                            </label>
                            <input
                                type="date"
                                required
                                value={formData.last_working_date}
                                onChange={(e) => setFormData({ ...formData, last_working_date: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* Reason Section */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Reason for Leaving *
                        </label>
                        <select
                            required
                            value={formData.reason}
                            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="">Select a reason...</option>
                            {Object.entries(reasons).map(([key, label]) => (
                                <option key={key} value={key}>
                                    {label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Additional Details
                        </label>
                        <textarea
                            value={formData.reason_details}
                            onChange={(e) => setFormData({ ...formData, reason_details: e.target.value })}
                            rows={2}
                            placeholder="Provide additional details about the reason..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Financial Section */}
                    <div className="border-t pt-4 mt-4">
                        <h3 className="text-lg font-semibold text-gray-800 mb-3">Final Pay Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Final Salary (Rs.) *
                                </label>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    step="0.01"
                                    value={formData.final_salary}
                                    onChange={(e) => setFormData({ ...formData, final_salary: e.target.value })}
                                    placeholder="0.00"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Pending Leaves Payment (Rs.)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={formData.pending_leaves_payment}
                                    onChange={(e) => setFormData({ ...formData, pending_leaves_payment: e.target.value })}
                                    placeholder="0.00"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Deductions (Rs.)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={formData.deductions}
                                    onChange={(e) => setFormData({ ...formData, deductions: e.target.value })}
                                    placeholder="0.00"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        {/* Total Calculation */}
                        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                            <div className="flex justify-between items-center">
                                <span className="font-semibold text-gray-700">Total Final Pay:</span>
                                <span className="text-2xl font-bold text-blue-600">
                                    LKR {calculateTotalPay().toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Notes Section */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Additional Notes
                        </label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            rows={3}
                            placeholder="Any additional notes or comments..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Processing...
                                </>
                            ) : (
                                'Record Resignation'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ResignationModal;
