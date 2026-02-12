import { useNavigate, useSearchParams } from 'react-router-dom';
import { FaTimesCircle, FaRedo } from 'react-icons/fa';

export default function PaymentCancel() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderIds = searchParams.get('order_ids') || '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
        <FaTimesCircle className="text-6xl text-red-400 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-neutral-800 mb-2">Payment Cancelled</h1>
        <p className="text-neutral-600 mb-6">
          Your payment was cancelled. The appointment(s) have not been confirmed.
        </p>
        <p className="text-sm text-neutral-500 mb-6">
          You can try booking again from the appointment page.
        </p>
        <div className="space-y-3">
          <button
            onClick={() => navigate('/patient/book-appointment')}
            className="w-full py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition flex items-center justify-center font-semibold"
          >
            <FaRedo className="mr-2" />
            Try Again
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
