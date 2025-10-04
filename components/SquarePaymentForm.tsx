// file: components/SquarePaymentForm.tsx
import React, { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    Square?: any;
  }
}

const SQUARE_SDK_URL = "https://web.squarecdn.com/v1/square.js";

type Discount =
  | { code: string; type: "amount"; value: number }   // cents
  | { code: string; type: "percent"; value: number }; // 0-100

type Props = {
  amountCents: number;
  items: any[];
  discount?: {
    code?: string;
    discount_type?: "amount" | "percent";
    discount_value?: number;
    label?: string;
    amountCents?: number; // compat with current page object
  } | null;
  notes?: string;
  pickupTime?: string;
  onPaymentSuccess?: () => void;
  onPaymentError?: (err: unknown) => void;
};

// Robust script loader (reuses an existing <script> tag)
async function ensureSquareSdk(): Promise<void> {
  if (window.Square) return;

  const existing = document.querySelector(
    `script[src="${SQUARE_SDK_URL}"]`
  ) as HTMLScriptElement | null;

  if (existing) {
    await new Promise<void>((resolve, reject) => {
      const ok = () => {
        existing.removeEventListener("load", ok);
        existing.removeEventListener("error", fail);
        resolve();
      };
      const fail = () => reject(new Error("Square SDK script error (existing)"));
      existing.addEventListener("load", ok, { once: true });
      existing.addEventListener("error", fail, { once: true });
    });
    return;
  }

  await new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = SQUARE_SDK_URL;
    s.async = true;
    s.crossOrigin = "anonymous";
    s.referrerPolicy = "no-referrer";
    s.onload = () => resolve();
    s.onerror = () => {
      console.error("❌ Failed to load Square SDK script", {
        url: SQUARE_SDK_URL,
        appId: import.meta.env.VITE_SQUARE_APPLICATION_ID,
        env: import.meta.env.VITE_SQUARE_ENV,
        locationId: import.meta.env.VITE_SQUARE_LOCATION_ID,
      });
      reject(new Error("Failed to load Square SDK script"));
    };
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

  const [payments, setPayments] = useState<any>(null);
  const [card, setCard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [errMsg, setErrMsg] = useState<string>("");

  const cardContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setErrMsg("");

        await ensureSquareSdk();

        const appId = import.meta.env.VITE_SQUARE_APPLICATION_ID as string | undefined;
        const locationId = import.meta.env.VITE_SQUARE_LOCATION_ID as string | undefined;
        if (!appId || !locationId) {
          throw new Error("Missing VITE_SQUARE_APPLICATION_ID or VITE_SQUARE_LOCATION_ID (check Netlify Production env and redeploy).");
        }

        const p = await window.Square!.payments(appId, locationId);
        if (cancelled) return;
        setPayments(p);
        console.log("✅ Square payments initialized", {
          env: import.meta.env.VITE_SQUARE_ENV,
          appId,
          locationId,
        });

        const card = await p.card();
        await card.attach(cardContainerRef.current);
        if (cancelled) return;
        setCard(card);
      } catch (err) {
        console.error("Error initializing Square:", err);
        setErrMsg(err instanceof Error ? err.message : String(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handlePay() {
    try {
      setBusy(true);
      setErrMsg("");

      if (!payments || !card) throw new Error("Payments not ready.");

      const result = await card.tokenize();
      if (result.status !== "OK") {
        console.warn("Tokenize failed:", result);
        throw new Error(result.errors?.[0]?.message || "Failed to tokenize card.");
      }
      const sourceId = result.token as string;

      const d = normalizeDiscount(discount);
      const createBody = {
        amount_cents: amountCents,
        items,
        notes: notes ?? "",
        pickup_time: pickupTime ?? "ASAP",
        coupon: d ? { code: d.code, type: d.type, value: d.value } : null,
      };

      const createRes = await fetch("/.netlify/functions/create-square-order", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(createBody),
      });
      const createJson = await createRes.json().catch(() => ({}));
      if (!createRes.ok) {
        console.error("create-square-order error:", createJson);
        throw new Error(createJson?.message || "Failed to create order.");
      }
      const orderId = createJson.orderId || createJson.order_id || createJson.id;
      if (!orderId) throw new Error("Order created but no orderId returned.");

      const payRes = await fetch("/.netlify/functions/pay-square-order", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ order_id: orderId, amount_cents: amountCents, source_id: sourceId }),
      });
      const payJson = await payRes.json().catch(() => ({}));
      if (!payRes.ok) {
        console.error("pay-square-order error:", payJson);
        throw new Error(payJson?.message || "Payment failed.");
      }

      console.log("✅ Payment success:", payJson);
      onPaymentSuccess?.();
    } catch (err) {
      console.error("Payment flow error:", err);
      setErrMsg(err instanceof Error ? err.message : String(err));
      onPaymentError?.(err);
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <div>Loading payments…</div>;
  if (errMsg) {
    return (
      <div className="p-3 rounded bg-red-50 text-red-700">
        <p className="font-semibold">Payment setup error</p>
        <p className="text-sm break-words">{errMsg}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div id="card-container" ref={cardContainerRef} className="border rounded p-3" />
      <button
        type="button"
        onClick={handlePay}
        disabled={busy}
        className={`px-4 py-2 rounded ${busy ? "opacity-50 cursor-not-allowed" : "bg-black text-white hover:bg-gray-900"}`}
      >
        {busy ? "Processing…" : "Pay Now"}
      </button>
    </div>
  );
}
