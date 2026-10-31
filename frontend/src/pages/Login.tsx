import React, { useState } from 'react';
import { useAuthStore } from '../context/useAuthStore';
import api from '../services/api';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loginStore = useAuthStore((state) => state.login);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await api.post('/auth/login', { username, password });
      const { user, token } = response.data;

      // Seed the global Zustand session configuration parameters
      loginStore(user, token);

      // Route user straight into their designated tracking workplace dashboard
      window.location.href = '/dashboard';
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
  <div className="h-screen w-screen bg-slate-100 flex items-center justify-center p-0 md:p-6 overflow-hidden font-sans">
    {/* Main Container Frame - changed max-w-5xl to max-w-4xl and forced hard height restriction on desktop viewports */}
    <div className="w-full h-full md:h-auto md:max-h-[90vh] max-w-4xl bg-white md:rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row">

      {/* LEFT BRAND PANEL: Accent Branding Panel (Hidden on mobile) */}
      <div className="hidden md:flex md:w-1/2 bg-blue-600 p-8 lg:p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-blue-500 rounded-full opacity-20 pointer-events-none" />
        <div className="absolute -left-8 -top-8 w-48 h-48 bg-blue-700 rounded-full opacity-30 pointer-events-none" />

        <div className="relative z-10">
          <span className="text-white font-bold tracking-wider text-sm uppercase">eLTS Engine</span>
        </div>

        <div className="my-auto relative z-10 text-white space-y-3">
          <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight">
            Streamline your workflow
          </h1>
          <p className="text-blue-100 text-sm font-light max-w-xs">
            Track government documents, resolutions, and committee reports cleanly within a centralized repository system.
          </p>
        </div>

        <div className="relative z-10 text-[10px] text-blue-200 font-light">
          &copy; 2026 eLegislative Tracking System. Local Intranet Node.
        </div>
      </div>

      {/* RIGHT DATA ENTRY PANEL: Scrollable internal content ONLY if mobile screens require it */}
      <div className="w-full md:w-1/2 p-6 sm:p-10 lg:p-12 flex flex-col justify-center bg-white overflow-y-auto">
        <div className="w-full max-w-sm mx-auto space-y-6">

          {/* Header Identity Stack */}
          <div className="space-y-1">
            <h2 className="text-xl lg:text-2xl font-bold text-gray-900 tracking-tight">
              Login to System Portal
            </h2>
            <p className="text-xs text-gray-500">
              Welcome back! Please supply administrative access credentials.
            </p>
          </div>

          {/* Error Message Box Callout Banner */}
          {error && (
            <div className="p-3.5 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-md text-xs">
              <p className="font-semibold">Access Verification Warning</p>
              <p className="mt-0.5 font-light">{error}</p>
            </div>
          )}

          {/* Interactive Data Entry Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-[10px] font-semibold uppercase tracking-wider text-gray-700 mb-1">
                Username
              </label>
              <input
                id="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter system account name"
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-gray-900 placeholder-gray-400 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50/50"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-[10px] font-semibold uppercase tracking-wider text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-gray-900 placeholder-gray-400 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50/50"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs font-semibold rounded-lg shadow-sm hover:shadow transition-all duration-200 mt-2 flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <span>Verifying Configuration...</span>
              ) : (
                <>
                  <span>Sign In &rarr;</span>
                </>
              )}
            </button>
          </form>

          {/* Public Access Link */}
          <div className="border-t border-gray-100 pt-4 text-center">
            <p className="text-[11px] text-gray-500">
              Are you a local resident?{' '}
              <a href="/public-track" className="font-semibold text-blue-600 hover:text-blue-700 hover:underline transition duration-150">
                Track your application status here
              </a>
            </p>
          </div>

        </div>
      </div>

    </div>
  </div>
  );
}
