'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Tattoo, Artist } from '@/types';
import { getTattoos, getArtists, clearUserLikes, getUserPreferences } from '@/lib/firestore';
import { TattooCard } from './TattooCard';
import { FilterBar, FilterOptions } from './FilterBar';
import { getUserId } from '@/lib/recommendations';
import { useAuth } from '@/contexts/AuthContext';

interface GalleryProps {
  onRequireAuth?: () => void;
  initialFilters?: FilterOptions;
}

export function Gallery({ onRequireAuth, initialFilters }: GalleryProps) {
  const [tattoos, setTattoos] = useState<Tattoo[]>([]);
  const [artists, setArtists] = useState<Map<string, Artist>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterOptions>(
    initialFilters || {
      search: '',
      style: '',
      bodyPart: '',
      color: 'all',
      minPrice: '',
      maxPrice: '',
      location: '',
      parlor: '',
      sortBy: 'newest',
    }
  );

  // Update filters when initialFilters prop changes
  useEffect(() => {
    if (initialFilters) {
      setFilters(initialFilters);
    }
  }, [initialFilters]);
  const [clearingLikes, setClearingLikes] = useState(false);
  const [clearError, setClearError] = useState('');
  const { user } = useAuth();

  const loadData = useCallback(async () => {
      try {
        setLoading(true);
        const [tattoosData, artistsData] = await Promise.all([
          getTattoos(),
          getArtists()
        ]);

        // Create a map for quick artist lookup
        const artistsMap = new Map<string, Artist>();
        artistsData.forEach(artist => {
          artistsMap.set(artist.id, artist);
        });

        setTattoos(tattoosData);
        setArtists(artistsMap);
        setError(null);
      } catch (err) {
        setError('Failed to load tattoos. Please try again later.');
        console.error('Error loading data:', err);
      } finally {
        setLoading(false);
      }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Apply saved preferences from beginners questionnaire or user profile
  useEffect(() => {
    const applyPreferences = async () => {
      // First check localStorage (for immediate redirect from questionnaire)
      const savedPreferences = localStorage.getItem('tattooPreferences');
      if (savedPreferences) {
        try {
          const prefs = JSON.parse(savedPreferences);
          setFilters(prevFilters => {
            const newFilters: FilterOptions = { ...prevFilters };
            
            // Apply first selected style if available
            if (prefs.styles && prefs.styles.length > 0) {
              newFilters.style = prefs.styles[0];
            }
            
            // Apply first selected body part if available
            if (prefs.bodyParts && prefs.bodyParts.length > 0) {
              newFilters.bodyPart = prefs.bodyParts[0];
            }
            
            // Apply color preference
            if (prefs.colorPreference) {
              if (prefs.colorPreference === 'color') {
                newFilters.color = 'color';
              } else if (prefs.colorPreference === 'bw') {
                newFilters.color = 'bw';
              } else {
                newFilters.color = 'all';
              }
            }
            
            return newFilters;
          });
          // Clear the saved preferences after applying
          localStorage.removeItem('tattooPreferences');
        } catch (err) {
          console.error('Error parsing saved preferences:', err);
        }
      } else if (user?.uid) {
        // If no localStorage preferences, check user profile for the most recent filter set
        try {
          const userPrefs = await getUserPreferences(user.uid);
          if (userPrefs && userPrefs.filterSets && userPrefs.filterSets.length > 0) {
            // Use the most recently updated filter set
            const mostRecent = userPrefs.filterSets.sort((a, b) => 
              (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0)
            )[0];
            
            setFilters(prevFilters => {
              const newFilters: FilterOptions = { ...prevFilters };
              
              // Apply first selected style if available
              if (mostRecent.styles && mostRecent.styles.length > 0) {
                newFilters.style = mostRecent.styles[0];
              }
              
              // Apply first selected body part if available
              if (mostRecent.bodyParts && mostRecent.bodyParts.length > 0) {
                newFilters.bodyPart = mostRecent.bodyParts[0];
              }
              
              // Apply color preference
              if (mostRecent.colorPreference) {
                if (mostRecent.colorPreference === 'color') {
                  newFilters.color = 'color';
                } else if (mostRecent.colorPreference === 'bw') {
                  newFilters.color = 'bw';
                } else {
                  newFilters.color = 'all';
                }
              }
              
              return newFilters;
            });
          }
        } catch (err) {
          console.error('Error loading user preferences:', err);
        }
      }
    };
    
    applyPreferences();
  }, [user?.uid]);

  // Filter and sort tattoos based on filter options
  const filteredTattoos = useMemo(() => {
    // Only show tattoos that are not explicitly hidden and whose parlor is visible
    let filtered = tattoos.filter((tattoo) => {
      const artist = artists.get(tattoo.artistId);
      const artistVisible = artist?.isVisible !== false;
      const tattooVisible = tattoo.isVisible !== false;
      return artistVisible && tattooVisible;
    });

    // Search filter (artist name, tags, description)
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter((tattoo) => {
        const artist = artists.get(tattoo.artistId);
        const artistName = artist?.name?.toLowerCase() || '';
        const description = tattoo.description?.toLowerCase() || '';
        const tags = tattoo.tags?.join(' ').toLowerCase() || '';
        const style = tattoo.style?.toLowerCase() || '';
        
        return (
          artistName.includes(searchLower) ||
          description.includes(searchLower) ||
          tags.includes(searchLower) ||
          style.includes(searchLower)
        );
      });
    }

    // Style filter
    if (filters.style) {
      filtered = filtered.filter((tattoo) => tattoo.style === filters.style);
    }

    // Body part filter
    if (filters.bodyPart) {
      filtered = filtered.filter((tattoo) => tattoo.bodyPart === filters.bodyPart);
    }

    // Color filter
    if (filters.color !== 'all') {
      filtered = filtered.filter((tattoo) => {
        if (filters.color === 'color') {
          return tattoo.color === true;
        } else if (filters.color === 'bw') {
          return tattoo.color === false;
        }
        return true;
      });
    }

    // Price range filter
    if (filters.minPrice) {
      const minPrice = parseFloat(filters.minPrice);
      if (!isNaN(minPrice)) {
        filtered = filtered.filter((tattoo) => {
          if (tattoo.price === undefined) return false;
          return tattoo.price >= minPrice;
        });
      }
    }
    if (filters.maxPrice) {
      const maxPrice = parseFloat(filters.maxPrice);
      if (!isNaN(maxPrice)) {
        filtered = filtered.filter((tattoo) => {
          if (tattoo.price === undefined) return false;
          return tattoo.price <= maxPrice;
        });
      }
    }

    // Location filter
    if (filters.location) {
      filtered = filtered.filter((tattoo) => {
        const artist = artists.get(tattoo.artistId);
        return (
          tattoo.location === filters.location ||
          artist?.location === filters.location
        );
      });
    }

    // Parlor filter
    if (filters.parlor) {
      filtered = filtered.filter((tattoo) => {
        const artist = artists.get(tattoo.artistId);
        return artist?.name === filters.parlor;
      });
    }

    // Sort
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'newest':
          return (b.createdAt || 0) - (a.createdAt || 0);
        case 'oldest':
          return (a.createdAt || 0) - (b.createdAt || 0);
        case 'price-low':
          const priceA = a.price ?? Infinity;
          const priceB = b.price ?? Infinity;
          return priceA - priceB;
        case 'price-high':
          const priceAHigh = a.price ?? -Infinity;
          const priceBHigh = b.price ?? -Infinity;
          return priceBHigh - priceAHigh;
        default:
          return 0;
      }
    });

    return filtered;
  }, [tattoos, artists, filters]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-black border-t-transparent mx-auto"></div>
          <p className="text-black/60 text-sm tracking-wide">Loading beautiful tattoos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-center">
          <p className="text-black/60 mb-6 text-sm">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-full border border-black px-6 py-3 text-xs font-medium text-black transition-all hover:bg-black hover:text-white active:bg-black/90 active:text-white uppercase tracking-wider min-h-[44px] touch-manipulation"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (tattoos.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-center">
          <p className="text-black/60 text-sm mb-2 tracking-wide">No tattoos found</p>
          <p className="text-black/40 text-xs tracking-wide">Check back soon for new artwork</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6">
      <div className="mx-auto max-w-7xl">
        {/* Intentional header with refined spacing */}
        <div className="mb-12 sm:mb-20 md:mb-24 text-center">
          <h1 className="mb-4 sm:mb-6 text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light tracking-[-0.02em] text-black leading-[1.1] px-4">
            Discover Dutch Tattoo Artistry
          </h1>
          <p className="mx-auto max-w-2xl text-sm sm:text-base text-black/50 leading-relaxed tracking-wide px-4">
            Explore curated tattoos from talented artists across the Netherlands. 
            Like the ones that resonate with you, and we'll find your perfect match.
          </p>
        </div>

        {/* Filter Bar */}
        <FilterBar
          tattoos={tattoos}
          artists={artists}
          filters={filters}
          onFiltersChange={setFilters}
        />

        {/* Results + optional clear filters/likes */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {filteredTattoos.length !== tattoos.length && (
              <div className="text-sm text-black/50 tracking-wide">
            Showing {filteredTattoos.length} of {tattoos.length} tattoos
              </div>
            )}
            {(filters.search ||
              filters.style ||
              filters.bodyPart ||
              filters.color !== 'all' ||
              filters.minPrice ||
              filters.maxPrice ||
              filters.location ||
              filters.parlor ||
              filters.sortBy !== 'newest') && (
              <button
                type="button"
                onClick={() =>
                  setFilters({
                    search: '',
                    style: '',
                    bodyPart: '',
                    color: 'all',
                    minPrice: '',
                    maxPrice: '',
                    location: '',
                    parlor: '',
                    sortBy: 'newest',
                  })
                }
                className="self-start rounded-full border border-black px-5 py-2.5 text-xs font-medium text-black transition-all hover:bg-black hover:text-white active:bg-black/90 uppercase tracking-[0.1em] min-h-[44px] touch-manipulation"
              >
                Clear All Filters
              </button>
            )}
          </div>

          {user && (
            <button
              type="button"
              disabled={clearingLikes}
              onClick={async () => {
                try {
                  setClearingLikes(true);
                  setClearError('');
                  const userId = getUserId();
                  await clearUserLikes(userId);
                  await loadData();
                } catch (err: any) {
                  setClearError(err.message || 'Failed to clear liked tattoos');
                } finally {
                  setClearingLikes(false);
                }
              }}
              className="self-start rounded-full border border-black px-5 py-2.5 text-xs font-medium text-black transition-all hover:bg-black hover:text-white active:bg-black/90 uppercase tracking-[0.1em] min-h-[44px] touch-manipulation disabled:opacity-50"
            >
              {clearingLikes ? 'Clearing Likes…' : 'Clear Liked Tattoos'}
            </button>
          )}
        </div>

        {clearError && (
          <div className="mb-6 border border-black/20 bg-black/5 p-4 text-sm text-black">
            {clearError}
          </div>
        )}

        {/* Intentional grid with refined spacing */}
        {filteredTattoos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-0.5 sm:gap-1">
            {filteredTattoos.map((tattoo) => {
              const artist = artists.get(tattoo.artistId);
              return (
                <TattooCard
                  key={tattoo.id}
                  tattoo={tattoo}
                  artistName={artist?.name}
                  artistLocation={artist?.location}
                  artistId={artist?.id}
                  onRequireAuth={onRequireAuth}
                />
              );
            })}
          </div>
        ) : (
          <div className="border border-black/10 bg-white p-12 sm:p-16 text-center">
            <p className="text-black/60 text-sm mb-2 tracking-wide">No tattoos match your filters</p>
            <p className="text-black/40 text-xs tracking-wide mb-6">Try adjusting your search or filters</p>
            <button
              onClick={() => setFilters({
                search: '',
                style: '',
                bodyPart: '',
                color: 'all',
                minPrice: '',
                maxPrice: '',
                location: '',
                parlor: '',
                sortBy: 'newest',
              })}
              className="rounded-full border border-black px-6 py-3 text-xs font-medium text-black transition-all hover:bg-black hover:text-white active:bg-black/90 active:text-white uppercase tracking-wider min-h-[44px] touch-manipulation"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

