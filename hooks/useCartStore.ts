
import { create } from 'zustand';
import type { CartItem, MenuItem, SelectedModifier } from '../types';
import toast from 'react-hot-toast';

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  addItem: (item: MenuItem, selectedModifiers: SelectedModifier[], quantity: number) => void;
  removeItem: (itemId: string) => void;
  updateItemQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  getCartTotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  isOpen: false,
  addItem: (menuItem, selectedModifiers, quantity) => {
    set((state) => {
      const newItemId = `${menuItem.id}-${selectedModifiers.map(m => m.optionName).join('-')}`;
      const existingItem = state.items.find((item) => item.id === newItemId);
      
      let newItems;
      if (existingItem) {
        newItems = state.items.map((item) =>
          item.id === newItemId
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        const cartItem: CartItem = {
          id: newItemId,
          menuItem,
          quantity,
          selectedModifiers,
        };
        newItems = [...state.items, cartItem];
      }
      toast.success(`${menuItem.name} added to cart!`);
      return { items: newItems, isOpen: true };
    });
  },
  removeItem: (itemId) => {
    set((state) => ({
      items: state.items.filter((item) => item.id !== itemId),
    }));
    toast.error("Item removed from cart.");
  },
  updateItemQuantity: (itemId, quantity) => {
    set((state) => ({
      items: state.items.map((item) =>
        item.id === itemId ? { ...item, quantity: Math.max(0, quantity) } : item
      ).filter(item => item.quantity > 0),
    }));
  },
  clearCart: () => set({ items: [] }),
  toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
  getCartTotal: () => {
    return get().items.reduce((total, item) => {
        const basePrice = item.menuItem.price;
        const modifiersPrice = item.selectedModifiers.reduce((modTotal, mod) => modTotal + mod.price, 0);
        return total + (basePrice + modifiersPrice) * item.quantity;
    }, 0);
  },
  getItemCount: () => {
    return get().items.reduce((count, item) => count + item.quantity, 0);
  },
}));
