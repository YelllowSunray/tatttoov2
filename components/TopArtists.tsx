'use client';

import { useState, useEffect } from 'react';
import { Artist, ArtistScore, Tattoo } from '@/types';
import { getArtist, getTattoo, trackArtistPhoneClick } from '@/lib/firestore';
import { getTop5Artists, getUserId } from '@/lib/recommendations';
import { InquiryModal } from './InquiryModal';
import Link from 'next/link';
import Image from 'next/image';

interface TopArtistsProps {
  onRefresh?: () => void;
}

interface ContactModalProps {
  artist: Artist;
  onClose: () => void;
}

function ContactModal({ artist, onClose }: ContactModalProps) {
  const hasContactInfo = artist.email || artist.phone || artist.instagram || artist.website;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md border border-black/20 bg-white p-6 sm:p-8 md:p-10 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="mb-6 ml-auto block text-black/40 hover:text-black active:text-black/60 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation"
          aria-label="Close"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="1"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="mb-8 sm:mb-10 text-2xl sm:text-3xl md:text-4xl font-light tracking-[-0.02em] text-black">
          Contact {artist.name}
        </h2>

        {hasContactInfo ? (
          <div className="space-y-8">
            {artist.email && (
              <div>
                <label className="mb-3 block text-xs font-medium text-black/50 uppercase tracking-[0.1em]">
                  Email
                </label>
                <a
                  href={`mailto:${artist.email}`}
                  className="text-base text-black hover:text-black/60 transition-colors duration-200 break-all"
                >
                  {artist.email}
                </a>
              </div>
            )}

            {artist.phone && (
              <div>
                <label className="mb-3 block text-xs font-medium text-black/50 uppercase tracking-[0.1em]">
                  Phone
                </label>
                <button
                  type="button"
                  onClick={() => {
                    trackArtistPhoneClick(artist.id).catch(() => {});
                  }}
                  className="text-base text-black hover:text-black/60 transition-colors duration-200 underline underline-offset-4"
                >
                  {artist.phone}
                </button>
              </div>
            )}

            {artist.instagram && (
              <div>
                <label className="mb-3 block text-xs font-medium text-black/50 uppercase tracking-[0.1em]">
                  Instagram
                </label>
                <a
                  href={artist.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-base text-black hover:text-black/60 transition-colors duration-200 break-all underline underline-offset-4"
                >
                  {artist.instagram}
                </a>
              </div>
            )}

            {artist.website && (
              <div>
                <label className="mb-3 block text-xs font-medium text-black/50 uppercase tracking-[0.1em]">
                  Website
                </label>
                <a
                  href={artist.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-base text-black hover:text-black/60 transition-colors duration-200 break-all underline underline-offset-4"
                >
                  {artist.website}
                </a>
              </div>
            )}

            {artist.location && (
              <div>
                <label className="mb-3 block text-xs font-medium text-black/50 uppercase tracking-[0.1em]">
                  Location
                </label>
                <p className="text-base text-black/60">
                  {artist.location}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-sm text-black/50 tracking-wide">
              Contact information not available for this artist.
            </p>
          </div>
        )}

        <div className="mt-10 pt-8 border-t border-black/10 flex flex-col sm:flex-row gap-3">
          <Link
            href={`/artist/${artist.id}`}
            onClick={onClose}
            className="flex-1 rounded-full bg-black px-6 py-3.5 text-xs font-medium text-white transition-all duration-200 hover:bg-black/90 active:bg-black/95 uppercase tracking-[0.1em] min-h-[44px] touch-manipulation text-center"
          >
            View Profile
          </Link>
          <button
            onClick={onClose}
            className="flex-1 rounded-full border border-black px-6 py-3.5 text-xs font-medium text-black transition-all duration-200 hover:bg-black hover:text-white active:bg-black/95 uppercase tracking-[0.1em] min-h-[44px] touch-manipulation"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export function TopArtists({ onRefresh }: TopArtistsProps) {
  const [topArtists, setTopArtists] = useState<ArtistScore[]>([]);
  const [artistsData, setArtistsData] = useState<Map<string, Artist>>(new Map());
  const [tattoosData, setTattoosData] = useState<Map<string, Tattoo>>(new Map());
  const [loading, setLoading] = useState(true);
  const [showResults, setShowResults] = useState(false);
  const [contactModalArtist, setContactModalArtist] = useState<Artist | null>(null);
  const [inquiryModalArtist, setInquiryModalArtist] = useState<Artist | null>(null);
  const [selectedTattooIndex, setSelectedTattooIndex] = useState<number | null>(null);
  const [selectedArtistTattoos, setSelectedArtistTattoos] = useState<Tattoo[]>([]);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const loadTopArtists = async () => {
    try {
      setLoading(true);
      const userId = getUserId();
      const topScores = await getTop5Artists(userId);

      // Load full artist data
      const artistsMap = new Map<string, Artist>();
      const tattoosMap = new Map<string, Tattoo>();
      
      for (const score of topScores) {
        const artist = await getArtist(score.artistId);
        if (artist) {
          artistsMap.set(artist.id, artist);
        }
        
        // Load tattoo data for liked tattoos (limit to 5 per artist)
        const tattooIdsToLoad = score.likedTattooIds.slice(0, 5);
        for (const tattooId of tattooIdsToLoad) {
          if (!tattoosMap.has(tattooId)) {
            const tattoo = await getTattoo(tattooId);
            if (tattoo) {
              tattoosMap.set(tattoo.id, tattoo);
            }
          }
        }
      }

      setTopArtists(topScores);
      setArtistsData(artistsMap);
      setTattoosData(tattoosMap);
      setShowResults(true);
    } catch (err) {
      console.error('Error loading top artists:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTopArtists();
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    if (selectedTattooIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        handlePrevious();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'Escape') {
        handleCloseModal();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedTattooIndex, selectedArtistTattoos]);

  const handleTattooClick = (tattooId: string, artistId: string) => {
    const artistScore = topArtists.find(score => score.artistId === artistId);
    if (!artistScore) return;

    // Get all liked tattoos for this artist
    const tattoos: Tattoo[] = [];
    for (const id of artistScore.likedTattooIds) {
      const tattoo = tattoosData.get(id);
      if (tattoo) tattoos.push(tattoo);
    }

    // Find the index of the clicked tattoo
    const index = tattoos.findIndex(t => t.id === tattooId);
    if (index !== -1) {
      setSelectedArtistTattoos(tattoos);
      setSelectedTattooIndex(index);
    }
  };

  const handleNext = () => {
    if (selectedTattooIndex === null || selectedArtistTattoos.length === 0) return;
    setSelectedTattooIndex((selectedTattooIndex + 1) % selectedArtistTattoos.length);
  };

  const handlePrevious = () => {
    if (selectedTattooIndex === null || selectedArtistTattoos.length === 0) return;
    setSelectedTattooIndex(
      selectedTattooIndex === 0
        ? selectedArtistTattoos.length - 1
        : selectedTattooIndex - 1
    );
  };

  const handleCloseModal = () => {
    setSelectedTattooIndex(null);
    setSelectedArtistTattoos([]);
  };

  // Swipe handlers for mobile
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || touchEnd === null) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      handleNext();
    } else if (isRightSwipe) {
      handlePrevious();
    }
  };

  if (!showResults && topArtists.length === 0 && !loading) {
    return (
      <div className="border border-black/10 bg-white p-6 sm:p-12 text-center">
        <p className="mb-6 text-sm text-black/60 tracking-wide">
          Start liking tattoos to discover your Top 5 artists
        </p>
        <button
          onClick={loadTopArtists}
          className="rounded-full border border-black px-6 py-3 text-xs font-medium text-black transition-all hover:bg-black hover:text-white active:bg-black/90 active:text-white uppercase tracking-wider min-h-[44px] touch-manipulation"
        >
          Refresh Results
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="border border-black/10 bg-white p-6 sm:p-12 text-center">
        <div className="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-black border-t-transparent mx-auto"></div>
        <p className="text-black/60 text-xs tracking-wide">Calculating your matches...</p>
      </div>
    );
  }

  if (topArtists.length === 0) {
    return (
      <div className="border border-black/10 bg-white p-6 sm:p-12 text-center">
        <p className="text-black/60 text-sm tracking-wide">
          Like some tattoos to see your personalized recommendations
        </p>
      </div>
    );
  }

  return (
    <div className="border border-black bg-white p-6 sm:p-10 md:p-14">
      {/* Intentional header with refined spacing */}
      <div className="mb-10 sm:mb-14 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
        <div>
          <h2 className="mb-2 text-2xl sm:text-3xl md:text-4xl font-light tracking-[-0.02em] text-black">
            Your Top 5 Artists
          </h2>
          <p className="text-xs text-black/40 tracking-wide mt-1">
            Based on your preferences
          </p>
        </div>
        <button
          onClick={loadTopArtists}
          className="rounded-full border border-black px-5 py-2.5 text-xs font-medium text-black transition-all duration-200 hover:bg-black hover:text-white active:bg-black/95 uppercase tracking-[0.1em] min-h-[44px] touch-manipulation self-start sm:self-auto"
        >
          Refresh
        </button>
      </div>

      {/* Intentional list spacing */}
      <div className="space-y-0.5">
        {topArtists.map((score, index) => {
          const artist = artistsData.get(score.artistId);
          if (!artist) return null;

          return (
            <div
              key={score.artistId}
              className="flex flex-col gap-5 sm:gap-8 border-b border-black/10 pb-8 pt-8 transition-colors duration-200 first:pt-0 last:border-0 last:pb-0 hover:border-black/20"
            >
              <div className="flex flex-col sm:flex-row sm:items-start gap-5 sm:gap-8">
                {/* Intentional numbering */}
                <div className="flex h-14 w-14 shrink-0 items-center justify-center border border-black text-sm font-light text-black">
                  {index + 1}
                </div>
                
                <div className="flex-1 space-y-3">
                  <div>
                    <Link
                      href={`/artist/${artist.id}`}
                      className="mb-1 text-xl sm:text-2xl font-light tracking-tight text-black hover:text-black/60 transition-colors duration-200 inline-block"
                    >
                      {artist.name}
                    </Link>
                    <p className="text-xs text-black/40 uppercase tracking-[0.1em]">
                      {artist.location}
                    </p>
                  </div>
                  {artist.bio && (
                    <p className="text-sm text-black/50 leading-relaxed max-w-2xl">
                      {artist.bio}
                    </p>
                  )}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8 pt-1">
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
                    <span className="text-xs text-black/30 uppercase tracking-[0.1em]">
                      {score.likedTattoos} {score.likedTattoos === 1 ? 'tattoo' : 'tattoos'} liked
                    </span>
                  </div>
                </div>

                <div className="flex-shrink-0 flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => {
                      // Track interaction when user opens contact options
                      trackArtistPhoneClick(artist.id).catch(() => {});
                      setContactModalArtist(artist);
                    }}
                    className="rounded-full border border-black px-5 py-2.5 text-xs font-medium text-black transition-all duration-200 hover:bg-black hover:text-white active:bg-black/95 uppercase tracking-[0.1em] min-h-[44px] touch-manipulation whitespace-nowrap"
                  >
                    Contact
                  </button>
                  <button
                    onClick={() => {
                      // Track interaction when user requests consultation or contact options
                      trackArtistPhoneClick(artist.id).catch(() => {});
                      if (artist.email) {
                        // Use email-based consultation flow when available
                        setInquiryModalArtist(artist);
                      } else {
                        // Fallback: show contact options (phone / Instagram / website)
                        setContactModalArtist(artist);
                      }
                    }}
                    className="rounded-full bg-black px-5 py-2.5 text-xs font-medium text-white transition-all duration-200 hover:bg-black/90 active:bg-black/95 uppercase tracking-[0.1em] min-h-[44px] touch-manipulation whitespace-nowrap"
                  >
                    {artist.email ? 'Request Consultation' : 'View Contact Options'}
                  </button>
                </div>
              </div>
              
              {/* Liked tattoo images */}
              {score.likedTattooIds.length > 0 && (
                <div className="flex gap-2 flex-wrap sm:ml-[calc(56px+2rem)]">
                  {score.likedTattooIds.slice(0, 5).map((tattooId) => {
                    const tattoo = tattoosData.get(tattooId);
                    if (!tattoo) return null;
                    return (
                      <button
                        key={tattooId}
                        onClick={() => handleTattooClick(tattooId, score.artistId)}
                        className="relative w-20 h-20 sm:w-24 sm:h-24 border border-black/10 overflow-hidden shrink-0 cursor-pointer hover:border-black/30 transition-colors duration-200"
                      >
                        <Image
                          src={tattoo.imageUrl}
                          alt={tattoo.description || 'Liked tattoo'}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 80px, 96px"
                        />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {contactModalArtist && (
        <ContactModal
          artist={contactModalArtist}
          onClose={() => setContactModalArtist(null)}
        />
      )}

      {inquiryModalArtist && (
        <InquiryModal
          artist={inquiryModalArtist}
          onClose={() => setInquiryModalArtist(null)}
        />
      )}

      {/* Tattoo Image Modal with Navigation */}
      {selectedTattooIndex !== null && selectedArtistTattoos.length > 0 && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm p-4 overflow-y-auto"
          onClick={handleCloseModal}
        >
          <div
            className="relative w-full max-w-5xl my-auto"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            {/* Close button */}
            <button
              onClick={handleCloseModal}
              className="absolute top-4 right-4 z-10 text-white/80 hover:text-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation bg-black/50 rounded-full backdrop-blur-sm"
              aria-label="Close"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Previous button */}
            {selectedArtistTattoos.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrevious();
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-10 text-white/80 hover:text-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation bg-black/50 rounded-full backdrop-blur-sm"
                aria-label="Previous"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}

            {/* Next button */}
            {selectedArtistTattoos.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleNext();
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 text-white/80 hover:text-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation bg-black/50 rounded-full backdrop-blur-sm"
                aria-label="Next"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}

            {/* Image counter */}
            {selectedArtistTattoos.length > 1 && (
              <div className="absolute top-4 left-4 z-10 bg-black/50 backdrop-blur-sm rounded-full px-4 py-2 text-white/80 text-xs uppercase tracking-[0.1em]">
                {selectedTattooIndex + 1} / {selectedArtistTattoos.length}
              </div>
            )}

            {/* Image container */}
            <div className="relative w-full aspect-square bg-black">
              <Image
                src={selectedArtistTattoos[selectedTattooIndex].imageUrl}
                alt={selectedArtistTattoos[selectedTattooIndex].description || 'Tattoo'}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 1280px"
                priority
              />
            </div>

            {/* Description */}
            {selectedArtistTattoos[selectedTattooIndex].description && (
              <div className="bg-white p-4 sm:p-6 border-t border-black/10">
                <p className="text-sm sm:text-base text-black/80 leading-relaxed">
                  {selectedArtistTattoos[selectedTattooIndex].description}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

