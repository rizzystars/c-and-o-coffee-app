param([string].=".")
Stop="Stop"
Push-Location .

function Backup-One([string]){
  if(Test-Path ){
     = Get-Date -Format "yyyyMMdd-HHmmss"
     = Join-Path . "backups\"
    New-Item -ItemType Directory -Force -Path  | Out-Null
    Copy-Item  (Join-Path  ([io.path]::GetFileName())) -Force
    Write-Host "🧷 Backup -> " -ForegroundColor DarkCyan
  }
}

# 1) Ensure styles/app-overrides.css exists with authoritative rules
src\styles = Join-Path "src" "styles"
src\styles\app-overrides.css = Join-Path src\styles "app-overrides.css"
New-Item -ItemType Directory -Force -Path src\styles | Out-Null
Backup-One src\styles\app-overrides.css
@'
 /* Homepage-specific background — wins without touching other CSS */
 body.home-hero {
   background-image: url('/cappuccino-crew.png') !important;
   background-repeat: no-repeat;
   background-position: center;
   background-size: cover;
 }

 /* Let the art show through on the homepage */
 body.home-hero main,
 body.home-hero main * {
   background: transparent !important;
 }

 /* Keep header solid */
 header {
   background-color: #000 !important;
   background-image: none !important;
   backdrop-filter: none !important;
 }
'@ | Set-Content -Path src\styles\app-overrides.css -Encoding UTF8
Write-Host "✅ Wrote src\styles\app-overrides.css" -ForegroundColor Green

# 2) Find the file that mounts the Router
C:\Users\mixed\Downloads\c-and-o-coffee-app\src\styles\App.tsx = Get-ChildItem -Recurse -File -Include *.tsx,*.jsx | Where-Object {
  (Get-Content .FullName -Raw) -match 'HashRouter|BrowserRouter|createBrowserRouter'
} | Select-Object -First 1
if(-not C:\Users\mixed\Downloads\c-and-o-coffee-app\src\styles\App.tsx){ throw "Could not find a React Router entry file. Search for HashRouter/BrowserRouter." }

# 3) Make sure it imports the overrides
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


 = Get-Content C:\Users\mixed\Downloads\c-and-o-coffee-app\src\styles\App.tsx.FullName -Raw
if(import React, { useEffect } from 'react';
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


 -notmatch "import\s+['""]\.\/styles\/app-overrides\.css['""];"){
  Backup-One C:\Users\mixed\Downloads\c-and-o-coffee-app\src\styles\App.tsx.FullName
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


 = import React, { useEffect } from 'react';
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


 -replace '(?ms)(^\s*(import[^\n]*;\s*)+)', "$1
import "./styles/app-overrides.css";
"
  Set-Content -Path C:\Users\mixed\Downloads\c-and-o-coffee-app\src\styles\App.tsx.FullName -Value import React, { useEffect } from 'react';
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


 -Encoding UTF8
  Write-Host "✅ Added import to App.tsx" -ForegroundColor Green
} else {
  Write-Host "ℹ️ Import already present in App.tsx" -ForegroundColor DarkYellow
}

# 4) Ensure BodyClassController definition + render
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


 = Get-Content C:\Users\mixed\Downloads\c-and-o-coffee-app\src\styles\App.tsx.FullName -Raw

True = import React, { useEffect } from 'react';
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


 -notmatch '(function|const)\s+BodyClassController'
if(True){
  # ensure useLocation import exists
  if(import React, { useEffect } from 'react';
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


 -match 'import\s+\{\s*([^\}]*)\}\s+from\s+["'']react-router-dom["''];'){
    if(System.Collections.Hashtable[1] -notmatch '\buseLocation\b'){
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


 = import React, { useEffect } from 'react';
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


 -replace 'import\s+\{\s*([^\}]*)\}\s+from\s+["'']react-router-dom["''];', { param() =.Groups[1].Value.Trim(); if(){=", useLocation"} else {="useLocation"}; "import {  } from "react-router-dom";" }
    }
  } elseif(import React, { useEffect } from 'react';
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


 -match 'from\s+["'']react-router-dom["'']'){
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


 = import React, { useEffect } from 'react';
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


 -replace '(?ms)^(\s*import\s+[^;]+from\s+["'']react-router-dom["''];\s*)', "$1
import { useLocation } from "react-router-dom";
"
  } else {
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


 = "import { useLocation } from "react-router-dom";
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


"
  }

  function BodyClassController() {
  const location = useLocation();
  React.useEffect(() => {
    const onHome =
      location.pathname === "/" || window.location.hash === "#/" || window.location.hash === "";
    document.body.classList.toggle("home-hero", onHome);
  }, [location]);
  return null;
} = @'
function BodyClassController() {
  const location = useLocation();
  React.useEffect(() => {
    const onHome =
      location.pathname === "/" || window.location.hash === "#/" || window.location.hash === "";
    document.body.classList.toggle("home-hero", onHome);
  }, [location]);
  return null;
}
'@

  if(import React, { useEffect } from 'react';
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


 -match 'export\s+default'){
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


 = import React, { useEffect } from 'react';
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


 -replace '(?ms)(export\s+default)', "function BodyClassController() {
  const location = useLocation();
  React.useEffect(() => {
    const onHome =
      location.pathname === "/" || window.location.hash === "#/" || window.location.hash === "";
    document.body.classList.toggle("home-hero", onHome);
  }, [location]);
  return null;
}

$1"
  } else {
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


 = "function BodyClassController() {
  const location = useLocation();
  React.useEffect(() => {
    const onHome =
      location.pathname === "/" || window.location.hash === "#/" || window.location.hash === "";
    document.body.classList.toggle("home-hero", onHome);
  }, [location]);
  return null;
}

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


"
  }
}

# ensure it renders in the Router
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


 = import React, { useEffect } from 'react';
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


 -replace '(?ms)(<HashRouter[^>]*>)','$1
      <BodyClassController />'
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


 = import React, { useEffect } from 'react';
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


 -replace '(?ms)(<BrowserRouter[^>]*>)','$1
      <BodyClassController />'

Set-Content -Path C:\Users\mixed\Downloads\c-and-o-coffee-app\src\styles\App.tsx.FullName -Value import React, { useEffect } from 'react';
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


 -Encoding UTF8
Write-Host "✅ Ensured BodyClassController in App.tsx" -ForegroundColor Green

# 5) Confirm the image exists
public\cappuccino-crew.png = Join-Path "public" "cappuccino-crew.png"
if(Test-Path public\cappuccino-crew.png){ Write-Host "✅ Found public\cappuccino-crew.png" -ForegroundColor Green } else { Write-Host "⚠️ Missing public\cappuccino-crew.png — place it in /public" -ForegroundColor Yellow }

Write-Host "
🎉 Patch complete." -ForegroundColor Cyan
Pop-Location
