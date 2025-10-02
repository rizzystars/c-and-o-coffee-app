import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../hooks/useCartStore';
import { useAuthStore } from '../hooks/useAuthStore';
import { formatCurrency } from '../lib/utils';
import SquarePaymentForm from '../components/SquarePaymentForm';
import toast from 'react-hot-toast';

// Read from Vite env (exposed as import.meta.env with VITE_ prefix)
const ALLOW_TIPS =
  String((import.meta as any).env?.VITE_ALLOW_TIPS ?? 'false').toLowerCase() === 'true';
const TAX_PERCENT = parseFloat(String((import.meta as any).env?.VITE_TAX_PERCENT ?? '0'));

const CheckoutPage: React.FC = () => {
  const { items, getCartTotal, clearCart } = useCartStore();
  const { user, loyaltyBalance, session } = useAuthStore();
  const navigate = useNavigate();

  const [tipPercentage, setTipPercentage] = useState(15);
  const [customTip, setCustomTip] = useState('');
  const [pickupTime, setPickupTime] = useState('asap');
  const [notes, setNotes] = useState('');
  const [pointsToRedeem, setPointsToRedeem] = useState(0);
  const [couponCode, setCouponCode] = useState(''); // <-- missing before (crash)
  const [isProcessing, setIsProcessing] = useState(false);

  const subtotal = getCartTotal();
  const taxAmount = subtotal * (TAX_PERCENT / 100);

  const tipAmount = useMemo(() => {
    if (customTip) {
      const customAmount = parseFloat(customTip) * 100;
      return isNaN(customAmount) ? 0 : Math.round(customAmount);
    }
    return Math.round(subtotal * (tipPercentage / 100));
  }, [subtotal, tipPercentage, customTip]);

  // 10 points = $0.10 (adjust if your backend uses a different rate)
  const pointsDiscount =
    Math.min(loyaltyBalance?.balancePoints || 0, pointsToRedeem) * 10;
  const total = subtotal + taxAmount + tipAmount - pointsDiscount;

  // If cart is empty, send them back to menu (avoid blank page)
  if (items.length === 0 && !isProcessing) {
    navigate('/menu');
    return null;
  }

  const handlePaymentSuccess = async (token: string) => {
    setIsProcessing(true);
    toast.loading('Placing your order...');

    try {
      // 1) Create the order via your function
      const createOrderResponse = await fetch(
        '/.netlify/functions/create-square-order',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(session && { Authorization: `Bearer ${session.access_token}` }),
          },
          body: JSON.stringify({
            items,
            tip: tipAmount,
            idempotencyKey:
              (crypto as any)?.randomUUID?.() ||
              Math.random().toString(36).slice(2),
            pickupTime,
            notes,
            pointsToRedeem,      // send points intent to backend
            loyaltyCode: couponCode?.trim() || null, // send reward code if present
          }),
        }
      );

      const orderData = await createOrderResponse.json().catch(() => ({}));
      if (!createOrderResponse.ok) {
        throw new Error(orderData.error || 'Failed to create order.');
      }

      const { order } = orderData;
      toast.dismiss();
      toast.loading('Processing payment...');

      // 2) Pay for the created order
      const payResponse = await fetch('/.netlify/functions/pay-square-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceId: token,
          orderId: order.id,
          amount: order.total_money.amount, // or omit; backend can read from order
          idempotencyKey:
            (crypto as any)?.randomUUID?.() ||
            Math.random().toString(36).slice(2),
        }),
      });

      const paymentData = await payResponse.json().catch(() => ({}));
      if (!payResponse.ok || paymentData?.ok === false) {
        throw new Error(paymentData.error || 'Payment failed.');
      }

      toast.dismiss();
      toast.success('Order placed successfully!');
      clearCart();
      navigate(`/confirmation/${order.id}`);
    } catch (error: any) {
      toast.dismiss();
      toast.error(error?.message || 'An unknown error occurred.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold text-center mb-8 font-serif">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Order Summary */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-2xl font-bold mb-4">Your Order</h2>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Have a code?</label>
            <input
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              placeholder="Enter reward code"
              className="w-full border rounded-lg px-3 py-2"
              inputMode="text"
              autoCapitalize="characters"
            />
          </div>

          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between items-start">
                <div>
                  <p className="font-semibold">
                    {item.quantity} x {item.menuItem.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {item.selectedModifiers.map((m) => m.optionName).join(', ')}
                  </p>
                </div>
                <p>
                  {formatCurrency(
                    (item.menuItem.price +
                      item.selectedModifiers.reduce((acc, m) => acc + m.price, 0)) *
                      item.quantity
                  )}
                </p>
              </div>
            ))}
          </div>

          <hr className="my-4" />
          <div className="space-y-2">
            <div className="flex justify-between">
              <p>Subtotal</p>
              <p>{formatCurrency(subtotal)}</p>
            </div>
            <div className="flex justify-between">
              <p>Tax ({TAX_PERCENT}%)</p>
              <p>{formatCurrency(taxAmount)}</p>
            </div>
            <div className="flex justify-between">
              <p>Tip</p>
              <p>{formatCurrency(tipAmount)}</p>
            </div>
            {pointsDiscount > 0 && (
              <div className="flex justify-between text-green-600">
                <p>Loyalty Discount</p>
                <p>-{formatCurrency(pointsDiscount)}</p>
              </div>
            )}
            <div className="flex justify-between font-bold text-xl pt-2 border-t">
              <p>Total</p>
              <p>{formatCurrency(total)}</p>
            </div>
          </div>
        </div>

        {/* Checkout Form */}
        <div>
          {/* Pickup Time */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Pickup Time</h3>
            <select
              value={pickupTime}
              onChange={(e) => setPickupTime(e.target.value)}
              className="w-full p-2 border rounded-md"
            >
              <option value="asap">As soon as possible (15-20 min)</option>
              <option value="30min">In 30 minutes</option>
              <option value="1hr">In 1 hour</option>
            </select>
          </div>

          {/* Tipping */}
          {ALLOW_TIPS && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Add a Tip</h3>
              <div className="flex gap-2">
                {[15, 20, 25].map((p) => (
                  <button
                    key={p}
                    onClick={() => {
                      setTipPercentage(p);
                      setCustomTip('');
                    }}
                    className={`flex-1 p-2 border rounded-md ${
                      tipPercentage === p && !customTip ? 'bg-navy text-white' : ''
                    }`}
                  >
                    {p}%
                  </button>
                ))}
                <input
                  type="number"
                  value={customTip}
                  onChange={(e) => {
                    setCustomTip(e.target.value);
                    setTipPercentage(0);
                  }}
                  placeholder="Custom ($)"
                  className="p-2 border rounded-md w-28"
                />
              </div>
            </div>
          )}

          {/* Loyalty Points */}
          {user && loyaltyBalance && loyaltyBalance.balancePoints > 0 && (
            <div className="mb-6 bg-amber-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Redeem Loyalty Points</h3>
              <p>
                You have <span className="font-bold">{loyaltyBalance.balancePoints}</span>{' '}
                points available.
              </p>
              <div className="flex items-center gap-4 mt-2">
                <input
                  type="range"
                  min="0"
                  max={loyaltyBalance.balancePoints}
                  value={pointsToRedeem}
                  onChange={(e) => setPointsToRedeem(Number(e.target.value))}
                  className="w-full"
                />
                <span className="font-bold">{pointsToRedeem} pts</span>
              </div>
              <p className="text-sm text-center mt-1">
                Discount: {formatCurrency(pointsToRedeem * 10)}
              </p>
            </div>
          )}

          {/* Order Notes */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Order Notes</h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special instructions?"
              className="w-full p-2 border rounded-md"
              rows={3}
            />
          </div>

          {/* Square payment form (your existing component) */}
          <SquarePaymentForm
            onPaymentSuccess={handlePaymentSuccess}
            isProcessing={isProcessing}
          />
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
