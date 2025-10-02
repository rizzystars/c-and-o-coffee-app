import React, { useState } from 'react';
import { useAuthStore } from '../hooks/useAuthStore';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Spinner from '../components/Spinner';
import { MailCheck } from 'lucide-react';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const { login, signUp } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter both email and password.");
      return;
    }
    setIsLoading(true);
    
    try {
      if (isLogin) {
        await login(email, password);
        toast.success('Logged in successfully!');
        navigate('/account');
      } else {
        await signUp(email, password);
        toast.success('Account created!');
        setSignupSuccess(true);
      }
    } catch (error: any) {
      toast.error(error.message || "An unknown error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 flex justify-center">
      <div className="w-full max-w-md">
        <div className="bg-white p-8 rounded-lg shadow-md">
          {signupSuccess ? (
             <div className="text-center">
                <MailCheck className="mx-auto h-16 w-16 text-green-500" />
                <h1 className="text-2xl font-bold text-center my-4 font-serif">Check Your Email</h1>
                <p className="text-gray-600">
                    We've sent a verification link to <span className="font-semibold">{email}</span>. Please click the link in the email to activate your account.
                </p>
             </div>
          ) : (
            <>
              <h1 className="text-3xl font-bold text-center mb-6 font-serif">{isLogin ? 'Log In' : 'Sign Up'}</h1>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email address</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-gold focus:border-gold"
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete={isLogin ? "current-password" : "new-password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-gold focus:border-gold"
                    disabled={isLoading}
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-navy text-white font-bold py-3 px-4 rounded-lg hover:bg-gray-800 transition-colors disabled:bg-gray-400 flex justify-center items-center"
                >
                  {isLoading ? <Spinner className="border-white" /> : (isLogin ? 'Log In' : 'Create Account')}
                </button>
                <p className="text-sm text-right mt-1">
    <a href="/#/reset" className="underline hover:no-underline">Forgot password?</a>
  </p>
</form>
              <div className="mt-6 text-center">
                <button onClick={() => setIsLogin(!isLogin)} className="text-sm text-navy hover:text-gold" disabled={isLoading}>
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