
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../hooks/useCartStore';
import { formatCurrency } from '../lib/utils';
import { X, Trash2, Plus, Minus } from 'lucide-react';
import type { CartItem as CartItemType } from '../types';

const CartItem: React.FC<{ item: CartItemType }> = ({ item }) => {
  const { removeItem, updateItemQuantity } = useCartStore();

  const itemPrice = item.menuItem.price + item.selectedModifiers.reduce((acc, mod) => acc + mod.price, 0);

  return (
    <div className="flex items-start gap-4 py-4">
      <img src={item.menuItem.imageUrl} alt={item.menuItem.name} className="w-20 h-20 rounded-md object-cover"/>
      <div className="flex-grow">
        <h4 className="font-bold">{item.menuItem.name}</h4>
        <div className="text-sm text-gray-500">
            {item.selectedModifiers.map(m => m.optionName).join(', ')}
        </div>
        <div className="flex items-center justify-between mt-2">
            <div className="flex items-center border rounded-full">
                <button onClick={() => updateItemQuantity(item.id, item.quantity - 1)} className="p-1"><Minus size={14}/></button>
                <span className="px-2 text-sm font-bold">{item.quantity}</span>
                <button onClick={() => updateItemQuantity(item.id, item.quantity + 1)} className="p-1"><Plus size={14}/></button>
            </div>
             <span className="font-semibold">{formatCurrency(itemPrice * item.quantity)}</span>
        </div>
      </div>
      <button onClick={() => removeItem(item.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={20}/></button>
    </div>
  );
};


const CartDrawer: React.FC = () => {
  const { isOpen, toggleCart, items, getCartTotal, clearCart } = useCartStore();
  const navigate = useNavigate();

  const handleCheckout = () => {
    toggleCart();
    navigate('/checkout');
  };

  return (
    <>
      <div 
        className={`fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={toggleCart}
      />
      <div className={`fixed top-0 right-0 h-full w-full max-w-sm bg-white shadow-lg z-50 transform transition-transform ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <header className="p-4 border-b flex justify-between items-center">
            <h2 className="text-xl font-bold text-navy">Your Cart</h2>
            <button onClick={toggleCart} className="text-gray-500 hover:text-navy"><X size={24}/></button>
          </header>
          
          {items.length > 0 ? (
            <>
              <div className="flex-grow p-4 overflow-y-auto divide-y">
                {items.map(item => <CartItem key={item.id} item={item} />)}
              </div>
              <footer className="p-4 border-t space-y-4">
                 <div className="flex justify-between font-bold text-lg">
                    <span>Subtotal</span>
                    <span>{formatCurrency(getCartTotal())}</span>
                 </div>
                 <p className="text-sm text-gray-500 text-center">Taxes and tips calculated at checkout.</p>
                 <button onClick={handleCheckout} className="w-full bg-gold text-navy font-bold py-3 px-4 rounded-lg text-lg hover:bg-amber-500 transition-colors">
                    Go to Checkout
                 </button>
                 <button onClick={clearCart} className="w-full text-center text-sm text-gray-500 hover:text-red-600">
                    Clear Cart
                 </button>
              </footer>
            </>
          ) : (
            <div className="flex-grow flex flex-col items-center justify-center p-4 text-center">
                <h3 className="text-lg font-semibold">Your cart is empty</h3>
                <p className="text-gray-500 mt-2">Add some delicious coffee or pastries to get started!</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CartDrawer;