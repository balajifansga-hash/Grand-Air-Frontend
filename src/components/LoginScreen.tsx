import React, { useState } from 'react';
import { Fan, Lock, User, ShieldCheck, ArrowRight, AlertCircle, KeyRound } from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess: (userId: string) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(true);

  // Default credentials: User ID: admin / Password: grandair2026
  const DEFAULT_USER = 'admin';
  const DEFAULT_PASS = 'grandair2026';

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanUser = userId.trim();
    const cleanPass = password.trim();

    if (cleanUser === DEFAULT_USER && cleanPass === DEFAULT_PASS) {
      if (rememberMe) {
        localStorage.setItem('grand_air_logged_in_user', cleanUser);
      } else {
        sessionStorage.setItem('grand_air_logged_in_user', cleanUser);
      }
      onLoginSuccess(cleanUser);
    } else {
      setError('Invalid User ID or Password. Please check the credentials below.');
    }
  };

  const fillDefaultCredentials = () => {
    setUserId(DEFAULT_USER);
    setPassword(DEFAULT_PASS);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 antialiased font-sans">
      <div className="max-w-md w-full space-y-8 bg-white border border-slate-200 p-8 rounded-3xl shadow-xl shadow-slate-200/60">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center mx-auto shadow-lg shadow-blue-500/25">
            <Fan className="w-9 h-9 text-white animate-spin-slow" />
          </div>
          <div className="pt-2">
            <div className="flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-widest text-blue-600">
              <ShieldCheck className="w-4 h-4" />
              <span>Electronics Manufacturing</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
              GRAND AIR
            </h1>
            <p className="text-xs text-slate-500">
              Manufacturing Admin & Serialization Control Portal
            </p>
          </div>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Admin User ID
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                required
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="Enter User ID (e.g. admin)"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 text-slate-900 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter Password"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 text-slate-900 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Remember me</span>
            </label>

            <button
              type="button"
              onClick={fillDefaultCredentials}
              className="text-blue-600 hover:text-blue-700 font-semibold text-xs inline-flex items-center gap-1"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Fill Default Login</span>
            </button>
          </div>

          <button
            type="submit"
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.99] mt-2"
          >
            <span>Sign In to Admin Portal</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Credentials Info Helper Card */}
        <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 text-xs space-y-1.5 text-slate-600">
          <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Default Administrator Credentials</span>
          </div>
          <div className="flex items-center justify-between font-mono bg-white p-2 rounded-lg border border-slate-200 text-[11px]">
            <span>User ID: <strong className="text-blue-700">admin</strong></span>
            <span>Password: <strong className="text-blue-700">grandair2026</strong></span>
          </div>
          <p className="text-[10px] text-slate-400">
            Click "Fill Default Login" above to automatically load these credentials.
          </p>
        </div>
      </div>
    </div>
  );
};

