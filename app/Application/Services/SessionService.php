<?php

namespace App\Application\Services;

use App\Core\Exceptions\BusinessLogicException;
use App\Core\Exceptions\ResourceNotFoundException;
use Illuminate\Support\Facades\DB;

/**
 * Session Service
 * Handles medical session management, diagnoses, prescriptions, and media
 */
class SessionService extends BaseService
{
    /**
     * Start new session
     */
    public function startSession(int $appointmentId, int $doctorId): array
    {
        try {
            // Verify appointment exists and is checked in
            $appointment = DB::table('appointments')->where('id', $appointmentId)->first();

            if (!$appointment) {
                throw new ResourceNotFoundException('Appointment', $appointmentId);
            }

            if ($appointment->status !== 'checked_in') {
                throw new BusinessLogicException('Patient must be checked in before starting session');
            }

            // Create session
            $sessionId = DB::table('sessions')->insertGetId([
                'appointment_id' => $appointmentId,
                'patient_id' => $appointment->patient_id,
                'doctor_id' => $doctorId,
                'center_id' => $appointment->center_id,
                'session_date' => now()->toDateString(),
                'session_time' => now()->toTimeString(),
                'status' => 'ongoing',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // Update appointment status
            DB::table('appointments')
                ->where('id', $appointmentId)
                ->update([
                    'status' => 'in_session',
                    'updated_at' => now(),
                ]);

            $this->log('info', 'Session started', [
                'session_id' => $sessionId,
                'appointment_id' => $appointmentId,
            ]);

            return $this->getSession($sessionId);

        } catch (\Throwable $e) {
            $this->handleException($e);
        }
    }

    /**
     * Get session details
     */
    public function getSession(int $sessionId): array
    {
        $session = DB::table('sessions')
            ->where('id', $sessionId)
            ->first();

        if (!$session) {
            throw new ResourceNotFoundException('Session', $sessionId);
        }

        return (array) $session;
    }

    /**
     * Add diagnosis to session
     */
    public function addDiagnosis(int $sessionId, array $diagnosisData): array
    {
        $this->validateRequired($diagnosisData, ['diagnosis']);

        DB::table('sessions')
            ->where('id', $sessionId)
            ->update([
                'diagnosis' => $diagnosisData['diagnosis'],
                'observations' => $diagnosisData['observations'] ?? null,
                'updated_at' => now(),
            ]);

        $this->log('info', 'Diagnosis added to session', ['session_id' => $sessionId]);

        return $this->getSession($sessionId);
    }

    /**
     * Add prescription to session
     */
    public function addPrescription(int $sessionId, array $prescriptionData): array
    {
        $this->validateRequired($prescriptionData, [
            'medication_id', 'dosage', 'frequency', 'duration'
        ]);

        $session = $this->getSession($sessionId);

        $prescriptionId = DB::table('prescriptions')->insertGetId([
            'session_id' => $sessionId,
            'patient_id' => $session['patient_id'],
            'doctor_id' => $session['doctor_id'],
            'medication_id' => $prescriptionData['medication_id'],
            'dosage' => $prescriptionData['dosage'],
            'frequency' => $prescriptionData['frequency'],
            'duration' => $prescriptionData['duration'],
            'notes' => $prescriptionData['notes'] ?? null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->log('info', 'Prescription added', [
            'session_id' => $sessionId,
            'prescription_id' => $prescriptionId,
        ]);

        return ['prescription_id' => $prescriptionId];
    }

    /**
     * Upload media to session
     */
    public function uploadMedia(int $sessionId, array $mediaData): array
    {
        $this->validateRequired($mediaData, ['file_type', 'file_url']);

        $session = $this->getSession($sessionId);

        $mediaId = DB::table('session_media')->insertGetId([
            'session_id' => $sessionId,
            'file_type' => $mediaData['file_type'],
            'file_url' => $mediaData['file_url'],
            'description' => $mediaData['description'] ?? null,
            'uploaded_by' => $mediaData['uploaded_by'],
            'upload_date' => now(),
            'created_at' => now(),
        ]);

        $this->log('info', 'Media uploaded to session', [
            'session_id' => $sessionId,
            'media_id' => $mediaId,
        ]);

        return ['media_id' => $mediaId, 'file_url' => $mediaData['file_url']];
    }

    /**
     * End session and set consultation fee
     */
    public function endSession(int $sessionId, float $consultationFee, ?string $notes = null): array
    {
        $session = $this->getSession($sessionId);

        if ($session['status'] !== 'ongoing') {
            throw new BusinessLogicException('Only ongoing sessions can be ended');
        }

        DB::table('sessions')
            ->where('id', $sessionId)
            ->update([
                'status' => 'completed',
                'consultation_fee' => $consultationFee,
                'session_notes' => $notes,
                'ended_at' => now(),
                'updated_at' => now(),
            ]);

        // Update appointment status
        DB::table('appointments')
            ->where('id', $session['appointment_id'])
            ->update([
                'status' => 'completed',
                'updated_at' => now(),
            ]);

        $this->log('info', 'Session ended', [
            'session_id' => $sessionId,
            'consultation_fee' => $consultationFee,
        ]);

        return $this->getSession($sessionId);
    }

    /**
     * Get session media
     */
    public function getSessionMedia(int $sessionId): array
    {
        return DB::table('session_media')
            ->where('session_id', $sessionId)
            ->orderBy('upload_date', 'desc')
            ->get()
            ->toArray();
    }

    /**
     * Get session prescriptions
     */
    public function getSessionPrescriptions(int $sessionId): array
    {
        return DB::table('prescriptions')
            ->where('session_id', $sessionId)
            ->get()
            ->toArray();
    }

    /**
     * Get patient session history
     */
    public function getPatientSessions(int $patientId): array
    {
        return DB::table('sessions')
            ->where('patient_id', $patientId)
            ->orderBy('session_date', 'desc')
            ->orderBy('session_time', 'desc')
            ->get()
            ->toArray();
    }
}
