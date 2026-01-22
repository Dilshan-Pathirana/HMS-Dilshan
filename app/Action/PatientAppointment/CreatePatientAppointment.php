<?php

namespace App\Action\PatientAppointment;

use Exception;
use App\Response\CommonResponse;
use App\Services\PayHereService;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

class CreatePatientAppointment
{
    use PatientAppointmentBase;

    public function __invoke(array $validated): array
    {
        DB::beginTransaction();

        try {
            $validated = $this->normalizeValidatedData($validated);

            $this->findOrCreatePatient($validated);

            if ($this->checkForExistingAppointment($validated)) {
                return CommonResponse::sendBadResponseWithMessage('Appointment already exists for this user at the specified date and time.');
            }

            // Initialize PayHere service and generate payment data WITHOUT creating appointment
            $payHereService = new PayHereService();

            // Generate temporary order ID for payment processing
            $tempOrderId = 'TEMP_'.uniqid().'_'.time();

            // Prepare appointment data for payment processing (store in session/cache)
            $appointmentData = [
                'schedule_id' => $validated['schedule_id'],
                'user_id' => $this->userId,
                'doctor_id' => $validated['doctor_id'],
                'branch_id' => $validated['branch_id'],
                'date' => $validated['date'],
                'slot' => $validated['slot'],
                'patient_data' => $validated,
            ];

            // Generate payment data using temporary order ID
            $paymentData = $payHereService->generatePaymentDataForPreAppointment($tempOrderId, $validated, $appointmentData);

            // Create PayHere payment form HTML
            $paymentFormHtml = $payHereService->createPaymentForm($paymentData);

            DB::commit();

            // Return payment data and form for frontend to display
            return [
                'status' => Response::HTTP_OK,
                'message' => 'Please complete payment to confirm your appointment.',
                'data' => [
                    'temp_order_id' => $tempOrderId,
                    'order_id' => $paymentData['order_id'],
                    'payment_amount' => $paymentData['amount'],
                    'payment_url' => $paymentData['payment_url'],
                    'payment_form_html' => $paymentFormHtml,
                    'payment_data' => $paymentData,
                ],
            ];
        } catch (Exception $exception) {
            DB::rollBack();

            return CommonResponse::sendBadResponseWithMessage('Internal Server Error: '.$exception->getMessage());
        }
    }
}
