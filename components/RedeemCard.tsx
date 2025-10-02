import React from 'react';

type Props = {
  code: string;
  rewardLabel: string;
  expiresAt?: string | null;
};

const RedeemCard: React.FC<Props> = ({ code, rewardLabel, expiresAt }) => {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      alert('Code copied!');
    } catch {
      alert('Copy failed — select & copy manually.');
    }
  };

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(code)}`;

  return (
    <div className="rounded-xl border border-white/20 p-4 mb-4 bg-black/30 text-white">
      <div className="text-sm opacity-80">Reward</div>
      <div className="text-xl font-semibold">{rewardLabel}</div>

      <div className="mt-3 flex items-center gap-3">
        <div className="font-mono text-lg tracking-wider bg-white/10 px-3 py-2 rounded">{code}</div>
        <button onClick={copy} className="px-3 py-2 border rounded hover:bg-white/10">Copy</button>
      </div>

      <div className="mt-3 flex items-center gap-4">
        <img src={qrUrl} alt="QR" className="w-24 h-24 border border-white/20 rounded" />
        <div className="text-sm opacity-80">
          Show this at the counter. Staff will apply the reward and it’ll be marked used automatically.
          {expiresAt ? <div className="mt-2">Expires: {new Date(expiresAt).toLocaleString()}</div> : null}
        </div>
      </div>
    </div>
  );
};

export default RedeemCard;
