import React from 'react';
import { useAuthStore } from '../hooks/useAuthStore';

const HistoryPage: React.FC = () => {
  const { user, orders, isUserDataLoading } = useAuthStore();

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto py-10 px-4">
        <h1 className="text-2xl font-bold mb-2">Order History</h1>
        <p className="text-gray-600">Please sign in to see your history.</p>
      </div>
    );
  }

  if (isUserDataLoading) {
    return <div className="max-w-4xl mx-auto py-10 px-4">Loading your orders…</div>;
  }

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-4">Order History</h1>
      {orders?.length ? (
        <ul className="space-y-3">
          {orders.map((o: any) => (
            <li key={o.id} className="bg-white rounded-xl shadow p-4">
              <div className="font-semibold">#{o.id}</div>
              <div className="text-sm text-gray-600">Total: ${o.total?.toFixed?.(2) ?? o.total}</div>
              <div className="text-sm text-gray-600">Placed: {o.created_at ? new Date(o.created_at).toLocaleString() : '—'}</div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-600">No orders yet.</p>
      )}
    </div>
  );
};

export default HistoryPage;