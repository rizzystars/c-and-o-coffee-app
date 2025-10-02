import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../hooks/useAuthStore';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import type { LoyaltyLedgerEntry } from '../types';
import { REWARD_TIERS, LEVELS } from '../constants';
import Spinner from '../components/Spinner';

const TABS = ['Loyalty Program', 'Order History', 'Profile'];
const GOLD = '#C9A227';

// Map visible reward names (including option labels) to backend reward keys
const REWARD_KEY_BY_NAME: Record<string, string> = {
  // 50 pts
  'Espresso Shot': 'ESPRESSO_2OZ',
  '2oz Espresso': 'ESPRESSO_2OZ',
  'Espresso': 'ESPRESSO_2OZ',

  // 100 pts
  'Brewed Coffee': 'BREWED_COFFEE',

  // 150 pts
  'Bakery': 'BAKERY',
  'Bakery Bite': 'BAKERY',
  'Pastry': 'BAKERY',
  'Pastry or Bagel': 'BAKERY',

  // 200 pts
  'Latte': 'LATTE',
  'Latte/Specialty': 'LATTE',
};

function normalizeLabel(s: string) {
  return s.trim();
}

const AccountPage: React.FC = () => {
  // NOTE: this store is used both as a hook (react state) and as a raw store (getState/setState)
  const store = useAuthStore as any;
  const { user, loyaltyBalance, loyaltyHistory, orders, isUserDataLoading, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState<string>('Loyalty Program');
  const [redeemingKey, setRedeemingKey] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState<Record<number, string>>({});
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) navigate('/login');
  }, [user, navigate]);

  if (!user || isUserDataLoading) {
    return <div className="flex items-center justify-center py-24"><Spinner /></div>;
  }

  const points = loyaltyBalance?.points ?? 0;

  // Lifetime points = sum of positive deltas in history (fallback to points if empty)
  const lifetime = (loyaltyHistory || []).reduce((sum: number, e: any) => sum + Math.max(0, e.deltaPoints || 0), 0) || points;
  const currentLevelIndex = [...LEVELS].sort((a,b)=>a.minPoints-b.minPoints).reduce((idx, lvl, i) => lifetime >= lvl.minPoints ? i : idx, 0);
  const currentLevel = LEVELS[currentLevelIndex];
  const nextLevel = LEVELS[currentLevelIndex + 1];
  const levelTarget = nextLevel ? nextLevel.minPoints : currentLevel.minPoints;
  const levelProg = nextLevel ? Math.min(1, (lifetime - currentLevel.minPoints) / (nextLevel.minPoints - currentLevel.minPoints)) : 1;

  const nextTier = REWARD_TIERS.find(t => t.points > points);
  const tierTarget = nextTier?.points ?? REWARD_TIERS[REWARD_TIERS.length - 1].points;
  const tierProg = Math.min(1, points / tierTarget);

  // NEW: Redeem flow that creates a coupon code via Netlify function
  const handleRedeem = async (tierPoints: number, visibleName: string) => {
    if (points < tierPoints || redeemingKey) return;

    const name = normalizeLabel(visibleName);
    const rewardKey = REWARD_KEY_BY_NAME[name] || REWARD_KEY_BY_NAME[name.trim()] || null;
    if (!rewardKey) {
      toast.error(`Can't map "${visibleName}" to a reward key. Tell me the exact label and I’ll add it.`);
      return;
    }

    const key = `${tierPoints}:${name}`;
    setRedeemingKey(key);

    // Snapshot current points for one-time local update on success
    const prev = store.getState();
    const oldPoints = prev.loyaltyBalance?.points ?? points;

    try {
      // Call the function that inserts pending reward + code and deducts points in the ledger
      const res = await fetch('/.netlify/functions/redeem-generate-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: user.id,
          rewardKey, // critical
        }),
      });

      if (!res.ok) {
        const msg = await res.text().catch(()=>'');
        throw new Error(msg || 'Redeem failed');
      }

      const { code, expires_at } = await res.json();

      // Locally reflect the deduction once (the function already deducted in DB)
      store.setState({
        loyaltyBalance: { ...(prev.loyaltyBalance || {}), points: Math.max(0, oldPoints - tierPoints) },
      });

      // Optional UX: copy to clipboard
      try { await navigator.clipboard.writeText(code); } catch {}

      toast.success(`Code generated: ${code}`);
      // Send them to Rewards page where the code appears (with QR + expiry)
      if (window.location.hash && window.location.hash.startsWith('#/')) {
        // hash routing
        window.location.hash = '#/rewards';
      } else {
        // react-router
        navigate('/rewards');
      }
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || 'Redeem failed. Please try again.');
    } finally {
      setRedeemingKey(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">My Account</h1>

      {/* Tabs */}
      <div className="flex gap-6 border-b pb-2 mb-6">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-2 -mb-px border-b-2 ${activeTab === tab ? 'border-[var(--gold)] text-black' : 'border-transparent text-gray-500'}`}
            style={{ ['--gold' as any]: GOLD }}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'Loyalty Program' ? (
        <div>
          {/* Points Card + Two Progress Bars */}
          <div className="bg-white rounded-2xl shadow p-6 mb-8 border">
            <div className="flex flex-wrap items-center gap-6">
              <div className="rounded-xl px-6 py-8 bg-[#F3F6FF]" />
              <div>
                <p className="text-gray-500 text-sm">Your current balance</p>
                <div className="flex items-end gap-3">
                  <span className="text-6xl font-extrabold">{points}</span>
                  <span className="text-xl font-semibold text-gray-700">points</span>
                </div>
              </div>
              <div className="ml-auto">
                <button
                  className="px-5 py-3 rounded-full text-white font-semibold"
                  style={{ backgroundColor: GOLD }}
                  onClick={() => {
                    // Prefer routing, but keep scroll as fallback
                    if (window.location.hash && window.location.hash.startsWith('#/')) {
                      window.location.hash = '#/rewards';
                    } else {
                      // Scroll down to tiers section
                      document.getElementById('rewards')?.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                >
                  See Rewards
                </button>
              </div>
            </div>

            {/* Reward Progress */}
            <div className="mt-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-700">{points} / {tierTarget} points until your next reward</span>
              </div>
              <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${tierProg * 100}%`, backgroundColor: GOLD }} />
              </div>
            </div>

            {/* Level Progress */}
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-700">Level: <span className="font-semibold">{currentLevel.name}</span>{nextLevel ? ` → Next: ${nextLevel.name}` : ''}</span>
                <span className="text-gray-600">Lifetime: {lifetime} pts</span>
              </div>
              <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${levelProg * 100}%`, backgroundColor: '#0EA5E9' }} />
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {nextLevel ? `${lifetime - currentLevel.minPoints} / ${nextLevel.minPoints - currentLevel.minPoints} to ${nextLevel.name}` : 'Max level reached'}
              </div>
            </div>
          </div>

          {/* Rewards Grid with Dropdown Options */}
          <div id="rewards" className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {REWARD_TIERS.map(tier => {
              const can = points >= tier.points;
              const opts = tier.options || [];
              const sel = selectedOption[tier.points] || (opts[0]?.name ?? tier.name);
              const key = `${tier.points}:${sel}`;
              return (
                <div key={tier.points} className="bg-white border rounded-2xl shadow-sm p-5 flex flex-col gap-3">
                  <div className="text-sm text-gray-500">Tier</div>
                  <div className="text-3xl font-extrabold">{tier.points} pts</div>
                  <div className="text-lg font-semibold">{tier.name}</div>
                  <div className="text-gray-600">{tier.description}</div>

                  {opts.length > 0 && (
                    <select
                      className="mt-1 border rounded-lg px-3 py-2 text-sm"
                      value={sel}
                      onChange={(e) => setSelectedOption(s => ({ ...s, [tier.points]: e.target.value }))}
                    >
                      {opts.map(o => <option key={o.name} value={o.name}>{o.name}</option>)}
                    </select>
                  )}

                  <button
                    disabled={!can || !!redeemingKey}
                    onClick={() => handleRedeem(tier.points, sel)}
                    className={`mt-2 w-full px-4 py-3 rounded-xl font-semibold ${can ? 'text-white' : 'text-gray-400'}`}
                    style={{ backgroundColor: can ? GOLD : '#E5E7EB' }}
                    title={can ? 'Redeem now' : 'Not enough points'}
                  >
                    {can ? (redeemingKey === key ? 'Redeeming…' : 'Redeem') : 'Not enough points'}
                  </button>
                </div>
              );
            })}
          </div>

          {/* History Table */}
          <div className="mt-10 bg-white rounded-2xl shadow p-6 border">
            <h2 className="text-2xl font-bold mb-4">History</h2>
            <div className="grid grid-cols-12 text-xs font-semibold text-gray-500 border-b pb-2">
              <div className="col-span-3">Date</div>
              <div className="col-span-7">Description</div>
              <div className="col-span-2 text-right">Points</div>
            </div>
            <ul className="divide-y">
              {(loyaltyHistory as LoyaltyLedgerEntry[] | undefined)?.map((entry) => (
                <li key={entry.id} className="grid grid-cols-12 py-3 text-sm">
                  <div className="col-span-3">{new Date(entry.createdAt).toLocaleString()}</div>
                  <div className="col-span-7">{entry.reason}</div>
                  <div className={`col-span-2 text-right font-bold ${entry.deltaPoints > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {entry.deltaPoints > 0 ? '+' : ''}{entry.deltaPoints}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : activeTab === 'Order History' ? (
        <div className="text-center text-gray-500 py-10">No orders yet.</div>
      ) : (
        <div className="max-w-md mx-auto bg-white shadow rounded-2xl p-6 space-y-4 text-center">
          <div className="text-2xl font-bold">{user?.displayName || "User"}</div>
          <div className="text-gray-600">{user?.email}</div>
          <div className="text-gray-600">{(user as any)?.phone || "No phone on file"}</div>
          <button
            onClick={async () => { await logout(); toast.success("Signed out successfully"); navigate("/"); }}
            className="w-full bg-gold text-white py-3 rounded-xl font-semibold hover:opacity-90 transition"
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
};

export default AccountPage;
