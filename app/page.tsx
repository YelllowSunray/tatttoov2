'use client';

import { useState } from 'react';
import { Gallery } from '@/components/Gallery';
import { TopArtists } from '@/components/TopArtists';
import { useAuth } from '@/contexts/AuthContext';
import { AuthModal } from '@/components/AuthModal';
import { ProfileModal } from '@/components/ProfileModal';
import { FilterSet } from '@/types';
import { FilterOptions } from '@/components/FilterBar';
import Link from 'next/link';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'gallery' | 'top-artists'>('gallery');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [galleryFilters, setGalleryFilters] = useState<FilterOptions | undefined>(undefined);
  const { user, loading, signOut } = useAuth();

  const handleApplyFilterSet = (filterSet: FilterSet) => {
    const filters: FilterOptions = {
      search: '',
      style: filterSet.styles.length > 0 ? filterSet.styles[0] : '',
      bodyPart: filterSet.bodyParts.length > 0 ? filterSet.bodyParts[0] : '',
      color: filterSet.colorPreference === 'both' ? 'all' : (filterSet.colorPreference || 'all'),
      minPrice: '',
      maxPrice: '',
      location: '',
      parlor: '',
      sortBy: 'newest',
    };
    setGalleryFilters(filters);
    setActiveTab('gallery');
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

  // Show gallery for unauthenticated users, but with limited functionality

  return (
    <div className="min-h-screen bg-white">
      {/* Header with refined spacing */}
      <header className="sticky top-0 z-50 border-b border-black bg-white/95 backdrop-blur-sm">
        <div className="container mx-auto px-4 sm:px-6 py-5 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-base sm:text-lg font-light tracking-[0.15em] text-black uppercase">
                Tattoo Discovery
              </h1>
              {user?.displayName && (
                <p className="mt-1.5 text-xs text-black/40 tracking-wide">
                  {user.displayName}
                </p>
              )}
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8">
              {user && (
                <>
                  <nav className="flex gap-0.5 border-b border-black/10 sm:border-0 pb-2 sm:pb-0">
                    <button
                      onClick={() => setActiveTab('gallery')}
                      className={`px-4 py-2.5 text-xs font-medium transition-all duration-200 uppercase tracking-[0.1em] min-h-[44px] ${
                        activeTab === 'gallery'
                          ? 'text-black border-b-2 border-black'
                          : 'text-black/40 hover:text-black/60'
                      }`}
                    >
                      Gallery
                    </button>
                    <button
                      onClick={() => setActiveTab('top-artists')}
                      className={`px-4 py-2.5 text-xs font-medium transition-all duration-200 uppercase tracking-[0.1em] min-h-[44px] ${
                        activeTab === 'top-artists'
                          ? 'text-black border-b-2 border-black'
                          : 'text-black/40 hover:text-black/60'
                      }`}
                    >
                      Top 5 Artists
                    </button>
                    <Link
                      href="/shops"
                      className="px-4 py-2.5 text-xs font-medium transition-all duration-200 uppercase tracking-[0.1em] min-h-[44px] flex items-center text-black/40 hover:text-black/60"
                    >
                      Shops
                    </Link>
                  </nav>
                </>
              )}
              <div className="flex items-center gap-4 sm:gap-6">
                {user && (
                  <Link
                    href="/beginners"
                    className="text-xs text-black/40 hover:text-black transition-colors duration-200 uppercase tracking-[0.1em] min-h-[44px] flex items-center"
                  >
                    For beginners
                  </Link>
                )}
                <Link
                  href="/studio"
                  className="text-xs text-black/40 hover:text-black transition-colors duration-200 uppercase tracking-[0.1em] min-h-[44px] flex items-center"
                >
                  For artists
                </Link>
                {user ? (
                  <>
                    <button
                      onClick={() => setShowProfileModal(true)}
                      className="rounded-full border border-black px-5 py-2.5 text-xs font-medium text-black transition-all duration-200 hover:bg-black hover:text-white active:bg-black/95 uppercase tracking-[0.1em] min-h-[44px] touch-manipulation"
                    >
                      Profile
                    </button>
                    <button
                      onClick={signOut}
                      className="rounded-full border border-black px-5 py-2.5 text-xs font-medium text-black transition-all duration-200 hover:bg-black hover:text-white active:bg-black/95 uppercase tracking-[0.1em] min-h-[44px] touch-manipulation"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setShowAuthModal(true)}
                    className="rounded-full bg-black px-5 py-2.5 text-xs font-medium text-white transition-all duration-200 hover:bg-black/90 active:bg-black/95 uppercase tracking-[0.1em] min-h-[44px] touch-manipulation"
                  >
                    Sign In
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content with intentional spacing */}
      <main className="container mx-auto px-4 sm:px-6 py-12 sm:py-20">
        {user && activeTab === 'top-artists' ? (
          <div className="mx-auto max-w-4xl">
            <TopArtists />
          </div>
        ) : (
          <Gallery onRequireAuth={() => setShowAuthModal(true)} initialFilters={galleryFilters} />
        )}
      </main>

      {/* Footer with refined spacing */}
      <footer className="border-t border-black bg-white">
        <div className="container mx-auto px-4 sm:px-6 py-12 sm:py-16 text-center">
          <p className="text-xs text-black/30 uppercase tracking-[0.15em]">
            Discover tattoo artists in the Netherlands
          </p>
        </div>
      </footer>
      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
      {showProfileModal && user && (
        <ProfileModal
          onClose={() => setShowProfileModal(false)}
          onApplyFilters={handleApplyFilterSet}
        />
      )}
    </div>
  );
}
