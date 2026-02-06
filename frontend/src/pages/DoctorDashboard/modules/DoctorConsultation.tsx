import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ConsultationQueue from './consultation/ConsultationQueue';
import ConsultationFlow from './consultation/ConsultationFlow';

/**
 * Doctor Consultation Module
 * 
 * This module handles the complete consultation workflow:
 * 1. Queue Management - View today's patients and future appointments
 * 2. Patient Overview - Read-only access to patient history, allergies, past treatments
 * 3. Clinical Questioning - Predefined Materia Medica questions + custom questions
 * 4. Diagnosis Selection - Select from master list or add new diagnoses
 * 5. Medicine Recommendations - Select medicines (read-only inventory access)
 * 6. Consultation Fee - Set fee (Free, 500, 1000, 2000, 2500, 3000, 3500, or Custom)
 * 7. Submit - Send to cashier for billing, then pharmacist for medicine dispensing
 * 
 * Doctor Restrictions (enforced by backend):
 * - Cannot collect money (cashier only)
 * - Cannot issue medicines (pharmacist only)
 * - Cannot modify stock
 * - Cannot backdate consultations
 * 
 * All actions are logged in the audit trail.
 */
const DoctorConsultation: React.FC = () => {
    return (
        <Routes>
            {/* Main Queue View */}
            <Route index element={<ConsultationQueue />} />
            
            {/* Consultation Flow */}
            <Route path="flow/:consultationId" element={<ConsultationFlow />} />
        </Routes>
    );
};

export default DoctorConsultation;
