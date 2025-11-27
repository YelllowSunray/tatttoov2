'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getUserPreferences, deleteFilterSet } from '@/lib/firestore';
import { FilterSet, UserPreferences } from '@/types';
import { FilterOptions } from './FilterBar';
import { GenerateTattooModal } from './GenerateTattooModal';

interface ProfileModalProps {
  onClose: () => void;
  onApplyFilters?: (filterSet: FilterSet) => void;
}

export function ProfileModal({ onClose, onApplyFilters }: ProfileModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [filterSets, setFilterSets] = useState<FilterSet[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [generatingForFilterSet, setGeneratingForFilterSet] = useState<FilterSet | null>(null);

  useEffect(() => {
    const loadPreferences = async () => {
      if (user?.uid) {
        try {
          const preferences = await getUserPreferences(user.uid);
          if (preferences && preferences.filterSets) {
            setFilterSets(preferences.filterSets);
          }
        } catch (err) {
          console.error('Error loading preferences:', err);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };
    loadPreferences();
  }, [user]);

  const handleDelete = async (filterSetId: string) => {
    if (!user?.uid) return;
    
    if (!confirm('Are you sure you want to delete this filter set?')) {
      return;
    }

    setDeletingId(filterSetId);
    try {
      await deleteFilterSet(user.uid, filterSetId);
      setFilterSets(prev => prev.filter(fs => fs.id !== filterSetId));
    } catch (err) {
      console.error('Error deleting filter set:', err);
      alert('Failed to delete filter set. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleApply = (filterSet: FilterSet) => {
    if (onApplyFilters) {
      onApplyFilters(filterSet);
    }
    onClose();
  };

  if (loading) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto"
        onClick={onClose}
      >
        <div
          className="w-full max-w-2xl border border-black/20 bg-white p-6 sm:p-8 md:p-10 my-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-center py-12">
            <div className="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-black border-t-transparent mx-auto"></div>
            <p className="text-black/60 text-sm tracking-wide">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl border border-black/20 bg-white p-6 sm:p-8 md:p-10 my-auto"
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
          Saved Filter Sets
        </h2>

        {filterSets.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-black/50 tracking-wide mb-4">
              No saved filter sets yet
            </p>
            <p className="text-xs text-black/40 tracking-wide">
              Complete the beginners questionnaire to save your first filter set
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filterSets.map((filterSet) => (
              <div
                key={filterSet.id}
                className="border border-black/10 p-4 sm:p-6 hover:border-black/20 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-light text-black mb-3">
                      {filterSet.name}
                    </h3>
                    <div className="space-y-2 text-sm text-black/50">
                      {filterSet.styles.length > 0 && (
                        <p>
                          <span className="font-medium text-black/60">Styles:</span>{' '}
                          {filterSet.styles.join(', ')}
                        </p>
                      )}
                      {filterSet.bodyParts.length > 0 && (
                        <p>
                          <span className="font-medium text-black/60">Body Parts:</span>{' '}
                          {filterSet.bodyParts.join(', ')}
                        </p>
                      )}
                      {filterSet.colorPreference && (
                        <p>
                          <span className="font-medium text-black/60">Color:</span>{' '}
                          {filterSet.colorPreference === 'both'
                            ? 'Both'
                            : filterSet.colorPreference === 'color'
                            ? 'Color'
                            : 'Black & White'}
                        </p>
                      )}
                      {filterSet.sizePreference && (
                        <p>
                          <span className="font-medium text-black/60">Size:</span>{' '}
                          {filterSet.sizePreference === 'all'
                            ? 'All Sizes'
                            : filterSet.sizePreference.charAt(0).toUpperCase() +
                              filterSet.sizePreference.slice(1)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={() => handleApply(filterSet)}
                      className="rounded-full bg-black px-5 py-2.5 text-xs font-medium text-white transition-all duration-200 hover:bg-black/90 active:bg-black/95 uppercase tracking-[0.1em] min-h-[44px] touch-manipulation whitespace-nowrap"
                    >
                      Apply
                    </button>
                    <button
                      onClick={() => setGeneratingForFilterSet(filterSet)}
                      className="rounded-full border border-black/20 px-5 py-2.5 text-xs font-medium text-black/60 transition-all duration-200 hover:border-black/40 hover:text-black active:bg-black/5 uppercase tracking-[0.1em] min-h-[44px] touch-manipulation whitespace-nowrap"
                    >
                      Generate Tattoo
                    </button>
                    <button
                      onClick={() => handleDelete(filterSet.id)}
                      disabled={deletingId === filterSet.id}
                      className="rounded-full border border-black/20 px-5 py-2.5 text-xs font-medium text-black/60 transition-all duration-200 hover:border-black/40 hover:text-black active:bg-black/5 uppercase tracking-[0.1em] min-h-[44px] touch-manipulation whitespace-nowrap disabled:opacity-50"
                    >
                      {deletingId === filterSet.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-10 pt-8 border-t border-black/10">
          <button
            onClick={onClose}
            className="w-full rounded-full border border-black px-6 py-3.5 text-xs font-medium text-black transition-all duration-200 hover:bg-black hover:text-white active:bg-black/95 uppercase tracking-[0.1em] min-h-[44px] touch-manipulation"
          >
            Close
          </button>
        </div>
      </div>

      {generatingForFilterSet && (
        <GenerateTattooModal
          filterSet={generatingForFilterSet}
          onClose={() => setGeneratingForFilterSet(null)}
          onSuccess={(imageUrl) => {
            // Keep the modal open so the user can view/download the image.
            console.log('Tattoo generated successfully:', imageUrl);
          }}
        />
      )}
    </div>
  );
}

