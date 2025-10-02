import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';

function getCode(): string | null {
  const qs = new URLSearchParams(window.location.search);
  if (qs.get('code')) return qs.get('code');
  const hash = window.location.hash || '';
  const idx = hash.indexOf('?');
  if (idx !== -1) {
    const hq = new URLSearchParams(hash.slice(idx + 1));
    return hq.get('code');
  }
  return null;
}

export default function UpdatePassword() {
  const [password, setPassword] = useState('');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const code = getCode();
        if (!code) {
          toast.error('Missing recovery code. Use the link from your email.');
          setReady(true);
          return;
        }
        const { error } = await supabase!.auth.exchangeCodeForSession(code);
        if (error) throw error;
      } catch (err: any) {
        toast.error(err?.message || 'Could not validate recovery code');
      } finally {
        setReady(true);
      }
    })();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const { error } = await supabase!.auth.updateUser({ password });
      if (error) throw error;
      toast.success('Password updated. You can log in now.');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update password');
    }
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 flex justify-center">
      <div className="w-full max-w-md">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-3xl font-bold text-center mb-6 font-serif">Set a new password</h1>
          {!ready ? (
            <p>Validating link…</p>
          ) : (
            <form onSubmit={onSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">New password</label>
                <input
                  type="password"
                  minLength={6}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-gold focus:border-gold"
                />
              </div>
              <button className="w-full rounded-lg bg-[#0C2540] text-white py-2 font-semibold">
                Update password
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}