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

// Types for normalized coupon we store in state
type CouponClient = {
  code: string;
  discount_type: "amount" | "percent";
  discount_value: number; // cents if 'amount', 0-100 if 'percent'
  message?: string;
};

function dollarsToCents(d: number) {
  return Math.round(d * 100);
}

function centsToDollars(c: number) {
  return Math.max(0, c) / 100;
}

// Calculate discount in **cents** from a coupon and the current subtotal in cents
function calcDiscountCents(subtotalCents: number, c?: CouponClient | null) {
  if (!c) return 0;
  if (c.discount_type === "amount") {
    return Math.min(subtotalCents, Math.max(0, Math.round(c.discount_value)));
  }
  // percent (0-100)
  const pct = Math.min(100, Math.max(0, c.discount_value));
  return Math.round(subtotalCents * (pct / 100));
}

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { items, clearCart } = useCartStore();
  const user = useAuthStore((state) => state.user);

  // Store *raw* coupon from server (normalized to our CouponClient shape)
  const [coupon, setCoupon] = useState<CouponClient | null>(null);
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

  // === Totals ===
  // subtotal in dollars (from cart)
  const subtotal = cart.reduce(
    (sum, item) => sum + normalizePrice(item.menuItem?.price) * (item.quantity || 1),
    0
  );
  const subtotalCents = dollarsToCents(subtotal);

  // discount based on current subtotal + applied coupon
  const discountCents = calcDiscountCents(subtotalCents, coupon);
  const discount = centsToDollars(discountCents);

  const tip = subtotal * (tipPercent / 100); // you can switch to cents similarly if you prefer
  const tax = (subtotal - discount + tip) * (TAX_PERCENT / 100);
  const total = subtotal - discount + tip + tax;
  const totalCents = dollarsToCents(total);

  // Coupon handler (talks to /.netlify/functions/coupon-validate)
  async function applyCoupon(e: React.FormEvent) {
    e.preventDefault();
    setCouponError("");
    try {
      const res = await fetch("/.netlify/functions/coupon-validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // DO NOT uppercase; backend is case-insensitive already (.ilike)
        body: JSON.stringify({ code: couponCode.trim() }),
      });
      const data = await res.json();

      if (!res.ok || !data?.ok) {
        setCoupon(null);
        setCouponError(data?.message || "Invalid or expired coupon code.");
        return;
      }

      // Normalize to our expected shape
      const normalized: CouponClient = {
        code: data.code,
        discount_type: data.discount_type,
        discount_value: data.discount_value,
        message: data.message,
      };
      setCoupon(normalized);

      // Friendly label (for UI line item)
      const label =
        normalized.discount_type === "amount"
          ? `Coupon ${normalized.code} (-$${(normalized.discount_value / 100).toFixed(2)})`
          : `Coupon ${normalized.code} (-${normalized.discount_value}% )`;

      toast.success(`Coupon applied: ${label}`);
    } catch (err: any) {
      console.error(err);
      setCoupon(null);
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

        {coupon && (
          <div className="flex justify-between text-green-600">
            <span>
              {coupon.discount_type === "amount"
                ? `Coupon ${coupon.code}`
                : `Coupon ${coupon.code} (${coupon.discount_value}% off)`}
            </span>
            <span>- ${discount.toFixed(2)}</span>
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
        amountCents={totalCents}          // already discounted + tax + tip
        items={cart}
        discount={{
          // optional prop if your SquarePaymentForm uses it
          code: coupon?.code,
          type: coupon?.discount_type,
          value: coupon?.discount_value,
          amountCents: discountCents,
        }}
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
