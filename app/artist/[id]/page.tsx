'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Artist, Tattoo } from '@/types';
import { getArtist, getTattoosByArtist, trackArtistPhoneClick } from '@/lib/firestore';
import { TattooCard } from '@/components/TattooCard';
import { InquiryModal } from '@/components/InquiryModal';
import { useAuth } from '@/contexts/AuthContext';

export default function ArtistProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const artistId = params.id as string;
  
  const [artist, setArtist] = useState<Artist | null>(null);
  const [tattoos, setTattoos] = useState<Tattoo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInquiryModal, setShowInquiryModal] = useState(false);
  const [showPhoneNumber, setShowPhoneNumber] = useState(false);

  useEffect(() => {
    const loadArtistData = async () => {
      try {
        setLoading(true);
        const [artistData, tattoosData] = await Promise.all([
          getArtist(artistId),
          getTattoosByArtist(artistId)
        ]);

        if (!artistData) {
          setError('Artist not found');
          return;
        }

        if (artistData.isVisible === false) {
          setError('This artist profile is not publicly available.');
          return;
        }

        setArtist(artistData);
        // Only show tattoos that are not explicitly hidden
        setTattoos(tattoosData.filter((tattoo) => tattoo.isVisible !== false));
        setError(null);
      } catch (err) {
        setError('Failed to load artist profile. Please try again later.');
        console.error('Error loading artist data:', err);
      } finally {
        setLoading(false);
      }
    };

    if (artistId) {
      loadArtistData();
    }
  }, [artistId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <header className="border-b border-black bg-white">
          <div className="container mx-auto px-4 sm:px-6 py-5 sm:py-6">
            <Link
              href="/"
              className="text-xs text-black/40 hover:text-black transition-colors duration-200 uppercase tracking-[0.1em] inline-flex items-center gap-2"
            >
              ← Back to Gallery
            </Link>
          </div>
        </header>
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-black border-t-transparent mx-auto"></div>
            <p className="text-black/60 text-sm tracking-wide">Loading artist profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !artist) {
    return (
      <div className="min-h-screen bg-white">
        <header className="border-b border-black bg-white">
          <div className="container mx-auto px-4 sm:px-6 py-5 sm:py-6">
            <Link
              href="/"
              className="text-xs text-black/40 hover:text-black transition-colors duration-200 uppercase tracking-[0.1em] inline-flex items-center gap-2"
            >
              ← Back to Gallery
            </Link>
          </div>
        </header>
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <p className="text-black/60 mb-6 text-sm">{error || 'Artist not found'}</p>
            <Link
              href="/"
              className="rounded-full border border-black px-6 py-3 text-xs font-medium text-black transition-all hover:bg-black hover:text-white active:bg-black/95 uppercase tracking-[0.1em] min-h-[44px] touch-manipulation inline-block"
            >
              Back to Gallery
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-black bg-white/95 backdrop-blur-sm">
        <div className="container mx-auto px-4 sm:px-6 py-5 sm:py-6">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="text-xs text-black/40 hover:text-black transition-colors duration-200 uppercase tracking-[0.1em] inline-flex items-center gap-2"
            >
              ← Back to Gallery
            </Link>
            {user && (
              <Link
                href="/studio"
                className="text-xs text-black/40 hover:text-black transition-colors duration-200 uppercase tracking-[0.1em]"
              >
                For artists
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Artist Profile Section */}
      <main className="container mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <div className="mx-auto max-w-7xl">
          {/* Artist Header */}
          <div className="mb-12 sm:mb-16 md:mb-20">
            <h1 className="mb-3 sm:mb-4 text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light tracking-[-0.02em] text-black leading-[1.1]">
              {artist.name}
            </h1>
            <p className="mb-6 text-sm sm:text-base text-black/50 uppercase tracking-[0.1em]">
              {artist.location}
            </p>
            
            {artist.bio && (
              <p className="mb-8 max-w-2xl text-sm sm:text-base text-black/60 leading-relaxed">
                {artist.bio}
              </p>
            )}

            {/* Contact Links and Request Consultation Button */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
              <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                {artist.instagram && (
                  <a
                    href={artist.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-black/40 hover:text-black transition-colors duration-200 uppercase tracking-[0.1em] underline underline-offset-4"
                  >
                    Instagram
                  </a>
                )}
                {artist.website && (
                  <a
                    href={artist.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-black/40 hover:text-black transition-colors duration-200 uppercase tracking-[0.1em] underline underline-offset-4"
                  >
                    Website
                  </a>
                )}
                {artist.email && (
                  <a
                    href={`mailto:${artist.email}`}
                    className="text-xs text-black/40 hover:text-black transition-colors duration-200 uppercase tracking-[0.1em] underline underline-offset-4"
                  >
                    Email
                  </a>
                )}
                {artist.phone && (
                  <button
                    type="button"
                    onClick={() => {
                      if (!showPhoneNumber) {
                        // Track only the first reveal as a "phone click" event
                        trackArtistPhoneClick(artist.id).catch(() => {});
                      }
                      setShowPhoneNumber((prev) => !prev);
                    }}
                    className="text-xs text-black/40 hover:text-black transition-colors duration-200 uppercase tracking-[0.1em] underline underline-offset-4"
                  >
                    {showPhoneNumber ? artist.phone : 'Phone'}
                  </button>
                )}
              </div>
              {artist.email && (
              <button
                onClick={() => setShowInquiryModal(true)}
                className="rounded-full bg-black px-6 py-3.5 text-xs font-medium text-white transition-all duration-200 hover:bg-black/90 active:bg-black/95 uppercase tracking-[0.1em] min-h-[44px] touch-manipulation whitespace-nowrap"
              >
                Request Consultation
              </button>
              )}
            </div>
          </div>

          {/* Portfolio Stats */}
          <div className="mb-8 sm:mb-12 border-b border-black/10 pb-6">
            <p className="text-xs text-black/40 uppercase tracking-[0.1em]">
              {tattoos.length} {tattoos.length === 1 ? 'tattoo' : 'tattoos'} in portfolio
            </p>
          </div>

          {/* Portfolio Grid */}
          {tattoos.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-0.5 sm:gap-1">
              {tattoos.map((tattoo) => (
                <TattooCard
                  key={tattoo.id}
                  tattoo={tattoo}
                  artistName={artist.name}
                  artistLocation={artist.location}
                  artistId={artist.id}
                />
              ))}
            </div>
          ) : (
            <div className="border border-black/10 bg-white p-12 text-center">
              <p className="text-sm text-black/50 tracking-wide">
                No tattoos available yet. Check back soon!
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-black bg-white">
        <div className="container mx-auto px-4 sm:px-6 py-12 sm:py-16 text-center">
          <p className="text-xs text-black/30 uppercase tracking-[0.15em]">
            Discover tattoo artists in the Netherlands
          </p>
        </div>
      </footer>

      {/* Inquiry Modal */}
      {showInquiryModal && artist && (
        <InquiryModal
          artist={artist}
          onClose={() => setShowInquiryModal(false)}
        />
      )}
    </div>
  );
}

