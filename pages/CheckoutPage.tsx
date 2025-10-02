import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCartStore } from "../hooks/useCartStore";
import { useAuthStore } from "../hooks/useAuthStore";
import SquarePaymentForm from "../components/SquarePaymentForm";

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items: rawItems = [], clearCart } = useCartStore();
  const { user } = useAuthStore();

  // normalize items in case of unexpected shape
  const cart = Array.isArray(rawItems) ? rawItems : [];
  const safeItems = cart.filter((it: any) => it && it.menuItem && it.quantity > 0);

  const [pickupTime, setPickupTime] = useState("asap");
  const [notes, setNotes] = useState("");
  const [tip, setTip] = useState(0);
  const [appliedDiscount, setAppliedDiscount] = useState<{ code: string; amount: number } | null>(null);
  const [couponError, setCouponError] = useState("");

  // tax percent from env or default 6%
  const TAX_PERCENT: number = Number((import.meta as any).env?.VITE_TAX_PERCENT ?? 6);

  const subtotal = safeItems.reduce(
    (sum, item: any) => sum + item.menuItem.price * item.quantity,
    0
  );
  const discount = appliedDiscount ? appliedDiscount.amount : 0;
  const taxedAmount = (subtotal - discount) * (TAX_PERCENT / 100);
  const total = subtotal - discount + taxedAmount + tip;

  const handleApplyCoupon = (couponCode: string) => {
    setCouponError("");
    if (couponCode.toLowerCase() === "espresso") {
      try {
        const isEspressoInCart = safeItems.some((item: any) =>
          item.menuItem.name.toLowerCase().includes("espresso")
        );
        if (isEspressoInCart) {
          setAppliedDiscount({ code: couponCode, amount: 2.0 });
        } else {
          setCouponError("This code requires an Espresso Shot in your cart.");
        }
      } catch {
        setCouponError("Could not validate coupon.");
      }
    } else {
      setCouponError("Invalid coupon code.");
    }
  };

  // Require sign-in
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-4">
        <h2 className="text-2xl font-bold mb-4">Please Sign In</h2>
        <p className="mb-6">You must be signed in to checkout.</p>
        <button
          onClick={() => navigate("/account")}
          className="bg-gray-800 text-white font-bold py-2 px-6 rounded-lg hover:bg-gray-900 transition-colors"
        >
          Sign In
        </button>
      </div>
    );
  }

  // Empty cart state
  if (safeItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <h2 className="text-2xl font-bold mb-3">Your cart is empty</h2>
        <p className="text-gray-600 mb-6">Add some items before checking out.</p>
        <button
          onClick={() => navigate("/menu")}
          className="bg-gray-800 text-white font-bold py-2 px-6 rounded-lg hover:bg-gray-900 transition-colors"
        >
          Go to Menu
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <h1 className="text-4xl font-extrabold mb-8 text-gray-800 border-b pb-4">Checkout</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Order Summary */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Order Summary</h2>
          <ul className="divide-y divide-gray-200">
            {safeItems.map((item: any) => (
              <li key={item.id} className="py-4 flex justify-between items-center">
                <div>
                  <p className="font-semibold">{item.menuItem.name}</p>
                  <p className="text-sm text-gray-600">
                    Qty: {item.quantity} × ${item.menuItem.price.toFixed(2)}
                  </p>
                </div>
                <p className="font-semibold">
                  ${(item.menuItem.price * item.quantity).toFixed(2)}
                </p>
              </li>
            ))}
          </ul>

          {/* Totals */}
          <div className="mt-6 space-y-2 text-gray-700">
            <p>Subtotal: ${subtotal.toFixed(2)}</p>
            {appliedDiscount && <p>Discount: -${discount.toFixed(2)}</p>}
            <p>Tax ({TAX_PERCENT}%): ${taxedAmount.toFixed(2)}</p>
            {tip > 0 && <p>Tip: ${tip.toFixed(2)}</p>}
            <p className="text-xl font-bold">Total: ${total.toFixed(2)}</p>
          </div>

          {/* Coupon */}
          <div className="mt-6">
            <h3 className="font-semibold mb-2">Apply Coupon</h3>
            <CouponForm onApply={handleApplyCoupon} />
            {couponError && <p className="text-red-500 mt-2">{couponError}</p>}
          </div>

          {/* Tip */}
          <div className="mt-6">
            <h3 className="font-semibold mb-2">Add a Tip</h3>
            <div className="flex gap-2">
              {[0, 1, 2, 5].map((amt) => (
                <button
                  key={amt}
                  onClick={() => setTip(amt)}
                  className={`px-3 py-2 rounded border ${
                    tip === amt ? "bg-gray-800 text-white" : "bg-white text-gray-800"
                  }`}
                >
                  {amt === 0 ? "No Tip" : `$${amt}`}
                </button>
              ))}
            </div>
          </div>

          {/* Pickup Time */}
          <div className="mt-6">
            <h3 className="font-semibold mb-2">Pickup Time</h3>
            <select
              value={pickupTime}
              onChange={(e) => setPickupTime(e.target.value)}
              className="w-full border p-2 rounded"
            >
              <option value="asap">ASAP</option>
              <option value="5">In 5 minutes</option>
              <option value="10">In 10 minutes</option>
              <option value="15">In 15 minutes</option>
            </select>
          </div>

          {/* Notes */}
          <div className="mt-6">
            <h3 className="font-semibold mb-2">Order Notes</h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border p-2 rounded"
              rows={3}
              placeholder="Any special instructions?"
            />
          </div>
        </div>

        {/* Payment */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Payment</h2>
          <SquarePaymentForm
            amount={total}
            onSuccess={() => {
              clearCart();
              navigate("/confirmation");
            }}
          />
        </div>
      </div>
    </div>
  );
}

function CouponForm({ onApply }: { onApply: (code: string) => void }) {
  const [code, setCode] = useState("");

  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        className="border p-2 flex-grow rounded"
        placeholder="Enter coupon"
      />
      <button
        onClick={() => {
          if (code.trim()) onApply(code.trim());
        }}
        className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-900"
      >
        Apply
      </button>
    </div>
  );
}
