
import { createClient, SupabaseClient, SupportedStorage } from '@supabase/supabase-js';

// Use `process.env` which is the standard way to access environment variables
// that are typically replaced at build time in frontend applications.
const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

// A custom in-memory storage adapter to be used as a fallback if localStorage is not available.
const memoryStorage = new Map<string, string>();
const inMemoryStorageAdapter: SupportedStorage = {
    getItem: (key: string) => memoryStorage.get(key) ?? null,
    setItem: (key: string, value: string) => {
        memoryStorage.set(key, value);
    },
    removeItem: (key: string) => {
        memoryStorage.delete(key);
    },
};

// This function safely determines the best available storage option.
const getBestStorage = (): SupportedStorage => {
    try {
        localStorage.setItem('supabase.storage.test', 'test');
        localStorage.removeItem('supabase.storage.test');
        return localStorage;
    } catch (error) {
        console.error(
          "CRITICAL: localStorage is not available or blocked. Supabase is falling back to in-memory storage. User sessions will NOT persist across page reloads or tabs. This can happen in private browsing mode or due to browser security settings.",
          error
        );
        return inMemoryStorageAdapter;
    }
}

// Initialize the client in a variable that can be null.
let supabaseInstance: SupabaseClient | null = null;

if (!supabaseUrl || !supabaseAnonKey) {
  // Log a critical error to the console instead of crashing the app.
  // This allows the app to load and display a degraded state.
  console.error("CRITICAL: Supabase environment variables (SUPABASE_URL, SUPABASE_ANON_KEY) are not set. The application will run in a degraded mode without database connectivity. Please check your .env file or hosting provider's configuration.");
} else {
  // If the variables are present, create the client instance.
  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { flowType: 'pkce',
        storage: getBestStorage(),
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
    }
  });
}

// Export the instance, which will be null if configuration is missing.
export const supabase = supabaseInstance;
