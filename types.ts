
export interface User {
  id: string;
  email?: string;
  displayName?: string;
}

export interface ModifierOption {
  id: string;
  name: string;
  price: number; // in cents
}

export interface ModifierGroup {
  id:string;
  name: string;
  options: ModifierOption[];
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number; // in cents
  category: string;
  imageUrl: string;
  stock: number;
  modifiers?: ModifierGroup[];
}

export interface SelectedModifier {
    groupName: string;
    optionName: string;
    price: number;
}

export interface CartItem {
  id: string; // Unique ID for the cart item instance
  menuItem: MenuItem;
  quantity: number;
  selectedModifiers: SelectedModifier[];
}

export interface LoyaltyBalance {
  userId: string;
  balancePoints: number;
}

export enum LoyaltyLedgerReason {
  EARN = 'earn',
  REDEEM = 'redeem',
  REFUND = 'refund',
  ADJUSTMENT = 'adjustment'
}

export interface LoyaltyLedgerEntry {
  id: string;
  userId: string;
  deltaPoints: number;
  reason: LoyaltyLedgerReason;
  orderId?: string;
  createdAt: string;
}

export interface OrderItem {
  sku: string;
  name: string;
  price: number; // in cents
  quantity: number;
  modifiers: Record<string, string>;
}

export interface Order {
  id: string;
  squareOrderId: string;
  status: 'PENDING' | 'COMPLETED' | 'CANCELED';
  subtotal: number;
  tax: number;
  tip: number;
  discount?: number; // << ADDED
  total: number;
  pickupTime: string;
  createdAt: string;
  items: OrderItem[];
}