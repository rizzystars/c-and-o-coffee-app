import React from 'react';
import { NavLink } from 'react-router-dom';
import { Coffee } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-navy text-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex flex-col items-center md:items-start">
            <div className="flex items-center gap-2 mb-4">
              <Coffee className="h-8 w-8 text-gold" />
              <span className="font-serif text-xl font-bold">C&O Coffee Collective</span>
            </div>
            <p className="text-sm text-gray-300">Brewed with care in Clear Spring, MD.</p>
          </div>
          <div className="flex flex-col items-center">
            <h3 className="font-bold mb-2">Quick Links</h3>
            <NavLink to="/menu" className="hover:text-gold mb-1">
              Menu
            </NavLink>
            <NavLink to="/location" className="hover:text-gold mb-1">
              Location
            </NavLink>
            <NavLink to="/login" className="hover:text-gold mb-1">
              Sign In
            </NavLink>
          </div>
          <div className="flex flex-col items-center md:items-end">
            <h3 className="font-bold mb-2">Follow Us</h3>
            <a href="https://instagram.com" className="hover:text-gold mb-1">Instagram</a>
            <a href="https://facebook.com" className="hover:text-gold mb-1">Facebook</a>
          </div>
        </div>
        <div className="mt-8 text-center text-xs text-gray-400">
          © {new Date().getFullYear()} C&O Coffee Collective. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
