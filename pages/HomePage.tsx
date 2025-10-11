import React from 'react';
import { Link } from 'react-router-dom';

const HomePage: React.FC = () => {
  return (
    <div className="text-white">
      {/* Top banner (uses global fixed background) */}
      <section className="relative w-full h-[26vh] flex items-start justify-center pt-8">
        <div className="absolute inset-0 bg-black/30"></div>
        <div className="relative z-20 text-center space-y-3 -translate-y-2 md:-translate-y-3">
          <h2 className="font-serif text-4xl md:text-5xl drop-shadow">
            <span
              className="inline-block text-white px-4 py-1 rounded-xl shadow-lg"
              style={{ backgroundColor: '#4169E1', opacity: 1 }}
            >
              Coffee
            </span>
          </h2>
          <p className="text-base md:text-lg leading-relaxed">
            <span
              className="inline-block text-white px-4 py-3 rounded-xl shadow-md"
              style={{ backgroundColor: '#4169E1', opacity: 1 }}
            >
              Everything from bold drip coffee, silky cappuccinos, and seasonal
              specials—all crafted with care and quality beans.
            </span>
          </p>
        </div>
      </section>

      {/* Clickable cup image */}
      <section className="py-6 flex justify-center">
        <Link to="/menu" aria-label="Go to menu">
          <img
            src="/menu-cup.png"
            alt="C&O Coffee Collective takeout cup"
            className="w-64 md:w-72 lg:w-80 drop-shadow-xl hover:scale-105 transition-transform duration-200"
          />
        </Link>
      </section>
    </div>
  );
};

export default HomePage;
