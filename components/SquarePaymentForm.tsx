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

    /** Optional globals you might already set elsewhere */
    __PAY_ENDPOINT?: string;          // e.g. "/.netlify/functions/pay-square-order"
    __ORDER_ID?: string;              // your order id if you have one
    __TOTAL_CENTS?: number;           // total in cents
  }
}

const mask = (val?: string) => {
  if (!val) return "(missing)";
  return val.slice(0, 6) + "…" + val.slice(-4);
};

/** Try to discover an amount (in cents) without changing any envs or pages.
 *  1) window.__TOTAL_CENTS
 *  2) an element with id="total-cents" or data-total-cents
 *  3) a prompt (so you can quickly test a real card)
 */
function resolveAmountCents(): number | null {
  if (typeof window.__TOTAL_CENTS === "number" && window.__TOTAL_CENTS > 0) {
    return Math.round(window.__TOTAL_CENTS);
  }

  const byId = document.getElementById("total-cents");
  if (byId && byId.textContent) {
    const n = Number(byId.textContent.trim());
    if (!Number.isNaN(n) && n > 0) return Math.round(n);
  }

  const dataNode = document.querySelector("[data-total-cents]") as HTMLElement | null;
  if (dataNode) {
    const attr = dataNode.getAttribute("data-total-cents");
    if (attr) {
      const n = Number(attr);
      if (!Number.isNaN(n) && n > 0) return Math.round(n);
    }
  }

  // Last resort: prompt for dollars so you can immediately test a live charge
  const dollars = window.prompt("Enter amount to charge (USD, e.g. 3.18):", "3.18");
  if (!dollars) return null;
  const num = Number(dollars);
  if (Number.isNaN(num) || num <= 0) return null;
  return Math.round(num * 100);
}

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

  // Where to POST the payment request
  const payEndpoint = window.__PAY_ENDPOINT || "/.netlify/functions/pay-square-order";

  useEffect(() => {
    let cancelled = false;

    async function loadScriptOnce(): Promise<void> {
      if (window.Square) return;

      await new Promise<void>((resolve, reject) => {
        const existing = document.querySelector(
          `script[src="${sdkUrl}"]`
        ) as HTMLScriptElement | null;

        if (existing) {
          existing.addEventListener("load", () => resolve(), { once: true });
          existing.addEventListener("error", () => reject(new Error("Square SDK failed to load")), { once: true });
          // If already loaded previously:
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
      } catch { /* no-op */ }
      window._squareCard = undefined;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appId, locationId, env]);

  const handlePayment = async () => {
    try {
      setStatus("processing");
      const card = window._squareCard;
      if (!card) throw new Error("Card not initialized");

      // Tokenize the card
      const result = await card.tokenize();
      if (result.status !== "OK") {
        throw new Error(JSON.stringify(result.errors ?? "Tokenize failed"));
      }

      // Figure out how much to charge (in cents) without changing your envs
      const amountCents = resolveAmountCents();
      if (!amountCents) {
        throw new Error("Charge amount not provided. (No window.__TOTAL_CENTS / #total-cents / data-total-cents, and prompt canceled.)");
      }

      // Call your Netlify Function in PRODUCTION mode
      const resp = await fetch(payEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceId: result.token,
          amount: amountCents,
          currency: "USD",
          orderId: window.__ORDER_ID || undefined,
        }),
      });

      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(typeof data === "string" ? data : data?.error || "Payment failed");
      }

      onPaymentSuccess(data);
      setStatus("success");
    } catch (err: any) {
      console.error("[Square] payment error:", err);
      setStatus("error");
      onPaymentError(err);
      alert(`Payment error: ${err?.message || err}`);
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
 