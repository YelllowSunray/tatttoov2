'use client';

import { useEffect, useState } from 'react';
import { getAllArtists, getTattoosByArtistId, adminUpdateArtist, adminCreateArtist, adminDeleteArtist, adminUpdateTattoo, adminSetParlorVisibility, adminDeleteTattoo } from '@/lib/artist';
import type { Artist, Tattoo, ArtistStats } from '@/types';
import { getArtistStats } from '@/lib/firestore';
import { AdminTattooUploadForm } from './AdminTattooUploadForm';
import Image from 'next/image';
import { deleteImage } from '@/lib/storage';

export function AdminArtistManager() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [selectedArtistId, setSelectedArtistId] = useState<string | null>(null);
  const [tattoos, setTattoos] = useState<Tattoo[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingTattoos, setLoadingTattoos] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);
  const [error, setError] = useState('');
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [editingTattoo, setEditingTattoo] = useState<Tattoo | null>(null);
  const [stats, setStats] = useState<ArtistStats | null>(null);

  const [profileData, setProfileData] = useState({
    name: '',
    location: '',
    bio: '',
    instagram: '',
    website: '',
    email: '',
    phone: '',
  });

  useEffect(() => {
    loadArtists();
  }, []);

  useEffect(() => {
    if (selectedArtistId) {
      const artist = artists.find((a) => a.id === selectedArtistId);
      if (artist) {
        setProfileData({
          name: artist.name || '',
          location: artist.location || '',
          bio: artist.bio || '',
          instagram: artist.instagram || '',
          website: artist.website || '',
          email: artist.email || '',
          phone: artist.phone || '',
        });
        loadTattoos(selectedArtistId);
        loadStats(selectedArtistId);
      }
      setIsCreatingNew(false);
      setEditingTattoo(null);
      setShowUploadForm(false);
    } else if (!isCreatingNew) {
      setTattoos([]);
      setStats(null);
      setProfileData({
        name: '',
        location: '',
        bio: '',
        instagram: '',
        website: '',
        email: '',
        phone: '',
      });
    }
  }, [selectedArtistId, artists, isCreatingNew]);

  const loadArtists = async () => {
    setLoading(true);
    setError('');
    try {
      const allArtists = await getAllArtists();
      setArtists(allArtists);
      if (allArtists.length > 0 && !selectedArtistId && !isCreatingNew) {
        setSelectedArtistId(allArtists[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load artists');
    } finally {
      setLoading(false);
    }
  };

  const loadTattoos = async (artistId: string) => {
    setLoadingTattoos(true);
    setError('');
    try {
      const artistTattoos = await getTattoosByArtistId(artistId);
      setTattoos(artistTattoos);
    } catch (err: any) {
      setError(err.message || 'Failed to load tattoos');
    } finally {
      setLoadingTattoos(false);
    }
  };

  const loadStats = async (artistId: string) => {
    setLoadingStats(true);
    try {
      const artistStats = await getArtistStats(artistId);
      setStats(artistStats);
    } catch (err: any) {
      // Stats are non-critical; log to console but don't surface as error banner
      console.error('Failed to load artist stats', err);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError('');
    setLoading(true);
    try {
      if (isCreatingNew) {
        const newId = await adminCreateArtist({
          name: profileData.name,
          location: profileData.location,
          bio: profileData.bio || undefined,
          instagram: profileData.instagram || undefined,
          website: profileData.website || undefined,
          email: profileData.email || undefined,
          phone: profileData.phone || undefined,
        });
        await loadArtists();
        setIsCreatingNew(false);
        setSelectedArtistId(newId);
      } else if (selectedArtistId) {
        await adminUpdateArtist(selectedArtistId, {
          name: profileData.name,
          location: profileData.location,
          bio: profileData.bio || undefined,
          instagram: profileData.instagram || undefined,
          website: profileData.website || undefined,
          email: profileData.email || undefined,
          phone: profileData.phone || undefined,
        });
        await loadArtists();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTattoo = async (tattooId: string, imageUrl: string) => {
    if (!selectedArtistId) return;
    if (typeof window !== 'undefined' && !window.confirm('Delete this tattoo? This cannot be undone.')) {
      return;
    }

    setError('');
    try {
      await adminDeleteTattoo(tattooId);
      if (imageUrl) {
        deleteImage(imageUrl).catch(() => {});
      }
      await loadTattoos(selectedArtistId);
    } catch (err: any) {
      setError(err.message || 'Failed to delete tattoo');
    }
  };

  const handleDeleteParlor = async () => {
    if (!selectedArtistId || !selectedArtist) return;
    if (!confirm(`Delete parlor "${selectedArtist.name}" and all of its tattoos? This cannot be undone.`)) {
      return;
    }

    setError('');
    setLoading(true);
    try {
      // Best-effort: delete associated images from Storage
      const artistTattoos = await getTattoosByArtistId(selectedArtist.id);
      artistTattoos.forEach((tattoo) => {
        if (tattoo.imageUrl) {
          deleteImage(tattoo.imageUrl).catch(() => {});
        }
      });

      await adminDeleteArtist(selectedArtist.id);

      // Reset local state
      setSelectedArtistId(null);
        setTattoos([]);
        setStats(null);
      setEditingTattoo(null);
      setShowUploadForm(false);
      setIsCreatingNew(false);

      await loadArtists();
    } catch (err: any) {
      setError(err.message || 'Failed to delete parlor');
    } finally {
      setLoading(false);
    }
  };

  const selectedArtist = artists.find((a) => a.id === selectedArtistId) || null;

  if (loading && artists.length === 0) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-black border-t-transparent mx-auto"></div>
          <p className="text-black/60 text-sm tracking-wide">Loading artists...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-10">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Artist list */}
        <aside className="md:col-span-1 border border-black/10 bg-white">
          <div className="border-b border-black/10 p-4 flex items-center justify-between gap-2">
            <h2 className="text-xs font-medium text-black/60 uppercase tracking-wider">
              Tattoo Parlors
            </h2>
            <button
              type="button"
              onClick={() => {
                setIsCreatingNew(true);
                setSelectedArtistId(null);
                setTattoos([]);
        setEditingTattoo(null);
        setShowUploadForm(false);
                setProfileData({
                  name: '',
                  location: '',
                  bio: '',
                  instagram: '',
                  website: '',
                  email: '',
                  phone: '',
                });
              }}
              className="rounded-full border border-black px-3 py-1 text-[10px] font-medium text-black hover:bg-black hover:text-white transition-colors uppercase tracking-wider"
            >
              New
            </button>
          </div>
          <div className="max-h-[520px] overflow-y-auto">
            {artists.length === 0 ? (
              <p className="p-4 text-sm text-black/60">No artists found.</p>
            ) : (
              <ul>
                {artists.map((artist) => (
                  <li key={artist.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedArtistId(artist.id)}
                      className={`w-full text-left px-4 py-3 text-sm border-b border-black/5 hover:bg-black/5 transition-colors ${
                        artist.id === selectedArtistId ? 'bg-black/5 font-medium' : ''
                      }`}
                    >
                      <div className="truncate">
                        {artist.name}
                        {artist.isVisible === false && (
                          <span className="ml-2 text-[10px] uppercase tracking-wider text-black/40">
                            (Hidden)
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-black/50 truncate">{artist.location}</div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>

        {/* Detail panel */}
        <section className="md:col-span-3 space-y-10">
          {isCreatingNew || selectedArtist ? (
            <>
              {/* Profile editor */}
              <div className="border border-black/10 bg-white p-4 sm:p-6 md:p-8">
                <div className="mb-6 flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-light tracking-tight text-black uppercase tracking-wider">
                      {isCreatingNew ? 'Create New Parlor' : selectedArtist?.name}
                    </h2>
                    <p className="mt-1 text-xs text-black/50 uppercase tracking-wider">
                      {isCreatingNew ? 'New tattoo parlor' : selectedArtist?.location}
                    </p>
                  </div>
                  {!isCreatingNew && selectedArtist && (
                    <div className="flex flex-col items-end gap-2 text-right">
                      <div className="flex items-center gap-3">
                        <p className="text-[10px] text-black/40 uppercase tracking-wider">
                          Artist ID: {selectedArtist.id}
                        </p>
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              const nextVisible = selectedArtist.isVisible === false ? true : false;
                              await adminSetParlorVisibility(selectedArtist.id, nextVisible);
                              await loadArtists();
                              await loadTattoos(selectedArtist.id);
                              await loadStats(selectedArtist.id);
                            } catch (err: any) {
                              setError(err.message || 'Failed to update parlor visibility');
                            }
                          }}
                          className="rounded-full border border-black/40 px-3 py-1.5 text-[10px] font-medium text-black/70 hover:bg-black/80 hover:text-white transition-colors uppercase tracking-wider"
                        >
                          {selectedArtist.isVisible === false ? 'Show Parlor' : 'Hide Parlor'}
                        </button>
                        <button
                          type="button"
                          onClick={handleDeleteParlor}
                          className="rounded-full border border-black/40 px-3 py-1.5 text-[10px] font-medium text-black/70 hover:bg-black/80 hover:text-white transition-colors uppercase tracking-wider"
                        >
                          Delete Parlor
                        </button>
                      </div>
                      <div className="text-[10px] text-black/50 uppercase tracking-wider">
                        {loadingStats ? (
                          <span>Loading stats…</span>
                        ) : stats ? (
                          <span>
                            {stats.consultationRequests ?? 0} consultation
                            {(stats.consultationRequests ?? 0) === 1 ? '' : 's'} ·{' '}
                            {stats.phoneClicks ?? 0} phone click
                            {(stats.phoneClicks ?? 0) === 1 ? '' : 's'}
                          </span>
                        ) : (
                          <span>No interactions tracked yet</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <form onSubmit={handleProfileSubmit} className="space-y-6 sm:space-y-8">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
                    <div>
                      <label
                        htmlFor="admin-name"
                        className="mb-2 block text-xs font-medium text-black/60 uppercase tracking-wider"
                      >
                        Name <span className="text-black">*</span>
                      </label>
                      <input
                        id="admin-name"
                        type="text"
                        value={profileData.name}
                        onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                        required
                        className="w-full border-b border-black/20 bg-transparent px-0 py-3 text-base text-black placeholder-black/30 focus:border-black focus:outline-none transition-colors"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="admin-location"
                        className="mb-2 block text-xs font-medium text-black/60 uppercase tracking-wider"
                      >
                        Location <span className="text-black">*</span>
                      </label>
                      <input
                        id="admin-location"
                        type="text"
                        value={profileData.location}
                        onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                        required
                        className="w-full border-b border-black/20 bg-transparent px-0 py-3 text-base text-black placeholder-black/30 focus:border-black focus:outline-none transition-colors"
                        placeholder="Amsterdam, Netherlands"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="admin-bio"
                      className="mb-2 block text-xs font-medium text-black/60 uppercase tracking-wider"
                    >
                      Bio
                    </label>
                    <textarea
                      id="admin-bio"
                      value={profileData.bio}
                      onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                      rows={4}
                      className="w-full border-b border-black/20 bg-transparent px-0 py-3 text-base text-black placeholder-black/30 focus:border-black focus:outline-none transition-colors resize-none"
                      placeholder="Artist bio..."
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
                    <div>
                      <label
                        htmlFor="admin-instagram"
                        className="mb-2 block text-xs font-medium text-black/60 uppercase tracking-wider"
                      >
                        Instagram
                      </label>
                      <input
                        id="admin-instagram"
                        type="url"
                        value={profileData.instagram}
                        onChange={(e) => setProfileData({ ...profileData, instagram: e.target.value })}
                        className="w-full border-b border-black/20 bg-transparent px-0 py-3 text-base text-black placeholder-black/30 focus:border-black focus:outline-none transition-colors"
                        placeholder="https://instagram.com/handle"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="admin-website"
                        className="mb-2 block text-xs font-medium text-black/60 uppercase tracking-wider"
                      >
                        Website
                      </label>
                      <input
                        id="admin-website"
                        type="url"
                        value={profileData.website}
                        onChange={(e) => setProfileData({ ...profileData, website: e.target.value })}
                        className="w-full border-b border-black/20 bg-transparent px-0 py-3 text-base text-black placeholder-black/30 focus:border-black focus:outline-none transition-colors"
                        placeholder="https://studio.com"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
                    <div>
                      <label
                        htmlFor="admin-email"
                        className="mb-2 block text-xs font-medium text-black/60 uppercase tracking-wider"
                      >
                        Email
                      </label>
                      <input
                        id="admin-email"
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                        className="w-full border-b border-black/20 bg-transparent px-0 py-3 text-base text-black placeholder-black/30 focus:border-black focus:outline-none transition-colors"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="admin-phone"
                        className="mb-2 block text-xs font-medium text-black/60 uppercase tracking-wider"
                      >
                        Phone
                      </label>
                      <input
                        id="admin-phone"
                        type="tel"
                        value={profileData.phone}
                        onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                        className="w-full border-b border-black/20 bg-transparent px-0 py-3 text-base text-black placeholder-black/30 focus:border-black focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="border border-black/20 bg-black/5 p-4 text-sm text-black">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="rounded-full bg-black px-6 py-3 sm:py-4 text-xs font-medium text-white transition-all hover:bg-black/90 active:bg-black/80 disabled:opacity-50 uppercase tracking-wider min-h-[44px] touch-manipulation"
                  >
                    {loading ? 'Saving...' : 'Save Profile'}
                  </button>
                </form>
              </div>

              {/* Tattoo manager – only when editing an existing parlor */}
              {!isCreatingNew && selectedArtist && (
                <div className="border border-black/10 bg-white p-4 sm:p-6 md:p-8 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <h3 className="text-lg sm:text-xl font-light tracking-tight text-black uppercase tracking-wider">
                      Tattoos ({tattoos.length})
                    </h3>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingTattoo(null);
                        setShowUploadForm(true);
                      }}
                      className="rounded-full bg-black px-5 py-2.5 text-xs font-medium text-white transition-all hover:bg-black/90 active:bg-black/80 uppercase tracking-wider min-h-[40px] touch-manipulation"
                    >
                      Upload Tattoo for {selectedArtist.name}
                    </button>
                  </div>

                  {showUploadForm && (
                    <div className="border border-black/10 bg-white p-4 sm:p-6 md:p-8">
                      <div className="mb-4 flex items-center justify-between gap-4">
                        <h4 className="text-base sm:text-lg font-light tracking-tight text-black uppercase tracking-wider">
                          {editingTattoo ? 'Edit Tattoo' : 'New Tattoo Upload'}
                        </h4>
                        <button
                          type="button"
                          onClick={() => setShowUploadForm(false)}
                          className="text-black/40 hover:text-black transition-colors"
                        >
                          <svg
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="1"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      <AdminTattooUploadForm
                        artist={selectedArtist}
                        tattoo={editingTattoo || undefined}
                        onSuccess={async () => {
                          setShowUploadForm(false);
                          setEditingTattoo(null);
                          await loadTattoos(selectedArtist.id);
                        }}
                        onCancel={() => {
                          setShowUploadForm(false);
                          setEditingTattoo(null);
                        }}
                      />
                    </div>
                  )}

                  <div>
                    {loadingTattoos ? (
                      <div className="py-10 text-center text-sm text-black/60">Loading tattoos...</div>
                    ) : tattoos.length === 0 ? (
                      <div className="py-10 text-center text-sm text-black/60">
                        No tattoos uploaded yet for this artist.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {tattoos.map((tattoo) => (
                          <div key={tattoo.id} className="group relative overflow-hidden border border-black/10 bg-white">
                            <div className="aspect-square relative bg-black">
                              <Image
                                src={tattoo.imageUrl}
                                alt={tattoo.description || 'Tattoo'}
                                fill
                                className="object-cover transition-transform duration-500 group-hover:scale-105"
                              />
                            </div>
                            <div className="p-4">
                              {tattoo.description && (
                                <p className="mb-2 text-sm text-black leading-relaxed tracking-wide">
                                  {tattoo.description}
                                </p>
                              )}
                              <div className="mb-3 flex flex-wrap gap-3 text-xs text-black/50 uppercase tracking-wider">
                                {tattoo.price && <span>€{tattoo.price}</span>}
                                {tattoo.style && <span>• {tattoo.style}</span>}
                                {tattoo.size && <span>• {tattoo.size}</span>}
                              </div>
                              <div className="mb-2 text-[10px] uppercase tracking-wider text-black/50">
                                {tattoo.isVisible === false ? 'Hidden from gallery' : 'Visible in gallery'}
                              </div>
                              <div className="flex items-center gap-4 text-[11px] uppercase tracking-wider">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingTattoo(tattoo);
                                    setShowUploadForm(true);
                                  }}
                                  className="text-black/60 hover:text-black transition-colors underline underline-offset-4"
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    try {
                                      await adminUpdateTattoo(tattoo.id, {
                                        isVisible: tattoo.isVisible === false ? true : false,
                                      });
                                      await loadTattoos(selectedArtist.id);
                                    } catch (err: any) {
                                      setError(err.message || 'Failed to update visibility');
                                    }
                                  }}
                                  className="text-black/60 hover:text-black transition-colors underline underline-offset-4"
                                >
                                  {tattoo.isVisible === false ? 'Show' : 'Hide'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteTattoo(tattoo.id, tattoo.imageUrl)}
                                  className="text-black/50 hover:text-black transition-colors underline underline-offset-4"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="border border-black/10 bg-white p-10 text-center text-sm text-black/60">
              Select a tattoo parlor from the list to manage their profile and uploads.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}


