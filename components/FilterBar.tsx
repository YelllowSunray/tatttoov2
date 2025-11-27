'use client';

import { useState } from 'react';
import { Tattoo, Artist } from '@/types';

export interface FilterOptions {
  search: string;
  style: string;
  bodyPart: string;
  color: 'all' | 'color' | 'bw';
  minPrice: string;
  maxPrice: string;
  location: string;
  parlor: string;
  sortBy: 'newest' | 'oldest' | 'price-low' | 'price-high';
}

interface FilterBarProps {
  tattoos: Tattoo[];
  artists: Map<string, Artist>;
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
}

export function FilterBar({ tattoos, artists, filters, onFiltersChange }: FilterBarProps) {
  const [showFilters, setShowFilters] = useState(false);

  // Extract unique values for filter options
  const styles = Array.from(new Set(tattoos.map(t => t.style).filter(Boolean))) as string[];
  const bodyParts = Array.from(new Set(tattoos.map(t => t.bodyPart).filter(Boolean))) as string[];
  const locations = Array.from(
    new Set([
      ...tattoos.map(t => t.location).filter(Boolean),
      ...Array.from(artists.values()).map(a => a.location).filter(Boolean)
    ])
  ) as string[];
  const parlors = Array.from(
    new Set(
      Array.from(artists.values())
        .filter((artist) => artist.isVisible !== false)
        .map((artist) => artist.name)
        .filter(Boolean)
    )
  ) as string[];

  const updateFilter = (key: keyof FilterOptions, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFiltersChange({
      search: '',
      style: '',
      bodyPart: '',
      color: 'all',
      minPrice: '',
      maxPrice: '',
      location: '',
      parlor: '',
      sortBy: 'newest',
    });
  };

  const hasActiveFilters = 
    filters.search !== '' ||
    filters.style !== '' ||
    filters.bodyPart !== '' ||
    filters.color !== 'all' ||
    filters.minPrice !== '' ||
    filters.maxPrice !== '' ||
    filters.location !== '' ||
    filters.parlor !== '' ||
    filters.sortBy !== 'newest';

  return (
    <div className="mb-8 sm:mb-12 border-b border-black/10 pb-6">
      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Search by artist, tags, or description..."
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="w-full border-b border-black/20 bg-transparent px-0 py-3 pr-10 text-base text-black placeholder-black/30 focus:border-black focus:outline-none transition-colors duration-200"
          />
          {filters.search && (
            <button
              onClick={() => updateFilter('search', '')}
              className="absolute right-0 top-1/2 -translate-y-1/2 text-black/40 hover:text-black transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation"
              aria-label="Clear search"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Filter Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 text-xs font-medium text-black/60 hover:text-black transition-colors duration-200 uppercase tracking-[0.1em] min-h-[44px] touch-manipulation"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-4 w-4 transition-transform duration-200 ${showFilters ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
          {showFilters ? 'Hide Filters' : 'Show Filters'}
          {hasActiveFilters && (
            <span className="ml-2 rounded-full bg-black text-white text-[10px] px-2 py-0.5">
              Active
            </span>
          )}
        </button>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-xs font-medium text-black/40 hover:text-black transition-colors duration-200 uppercase tracking-[0.1em] underline underline-offset-4 min-h-[44px] touch-manipulation"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Filter Options */}
      {showFilters && (
        <div className="mt-6 pt-6 border-t border-black/10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {/* Style Filter */}
          {styles.length > 0 && (
            <div>
              <label className="mb-3 block text-xs font-medium text-black/50 uppercase tracking-[0.1em]">
                Style
              </label>
              <select
                value={filters.style}
                onChange={(e) => updateFilter('style', e.target.value)}
                className="w-full border-b border-black/20 bg-transparent px-0 py-2 text-sm text-black focus:border-black focus:outline-none transition-colors duration-200"
              >
                <option value="">All Styles</option>
                {styles.sort().map((style) => (
                  <option key={style} value={style}>
                    {style}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Body Part Filter */}
          {bodyParts.length > 0 && (
            <div>
              <label className="mb-3 block text-xs font-medium text-black/50 uppercase tracking-[0.1em]">
                Body Part
              </label>
              <select
                value={filters.bodyPart}
                onChange={(e) => updateFilter('bodyPart', e.target.value)}
                className="w-full border-b border-black/20 bg-transparent px-0 py-2 text-sm text-black focus:border-black focus:outline-none transition-colors duration-200"
              >
                <option value="">All Body Parts</option>
                {bodyParts.sort().map((part) => (
                  <option key={part} value={part}>
                    {part}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Color Filter */}
          <div>
            <label className="mb-3 block text-xs font-medium text-black/50 uppercase tracking-[0.1em]">
              Color
            </label>
            <select
              value={filters.color}
              onChange={(e) => updateFilter('color', e.target.value)}
              className="w-full border-b border-black/20 bg-transparent px-0 py-2 text-sm text-black focus:border-black focus:outline-none transition-colors duration-200"
            >
              <option value="all">All</option>
              <option value="color">Color</option>
              <option value="bw">Black & White</option>
            </select>
          </div>

          {/* Location Filter */}
          {locations.length > 0 && (
            <div>
              <label className="mb-3 block text-xs font-medium text-black/50 uppercase tracking-[0.1em]">
                Location
              </label>
              <select
                value={filters.location}
                onChange={(e) => updateFilter('location', e.target.value)}
                className="w-full border-b border-black/20 bg-transparent px-0 py-2 text-sm text-black focus:border-black focus:outline-none transition-colors duration-200"
              >
                <option value="">All Locations</option>
                {locations.sort().map((location) => (
                  <option key={location} value={location}>
                    {location}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Parlor Filter */}
          {parlors.length > 0 && (
            <div>
              <label className="mb-3 block text-xs font-medium text-black/50 uppercase tracking-[0.1em]">
                Tattoo Parlor
              </label>
              <select
                value={filters.parlor}
                onChange={(e) => updateFilter('parlor', e.target.value)}
                className="w-full border-b border-black/20 bg-transparent px-0 py-2 text-sm text-black focus:border-black focus:outline-none transition-colors duration-200"
              >
                <option value="">All Parlors</option>
                {parlors.sort().map((parlor) => (
                  <option key={parlor} value={parlor}>
                    {parlor}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Price Range */}
          <div>
            <label className="mb-3 block text-xs font-medium text-black/50 uppercase tracking-[0.1em]">
              Min Price (€)
            </label>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={filters.minPrice}
              onChange={(e) => updateFilter('minPrice', e.target.value)}
              placeholder="0"
              className="w-full border-b border-black/20 bg-transparent px-0 py-2 text-sm text-black placeholder-black/30 focus:border-black focus:outline-none transition-colors duration-200"
            />
          </div>

          <div>
            <label className="mb-3 block text-xs font-medium text-black/50 uppercase tracking-[0.1em]">
              Max Price (€)
            </label>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={filters.maxPrice}
              onChange={(e) => updateFilter('maxPrice', e.target.value)}
              placeholder="No limit"
              className="w-full border-b border-black/20 bg-transparent px-0 py-2 text-sm text-black placeholder-black/30 focus:border-black focus:outline-none transition-colors duration-200"
            />
          </div>

          {/* Sort By */}
          <div>
            <label className="mb-3 block text-xs font-medium text-black/50 uppercase tracking-[0.1em]">
              Sort By
            </label>
            <select
              value={filters.sortBy}
              onChange={(e) => updateFilter('sortBy', e.target.value as FilterOptions['sortBy'])}
              className="w-full border-b border-black/20 bg-transparent px-0 py-2 text-sm text-black focus:border-black focus:outline-none transition-colors duration-200"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
}



