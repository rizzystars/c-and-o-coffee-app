import React, { useEffect, useRef, useState } from "react";

type SquareEnv = "sandbox" | "production";

type DiscountInfo = {
  code?: string;
  type?: "amount" | "percent";
  value?: number;
  amountCents?: number;
};

interface SquarePaymentFormProps {
  /** Final amount in cents (after coupon, tax, tip). */
  amountCents?: number;

  /** Optional: pass a single billing ZIP from your page. If omitted, none is used. */
  postalCode?: string;

  /** Optional context for your receipt page (not sent to Square here). */
  items?: any[];
  discount?: DiscountInfo;
  notes?: string;
  pickupTime?: string;

  onPaymentSuccess: (payment: any) => void;
  onPaymentError: (error: any) => void;
}

declare global {
  interface Window {
    Square?: { payments: (appId: string, locationId: string) => Promise<any> };
    _squareCard?: any;
    __PAY_ENDPOINT?: string;
    __ORDER_ID?: string;
    __TOTAL_CENTS?: number;
    __LAST_PAYMENT?: any;
    __LAST_AMOUNT?: number;
  }
}

const fmtUSD = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const mask = (val?: string) => (!val ? "(missing)" : val.slice(0, 6) + "…" + val.slice(-4));

/** Fallback: read amount (in cents) from window or [data-total-cents] */
function resolveAmountCentsFromDom(): number | null {
  if (typeof window.__TOTAL_CENTS === "number" && window.__TOTAL_CENTS > 0) {
    return Math.round(window.__TOTAL_CENTS);
  }
  const node = document.querySelector("[data-total-cents]") as HTMLElement | null;
  if (node) {
    const n = Number(node.getAttribute("data-total-cents") || "");
    if (!Number.isNaN(n) && n > 0) return Math.round(n);
  }
  return null;
}

const SquarePaymentForm: React.FC<SquarePaymentFormProps> = ({
  amountCents,
  postalCode,         // <- optional, supplied by the page if you want
  items,
  discount,
  notes,
  pickupTime,
  onPaymentSuccess,
  onPaymentError,
}) => {
  const [status, setStatus] = useState<
    "initial" | "loading" | "attaching" | "ready" | "confirm" | "processing" | "success" | "error"
  >("initial");
  const [confirmCents, setConfirmCents] = useState<number | null>(null);
  const [cardError, setCardError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);

  const appId = import.meta.env.VITE_SQUARE_APPLICATION_ID as string | undefined;
  const locationId = import.meta.env.VITE_SQUARE_LOCATION_ID as string | undefined;
  const env = (import.meta.env.VITE_SQUARE_ENV as SquareEnv) || "production";
  const sdkUrl =
    env === "production"
      ? "https://web.squarecdn.com/v1/square.js"
      : "https://sandbox.web.squarecdn.com/v1/square.js";

  const payEndpoint = window.__PAY_ENDPOINT || "/.netlify/functions/pay-square-order";

  // Mirror amount to window for any legacy code using __TOTAL_CENTS
  useEffect(() => {
    if (typeof amountCents === "number" && amountCents > 0) {
      window.__TOTAL_CENTS = Math.round(amountCents);
    }
  }, [amountCents]);

  useEffect(() => {
    let cancelled = false;

    async function loadScriptOnce(): Promise<void> {
      if (window.Square) return;
      await new Promise<void>((resolve, reject) => {
        const existing = document.querySelector(`script[src="${sdkUrl}"]`) as HTMLScriptElement | null;
        if (existing) {
          existing.addEventListener("load", () => resolve(), { once: true });
          existing.addEventListener("error", () => reject(new Error("Square SDK failed to load")), { once: true });
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
        if (!appId || !locationId) throw new Error("Missing Square env vars (VITE_SQUARE_APPLICATION_ID / VITE_SQUARE_LOCATION_ID)");

        await loadScriptOnce();
        if (!window.Square) throw new Error("Square SDK not found on window after load");

        const payments = await window.Square.payments(appId, locationId);

        // Create the card element (no postalCode option here; not supported)
        const card = await payments.card();

        const el = containerRef.current;
        if (!el) throw new Error("Card container ref is null");

        setStatus("attaching");
        await card.attach(el);
        if (cancelled) return;

        try {
          card.addEventListener?.("change", (ev: any) => {
            if (ev?.errors?.length) {
              setCardError(ev.errors.map((e: any) => e.message).join(" · "));
            } else {
              setCardError(null);
            }
          });
        } catch { /* no-op */ }

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
      try { window._squareCard?.destroy?.(); } catch {}
      window._squareCard = undefined;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appId, locationId, env]);

  const handleBeginPay = () => {
    const cents =
      typeof amountCents === "number" && amountCents > 0
        ? Math.round(amountCents)
        : resolveAmountCentsFromDom();

    if (!cents) {
      const err = new Error("Total amount not available.");
      onPaymentError(err);
      setCardError(err.message);
      setStatus("error");
      return;
    }
    setConfirmCents(cents);
    setStatus("confirm");
  };

  const handleConfirmPay = async () => {
    try {
      setStatus("processing");
      setCardError(null);

      const card = window._squareCard;
      if (!card) throw new Error("Card not initialized");

      // Only pass billingDetails if the page gave us a postalCode
      const billingDetails = postalCode?.trim()
        ? ({ postalCode: postalCode.trim() } as any)
        : undefined;

      const tok = await card.tokenize(billingDetails ? { billingDetails } : undefined);
      if (tok.status !== "OK") {
        const msg = (tok.errors || []).map((e: any) => e.message).join(" · ") || "Tokenize failed";
        throw new Error(msg);
      }

      const payload: Record<string, any> = {
        sourceId: tok.token,
        amount: confirmCents,
        currency: "USD",
        orderId: window.__ORDER_ID || undefined,
      };

      const resp = await fetch(payEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await resp.json();
      if (!resp.ok) throw new Error(typeof data === "string" ? data : data?.error || "Payment failed");

      onPaymentSuccess(data);

      try {
        const toStore = (data?.payment ?? data) || {};
        (toStore as any).__clientNotes = notes;
        (toStore as any).__pickupTime = pickupTime;
        (toStore as any).__discount = discount;
        (toStore as any).__items = items?.map?.((i: any) => ({
          name: i?.menuItem?.name,
          qty: i?.quantity,
          price: i?.menuItem?.price,
        }));
        sessionStorage.setItem("lastPayment", JSON.stringify(toStore));
      } catch {}

      window.__LAST_PAYMENT = data?.payment ?? data;
      window.__LAST_AMOUNT = (confirmCents ?? 0) / 100;

      setStatus("success");
      // No redirect here; your CheckoutPage navigates on success.
    } catch (err: any) {
      console.error("[Square] payment error:", err);
      setStatus("ready");
      setCardError(err?.message || "Payment error");
      onPaymentError(err);
    }
  };

  return (
    <div className="p-4 border rounded relative">
      <h3 className="text-lg font-bold mb-2">Payment</h3>

      {/* Debug Banner */}
      <div className="bg-gray-100 text-xs p-2 mb-3 rounded border">
        <div><strong>Env:</strong> {env}</div>
        <div><strong>App ID:</strong> {mask(appId)}</div>
        <div><strong>Location ID:</strong> {mask(locationId)}</div>
        <div><strong>Status:</strong> {status}</div>
      </div>

      {/* Card field */}
      <div ref={containerRef} id="card-container" className="border rounded p-3 min-h-[56px]" />

      {cardError && <p className="mt-2 text-sm text-red-600">{cardError}</p>}

      <button
        onClick={status === "ready" ? handleBeginPay : undefined}
        disabled={status !== "ready"}
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
      >
        {status === "processing" ? "Processing..." : "Pay"}
      </button>

      {/* Confirm Modal */}
      {status === "confirm" && confirmCents !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" />
          <div className="relative z-10 w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h4 className="text-lg font-semibold mb-2">Confirm payment</h4>
            <p className="text-sm text-gray-700 mb-4">
              You’re about to charge <span className="font-semibold">{fmtUSD.format(confirmCents / 100)}</span>.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                className="px-4 py-2 rounded border"
                onClick={() => { setStatus("ready"); setConfirmCents(null); }}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded bg-blue-600 text-white"
                onClick={handleConfirmPay}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SquarePaymentForm;
