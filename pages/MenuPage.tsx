import React, { useState, useMemo, useEffect } from 'react';
import MenuItemCard from '../components/MenuItemCard';
import ModifierModal from '../components/ModifierModal';
import type { MenuItem } from '../types';
import { supabase } from '../lib/supabaseClient';
import Spinner from '../components/Spinner';

const MenuPage: React.FC = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

  
  useEffect(() => {
    const fetchMenu = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch("/.netlify/functions/list-catalog");
        if (!res.ok) throw new Error(`Catalog fetch failed: ${res.status}`);
        const data = await res.json();
        if (!data?.items) throw new Error("No items found in catalog.");
        setMenuItems(data.items);
      } catch (err: any) {
        setError(err.message || "Failed to load menu.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchMenu();
  }, []);


  const categories = useMemo(() => {
    if (!menuItems) return [];
    const allCategories = menuItems.map(item => item.category);
    return ['All', ...Array.from(new Set(allCategories))];
  }, [menuItems]);

  const filteredItems = useMemo(() => {
    if (!menuItems) return [];
    if (selectedCategory === 'All') {
      return menuItems;
    }
    return menuItems.filter(item => item.category === selectedCategory);
  }, [selectedCategory, menuItems]);
  
  const handleItemSelect = (item: MenuItem) => {
    setSelectedItem(item);
  };

  const renderContent = () => {
    if (isLoading) {
      return <div className="flex justify-center items-center py-20"><Spinner /> <span className="ml-4 text-lg">Loading Menu...</span></div>;
    }

    if (error) {
      return <div className="text-center py-20 text-red-600">Failed to load menu: {error}</div>;
    }

    return (
       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {filteredItems.map(item => (
          <MenuItemCard key={item.id} item={item} onSelect={handleItemSelect} />
        ))}
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold text-center mb-8 font-serif">Our Menu</h1>
      
      <div className="flex justify-center flex-wrap gap-2 mb-10">
        {categories.map(category => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-full font-semibold text-sm transition-colors ${
              selectedCategory === category
                ? 'bg-navy text-white'
                : 'bg-gray-200 text-navy hover:bg-gray-300'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

     {renderContent()}
      
      <ModifierModal item={selectedItem} onClose={() => setSelectedItem(null)} />
    </div>
  );
};

export default MenuPage;