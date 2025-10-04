import React, { useEffect, useRef, useState } from "react";

interface SquarePaymentFormProps {
  onPaymentSuccess: (payment: any) => void;
  onPaymentError: (error: any) => void;
}

type SquareEnv = "sandbox" | "production";

declare global {
  interface Window {
    Square?: {
      payments: (appId: string, locationId: string) => Promise<any>;
    };
    _squareCard?: any;
  }
}

const mask = (val?: string) => {
  if (!val) return "(missing)";
  return val.slice(0, 6) + "…" + val.slice(-4);
};

const SquarePaymentForm: React.FC<SquarePaymentFormProps> = ({
  onPaymentSuccess,
  onPaymentError,
}) => {
  const [status, setStatus] = useState<
    "initial" | "loading" | "attaching" | "ready" | "processing" | "success" | "error"
  >("initial");

  const containerRef = useRef<HTMLDivElement | null>(null);

  const appId = import.meta.env.VITE_SQUARE_APPLICATION_ID as string | undefined;
  const locationId = import.meta.env.VITE_SQUARE_LOCATION_ID as string | undefined;
  const env = (import.meta.env.VITE_SQUARE_ENV as SquareEnv) || "production";

  const sdkUrl =
    env === "production"
      ? "https://web.squarecdn.com/v1/square.js"
      : "https://sandbox.web.squarecdn.com/v1/square.js";

  useEffect(() => {
    let cancelled = false;

    async function loadScriptOnce(): Promise<void> {
      if (window.Square) return;

      await new Promise<void>((resolve, reject) => {
        // Already added?
        const existing = document.querySelector(
          `script[src="${sdkUrl}"]`
        ) as HTMLScriptElement | null;

        if (existing) {
          const onLoad = () => resolve();
          const onError = () => reject(new Error("Square SDK failed to load"));
          existing.addEventListener("load", onLoad, { once: true });
          existing.addEventListener("error", onError, { once: true });
          // if it already finished loading, resolve immediately
          if ((existing as any).complete) resolve();
          return;
        }

        const s = document.createElement("script");
        s.src = sdkUrl;
        s.async = true;
        s.onload = () => resolve();
        s.onerror = () => reject(new Error("Square SDK failed to load"));
        document.head.appendChild(s);
      });
    }

    async function init() {
      try {
        setStatus("loading");

        if (!appId || !locationId) {
          throw new Error("Missing Square env vars (VITE_SQUARE_APPLICATION_ID / VITE_SQUARE_LOCATION_ID)");
        }

        await loadScriptOnce();

        if (!window.Square) {
          throw new Error("Square SDK not found on window after load");
        }

        const payments = await window.Square.payments(appId, locationId);
        const card = await payments.card();

        // Ensure container exists
        await Promise.resolve();
        const el = containerRef.current;
        if (!el) throw new Error("Card container ref is null");

        setStatus("attaching");
        await card.attach(el);
        if (cancelled) return;

        window._squareCard = card;
        setStatus("ready");
      } catch (err) {
        console.error("[Square] init error:", err);
        setStatus("error");
        onPaymentError(err);
      }
    }

    init();

    return () => {
      cancelled = true;
      try {
        window._squareCard?.destroy?.();
      } catch {/* no-op */}
      window._squareCard = undefined;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appId, locationId, env]);

  const handlePayment = async () => {
    try {
      setStatus("processing");
      const card = window._squareCard;
      if (!card) throw new Error("Card not initialized");

      const result = await card.tokenize();
      if (result.status !== "OK") {
        throw new Error(JSON.stringify(result.errors ?? "Tokenize failed"));
      }

      // send result.token to your Netlify Function from here if desired
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
      <div ref={containerRef} id="card-container" className="border rounded p-3 min-h-[56px]" />

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
