import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCartStore } from "../hooks/useCartStore";
import { useAuthStore } from "../hooks/useAuthStore";
import SquarePaymentForm from "../components/SquarePaymentForm";
import { toast } from "react-hot-toast";

// normalize prices (handles cents vs dollars)
const normalizePrice = (val: any) => {
  const n = Number(val) || 0;
  return n > 50 ? n / 100 : n;
};

const TAX_PERCENT = Number((import.meta as any).env?.VITE_TAX_PERCENT ?? 6);

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { items, clearCart } = useCartStore();
  const user = useAuthStore((state) => state.user);

  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponCode, setCouponCode] = useState("");
  const [couponError, setCouponError] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const [pickupTime, setPickupTime] = useState("ASAP");
  const [tipPercent, setTipPercent] = useState(0);

  const cart = Array.isArray(items) ? items : [];

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
        <h2 className="text-2xl font-bold mb-4">Please sign in to checkout</h2>
        <button
          onClick={() => navigate("/signin")}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
        >
          Sign In
        </button>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <h2 className="text-2xl font-bold mb-3">Your cart is empty</h2>
        <button
          onClick={() => navigate("/menu")}
          className="bg-gray-800 text-white px-6 py-2 rounded-lg hover:bg-gray-900"
        >
          Go to Menu
        </button>
      </div>
    );
  }

  // subtotal in dollars
  const subtotal = cart.reduce(
    (sum, item) => sum + normalizePrice(item.menuItem?.price) * (item.quantity || 1),
    0
  );

  const tip = subtotal * (tipPercent / 100);
  const discount = appliedCoupon?.amountCents ? appliedCoupon.amountCents / 100 : 0;
  const tax = (subtotal - discount + tip) * (TAX_PERCENT / 100);
  const total = subtotal - discount + tip + tax;
  const totalCents = Math.round(total * 100);

  // coupon handler
  async function applyCoupon(e: React.FormEvent) {
    e.preventDefault();
    setCouponError("");
    try {
      const res = await fetch("/.netlify/functions/coupon-validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode }),
      });
      const data = await res.json();
      if (!res.ok || !data?.valid) {
        setCouponError("Invalid or expired coupon code.");
        setAppliedCoupon(null);
      } else {
        setAppliedCoupon(data);
        toast.success(`Coupon applied: ${data.label}`);
      }
    } catch (err: any) {
      console.error(err);
      setCouponError("Coupon validation failed.");
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Checkout</h1>

      {/* Order Summary */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h2 className="text-xl font-semibold mb-3">Order Summary</h2>
        {cart.map((item, idx) => (
          <div key={idx} className="flex justify-between py-1 border-b">
            <span>
              {item.quantity} × {item.menuItem?.name}
            </span>
            <span>
              ${(normalizePrice(item.menuItem?.price) * item.quantity).toFixed(2)}
            </span>
          </div>
        ))}
        <div className="flex justify-between mt-2">
          <span>Subtotal</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        {appliedCoupon && (
          <div className="flex justify-between text-green-600">
            <span>{appliedCoupon.label}</span>
            <span>- ${(appliedCoupon.amountCents / 100).toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span>Tip ({tipPercent}%)</span>
          <span>${tip.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>Tax ({TAX_PERCENT}%)</span>
          <span>${tax.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-bold text-lg mt-2">
          <span>Total</span>
          <span>${total.toFixed(2)}</span>
        </div>
      </div>

      {/* Coupon Form */}
      <form onSubmit={applyCoupon} className="mb-6">
        <input
          type="text"
          placeholder="Coupon code"
          value={couponCode}
          onChange={(e) => setCouponCode(e.target.value)}
          className="border p-2 rounded mr-2"
        />
        <button type="submit" className="bg-gray-700 text-white px-4 py-2 rounded">
          Apply
        </button>
        {couponError && <p className="text-red-600 mt-1">{couponError}</p>}
      </form>

      {/* Tip selection */}
      <div className="mb-6">
        <label className="font-semibold mr-2">Tip:</label>
        {[0, 10, 15, 20].map((pct) => (
          <button
            key={pct}
            type="button"
            onClick={() => setTipPercent(pct)}
            className={`px-3 py-1 mr-2 rounded ${
              tipPercent === pct ? "bg-blue-600 text-white" : "bg-gray-200"
            }`}
          >
            {pct}%
          </button>
        ))}
      </div>

      {/* Pickup time */}
      <div className="mb-6">
        <label className="font-semibold mr-2">Pickup:</label>
        <select
          value={pickupTime}
          onChange={(e) => setPickupTime(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="ASAP">ASAP</option>
          <option value="15min">15 minutes</option>
          <option value="30min">30 minutes</option>
        </select>
      </div>

      {/* Notes */}
      <div className="mb-6">
        <label className="block font-semibold mb-1">Order Notes:</label>
        <textarea
          value={orderNotes}
          onChange={(e) => setOrderNotes(e.target.value)}
          className="w-full border p-2 rounded"
        />
      </div>

      {/* Payment */}
      <SquarePaymentForm
        amountCents={totalCents}
        items={cart}
        discount={appliedCoupon}
        notes={orderNotes}
        pickupTime={pickupTime}
        onPaymentSuccess={() => {
          clearCart();
          navigate("/order-confirmation");
        }}
        onPaymentError={(err) => console.error("Payment error:", err)}
      />
    </div>
  );
};

export default CheckoutPage;
