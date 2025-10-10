import React, { useEffect } from 'react';
import "./styles/app-overrides.css"; param($m) $inner=$m.Groups[1].Value.Trim(); if($inner){$inner="$inner, useLocation"} else {$inner="useLocation"}; "import { $inner } from `"react-router-dom`";" 
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
import OrderConfirmationPage from './pages/OrderConfirmationPage'; // <-- NEW
import CartDrawer from './components/CartDrawer';
import { Toaster } from 'react-hot-toast';
import { supabase } from './lib/supabaseClient';
import { useAuthStore } from './hooks/useAuthStore';

const App: React.FC = () => {
  useEffect(() => {
    // This effect hook handles the Supabase authentication state changes.
    // It's placed in the top-level App component to ensure it runs once
    // when the application loads.

    if (!supabase) {
      console.error("Supabase client is not available. Authentication will not work.");
      useAuthStore.setState({ isLoading: false });
      return;
    }

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        useAuthStore.getState().setUserAndFetchData(session);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  return (
    `<HashRouter>`r`n      <BodyClassController />
      <div className="flex flex-col min-h-screen font-sans bg-white text-navy">
        <Header />
        <main className="flex-grow">
          <main className="min-h-screen"><Routes>
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
            {/* NEW: standard receipt page after successful Square payment */}
            <Route path="/order-confirmation" element={<OrderConfirmationPage />} />
          </Routes></main>
        </main>
        <Footer />
        <CartDrawer />
        <Toaster position="bottom-center" />
      </div>
    </HashRouter>
  );
};

function BodyClassController() {
  const location = useLocation();
  React.useEffect(() => {
    const onHome =
      location.pathname === "/" || window.location.hash === "#/" || window.location.hash === "";
    document.body.classList.toggle("home-hero", onHome);
  }, [location]);
  return null;
}

export default App;



