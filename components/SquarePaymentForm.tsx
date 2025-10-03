import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

declare global {
  interface Window {
    Square: any;
  }
}

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
  // State to hold the initialized Card payment form instance
  const [cardInstance, setCardInstance] = useState<any>(null);
  // State to track loading status
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let card: any;

    async function initSquare() {
      try {
        if (!window.Square) {
          // Check for the script tag loading issue first
          throw new Error("Square.js SDK not loaded (window.Square is null).");
        }

        const payments = window.Square.payments(
          import.meta.env.VITE_SQUARE_APPLICATION_ID!,
          import.meta.env.VITE_SQUARE_LOCATION_ID!
        );

        card = await payments.card();
        await card.attach("#card-container");
        
        // Store the initialized card instance for later use in handlePayment
        setCardInstance(card);
        setIsLoading(false);

      } catch (err: any) {
        console.error("Square init error:", err);
        toast.error(err.message || "Unable to load payment form.");
        setIsLoading(false);
      }
    }

    initSquare();

    return () => {
      if (card) {
        card.destroy();
      }
    };
  }, []); // Empty dependency array ensures this runs only once

  async function handlePayment() {
    try {
      if (!cardInstance) {
        // If cardInstance is null, it means initialization failed or is still loading
        throw new Error("Square SDK not available. Please wait or refresh.");
      }
      
      // We no longer re-initialize the payment object or attach the card form here.
      // We go directly to tokenization using the stored instance.

      const result = await cardInstance.tokenize();
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
        disabled={isLoading} // Disable button while loading or if initialization failed
        className={`text-white px-4 py-2 rounded ${
          isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
        }`}
      >
        {isLoading ? 'Loading Payment...' : `Pay $${(amountCents / 100).toFixed(2)}`}
      </button>
    </div>
  );
};

export default SquarePaymentForm;
