import React, { useEffect, useState } from "react";

interface SquarePaymentFormProps {
  onPaymentSuccess: (payment: any) => void;
  onPaymentError: (error: any) => void;
}

const mask = (val?: string) => {
  if (!val) return "(missing)";
  return val.slice(0, 6) + "…" + val.slice(-4);
};

const SquarePaymentForm: React.FC<SquarePaymentFormProps> = ({
  onPaymentSuccess,
  onPaymentError,
}) => {
  const [status, setStatus] = useState("initial");

  const appId = import.meta.env.VITE_SQUARE_APPLICATION_ID;
  const locationId = import.meta.env.VITE_SQUARE_LOCATION_ID;
  const env = import.meta.env.VITE_SQUARE_ENV || "production";

  useEffect(() => {
    const init = async () => {
      try {
        setStatus("loading");

        if (!appId || !locationId) {
          throw new Error("Missing Square env vars");
        }

        if (!(window as any).Square) {
          throw new Error("Square SDK not found on window");
        }

        const payments = (window as any).Square.payments(appId, locationId);
        const card = await payments.card();

        setStatus("attaching");
        await card.attach("#card-container");

        (window as any)._squareCard = card;
        setStatus("ready");
      } catch (err) {
        console.error("[Square] init error:", err);
        setStatus("error");
        onPaymentError(err);
      }
    };

    init();
  }, [onPaymentError]);

  const handlePayment = async () => {
    try {
      setStatus("processing");
      const card = (window as any)._squareCard;
      if (!card) throw new Error("Card not initialized");

      const result = await card.tokenize();
      if (result.status !== "OK") throw new Error(result.errors);

      console.log("[Square] tokenized:", result);

      // TODO: send result.token to your Netlify backend
      onPaymentSuccess(result);
      setStatus("success");
    } catch (err) {
      console.error("[Square] payment error:", err);
      setStatus("error");
      onPaymentError(err);
    }
  };

  return (
    <div className="p-4 border rounded">
      <h3 className="text-lg font-bold mb-2">Payment</h3>

      {/* Debug Banner */}
      <div className="bg-gray-100 text-xs p-2 mb-3 rounded border">
        <div><strong>Env:</strong> {env}</div>
        <div><strong>App ID:</strong> {mask(appId)}</div>
        <div><strong>Location ID:</strong> {mask(locationId)}</div>
        <div><strong>Status:</strong> {status}</div>
      </div>

      {/* Card field mounts here */}
      <div id="card-container" className="border rounded p-3 min-h-[56px]" />

      <button
        onClick={handlePayment}
        disabled={status !== "ready"}
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
      >
        {status === "processing" ? "Processing..." : "Pay"}
      </button>
    </div>
  );
};

export default SquarePaymentForm;
