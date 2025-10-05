import React, { useMemo } from "react";

type AnyObj = Record<string, any>;

function readPayment(): AnyObj | null {
  try {
    const fromSession = sessionStorage.getItem("lastPayment");
    if (fromSession) return JSON.parse(fromSession);
    // Fallback if we stashed on window
    // @ts-ignore
    return (window as any).__LAST_PAYMENT ?? null;
  } catch {
    return null;
  }
}

function centsToUSD(cents?: number | null) {
  if (!Number.isFinite(cents ?? NaN)) return "—";
  return ((cents as number) / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function Row({
  label,
  value,
  strong,
  mono,
}: {
  label: string;
  value: React.ReactNode;
  strong?: boolean;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-gray-600">{label}</span>
      <span className={[strong ? "font-semibold" : "", mono ? "font-mono text-sm break-all" : ""].join(" ")}>
        {value}
      </span>
    </div>
  );
}

export default function OrderConfirmationPage() {
  const pay = useMemo(readPayment, []);

  const payment = pay?.payment ?? pay ?? null;
  const status = payment?.status ?? "(unknown)";
  const id = payment?.id ?? "(none)";
  const created = payment?.createdAt || payment?.created_at || new Date().toISOString();

  const amountCents =
    payment?.amountMoney?.amount ??
    payment?.approvedMoney?.amount ??
    payment?.totalMoney?.amount ??
    null;

  const brand =
    payment?.cardDetails?.card?.cardBrand ??
    payment?.paymentMethodDetails?.card?.cardBrand ??
    "";
  const last4 =
    payment?.cardDetails?.card?.last4 ??
    payment?.paymentMethodDetails?.card?.last4 ??
    "";

  const note = payment?.note ?? "";

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-2">Order confirmation</h1>
      <p className="text-gray-600 mb-6">Thank you! Your payment has been processed.</p>

      <div className="rounded-xl border bg-white/80 backdrop-blur p-5 space-y-3 shadow">
        <Row label="Status" value={status} strong />
        <Row label="Amount" value={centsToUSD(amountCents)} />
        <Row label="Payment ID" value={id} mono />
        <Row label="Time" value={new Date(created).toLocaleString()} />
        {(brand || last4) && <Row label="Card" value={`${brand || "Card"} •••• ${last4 || ""}`} />}
        {note && <Row label="Note" value={note} />}
      </div>

      <div className="mt-6 flex gap-3">
        <a href="/#/" className="px-4 py-2 rounded-lg border bg-white hover:bg-gray-50 transition">
          Back to Home
        </a>
        <button onClick={() => window.print()} className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition">
          Print receipt
        </button>
      </div>
    </div>
  );
}
