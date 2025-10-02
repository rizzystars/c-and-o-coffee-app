
import { create } from 'zustand';
import { supabase } from '../lib/supabaseClient';
import type { User, LoyaltyBalance, LoyaltyLedgerEntry, Order } from '../types';
import toast from 'react-hot-toast';
import type { Session } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: Session | null;
  loyaltyBalance: LoyaltyBalance | null;
  loyaltyHistory: LoyaltyLedgerEntry[];
  orders: Order[];
  isLoading: boolean;
  isUserDataLoading: boolean;
  signUp: (email: string, password: string) => Promise<any>;
  login: (email: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
  fetchUserData: () => Promise<void>;
  setUserAndFetchData: (session: Session | null) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  loyaltyBalance: null,
  loyaltyHistory: [],
  orders: [],
  isLoading: true,
  isUserDataLoading: false,

  signUp: async (email, password) => {
    if (!supabase) throw new Error("Supabase client is not initialized.");
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    return data;
  },

  login: async (email, password) => {
    if (!supabase) throw new Error("Supabase client is not initialized.");
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  logout: async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    // State will be cleared by the onAuthStateChange listener
  },
  
  setUserAndFetchData: (session) => {
    const previousUser = get().user;

    if (session?.user) {
        // If the user is the same, just ensure loading is false and exit.
        // This prevents re-fetching data on every auth event for the same session.
        if (session.user.id === previousUser?.id) {
            set({ isLoading: false });
            return;
        }

        const newUser: User = {
            id: session.user.id,
            email: session.user.email,
            displayName: session.user.user_metadata?.display_name,
        };
        // Set the new user and then immediately trigger the data fetch.
        set({ user: newUser, session, isLoading: false });
        get().fetchUserData();
    } else {
        // User logged out, clear all user-specific data.
        set({
            user: null,
            session: null,
            isLoading: false,
            loyaltyBalance: null,
            loyaltyHistory: [],
            orders: [],
        });
    }
  },

  fetchUserData: async () => {
    const { user } = get();
    if (!user || !supabase) {
        console.warn("fetchUserData called without a user or supabase client.");
        return;
    }

    set({ isUserDataLoading: true });
    try {
      const [loyaltyBalanceRes, loyaltyHistoryRes, ordersRes] = await Promise.all([
        supabase.from('loyalty_balances').select('*').eq('user_id', user.id).single(),
        supabase.from('loyalty_ledger').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('orders').select('*, items:order_items(*)').eq('user_id', user.id).order('created_at', { ascending: false })
      ]);

      if (loyaltyBalanceRes.error && loyaltyBalanceRes.status !== 406) throw loyaltyBalanceRes.error;
      if (loyaltyHistoryRes.error) throw loyaltyHistoryRes.error;
      if (ordersRes.error) throw ordersRes.error;

      set({
        loyaltyBalance: loyaltyBalanceRes.data,
        loyaltyHistory: loyaltyHistoryRes.data as LoyaltyLedgerEntry[],
        orders: ordersRes.data as Order[],
      });

    } catch (error: any) {
        toast.error("Failed to fetch account details: " + error.message);
        console.error("Error fetching user data:", error);
    } finally {
        set({ isUserDataLoading: false });
    }
  },
}));

// The module-level subscription to onAuthStateChange has been removed from this file.
// It is now handled inside the App.tsx component for better lifecycle management.
