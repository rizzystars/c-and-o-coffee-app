import React, { useMemo } from "react";

type AnyObj = Record<string, any>;

function readStoredPayment(): AnyObj | null {
  try {
    const fromSession = sessionStorage.getItem("lastPayment");
    if (fromSession) return JSON.parse(fromSession);
  } catch {}
  // fallback
  // @ts-ignore
  return (window as any).__LAST_PAYMENT ?? null;
}

function moneyFrom(obj?: AnyObj | null): number | null {
  if (!obj) return null;
  // camelCase candidates
  const camel =
    obj?.amountMoney?.amount ??
    obj?.approvedMoney?.amount ??
    obj?.totalMoney?.amount ??
    obj?.order?.totalMoney?.amount ??
    null;

  if (Number.isFinite(camel)) return Number(camel);

  // snake_case candidates
  const snake =
    obj?.amount_money?.amount ??
    obj?.approved_money?.amount ??
    obj?.total_money?.amount ??
    obj?.order?.total_money?.amount ??
    null;

  if (Number.isFinite(snake)) return Number(snake);

  return null;
}

function getAmountCents(pay: AnyObj | null): number | null {
  if (!pay) return null;

  // payment object might be at root or under .payment
  const payment = pay?.payment ?? pay;

  // Try direct payment fields
  const direct = moneyFrom(payment);
  if (Number.isFinite(direct)) return Number(direct);

  // Try nested tender(s)
  const tenders = payment?.tenders || payment?.tender;
  if (Array.isArray(tenders) && tenders.length) {
    for (const t of tenders) {
      const amt = moneyFrom(t?.amountMoney || t?.amount_money);
      if (Number.isFinite(amt)) return Number(amt);
    }
  }

  // Fallbacks from window helpers you set during checkout
  // @ts-ignore
  const lastAmtDollars = (window as any).__LAST_AMOUNT;
  if (Number.isFinite(lastAmtDollars)) return Math.round(Number(lastAmtDollars) * 100);

  // @ts-ignore
  const totalCents = (window as any).__TOTAL_CENTS;
  if (Number.isFinite(totalCents)) return Math.round(Number(totalCents));

  return null;
}

function getCardBrandAndLast4(pay: AnyObj | null): { brand?: string; last4?: string } {
  const p = pay?.payment ?? pay ?? {};
  // camelCase paths
  const camelBrand = p?.cardDetails?.card?.cardBrand || p?.paymentMethodDetails?.card?.cardBrand;
  const camelLast4 = p?.cardDetails?.card?.last4 || p?.paymentMethodDetails?.card?.last4;

  if (camelBrand || camelLast4) return { brand: camelBrand, last4: camelLast4 };

  // snake_case paths
  const snakeBrand =
    p?.card_details?.card?.card_brand || p?.payment_method_details?.card?.card_brand;
  const snakeLast4 = p?.card_details?.card?.last_4 || p?.payment_method_details?.card?.last_4;

  return { brand: snakeBrand, last4: snakeLast4 };
}

function centsToUSD(cents?: number | null) {
  if (!Number.isFinite(cents ?? NaN)) return "—";
  return ((cents as number) / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
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
  const pay = useMemo(readStoredPayment, []);
  const payment = pay?.payment ?? pay ?? null;

  const status = payment?.status ?? "(unknown)";
  const id = payment?.id ?? "(none)";
  const created = payment?.createdAt || payment?.created_at || new Date().toISOString();

  const amountCents = getAmountCents(pay);
  const { brand, last4 } = getCardBrandAndLast4(pay);
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
        {(brand || last4) && <Row label="Card" value={`${brand || "Card"} ${last4 ? "•••• " + last4 : ""}`} />}
        {note && <Row label="Note" value={note} />}
      </div>

      <div className="mt-6 flex gap-3">
        <a href="/#/" className="px-4 py-2 rounded-lg border bg-white hover:bg-gray-50 transition">
          Back to Home
        </a>
        <button
          onClick={() => window.print()}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
        >
          Print receipt
        </button>
      </div>
    </div>
  );
}
