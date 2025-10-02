
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';

const ConfirmationPage: React.FC = () => {
  const { orderId } = useParams();

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
      <div className="bg-green-100 text-green-800 rounded-full h-24 w-24 flex items-center justify-center mx-auto mb-6">
        <CheckCircle size={64} />
      </div>
      <h1 className="text-4xl font-bold font-serif text-navy">Thank You for Your Order!</h1>
      <p className="mt-4 text-lg text-gray-600">Your order has been placed successfully.</p>
      <p className="mt-2 text-gray-600">
        Your order number is <span className="font-semibold text-navy">{orderId}</span>.
      </p>
      <p className="mt-2 text-gray-600">
        We'll have it ready for pickup shortly. You'll receive a notification when it's ready.
      </p>

      <div className="mt-10">
        <Link to="/menu">
          <button className="bg-gold text-navy font-bold py-3 px-8 rounded-full text-lg hover:bg-amber-500 transition-colors">
            Place Another Order
          </button>
        </Link>
      </div>
    </div>
  );
};

export default ConfirmationPage;
