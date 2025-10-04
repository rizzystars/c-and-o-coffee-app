// file: components/SquarePaymentForm.tsx
import React, { useEffect, useRef, useState } from "react";

declare global {
  interface Window { Square?: any }
}

const SQUARE_SDK_URL = "https://web.squarecdn.com/v1/square.js";

type Discount =
  | { code: string; type: "amount"; value: number }
  | { code: string; type: "percent"; value: number };

type Props = {
  amountCents: number;
  items: any[];
  discount?: {
    code?: string;
    discount_type?: "amount" | "percent";
    discount_value?: number;
    label?: string;
    amountCents?: number;
  } | null;
  notes?: string;
  pickupTime?: string;
  onPaymentSuccess?: () => void;
  onPaymentError?: (err: unknown) => void;
};

function mask(s?: string) {
  if (!s) return "(empty)";
  return s.length <= 8 ? s : `${s.slice(0, 4)}…${s.slice(-4)}`;
}

async function loadSquareSdk(): Promise<void> {
  if (window.Square?.payments) return;
  const existing = document.querySelector<HTMLScriptElement>(
    `script[src="${SQUARE_SDK_URL}"]`
  );
  if (existing) {
    await new Promise<void>((resolve, reject) => {
      const onLoad = () => { cleanup(); resolve(); };
      const onErr  = () => { cleanup(); reject(new Error("Square SDK script failed (existing tag).")); };
      const cleanup = () => {
        existing.removeEventListener("load", onLoad);
        existing.removeEventListener("error", onErr);
      };
      existing.addEventListener("load", onLoad, { once: true });
      existing.addEventListener("error", onErr, { once: true });
    });
    return;
  }
  await new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = SQUARE_SDK_URL;
    s.async = true;
    s.crossOrigin = "anonymous";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load Square SDK script"));
    document.head.appendChild(s);
  });
}

function normalizeDiscount(d?: Props["discount"]): Discount | null {
  if (!d) return null;
  if (d.discount_type && typeof d.discount_value === "number") {
    return { code: d.code ?? "", type: d.discount_type, value: d.discount_value };
  }
  if (typeof d.amountCents === "number") {
    return { code: d.code ?? "", type: "amount", value: d.amountCents };
  }
  return null;
}

export default function SquarePaymentForm(props: Props) {
  const { amountCents, items, discount, notes, pickupTime, onPaymentSuccess, onPaymentError } = props;
  const [status, setStatus] = useState("env-check");
  const [error, setError]   = useState("");
  const [payments, setPayments] = useState<any>(null);
  const [card, setCard]         = useState<any>(null);
  const cardContainerRef = useRef<HTMLDivElement>(null);

  const appId      = (import.meta as any).env?.VITE_SQUARE_APPLICATION_ID;
  const locationId = (import.meta as any).env?.VITE_SQUARE_LOCATION_ID;
  const clientEnv  = (import.meta as any).env?.VITE_SQUARE_ENV || "production";

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (!appId || !locationId) {
          setStatus("error");
          setError("Missing VITE_SQUARE_APPLICATION_ID or VITE_SQUARE_LOCATION_ID (client). Rebuild after setting them.");
          return;
        }
        setStatus("sdk-loading");
        await loadSquareSdk();
        if (cancelled) return;
        if (!window.Square?.payments) {
          throw new Error("Square SDK loaded but window.Square.payments is missing.");
        }
        setStatus("payments-creating");
        const p = await window.Square.payments(appId, locationId);
        if (cancelled) return;
        setPayments(p);
        setStatus("card-creating");
        const c = await p.card();
        if (cancelled) return;
        if (!cardContainerRef.current) {
          throw new Error("Card container not found in DOM.");
        }
        setStatus("card-attaching");
        await c.attach(cardContainerRef.current);
        if (cancelled) return;
        setCard(c);
        setStatus("ready");
        console.log("[Square] ready", { env: clientEnv, appId: mask(appId), locationId: mask(locationId) });
      } catch (e: any) {
        const msg = e?.message || String(e);
        let hint = "";
        if (/not enabled|domain|origin/i.test(msg)) {
          hint = "This origin is not allowed. Add your domain to Allowed JavaScript Origins in Square Dashboard.";
        } else if (/location/i.test(msg)) {
          hint = "Check that the Location ID belongs to the same app/environment and supports card processing.";
        }
        setStatus("error");
        setError([msg, hint].filter(Boolean).join("  "));
        console.error("[Square] init error:", e);
        onPaymentError?.(e);
      }
    })();
    return () => { cancelled = true; };
  }, [appId, locationId, clientEnv, onPaymentError]);

  async function handlePay() {
    if (!card) return;
    try {
      const result = await card.tokenize();
      if (result?.status !== "OK" || !result?.token) {
        throw new Error(result?.errors?.[0]?.message || "Tokenization failed");
      }
      const sourceId = result.token;
      const d = normalizeDiscount(discount);
      const createRes = await fetch("/.netlify/functions/create-square-order", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          amount_cents: amountCents,
          items,
          notes: notes ?? "",
          pickup_time: pickupTime ?? "ASAP",
          coupon: d ? { code: d.code, type: d.type, value: d.value } : null,
        }),
      });
      const createJson = await createRes.json().catch(() => ({}));
      if (!createRes.ok) throw new Error(createJson?.message || "Failed to create order");
      const orderId = createJson.orderId || createJson.order_id || createJson.id;
      if (!orderId) throw new Error("Order created, but no orderId returned");
      const payRes = await fetch("/.netlify/functions/pay-square-order", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ order_id: orderId, amount_cents: amountCents, source_id: sourceId }),
      });
      const payJson = await payRes.json().catch(() => ({}));
      if (!payRes.ok) throw new Error(payJson?.message || "Payment failed");
      onPaymentSuccess?.();
    } catch (e: any) {
      setStatus("error");
      setError(e?.message || "Payment failed");
      onPaymentError?.(e);
      console.error("[Square] payment flow error:", e);
    }
  }

  if (status !== "ready") {
    return (
      <div className="rounded border p-3 text-sm">
        <div><strong>Square status:</strong> {status}</div>
        {error && <div className="text-red-600 mt-1 break-words">{error}</div>}
        <div className="text-gray-600 mt-1">
          ENV: {String(clientEnv)} — App: {mask(appId)} — Loc: {mask(locationId)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div ref={cardContainerRef} className="border rounded p-3 min-h-[56px]" />
      <button type="button" className="bg-black text-white px-4 py-2 rounded" onClick={handlePay}>
        Pay {(amountCents / 100).toFixed(2)}
      </button>
    </div>
  );
}
