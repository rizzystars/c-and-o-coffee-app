import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';

export default function Reset() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const redirectTo = `${window.location.origin}/#/update-password`;
      const { error } = await supabase!.auth.resetPasswordForEmail(email, { redirectTo });
      if (error) throw error;
      setSent(true);
      toast.success('Reset link sent!');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to send reset link');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 flex justify-center">
      <div className="w-full max-w-md">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-3xl font-bold text-center mb-6 font-serif">Reset your password</h1>
          {sent ? (
            <p>Check your email for a reset link.</p>
          ) : (
            <form onSubmit={onSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Email address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-gold focus:border-gold"
                />
              </div>
              <button
                disabled={loading}
                className="w-full rounded-lg bg-[#0C2540] text-white py-2 font-semibold"
              >
                {loading ? 'Sending...' : 'Send reset link'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}