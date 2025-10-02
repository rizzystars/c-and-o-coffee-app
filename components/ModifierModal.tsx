
import React, { useState, useEffect } from 'react';
import type { MenuItem, ModifierGroup, ModifierOption, SelectedModifier } from '../types';
import { formatCurrency } from '../lib/utils';
import { X, Plus, Minus } from 'lucide-react';
import { useCartStore } from '../hooks/useCartStore';

interface ModifierModalProps {
  item: MenuItem | null;
  onClose: () => void;
}

const ModifierModal: React.FC<ModifierModalProps> = ({ item, onClose }) => {
  const [selectedModifiers, setSelectedModifiers] = useState<Record<string, ModifierOption>>({});
  const [quantity, setQuantity] = useState(1);
  const addItemToCart = useCartStore((state) => state.addItem);

  useEffect(() => {
    if (item && item.modifiers) {
      const defaults: Record<string, ModifierOption> = {};
      item.modifiers.forEach(group => {
        defaults[group.id] = group.options[0];
      });
      setSelectedModifiers(defaults);
    } else {
      setSelectedModifiers({});
    }
    setQuantity(1);
  }, [item]);

  if (!item) return null;

  const handleModifierChange = (group: ModifierGroup, option: ModifierOption) => {
    setSelectedModifiers(prev => ({
      ...prev,
      [group.id]: option
    }));
  };

  const calculateTotalPrice = () => {
    const basePrice = item.price;
    const modifierPrice = Object.values(selectedModifiers).reduce((total, option) => total + option.price, 0);
    return (basePrice + modifierPrice) * quantity;
  };

  const handleAddToCart = () => {
    const modifiersForCart: SelectedModifier[] = Object.entries(selectedModifiers).map(([groupId, option]) => {
        const group = item.modifiers?.find(g => g.id === groupId);
        return {
            groupName: group?.name || 'Unknown',
            optionName: option.name,
            price: option.price
        };
    });
    addItemToCart(item, modifiersForCart, quantity);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold text-navy">{item.name}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-navy">
            <X size={24} />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto">
          <p className="text-gray-600 mb-4">{item.description}</p>
          
          {item.modifiers?.map(group => (
            <div key={group.id} className="mb-4">
              <h3 className="text-lg font-semibold text-navy mb-2">{group.name}</h3>
              <div className="space-y-2">
                {group.options.map(option => (
                  <label key={option.id} className="flex items-center justify-between p-3 rounded-lg border cursor-pointer has-[:checked]:bg-amber-50 has-[:checked]:border-gold">
                    <div>
                      <span className="font-medium">{option.name}</span>
                      {option.price > 0 && <span className="text-sm text-gray-500 ml-2">+{formatCurrency(option.price)}</span>}
                    </div>
                    <input
                      type="radio"
                      name={group.id}
                      checked={selectedModifiers[group.id]?.id === option.id}
                      onChange={() => handleModifierChange(group, option)}
                      className="form-radio h-5 w-5 text-gold focus:ring-gold"
                    />
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t mt-auto">
           <div className="flex items-center justify-center gap-4 mb-4">
              <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="p-2 rounded-full border hover:bg-gray-100">
                <Minus size={16} />
              </button>
              <span className="text-lg font-bold w-8 text-center">{quantity}</span>
              <button onClick={() => setQuantity(q => q + 1)} className="p-2 rounded-full border hover:bg-gray-100">
                <Plus size={16} />
              </button>
            </div>
          <button
            onClick={handleAddToCart}
            className="w-full bg-gold text-navy font-bold py-3 px-4 rounded-lg flex justify-between items-center text-lg hover:bg-amber-500 transition-colors"
          >
            <span>Add to Cart</span>
            <span>{formatCurrency(calculateTotalPrice())}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModifierModal;
