
import React from 'react';
import type { MenuItem } from '../types';
import { formatCurrency } from '../lib/utils';
import { Plus } from 'lucide-react';

interface MenuItemCardProps {
  item: MenuItem;
  onSelect: (item: MenuItem) => void;
}

const MenuItemCard: React.FC<MenuItemCardProps> = ({ item, onSelect }) => {
  const isOutOfStock = item.stock <= 0;

  return (
    <div className={`border rounded-lg overflow-hidden shadow-sm transition-transform duration-300 hover:shadow-lg hover:-translate-y-1 flex flex-col ${isOutOfStock ? 'bg-gray-100' : 'bg-white'}`}>
      <img src={item.imageUrl} alt={item.name} className="w-full h-48 object-cover" />
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-lg font-bold text-navy">{item.name}</h3>
        <p className="text-gray-600 text-sm mt-1 flex-grow">{item.description}</p>
        <div className="flex justify-between items-center mt-4">
          <span className="text-navy font-semibold">{formatCurrency(item.price)}</span>
          <button
            onClick={() => onSelect(item)}
            disabled={isOutOfStock}
            className="bg-gold text-navy font-bold py-2 px-4 rounded-full flex items-center gap-2 transition-colors hover:bg-amber-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isOutOfStock ? 'Out of Stock' : <><Plus size={16} /> Add</>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MenuItemCard;
