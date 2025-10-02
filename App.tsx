import React, { useEffect } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import MenuPage from './pages/MenuPage';
import CheckoutPage from './pages/CheckoutPage';
import AccountPage from './pages/AccountPage';
import LocationPage from './pages/LocationPage';
import ConfirmationPage from './pages/ConfirmationPage';
import LoginPage from './pages/LoginPage';
import RewardsPage from './pages/RewardsPage';
import HistoryPage from './pages/HistoryPage';
import PersonalInfoPage from './pages/PersonalInfoPage';
import PrivacyPage from './pages/PrivacyPage';
import Reset from './pages/Reset';
import UpdatePassword from './pages/UpdatePassword';
import CartDrawer from './components/CartDrawer';
import { Toaster } from 'react-hot-toast';
import { supabase } from './lib/supabaseClient';
import { useAuthStore } from './hooks/useAuthStore';

const App: React.FC = () => {
  useEffect(() => {
    // This effect hook handles the Supabase authentication state changes.
    // It's placed in the top-level App component to ensure it runs once
    // when the application loads.
    
    // Guard against the case where the Supabase client might not be initialized
    // (e.g., missing environment variables).
    if (!supabase) {
      console.error("Supabase client is not available. Authentication will not work.");
      // Set loading to false so the app doesn't hang in a loading state.
      useAuthStore.setState({ isLoading: false });
      return;
    }

    // `onAuthStateChange` returns a subscription object. We capture it here
    // so we can unsubscribe later, preventing memory leaks.
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        // This callback is triggered on sign-in, sign-out, and token refresh.
        // We delegate the state update logic to our Zustand store.
        useAuthStore.getState().setUserAndFetchData(session);
      }
    );

    // The cleanup function for the useEffect hook.
    // React will call this when the component unmounts.
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []); // The empty dependency array ensures this effect runs only once on mount.

  return (
    <HashRouter>
      <div className="flex flex-col min-h-screen font-sans bg-white text-navy">
        <Header />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/menu" element={<MenuPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/account" element={<AccountPage />} />
            <Route path="/location" element={<LocationPage />} />
            <Route path="/confirmation/:orderId" element={<ConfirmationPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/reset" element={<Reset />} />
            <Route path="/update-password" element={<UpdatePassword />} />
            <Route path="/rewards" element={<RewardsPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/account/info" element={<PersonalInfoPage />} />
            <Route path="/account/privacy" element={<PrivacyPage />} />
          </Routes>
        </main>
        <Footer />
        <CartDrawer />
        <Toaster position="bottom-center" />
      </div>
    </HashRouter>
  );
};

export default App;
