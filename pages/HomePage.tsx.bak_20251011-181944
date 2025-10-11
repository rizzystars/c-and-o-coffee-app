import React from 'react';
import { Link } from 'react-router-dom';

const HomePage: React.FC = () => {
  return (
    <div className="text-white">
            {/* Top banner (uses global fixed background) */}
      <section className="relative w-full h-[26vh] flex items-start justify-center pt-16">
        <div className="absolute inset-0 bg-black/30"></div>
        <div className="relative z-10 text-center">
          <Link to="/menu" className="inline-block rounded-full bg-blue-600 hover:bg-blue-700 transition px-8 py-3 text-base font-semibold shadow-lg">
            Order
          </Link>
        </div>
      </section>

      {/* Coffee section */}
      <section className="relative z-10 max-w-3xl mx-auto px-6 text-center">
        <h2 className="font-serif text-4xl md:text-5xl mb-4 drop-shadow">Coffee</h2>
        <p className="text-lg md:text-xl leading-relaxed text-white/90">
          Everything from bold drip coffee, silky cappuccinos, creamy breves, and refreshing cold brew,
          to espresso shots, flat whites, americanos, mochas, and seasonal specials—all crafted with care and quality beans.
        </p>
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
