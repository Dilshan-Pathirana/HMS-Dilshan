import React from 'react';
import {
    DollarSign,
    FileText,
    Activity,
    Pill,
    Check,
    AlertCircle
} from 'lucide-react';
import { ConsultationDiagnosis, Prescription, CONSULTATION_FEE_OPTIONS } from './types';

interface ConsultationFeeStepProps {
    consultationFee: number;
    setConsultationFee: (fee: number) => void;
    clinicalNotes: string;
    setClinicalNotes: (notes: string) => void;
    followUpInstructions: string;
    setFollowUpInstructions: (instructions: string) => void;
    diagnoses: ConsultationDiagnosis[];
    prescriptions: Prescription[];
}

const ConsultationFeeStep: React.FC<ConsultationFeeStepProps> = ({
    consultationFee,
    setConsultationFee,
    clinicalNotes,
    setClinicalNotes,
    followUpInstructions,
    setFollowUpInstructions,
    diagnoses,
    prescriptions
}) => {
    const [customFee, setCustomFee] = React.useState<string>('');
    const [showCustom, setShowCustom] = React.useState(false);

    const handleFeeSelect = (fee: number) => {
        setConsultationFee(fee);
        setShowCustom(false);
        setCustomFee('');
    };

    const handleCustomFee = () => {
        const fee = parseFloat(customFee);
        if (!isNaN(fee) && fee >= 0) {
            setConsultationFee(fee);
        }
    };

    const isPresetSelected = (fee: number) => {
        return !showCustom && consultationFee === fee;
    };

    return (
        <div className="p-6 space-y-6">
            <div>
                <h2 className="text-xl font-bold text-neutral-800">Fee & Summary</h2>
                <p className="text-neutral-500">
                    Set the consultation fee and add any final notes
                </p>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Diagnoses Summary */}
                <div className="bg-neutral-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <Activity className="w-5 h-5 text-primary-500" />
                        <h3 className="font-semibold text-neutral-800">Diagnoses ({diagnoses.length})</h3>
                    </div>
                    {diagnoses.length === 0 ? (
                        <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-3 rounded-lg">
                            <AlertCircle className="w-4 h-4" />
                            <span className="text-sm">No diagnoses added</span>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {diagnoses.map((d, i) => (
                                <div key={i} className="flex items-center gap-2 text-sm">
                                    <span className={`w-2 h-2 rounded-full ${
                                        d.diagnosis_type === 'primary' ? 'bg-primary-500' :
                                        d.diagnosis_type === 'secondary' ? 'bg-purple-500' : 'bg-amber-500'
                                    }`} />
                                    <span className="capitalize text-neutral-500">{d.diagnosis_type}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Prescriptions Summary */}
                <div className="bg-neutral-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <Pill className="w-5 h-5 text-green-600" />
                        <h3 className="font-semibold text-neutral-800">Prescriptions ({prescriptions.length})</h3>
                    </div>
                    {prescriptions.length === 0 ? (
                        <p className="text-sm text-neutral-500">No medicines prescribed</p>
                    ) : (
                        <div className="space-y-2">
                            {prescriptions.slice(0, 5).map((p, i) => (
                                <p key={i} className="text-sm text-neutral-700">
                                    • {p.medicine_name} {p.potency}
                                </p>
                            ))}
                            {prescriptions.length > 5 && (
                                <p className="text-sm text-neutral-500">
                                    +{prescriptions.length - 5} more
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Consultation Fee */}
            <div className="bg-white border border-neutral-200 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    <h3 className="font-semibold text-neutral-800">Consultation Fee</h3>
                </div>

                {/* Preset Buttons */}
                <div className="grid grid-cols-4 md:grid-cols-8 gap-2 mb-4">
                    {CONSULTATION_FEE_OPTIONS.map((option) => (
                        <button
                            key={option.value}
                            onClick={() => handleFeeSelect(option.value)}
                            className={`py-3 px-2 rounded-lg border text-center font-medium transition-colors ${
                                isPresetSelected(option.value)
                                    ? 'bg-green-600 border-green-600 text-white'
                                    : 'border-neutral-300 text-neutral-700 hover:bg-neutral-50'
                            }`}
                        >
                            {option.label}
                        </button>
                    ))}
                    <button
                        onClick={() => setShowCustom(true)}
                        className={`py-3 px-2 rounded-lg border text-center font-medium transition-colors ${
                            showCustom
                                ? 'bg-primary-500 border-primary-500 text-white'
                                : 'border-neutral-300 text-neutral-700 hover:bg-neutral-50'
                        }`}
                    >
                        Custom
                    </button>
                </div>

                {/* Custom Fee Input */}
                {showCustom && (
                    <div className="flex items-center gap-3 mb-4">
                        <div className="flex-1 relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500">Rs.</span>
                            <input
                                type="number"
                                min="0"
                                step="100"
                                value={customFee}
                                onChange={(e) => setCustomFee(e.target.value)}
                                placeholder="Enter custom amount"
                                className="w-full pl-12 pr-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                        </div>
                        <button
                            onClick={handleCustomFee}
                            disabled={!customFee}
                            className="px-4 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50"
                        >
                            Apply
                        </button>
                    </div>
                )}

                {/* Selected Fee Display */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between">
                    <span className="text-green-700 font-medium">Selected Fee</span>
                    <span className="text-2xl font-bold text-green-700">
                        Rs. {consultationFee.toLocaleString()}
                    </span>
                </div>
            </div>

            {/* Clinical Notes */}
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-5 h-5 text-primary-500" />
                    <label className="font-semibold text-neutral-800">Clinical Notes</label>
                </div>
                <textarea
                    value={clinicalNotes}
                    onChange={(e) => setClinicalNotes(e.target.value)}
                    placeholder="Add any clinical observations, examination findings, or notes for this consultation..."
                    className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[120px] resize-none"
                />
            </div>

            {/* Follow-up Instructions */}
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-5 h-5 text-purple-600" />
                    <label className="font-semibold text-neutral-800">Follow-up Instructions</label>
                </div>
                <textarea
                    value={followUpInstructions}
                    onChange={(e) => setFollowUpInstructions(e.target.value)}
                    placeholder="Enter any follow-up instructions, lifestyle advice, dietary recommendations, or next appointment guidance..."
                    className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[120px] resize-none"
                />
            </div>

            {/* Final Checklist */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h3 className="font-semibold text-blue-800 mb-3">Before Submitting</h3>
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                            diagnoses.length > 0 ? 'bg-green-500' : 'bg-neutral-300'
                        }`}>
                            {diagnoses.length > 0 && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <span className={diagnoses.length > 0 ? 'text-green-700' : 'text-neutral-500'}>
                            At least one diagnosis selected
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                            consultationFee >= 0 ? 'bg-green-500' : 'bg-neutral-300'
                        }`}>
                            <Check className="w-3 h-3 text-white" />
                        </div>
                        <span className="text-green-700">
                            Consultation fee set (Rs. {consultationFee})
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                            prescriptions.length > 0 ? 'bg-green-500' : 'bg-amber-300'
                        }`}>
                            {prescriptions.length > 0 ? (
                                <Check className="w-3 h-3 text-white" />
                            ) : (
                                <span className="text-amber-700 text-xs font-bold">!</span>
                            )}
                        </div>
                        <span className={prescriptions.length > 0 ? 'text-green-700' : 'text-amber-700'}>
                            {prescriptions.length > 0 
                                ? `${prescriptions.length} medicine(s) prescribed`
                                : 'No medicines prescribed (optional)'
                            }
                        </span>
                    </div>
                </div>
            </div>

            {/* Info about workflow */}
            <div className="bg-neutral-100 rounded-xl p-4 text-sm text-neutral-600">
                <p className="font-medium text-neutral-800 mb-2">What happens next?</p>
                <ol className="list-decimal list-inside space-y-1">
                    <li>This consultation will be marked as "Payment Pending"</li>
                    <li>The cashier will receive this in their billing queue</li>
                    <li>After payment is collected, the pharmacist will issue medicines</li>
                    <li>The patient will receive their prescription and medicines</li>
                </ol>
            </div>
        </div>
    );
};

export default ConsultationFeeStep;
