import React, { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '../hooks/useAuthStore';
import RedeemCard from '../components/RedeemCard';
import { supabase } from '../lib/supabaseClient';

type RewardRow = {
  id: string;
  reward_type: string;
  status: 'PENDING' | 'USED' | 'VOID' | 'EXPIRED';
  code: string | null;
  expires_at: string | null;
  created_at: string;
};

const label = (key: string) =>
  ({
    ESPRESSO_2OZ: 'Free 2oz Espresso Shot',
    BREWED_COFFEE: 'Free Brewed Coffee',
    BAKERY: 'Free Bakery Item',
    LATTE: 'Free Latte / Specialty',
  } as Record<string, string>)[key] || key;

const RewardsPage: React.FC = () => {
  const { user, loyaltyBalance, isUserDataLoading } = useAuthStore();
  const [rows, setRows] = useState<RewardRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!user) return;
    if (!supabase) {
      setError(
        'Supabase client not initialized. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
      );
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // Fetch all statuses, then split into Active vs History
      const { data, error } = await supabase
        .from<RewardRow>('pending_rewards')
        .select('id,reward_type,status,code,expires_at,created_at')
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRows(data ?? []);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load rewards.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) void load();
  }, [user]);

  const [pending, history] = useMemo(() => {
    const p = rows.filter((r) => r.status === 'PENDING');
    const h = rows.filter((r) => r.status !== 'PENDING');
    return [p, h];
  }, [rows]);

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto py-10 px-4 text-white">
        <h1 className="text-2xl font-bold mb-2">My Rewards</h1>
        <p className="opacity-80">Please sign in to view your rewards.</p>
      </div>
    );
  }

  if (isUserDataLoading) {
    return (
      <div className="max-w-3xl mx-auto py-10 px-4 text-white">
        Loading your rewards…
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-10 px-4 text-white">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">My Rewards</h1>
        <button
          onClick={load}
          className="rounded-xl border border-white/30 px-3 py-2 text-sm hover:bg-white/10 active:scale-[.98] transition"
          disabled={loading}
          title="Refresh"
        >
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {/* Balance */}
      <div className="mt-4 rounded-2xl border border-white/20 bg-white/5 p-5">
        <div className="opacity-80 text-sm">Points balance</div>
        <div className="text-4xl font-extrabold mt-1">
          {loyaltyBalance?.points ?? 0}
        </div>
        <div className="text-xs opacity-70 mt-2">
          Earn 1 point per $1. When you redeem, your code appears below.
        </div>
      </div>

      {/* Errors */}
      {error && <div className="mt-4 text-rose-200">{error}</div>}

      {/* Active rewards */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-3">Active rewards</h2>
        {!loading && pending.length === 0 && (
          <div className="opacity-80">
            No active rewards yet. Redeem from the Loyalty tab.
          </div>
        )}
        <div className="grid gap-4">
          {pending.map(
            (r) =>
              r.code && (
                <RedeemCard
                  key={r.id}
                  code={r.code}
                  rewardLabel={label(r.reward_type)}
                  expiresAt={r.expires_at}
                />
              )
          )}
        </div>
      </div>

      {/* History */}
      <div className="mt-10">
        <h2 className="text-xl font-semibold mb-3">History</h2>
        {history.length === 0 ? (
          <div className="opacity-70">No used or expired rewards yet.</div>
        ) : (
          <div className="grid gap-3">
            {history.map((r) => (
              <div
                key={r.id}
                className="rounded-xl border border-white/15 bg-white/5 p-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{label(r.reward_type)}</div>
                    <div className="text-xs opacity-70">
                      Code: {r.code ?? '—'}
                    </div>
                  </div>
                  <div className="text-xs opacity-80">{r.status}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Help text */}
      <div className="mt-10 text-sm opacity-80">
        Show the code to staff at the counter (they’ll apply your reward), or
        paste it at checkout. Codes expire on the date shown.
      </div>
    </div>
  );
};

export default RewardsPage;
