'use client';

import { useState, useEffect } from 'react';
import { Tattoo } from '@/types';
import { toggleLike, isTattooLiked } from '@/lib/firestore';
import { getUserId } from '@/lib/recommendations';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';
import Link from 'next/link';

interface TattooCardProps {
  tattoo: Tattoo;
  artistName?: string;
  artistLocation?: string;
  artistId?: string;
  onRequireAuth?: () => void;
}

export function TattooCard({ tattoo, artistName, artistLocation, artistId, onRequireAuth }: TattooCardProps) {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isToggling, setIsToggling] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);

  useEffect(() => {
    const checkLiked = async () => {
      // Only check likes if user is authenticated
      if (!user) {
        setIsLiked(false);
        setIsLoading(false);
        return;
      }
      const userId = getUserId();
      const liked = await isTattooLiked(userId, tattoo.id);
      setIsLiked(liked);
      setIsLoading(false);
    };
    checkLiked();
  }, [tattoo.id, user]);

  const handleLike = async () => {
    if (isToggling) return;
    
    // If user is not authenticated, prompt them to sign in
    if (!user) {
      if (onRequireAuth) {
        onRequireAuth();
      }
      return;
    }
    
    setIsToggling(true);
    const userId = getUserId();
    const newLikedState = await toggleLike(userId, tattoo.id);
    setIsLiked(newLikedState);
    setIsToggling(false);
  };

  // Handle overlay visibility - show on hover/touch, hide when clicking outside
  const handleCardClick = () => {
    if (showOverlay) {
      // If overlay is already shown, clicking again will toggle it
      setShowOverlay(false);
    } else {
      setShowOverlay(true);
    }
  };

  return (
    <div 
      className="group relative aspect-square overflow-hidden bg-black touch-manipulation"
      onMouseEnter={() => setShowOverlay(true)}
      onMouseLeave={() => setShowOverlay(false)}
      onClick={handleCardClick}
    >
      <Image
        src={tattoo.imageUrl}
        alt={tattoo.description || `Tattoo by ${artistName || 'artist'}`}
        fill
        className="object-cover transition-transform duration-[800ms] ease-out group-hover:scale-[1.02]"
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        priority={false}
      />
      
      {/* Intentional overlay with refined gradient - always visible on mobile, hover-controlled on desktop */}
      <div className={`absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-100 transition-opacity duration-[400ms] ease-out ${showOverlay ? 'sm:opacity-100' : 'sm:opacity-0'}`}>
        <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6 space-y-3">
          {/* Tattoo description with refined typography */}
          {tattoo.description && (
            <p className="text-sm sm:text-base font-light text-white leading-relaxed break-words">
              {tattoo.description}
            </p>
          )}
          
          {/* Artist name with intentional hierarchy */}
          {artistName && (
            artistId ? (
              <Link
                href={`/artist/${artistId}`}
                onClick={(e) => e.stopPropagation()}
                className="text-xs font-medium text-white/90 uppercase tracking-[0.1em] hover:text-white transition-colors duration-200 inline-block"
              >
                {artistName}
              </Link>
            ) : (
              <p className="text-xs font-medium text-white/90 uppercase tracking-[0.1em]">
                {artistName}
              </p>
            )
          )}
          
          {/* Price, Location and Style with refined spacing */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-white/70">
            {tattoo.price && (
              <span className="flex items-center gap-1.5">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="h-3 w-3"
                >
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
                €{tattoo.price.toLocaleString()}
              </span>
            )}
            {(tattoo.location || artistLocation) && (
              <span className="flex items-center gap-1.5">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="h-3 w-3"
                >
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                {tattoo.location || artistLocation}
              </span>
            )}
            {tattoo.style && (
              <span className="flex items-center gap-1.5 uppercase tracking-[0.12em] text-white/80">
                • {tattoo.style}
              </span>
            )}
          </div>
          
          {/* Like button with refined styling */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleLike();
            }}
            disabled={isToggling}
            className={`flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-xs font-medium transition-all duration-200 uppercase tracking-wider min-h-[44px] touch-manipulation ${
              isLiked
                ? 'bg-white text-black hover:bg-white/95 active:bg-white/90'
                : 'bg-white/10 backdrop-blur-sm text-white border border-white/30 hover:bg-white/20 active:bg-white/25'
            } ${isToggling ? 'opacity-50 cursor-not-allowed' : ''}`}
            aria-label={isLiked ? 'Unlike this tattoo' : user ? 'Like this tattoo' : 'Sign in to like this tattoo'}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill={isLiked ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth="1.5"
              className="h-4 w-4"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            <span>{isLiked ? 'Liked' : user ? 'Like' : 'Sign in to Like'}</span>
          </button>
        </div>
      </div>

      {/* Refined like indicator - only on desktop when overlay is hidden */}
      {isLiked && user && !showOverlay && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleLike();
          }}
          disabled={isToggling}
          className={`hidden sm:flex absolute top-4 right-4 rounded-full bg-white p-2.5 shadow-lg transition-all duration-200 hover:scale-105 active:scale-95 touch-manipulation min-h-[44px] min-w-[44px] items-center justify-center ${isToggling ? 'opacity-50 cursor-not-allowed' : ''}`}
          aria-label="Unlike this tattoo"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-4 w-4 text-black"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>
      )}
    </div>
  );
}

