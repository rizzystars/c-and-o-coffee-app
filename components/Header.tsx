import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { useCartStore } from '../hooks/useCartStore';
import { useAuthStore } from '../hooks/useAuthStore';

const Header: React.FC = () => {
  const { toggleCart, getItemCount } = useCartStore();
  const { user, logout } = useAuthStore();
  const itemCount = getItemCount();

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `text-white hover:text-gold transition-colors text-sm font-medium ${isActive ? 'text-gold' : ''}`;

  return (
    <header className="bg-navy shadow">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Left nav */}
        <nav className="flex items-center gap-6">
          <NavLink to="/" className={navLinkClass}>Home</NavLink>
          <NavLink to="/menu" className={navLinkClass}>Menu</NavLink>
          <NavLink to="/location" className={navLinkClass}>Location</NavLink>
        </nav>

        {/* Right side: account links + cart */}
        <div className="flex items-center gap-4">
          {!user ? (
            <Link to="/login" className="px-4 py-2 bg-gold text-navy rounded-lg font-semibold">Sign In</Link>
          ) : (
            <div className="flex items-center gap-4">
              <Link to="/account" className="text-white hover:text-gold text-sm font-medium">Account</Link>
              <Link to="/account/privacy" className="text-white hover:text-gold text-sm font-medium">Privacy and data</Link>
              <button
                onClick={async () => { await logout(); }}
                className="text-white hover:text-gold text-sm font-medium"
              >
                Sign out
              </button>
            </div>
          )}

          <button onClick={toggleCart} className="relative p-2 rounded-full bg-white/10 hover:bg-white/20">
            <ShoppingCart className="h-6 w-6 text-white" />
            {itemCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-gold text-navy text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;