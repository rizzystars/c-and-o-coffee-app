import React, { useState } from 'react';
import { useAuthStore } from '../hooks/useAuthStore';

const PersonalInfoPage: React.FC = () => {
  const { user } = useAuthStore();
  const [name, setName] = useState((user as any)?.displayName ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState((user as any)?.phone ?? '');

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto py-10 px-4">
        <h1 className="text-2xl font-bold mb-2">Personal info</h1>
        <p className="text-gray-600">Please sign in to manage your info.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-4">Personal info</h1>
      <div className="bg-white rounded-xl shadow p-6 space-y-4">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Name</label>
          <input className="w-full border rounded-lg px-3 py-2" value={name} onChange={e=>setName(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Email</label>
          <input className="w-full border rounded-lg px-3 py-2" value={email} onChange={e=>setEmail(e.target.value)} disabled />
          <p className="text-xs text-gray-500 mt-1">Email changes are managed via your account sign-in provider.</p>
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Phone</label>
          <input className="w-full border rounded-lg px-3 py-2" value={phone} onChange={e=>setPhone(e.target.value)} />
        </div>
        <button className="px-4 py-2 bg-navy text-white rounded-lg" onClick={()=>alert('Saving coming soon')}>Save</button>
      </div>
    </div>
  );
};

export default PersonalInfoPage;