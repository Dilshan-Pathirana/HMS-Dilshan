import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { RootState } from '../../../../store';
import {
    ChevronLeft,
    ChevronRight,
    User,
    MessageSquare,
    Activity,
    Pill,
    DollarSign,
    Check,
    Loader2,
    AlertCircle,
    Heart,
    Thermometer,
    Scale,
    FileText,
    UserCheck
} from 'lucide-react';
import {
    Consultation,
    PatientOverview,
    ConsultationQuestion,
    ConsultationDiagnosis,
    Prescription,
    VitalSigns,
    AutoSummary
} from './types';
import {
    getConsultation,
    getPatientOverview,
    saveQuestions,
    saveDiagnoses,
    savePrescriptions,
    submitConsultation,
    getConsultationVitals,
    generateAutoSummary
} from './consultationApi';
import ClinicalQuestioning from './ClinicalQuestioning';
import DiagnosisSelection from './DiagnosisSelection';
import MedicineRecommendation from './MedicineRecommendation';
import ConsultationFeeStep from './ConsultationFeeStep';

interface Step {
    id: number;
    title: string;
    icon: React.ReactNode;
    component: React.ComponentType<any>;
}

const ConsultationFlow: React.FC = () => {
    const { consultationId } = useParams<{ consultationId: string }>();
    const navigate = useNavigate();
    
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // Consultation data
    const [_consultation, setConsultation] = useState<Consultation | null>(null);
    const [patient, setPatient] = useState<PatientOverview | null>(null);
    
    // Step data
    const [questions, setQuestions] = useState<ConsultationQuestion[]>([]);
    const [diagnoses, setDiagnoses] = useState<ConsultationDiagnosis[]>([]);
    const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
    const [consultationFee, setConsultationFee] = useState<number>(0);
    const [chiefComplaint, setChiefComplaint] = useState<string>('');
    const [clinicalNotes, setClinicalNotes] = useState<string>('');
    const [followUpInstructions, setFollowUpInstructions] = useState<string>('');
    const [vitals, setVitals] = useState<VitalSigns | null>(null);
    const [autoSummary, setAutoSummary] = useState<AutoSummary | null>(null);
    const steps: Step[] = [
        { id: 1, title: 'Patient Overview', icon: <User className="w-5 h-5" />, component: PatientOverviewStep },
        { id: 2, title: 'Clinical Questions', icon: <MessageSquare className="w-5 h-5" />, component: ClinicalQuestioning },
        { id: 3, title: 'Diagnosis', icon: <Activity className="w-5 h-5" />, component: DiagnosisSelection },
        { id: 4, title: 'Medicines', icon: <Pill className="w-5 h-5" />, component: MedicineRecommendation },
        { id: 5, title: 'Fee & Submit', icon: <DollarSign className="w-5 h-5" />, component: ConsultationFeeStep },
    ];

    // Fetch consultation data
    useEffect(() => {
        if (consultationId) {
            fetchConsultationData();
        }
    }, [consultationId]);

    const fetchConsultationData = async () => {
        try {
            setLoading(true);
            setError(null);
            
            // Get consultation details
            const consultResponse = await getConsultation(consultationId!);
            if (consultResponse.status === 200) {
                setConsultation(consultResponse.consultation);
                setQuestions(consultResponse.questions || []);
                setChiefComplaint(consultResponse.consultation.chief_complaint || '');
                setClinicalNotes(consultResponse.consultation.clinical_notes || '');
                setFollowUpInstructions(consultResponse.consultation.follow_up_instructions || '');
                setConsultationFee(consultResponse.consultation.consultation_fee || 0);
                
                // Map diagnoses
                if (consultResponse.diagnoses) {
                    setDiagnoses(consultResponse.diagnoses.map((d: any) => ({
                        diagnosis_id: d.diagnosis_id,
                        diagnosis_type: d.diagnosis_type,
                        notes: d.notes || ''
                    })));
                }
                
                // Map prescriptions
                if (consultResponse.prescriptions) {
                    setPrescriptions(consultResponse.prescriptions.map((p: any) => ({
                        medicine_id: p.medicine_id,
                        medicine_name: p.medicine_name,
                        potency: p.potency,
                        dosage: p.dosage,
                        frequency: p.frequency,
                        duration: p.duration,
                        quantity: p.quantity,
                        instructions: p.instructions || ''
                    })));
                }
                
                // Get patient details
                const patientResponse = await getPatientOverview(consultResponse.consultation.patient_id);
                setPatient(patientResponse);

                // Get nurse vitals for this consultation
                try {
                    const vitalsResponse = await getConsultationVitals(consultationId!);
                    setVitals(vitalsResponse.vitals);
                } catch { /* vitals may not exist */ }
            }
        } catch (err: any) {
            console.error('Failed to fetch consultation:', err);
            setError(err.response?.data?.message || 'Failed to load consultation data');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveStep = async (stepId: number) => {
        if (!consultationId) return;
        
        try {
            setSaving(true);
            
            switch (stepId) {
                case 2: // Questions
                    await saveQuestions(consultationId, questions.map(q => ({
                        question_bank_id: q.question_bank_id || undefined,
                        question_text: q.question_text,
                        answer_text: q.answer_text,
                        is_custom: q.is_custom,
                        answer_type: q.answer_type,
                        category: q.category || undefined,
                        display_order: q.display_order,
                    })));
                    // Generate auto-summary after Q&A
                    try {
                        const summaryResp = await generateAutoSummary(consultationId);
                        setAutoSummary(summaryResp.summary);
                    } catch { /* non-critical */ }
                    break;
                case 3: // Diagnoses
                    await saveDiagnoses(consultationId, diagnoses);
                    break;
                case 4: // Prescriptions
                    await savePrescriptions(consultationId, prescriptions);
                    break;
            }
        } catch (err: any) {
            console.error('Failed to save step:', err);
            alert(err.response?.data?.message || 'Failed to save. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleNextStep = async () => {
        if (currentStep < steps.length) {
            // Save current step data before moving
            await handleSaveStep(currentStep);
            setCurrentStep(currentStep + 1);
        }
    };

    const handlePrevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleSubmitConsultation = async () => {
        if (!consultationId) return;
        
        // Validate required data
        if (diagnoses.length === 0) {
            alert('Please add at least one diagnosis before submitting.');
            return;
        }
        
        if (!confirm('Submit this consultation? This will send it to the cashier for billing.')) {
            return;
        }
        
        try {
            setSaving(true);
            
            // Save prescriptions first
            await savePrescriptions(consultationId, prescriptions);
            
            // Submit consultation
            const response = await submitConsultation(consultationId, {
                consultation_fee: consultationFee,
                clinical_notes: clinicalNotes,
                follow_up_instructions: followUpInstructions
            });
            
            if (response.status === 200) {
                alert('Consultation completed successfully! Sent to cashier for billing.');
                navigate('/doctor-dashboard-new/consultation');
            }
        } catch (err: any) {
            console.error('Failed to submit consultation:', err);
            alert(err.response?.data?.message || 'Failed to submit consultation. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                    <p className="text-error-600">{error}</p>
                    <button
                        onClick={() => navigate('/doctor-dashboard-new/consultation')}
                        className="mt-4 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
                    >
                        Back to Queue
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <button
                        onClick={() => navigate('/doctor-dashboard-new/consultation')}
                        className="text-primary-500 hover:text-blue-700 text-sm flex items-center gap-1 mb-2"
                    >
                        <ChevronLeft className="w-4 h-4" /> Back to Queue
                    </button>
                    <h1 className="text-2xl font-bold text-neutral-800">
                        Consultation: {patient?.patient.first_name} {patient?.patient.last_name}
                    </h1>
                </div>
                {saving && (
                    <div className="flex items-center gap-2 text-primary-500">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Saving...</span>
                    </div>
                )}
            </div>

            {/* Progress Steps */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="flex items-center justify-between">
                    {steps.map((step, index) => (
                        <React.Fragment key={step.id}>
                            <div
                                className={`flex items-center gap-2 cursor-pointer ${
                                    currentStep === step.id
                                        ? 'text-primary-500'
                                        : currentStep > step.id
                                        ? 'text-green-600'
                                        : 'text-neutral-400'
                                }`}
                                onClick={() => {
                                    if (step.id < currentStep) {
                                        setCurrentStep(step.id);
                                    }
                                }}
                            >
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                    currentStep === step.id
                                        ? 'bg-blue-100 text-primary-500'
                                        : currentStep > step.id
                                        ? 'bg-green-100 text-green-600'
                                        : 'bg-neutral-100 text-neutral-400'
                                }`}>
                                    {currentStep > step.id ? (
                                        <Check className="w-5 h-5" />
                                    ) : (
                                        step.icon
                                    )}
                                </div>
                                <span className="hidden md:block font-medium text-sm">
                                    {step.title}
                                </span>
                            </div>
                            {index < steps.length - 1 && (
                                <div className={`flex-1 h-0.5 mx-2 ${
                                    currentStep > step.id ? 'bg-green-500' : 'bg-neutral-200'
                                }`} />
                            )}
                        </React.Fragment>
                    ))}
                </div>
            </div>

            {/* Step Content */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 min-h-[400px]">
                {currentStep === 1 && patient && (
                    <PatientOverviewStep 
                        patient={patient}
                        chiefComplaint={chiefComplaint}
                        setChiefComplaint={setChiefComplaint}
                        vitals={vitals}
                    />
                )}
                {currentStep === 2 && (
                    <ClinicalQuestioning
                        consultationId={consultationId!}
                        questions={questions}
                        setQuestions={setQuestions}
                    />
                )}
                {currentStep === 3 && (
                    <div>
                        {/* Auto-Summary Panel */}
                        {autoSummary && (autoSummary.symptom_summary || autoSummary.keynotes) && (
                            <div className="mx-6 mt-6 bg-indigo-50 border border-indigo-200 rounded-xl p-4">
                                <h3 className="font-semibold text-indigo-800 mb-2 flex items-center gap-2">
                                    <FileText className="w-4 h-4" />
                                    Auto-Generated Summary
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                    {autoSummary.symptom_summary && (
                                        <div>
                                            <span className="font-medium text-indigo-700">Symptoms: </span>
                                            <span className="text-indigo-600">{autoSummary.symptom_summary}</span>
                                        </div>
                                    )}
                                    {autoSummary.modalities && (
                                        <div>
                                            <span className="font-medium text-indigo-700">Modalities: </span>
                                            <span className="text-indigo-600">{autoSummary.modalities}</span>
                                        </div>
                                    )}
                                    {autoSummary.mental_emotional && (
                                        <div>
                                            <span className="font-medium text-indigo-700">Mental/Emotional: </span>
                                            <span className="text-indigo-600">{autoSummary.mental_emotional}</span>
                                        </div>
                                    )}
                                    {autoSummary.physical_generals && (
                                        <div>
                                            <span className="font-medium text-indigo-700">Physical Generals: </span>
                                            <span className="text-indigo-600">{autoSummary.physical_generals}</span>
                                        </div>
                                    )}
                                    {autoSummary.keynotes && (
                                        <div className="col-span-full">
                                            <span className="font-medium text-indigo-700">Keynotes: </span>
                                            <span className="text-indigo-600">{autoSummary.keynotes}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                        <DiagnosisSelection
                            consultationId={consultationId!}
                            diagnoses={diagnoses}
                            setDiagnoses={setDiagnoses}
                        />
                    </div>
                )}
                {currentStep === 4 && (
                    <MedicineRecommendation
                        consultationId={consultationId!}
                        prescriptions={prescriptions}
                        setPrescriptions={setPrescriptions}
                    />
                )}
                {currentStep === 5 && (
                    <ConsultationFeeStep
                        consultationFee={consultationFee}
                        setConsultationFee={setConsultationFee}
                        clinicalNotes={clinicalNotes}
                        setClinicalNotes={setClinicalNotes}
                        followUpInstructions={followUpInstructions}
                        setFollowUpInstructions={setFollowUpInstructions}
                        diagnoses={diagnoses}
                        prescriptions={prescriptions}
                    />
                )}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between">
                <button
                    onClick={handlePrevStep}
                    disabled={currentStep === 1}
                    className="inline-flex items-center gap-2 px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <ChevronLeft className="w-5 h-5" />
                    Previous
                </button>

                <div className="flex items-center gap-3">
                    {currentStep < steps.length ? (
                        <button
                            onClick={handleNextStep}
                            disabled={saving}
                            className="inline-flex items-center gap-2 px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50"
                        >
                            {saving ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    Next
                                    <ChevronRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmitConsultation}
                            disabled={saving}
                            className="inline-flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                        >
                            {saving ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <Check className="w-5 h-5" />
                                    Complete & Send to Cashier
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

// Patient Overview Step Component
const PatientOverviewStep: React.FC<{
    patient: PatientOverview;
    chiefComplaint: string;
    setChiefComplaint: (value: string) => void;
    vitals: VitalSigns | null;
}> = ({ patient, chiefComplaint, setChiefComplaint, vitals }) => {
    return (
        <div className="p-6 space-y-6">
            {/* Patient Info */}
            <div className="flex items-start gap-6">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center text-primary-500 font-bold text-2xl">
                    {patient.patient.first_name?.charAt(0)}{patient.patient.last_name?.charAt(0)}
                </div>
                <div className="flex-1">
                    <h2 className="text-2xl font-bold text-neutral-800">
                        {patient.patient.first_name} {patient.patient.last_name}
                    </h2>
                    <div className="flex flex-wrap items-center gap-4 text-neutral-600 mt-2">
                        {patient.patient.age && (
                            <span>{patient.patient.age} years, {patient.patient.gender}</span>
                        )}
                        <span>{patient.patient.phone}</span>
                        {patient.patient.blood_type && (
                            <span className="text-error-600 font-medium">Blood: {patient.patient.blood_type}</span>
                        )}
                    </div>
                </div>
            </div>

            {/* Nurse Pre-Assessment Vitals */}
            {vitals && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <h3 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                        <UserCheck className="w-5 h-5" />
                        Nurse Pre-Assessment
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {vitals.temperature && (
                            <div className="flex items-center gap-2">
                                <Thermometer className="w-4 h-4 text-orange-500" />
                                <div>
                                    <p className="text-xs text-neutral-500">Temperature</p>
                                    <p className="font-semibold">{vitals.temperature}°F</p>
                                </div>
                            </div>
                        )}
                        {vitals.blood_pressure_systolic && (
                            <div className="flex items-center gap-2">
                                <Heart className="w-4 h-4 text-red-500" />
                                <div>
                                    <p className="text-xs text-neutral-500">Blood Pressure</p>
                                    <p className="font-semibold">{vitals.blood_pressure_systolic}/{vitals.blood_pressure_diastolic} mmHg</p>
                                </div>
                            </div>
                        )}
                        {vitals.pulse_rate && (
                            <div className="flex items-center gap-2">
                                <Activity className="w-4 h-4 text-pink-500" />
                                <div>
                                    <p className="text-xs text-neutral-500">Pulse Rate</p>
                                    <p className="font-semibold">{vitals.pulse_rate} bpm</p>
                                </div>
                            </div>
                        )}
                        {vitals.oxygen_saturation && (
                            <div>
                                <p className="text-xs text-neutral-500">SpO2</p>
                                <p className="font-semibold">{vitals.oxygen_saturation}%</p>
                            </div>
                        )}
                        {vitals.weight && (
                            <div className="flex items-center gap-2">
                                <Scale className="w-4 h-4 text-blue-500" />
                                <div>
                                    <p className="text-xs text-neutral-500">Weight</p>
                                    <p className="font-semibold">{vitals.weight} kg</p>
                                </div>
                            </div>
                        )}
                        {vitals.height && (
                            <div>
                                <p className="text-xs text-neutral-500">Height</p>
                                <p className="font-semibold">{vitals.height} cm</p>
                            </div>
                        )}
                        {vitals.bmi && (
                            <div>
                                <p className="text-xs text-neutral-500">BMI</p>
                                <p className="font-semibold">{vitals.bmi}</p>
                            </div>
                        )}
                        {vitals.blood_sugar && (
                            <div>
                                <p className="text-xs text-neutral-500">Blood Sugar</p>
                                <p className="font-semibold">{vitals.blood_sugar} mg/dL</p>
                            </div>
                        )}
                    </div>

                    {/* Extended nurse assessment */}
                    {(vitals.chief_complaint || vitals.allergies || vitals.chronic_diseases) && (
                        <div className="mt-3 pt-3 border-t border-green-200 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            {vitals.chief_complaint && (
                                <div>
                                    <span className="font-medium text-green-700">Chief Complaint: </span>
                                    <span>{vitals.chief_complaint}</span>
                                </div>
                            )}
                            {vitals.allergies && (
                                <div>
                                    <span className="font-medium text-red-600">Allergies: </span>
                                    <span>{vitals.allergies}</span>
                                </div>
                            )}
                            {vitals.chronic_diseases && (
                                <div>
                                    <span className="font-medium text-amber-700">Chronic Diseases: </span>
                                    <span>{vitals.chronic_diseases}</span>
                                </div>
                            )}
                            {vitals.sleep_quality && (
                                <div>
                                    <span className="font-medium text-green-700">Sleep Quality: </span>
                                    <span>{vitals.sleep_quality}/10</span>
                                </div>
                            )}
                            {vitals.appetite && (
                                <div>
                                    <span className="font-medium text-green-700">Appetite: </span>
                                    <span className="capitalize">{vitals.appetite}</span>
                                </div>
                            )}
                            {vitals.lifestyle_notes && (
                                <div className="col-span-full">
                                    <span className="font-medium text-green-700">Lifestyle Notes: </span>
                                    <span>{vitals.lifestyle_notes}</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Allergies Warning */}
            {patient.patient.allergies && (
                <div className="bg-error-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                    <AlertCircle className="w-6 h-6 text-error-500 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="font-semibold text-red-700">Known Allergies</p>
                        <p className="text-error-600">{patient.patient.allergies}</p>
                    </div>
                </div>
            )}

            {/* Medical Conditions */}
            {patient.patient.medical_conditions && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <p className="font-semibold text-amber-700 mb-1">Medical Conditions</p>
                    <p className="text-amber-600">{patient.patient.medical_conditions}</p>
                </div>
            )}

            {/* Chief Complaint */}
            <div>
                <label className="block font-semibold text-neutral-800 mb-2">
                    Chief Complaint / Reason for Visit
                </label>
                <textarea
                    value={chiefComplaint}
                    onChange={(e) => setChiefComplaint(e.target.value)}
                    placeholder="Enter the patient's main complaint or reason for this visit..."
                    className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[100px] resize-none"
                />
            </div>

            {/* Recent History Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-neutral-50 rounded-xl p-4">
                    <h3 className="font-semibold text-neutral-800 mb-2">Recent Diagnoses</h3>
                    {patient.all_diagnoses.length === 0 ? (
                        <p className="text-neutral-500 text-sm">No previous diagnoses</p>
                    ) : (
                        <div className="flex flex-wrap gap-2">
                            {patient.all_diagnoses.slice(0, 5).map((d, i) => (
                                <span key={i} className="px-2 py-1 bg-white text-sm rounded-lg border border-neutral-200">
                                    {d.diagnosis_name}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
                <div className="bg-neutral-50 rounded-xl p-4">
                    <h3 className="font-semibold text-neutral-800 mb-2">Recent Medications</h3>
                    {patient.medication_history.length === 0 ? (
                        <p className="text-neutral-500 text-sm">No medication history</p>
                    ) : (
                        <div className="flex flex-wrap gap-2">
                            {patient.medication_history.slice(0, 5).map((m, i) => (
                                <span key={i} className="px-2 py-1 bg-white text-sm rounded-lg border border-neutral-200">
                                    {m.medicine_name} {m.potency}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ConsultationFlow;
