import React, { useState } from "react";
import { useAuthStore } from "../hooks/useAuthStore";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Spinner from "../components/Spinner";
import { MailCheck } from "lucide-react";

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);

  const { login, signUp } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      toast.error("Enter a valid email.");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be 6+ chars.");
      return;
    }

    setIsLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
        toast.success("Logged in successfully!");
        navigate("/account");
      } else {
        await signUp(email, password);
        toast.success("Account created!");
        setSignupSuccess(true);
      }
    } catch (error: any) {
      toast.error(error?.message || "An unknown error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-black bg-center bg-no-repeat"
      style={{
        backgroundImage: "url('/coffee_girls.png')",
        backgroundSize: "min(90%, 780px)",
      }}
      aria-label={isLogin ? "Login screen" : "Sign up screen"}
    >
      <div className="w-full max-w-md">
        <div className="auth-card relative z-10 rounded-2xl shadow-xl p-6 md:p-8 max-w-md w-full mx-auto">
          {signupSuccess ? (
            <div className="text-center">
              <MailCheck className="mx-auto h-16 w-16" />
              <h1 className="text-2xl font-bold text-center my-4 font-serif text-white/90">
                Check Your Email
              </h1>
              <p className="text-white/70">
                We've sent a verification link to{" "}
                <span className="font-semibold text-white/90">{email}</span>. Please click the
                link in the email to activate your account.
              </p>
            </div>
          ) : (
            <>
              <h1 className="text-3xl font-bold text-center font-serif text-white/90">
                {isLogin ? "Log In" : "Sign Up"}
              </h1>
              <div className="mx-auto mt-2 mb-6 h-px w-12 bg-white/15" />

              <form onSubmit={handleSubmit} className="space-y-6" aria-busy={isLoading}>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-white/80">
                    Email address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    autoFocus
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 rounded-md shadow-sm bg-white text-[#0A2540] border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37]"
                    disabled={isLoading}
                  />
                </div>

                <div className="relative">
                  <label htmlFor="password" className="block text-sm font-medium text-white/80">
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type={showPw ? "text" : "password"}
                    autoComplete={isLogin ? "current-password" : "new-password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 rounded-md shadow-sm bg-white text-[#0A2540] border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37]"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute right-3 top-[42px] text-sm text-white/80 hover:text-white/90"
                    aria-label={showPw ? "Hide password" : "Show password"}
                    tabIndex={-1}
                  >
                    {showPw ? "Hide" : "Show"}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#0A2540] text-white font-bold py-3 px-4 rounded-lg hover:opacity-90 transition-colors disabled:opacity-60 flex justify-center items-center"
                >
                  {isLoading ? <Spinner className="border-white" /> : isLogin ? "Log In" : "Create Account"}
                </button>

                <p className="text-sm text-right mt-1">
                  <a href="/#/reset" className="underline underline-offset-4 text-white/80 hover:text-white/90">
                    Forgot password?
                  </a>
                </p>
              </form>

              <div className="mt-6 text-center">
                <button
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-sm text-white/80 hover:text-white/90 underline underline-offset-4"
                  disabled={isLoading}
                  type="button"
                >
                  {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Log In"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
