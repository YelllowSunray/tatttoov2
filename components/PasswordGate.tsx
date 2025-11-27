'use client';

import { useState, useEffect } from 'react';

interface PasswordGateProps {
  children: React.ReactNode;
}

export function PasswordGate({ children }: PasswordGateProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [sitePassword, setSitePassword] = useState<string | null>(null);

  useEffect(() => {
    // Get password from environment variable or use default
    // This must be done in useEffect to ensure it runs on client side
    const password = process.env.NEXT_PUBLIC_SITE_PASSWORD || 'tattoo2024';
    setSitePassword(password);

    // Check if user is already authenticated in this session
    // Only check sessionStorage on client side
    if (typeof window !== 'undefined') {
      const authStatus = sessionStorage.getItem('site_authenticated');
      if (authStatus === 'true') {
        setIsAuthenticated(true);
      }
    }
    setLoading(false);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!sitePassword) {
      setError('Password not configured. Please contact administrator.');
      return;
    }

    if (password === sitePassword) {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('site_authenticated', 'true');
      }
      setIsAuthenticated(true);
    } else {
      setError('Incorrect password. Please try again.');
      setPassword('');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-black border-t-transparent mx-auto"></div>
          <p className="text-black/60 text-sm tracking-wide">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white p-4">
        <div className="w-full max-w-md border border-black bg-white p-8 sm:p-10 md:p-12">
          <div className="mb-8 text-center">
            <h1 className="mb-4 text-2xl sm:text-3xl md:text-4xl font-light tracking-[-0.02em] text-black">
              Tattoo Discovery
            </h1>
            <p className="text-sm text-black/50 tracking-wide">
              Enter password to access
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="password" className="mb-3 block text-xs font-medium text-black/60 uppercase tracking-wider">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                placeholder="Enter site password"
                className="w-full border-b border-black/20 bg-transparent px-0 py-3 text-base text-black placeholder-black/30 focus:border-black focus:outline-none transition-colors duration-200"
                autoFocus
              />
              {error && (
                <p className="mt-2 text-sm text-red-600">{error}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={!password.trim()}
              className="w-full rounded-full bg-black px-6 py-3.5 text-xs font-medium text-white transition-all duration-200 hover:bg-black/90 active:bg-black/95 uppercase tracking-[0.1em] min-h-[44px] touch-manipulation disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Enter
            </button>
          </form>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

