import React, { useEffect } from "react";
import Square from "@square/web-sdk";
import { toast } from "react-hot-toast";

interface SquarePaymentFormProps {
  amountCents: number;
  items: any[];
  discount?: { code: string; label: string; amountCents: number };
  notes?: string;
  pickupTime?: string;
  onPaymentSuccess: (data: any) => void;
  onPaymentError: (error: any) => void;
}

const SquarePaymentForm: React.FC<SquarePaymentFormProps> = ({
  amountCents,
  items,
  discount,
  notes,
  pickupTime,
  onPaymentSuccess,
  onPaymentError,
}) => {
  useEffect(() => {
    let card: any;

    async function initSquare() {
      try {
        const payments = Square.payments(
          process.env.REACT_APP_SQUARE_APP_ID!,
          process.env.REACT_APP_SQUARE_LOCATION_ID!
        );
        card = await payments.card();
        await card.attach("#card-container");
      } catch (err) {
        console.error("Square init error:", err);
        toast.error("Unable to load payment form.");
      }
    }

    initSquare();

    return () => {
      if (card) {
        card.destroy();
      }
    };
  }, []);

  async function handlePayment() {
    try {
      const payments = Square.payments(
        process.env.REACT_APP_SQUARE_APP_ID!,
        process.env.REACT_APP_SQUARE_LOCATION_ID!
      );
      const card = await payments.card();
      await card.attach("#card-container");

      const result = await card.tokenize();
      if (result.status !== "OK") {
        throw new Error(result.errors?.[0]?.detail || "Payment failed.");
      }

      const sourceId = result.token;

      // Send to Netlify backend
      const res = await fetch("/.netlify/functions/create-square-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceId,
          amountCents,
          items,
          discount,
          notes,
          pickupTime,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Payment could not be processed");
      }

      toast.success("Payment successful!");
      onPaymentSuccess(data);
    } catch (err: any) {
      console.error("Payment error:", err);
      toast.error(err.message || "Payment failed");
      onPaymentError(err);
    }
  }

  return (
    <div>
      <div id="card-container" className="mb-4" />
      <button
        onClick={handlePayment}
        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
      >
        Pay ${(amountCents / 100).toFixed(2)}
      </button>
    </div>
  );
};

export default SquarePaymentForm;
