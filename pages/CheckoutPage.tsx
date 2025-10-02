import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCartStore } from "../hooks/useCartStore";
import { useAuthStore } from "../hooks/useAuthStore";
import SquarePaymentForm from "../components/SquarePaymentForm";
import { VITE_TAX_PERCENT as TAX_PERCENT } from "../constants";

const VITE_TAX_PERCENT: number = (typeof TAX_PERCENT === "number" ? TAX_PERCENT : 6);

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { cart, clearCart } = useCartStore();
  const { user } = useAuthStore();

  const [tipPercentage, setTipPercentage] = useState(15);
  const [pickupTime, setPickupTime] = useState("As soon as possible (15-20 min)");
  const [notes, setNotes] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<{ code: string; amount: number } | null>(null);
  const [couponError, setCouponError] = useState("");

  const subtotal = cart.reduce((acc, item) => acc + item.menuItem.price * item.quantity, 0);
  const taxAmount = subtotal * (VITE_TAX_PERCENT / 100);
  const tipAmount = subtotal * (tipPercentage / 100);

  let discountAmount = appliedDiscount ? appliedDiscount.amount : 0;
  if (subtotal + taxAmount + tipAmount - discountAmount < 0) {
    discountAmount = subtotal + taxAmount + tipAmount;
  }
  const total = subtotal + taxAmount + tipAmount - discountAmount;

  useEffect(() => {
    if (cart.length === 0) {
      navigate("/menu");
    }
  }, [cart, navigate]);

  const handlePaymentSuccess = async (orderId: string) => {
    navigate("/confirmation", {
      state: {
        orderId,
        total,
        pickupTime,
        items: cart,
      },
    });
    clearCart();
  };

  const handleApplyCoupon = async () => {
    setCouponError("");
    setAppliedDiscount(null);
    if (!couponCode) {
      setCouponError("Please enter a code.");
      return;
    }
    try {
      const isEspressoInCart = cart.some((item) => item.menuItem.name.toLowerCase().includes("espresso"));
      if (isEspressoInCart) {
        setAppliedDiscount({ code: couponCode, amount: 2.0 });
        setCouponCode("");
      } else {
        setCouponError("This code requires an Espresso Shot in your cart.");
      }
    } catch (error: any) {
      setCouponError(error.message || "Invalid coupon code.");
      setAppliedDiscount(null);
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-4">
        <h2 className="text-2xl font-bold mb-4">Please Sign In</h2>
        <p className="mb-6">You need to be signed in to complete your order.</p>
        <button onClick={() => navigate("/login")} className="bg-blue-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-700 transition-colors">
          Go to Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <h1 className="text-4xl font-extrabold mb-8 text-gray-800 border-b pb-4">Checkout</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Order Summary */}
        <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
          <h2 className="text-2xl font-bold mb-6 text-gray-700">Your Order</h2>
          <div className="space-y-4 mb-6">
            {cart.map((item) => (
              <div key={item.id} className="flex justify-between items-center text-gray-600">
                <span>
                  {item.quantity} x {item.menuItem.name}
                </span>
                <span>${(item.menuItem.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>

          {/* Coupon Code Section */}
          <div className="mb-6">
            <label htmlFor="coupon" className="block text-sm font-medium text-gray-700 mb-2">
              Have a code?
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                id="coupon"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder="Enter reward code"
                className="flex-grow p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              />
              <button
                onClick={handleApplyCoupon}
                className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-800 transition-colors font-semibold disabled:bg-gray-400"
              >
                Apply
              </button>
            </div>
            {couponError && <p className="text-red-500 text-sm mt-2">{couponError}</p>}
          </div>

          <div className="border-t border-gray-200 pt-6 space-y-3">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            {appliedDiscount && (
              <div className="flex justify-between text-green-600 font-semibold">
                <span>Discount ({appliedDiscount.code})</span>
                <span>- ${discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-600">
              <span>Tax ({VITE_TAX_PERCENT}%)</span>
              <span>${taxAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Tip ({tipPercentage}%)</span>
              <span>${tipAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-2xl font-extrabold text-gray-800 mt-4 pt-4 border-t border-gray-300">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Order Options & Payment */}
        <div className="space-y-8">
          <div>
            <h2 className="text-xl font-bold mb-4 text-gray-700">Pickup Time</h2>
            <div className="flex flex-wrap gap-3">
              {["As soon as possible (15-20 min)", "In 30 minutes", "In 1 hour"].map((time) => (
                <button
                  key={time}
                  onClick={() => setPickupTime(time)}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    pickupTime === time
                      ? "bg-gray-800 text-white shadow-md"
                      : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-100"
                  }`}
                >
                  {time}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold mb-4 text-gray-700">Add a Tip</h2>
            <div className="flex flex-wrap gap-3">
              {[15, 20, 25].map((perc) => (
                <button
                  key={perc}
                  onClick={() => setTipPercentage(perc)}
                  className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                    tipPercentage === perc
                      ? "bg-gray-800 text-white shadow-md"
                      : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-100"
                  }`}
                >
                  {perc}%
                </button>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold mb-4 text-gray-700">Order Notes</h2>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special requests?"
              className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              rows={3}
            ></textarea>
          </div>

          <div>
            <h2 className="text-xl font-bold mb-4 text-gray-700">Payment</h2>
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <SquarePaymentForm
                amount={total}
                onPaymentSuccess={handlePaymentSuccess}
                cartItems={cart}
                tipCents={Math.round(tipAmount * 100)}
                couponCode={appliedDiscount?.code}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
