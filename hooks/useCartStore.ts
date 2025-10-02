import { create } from "zustand";
import { persist } from "zustand/middleware";

interface CartItem {
  id: string;
  menuItem: any;
  selectedModifiers: any[];
  quantity: number;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  addItem: (menuItem: any, selectedModifiers: any[], quantity: number) => void;
  removeItem: (itemId: string) => void;
  updateItemQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  getCartTotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
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
            newItems = [
              ...state.items,
              { id: newItemId, menuItem, selectedModifiers, quantity },
            ];
          }

          return { items: newItems };
        });
      },

      removeItem: (itemId) =>
        set((state) => ({ items: state.items.filter((item) => item.id !== itemId) })),

      updateItemQuantity: (itemId, quantity) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === itemId ? { ...item, quantity } : item
          ),
        })),

      clearCart: () => set({ items: [] }),

      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

      getCartTotal: () =>
        get().items.reduce((acc, item) => acc + item.menuItem.price * item.quantity, 0),

      getItemCount: () =>
        get().items.reduce((acc, item) => acc + item.quantity, 0),
    }),
    { name: "cno-cart" } // localStorage key
  )
);
