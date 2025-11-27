'use client';

import { useState } from 'react';
import { BeginnersQuestionnaire } from '@/components/BeginnersQuestionnaire';
import { useAuth } from '@/contexts/AuthContext';
import { AuthModal } from '@/components/AuthModal';

export default function BeginnersPage() {
  const { user, loading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

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

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4">
        <div className="max-w-md text-center">
          <p className="text-lg font-light uppercase tracking-[0.15em] text-black">
            Sign in required
          </p>
          <p className="mt-4 text-sm text-black/60">
            Create an account or sign in to access the beginners questionnaire and save your personalized tattoo recommendations.
          </p>
          <button
            onClick={() => setShowAuthModal(true)}
            className="mt-8 rounded-full bg-black px-6 py-3 text-xs font-medium uppercase tracking-[0.1em] text-white transition-all duration-200 hover:bg-black/90"
          >
            Sign In
          </button>
        </div>
        {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <BeginnersQuestionnaire />
    </div>
  );
}

