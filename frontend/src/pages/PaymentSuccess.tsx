import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { FaCheckCircle, FaSpinner, FaCalendarAlt } from 'react-icons/fa';
import api from '../utils/api/axios';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Confirming your payment…');
  const [count, setCount] = useState(0);

  useEffect(() => {
    const orderIds = searchParams.get('order_ids') || '';
    if (!orderIds) {
      setStatus('error');
      setMessage('No order information found.');
      return;
    }

    // Each appointment ID or a single PAY-xxx order_id
    const confirm = async () => {
      try {
        // Try to confirm using the first value (which is the PAY-xxx order id when
        // appointments are grouped, or comma-separated appointment ids)
        // The backend /payments/confirm-by-order uses the order_id stored in payment_reference
        const ids = orderIds.split(',');

        // First try: see if it's a PAY-xxx order_id directly
        const res = await api.post('/payments/confirm-by-order', { order_id: orderIds });
        const payload = (res as any)?.data ? (res as any).data : res;
        setCount(payload?.appointment_count || ids.length);
        setStatus('success');
        setMessage('Payment confirmed! Your appointment(s) are now booked.');
      } catch {
        // Fallback: try each id individually as an order_id
        try {
          const ids = orderIds.split(',');
          let confirmed = 0;
          for (const id of ids) {
            try {
              await api.post('/payments/confirm-by-order', { order_id: id });
              confirmed++;
            } catch { /* skip */ }
          }
          if (confirmed > 0) {
            setCount(confirmed);
            setStatus('success');
            setMessage('Payment confirmed!');
          } else {
            setStatus('error');
            setMessage('Could not confirm payment. Please contact support.');
          }
        } catch {
          setStatus('error');
          setMessage('Could not confirm payment. Please contact support.');
        }
      }
    };

    confirm();
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
        {status === 'loading' && (
          <>
            <FaSpinner className="text-5xl text-primary-500 animate-spin mx-auto mb-4" />
            <h1 className="text-xl font-bold text-neutral-800 mb-2">Processing</h1>
            <p className="text-neutral-600">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <FaCheckCircle className="text-6xl text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-neutral-800 mb-2">Payment Successful!</h1>
            <p className="text-neutral-600 mb-6">{message}</p>
            {count > 0 && (
              <p className="text-sm text-neutral-500 mb-6">
                {count} appointment{count > 1 ? 's' : ''} confirmed.
              </p>
            )}
            <button
              onClick={() => navigate('/patient')}
              className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center justify-center font-semibold"
            >
              <FaCalendarAlt className="mr-2" />
              Go to Dashboard
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="text-5xl mb-4">⚠️</div>
            <h1 className="text-xl font-bold text-neutral-800 mb-2">Something Went Wrong</h1>
            <p className="text-neutral-600 mb-6">{message}</p>
            <button
              onClick={() => navigate('/patient')}
              className="w-full py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-semibold"
            >
              Back to Dashboard
            </button>
          </>
        )}
      </div>
    </div>
  );
}
