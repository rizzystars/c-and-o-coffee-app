import React, { useEffect, useRef, useState } from 'react';

type Props = {
  onPaymentSuccess: (token: string) => Promise<void> | void;
  isProcessing?: boolean;
};

declare global {
  interface Window {
    Square?: any;
  }
}

const SquarePaymentForm: React.FC<Props> = ({ onPaymentSuccess, isProcessing }) => {
  // IMPORTANT: these must exist in Netlify as Vite client env vars
  const applicationId = (import.meta as any).env.VITE_SQUARE_APPLICATION_ID as string | undefined;
  const locationId = (import.meta as any).env.VITE_SQUARE_LOCATION_ID as string | undefined;

  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const paymentsRef = useRef<any>(null);
  const cardRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;

    async function ensureScript() {
      // If already present, skip inject
      if (window.Square) return;
      await new Promise<void>((resolve, reject) => {
        const existing = document.querySelector<HTMLScriptElement>('script[data-square-sdk]');
        if (existing) {
          existing.addEventListener('load', () => resolve());
          existing.addEventListener('error', () => reject(new Error('Square SDK failed to load')));
          if ((existing as any).dataset.loaded === 'true') resolve();
          return;
        }

        const s = document.createElement('script');
        s.src = 'https://web.squarecdn.com/v1/square.js'; // ← correct CDN
        s.async = true;
        s.defer = true;
        s.dataset.squareSdk = 'true';
        s.addEventListener('load', () => {
          (s as any).dataset.loaded = 'true';
          resolve();
        });
        s.addEventListener('error', () => reject(new Error('Square SDK failed to load')));
        document.head.appendChild(s);
      });
    }

    async function init() {
      try {
        setError(null);

        if (!applicationId || !locationId) {
          throw new Error(
            'Missing VITE_SQUARE_APPLICATION_ID or VITE_SQUARE_LOCATION_ID. Set them in Netlify env vars.'
          );
        }

        await ensureScript();
        if (cancelled) return;

        if (!window.Square?.payments) {
          throw new Error('Square SDK is present but window.Square.payments is undefined.');
        }

        const payments = window.Square.payments(applicationId, locationId);
        paymentsRef.current = payments;

        const card = await payments.card();
        await card.attach('#card-container');
        cardRef.current = card;

        if (!cancelled) setReady(true);
      } catch (e: any) {
        console.error(e);
        if (!cancelled) setError(e?.message || 'Could not load payment form. Please check configuration.');
      }
    }

    init();
    return () => {
      cancelled = true;
      // Best effort cleanup
      try { cardRef.current?.destroy?.(); } catch {}
    };
  }, [applicationId, locationId]);

  async function handlePay(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    try {
      if (!cardRef.current) throw new Error('Card input is not ready.');
      const result = await cardRef.current.tokenize();
      if (result.status !== 'OK') {
        // result.errors can contain details
        throw new Error(result.errors?.[0]?.message || 'Tokenization failed.');
      }
      await onPaymentSuccess(result.token);
    } catch (e: any) {
      console.error(e);
      setError(e?.message || 'Payment failed.');
    }
  }

  return (
    <div className="bg-white/5 border border-white/20 rounded-lg p-4">
      <h3 className="text-lg font-semibold mb-3 text-white">Payment</h3>

      {!applicationId || !locationId ? (
        <div className="text-red-300 text-sm">
          Missing <code>VITE_SQUARE_APPLICATION_ID</code> and/or <code>VITE_SQUARE_LOCATION_ID</code>.
          Add them in Netlify → Environment variables, then redeploy.
        </div>
      ) : null}

      {error && <div className="text-red-300 text-sm mb-3">{error}</div>}

      <form onSubmit={handlePay} className="space-y-3">
        <div id="card-container" className="bg-white p-3 rounded-md text-black" />
        <button
          type="submit"
          disabled={!ready || !!isProcessing}
          className={`w-full px-4 py-2 rounded-md font-semibold ${
            ready && !isProcessing ? 'bg-black text-white hover:opacity-90' : 'bg-gray-500 text-gray-200 cursor-not-allowed'
          }`}
        >
          {isProcessing ? 'Processing…' : 'Pay now'}
        </button>
      </form>
    </div>
  );
};

export default SquarePaymentForm;
