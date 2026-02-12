import { useNavigate, useSearchParams } from 'react-router-dom';
import { FaCheckCircle } from 'react-icons/fa';

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderIds = searchParams.get('order_ids') || '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
        <FaCheckCircle className="text-6xl text-emerald-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-neutral-800 mb-2">Payment Successful</h1>
        <p className="text-neutral-600 mb-6">
          Your payment has been processed successfully. Your appointment(s) are now confirmed.
        </p>
        {orderIds && (
          <p className="text-sm text-neutral-500 mb-6">
            Reference: {orderIds}
          </p>
        )}
        <div className="space-y-3">
          <button
            onClick={() => navigate('/patient/appointments')}
            className="w-full py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition flex items-center justify-center font-semibold"
          >
            View Appointments
          </button>
          <button
            onClick={() => navigate('/patient')}
            className="w-full py-3 bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200 transition font-semibold"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
