'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getArtistByUserId, createOrUpdateArtist } from '@/lib/artist';
import { getMyTattoos, deleteTattoo } from '@/lib/artist';
import { TattooUploadForm } from './TattooUploadForm';
import { Artist, Tattoo } from '@/types';
import Image from 'next/image';
import { deleteImage } from '@/lib/storage';

export function ArtistDashboard() {
  const { user } = useAuth();
  const [artist, setArtist] = useState<Artist | null>(null);
  const [tattoos, setTattoos] = useState<Tattoo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [editingTattoo, setEditingTattoo] = useState<Tattoo | null>(null);
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [error, setError] = useState('');

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
    loadArtistData();
  }, [user]);

  const loadArtistData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const artistData = await getArtistByUserId(user.uid);
      if (artistData) {
        setArtist(artistData);
        setProfileData({
          name: artistData.name || '',
          location: artistData.location || '',
          bio: artistData.bio || '',
          instagram: artistData.instagram || '',
          website: artistData.website || '',
          email: artistData.email || user.email || '',
          phone: artistData.phone || '',
        });
        
        // Load tattoos
        const myTattoos = await getMyTattoos(user.uid);
        setTattoos(myTattoos);
      } else {
        setShowProfileForm(true);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load artist data');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError('');

    try {
      await createOrUpdateArtist({
        name: profileData.name,
        location: profileData.location,
        bio: profileData.bio || undefined,
        instagram: profileData.instagram || undefined,
        website: profileData.website || undefined,
        email: profileData.email || undefined,
        phone: profileData.phone || undefined,
      }, user.uid);

      await loadArtistData();
      setShowProfileForm(false);
    } catch (err: any) {
      setError(err.message || 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTattoo = async (tattooId: string, imageUrl: string) => {
    if (!user || !confirm('Are you sure you want to delete this tattoo?')) return;

    try {
      await deleteTattoo(tattooId, user.uid);
      // Try to delete image (non-blocking)
      deleteImage(imageUrl).catch(() => {});
      await loadArtistData();
    } catch (err: any) {
      setError(err.message || 'Failed to delete tattoo');
    }
  };

  if (loading && !artist) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-black border-t-transparent mx-auto"></div>
          <p className="text-black/60 text-sm tracking-wide">Loading...</p>
        </div>
      </div>
    );
  }

  if (showProfileForm || !artist) {
    return (
      <div className="mx-auto max-w-2xl border border-black/10 bg-white p-4 sm:p-8 md:p-12">
        <h2 className="mb-4 sm:mb-6 text-2xl sm:text-3xl font-light tracking-tight text-black uppercase tracking-wider">
          Set Up Your Artist Profile
        </h2>
        <p className="mb-8 sm:mb-12 text-sm text-black/60 tracking-wide">
          Create your artist profile to start uploading tattoos.
        </p>

        <form onSubmit={handleProfileSubmit} className="space-y-6 sm:space-y-8">
          <div>
            <label htmlFor="name" className="mb-2 block text-xs font-medium text-black/60 uppercase tracking-wider">
              Artist Name <span className="text-black">*</span>
            </label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              value={profileData.name}
              onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
              required
              className="w-full border-b border-black/20 bg-transparent px-0 py-3 text-base text-black placeholder-black/30 focus:border-black focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label htmlFor="location" className="mb-2 block text-xs font-medium text-black/60 uppercase tracking-wider">
              Location <span className="text-black">*</span>
            </label>
              <input
                id="location"
                type="text"
                value={profileData.location}
                onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                required
                className="w-full border-b border-black/20 bg-transparent px-0 py-3 text-base text-black placeholder-black/30 focus:border-black focus:outline-none transition-colors"
                placeholder="Amsterdam, Netherlands"
              />
          </div>

          <div>
            <label htmlFor="bio" className="mb-2 block text-xs font-medium text-black/60 uppercase tracking-wider">
              Bio
            </label>
            <textarea
              id="bio"
              value={profileData.bio}
              onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
              rows={4}
              className="w-full border-b border-black/20 bg-transparent px-0 py-3 text-base text-black placeholder-black/30 focus:border-black focus:outline-none transition-colors resize-none"
              placeholder="Tell us about your style and experience..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
            <div>
              <label htmlFor="instagram" className="mb-2 block text-xs font-medium text-black/60 uppercase tracking-wider">
                Instagram
              </label>
              <input
                id="instagram"
                type="url"
                inputMode="url"
                value={profileData.instagram}
                onChange={(e) => setProfileData({ ...profileData, instagram: e.target.value })}
                className="w-full border-b border-black/20 bg-transparent px-0 py-3 text-base text-black placeholder-black/30 focus:border-black focus:outline-none transition-colors"
                placeholder="https://instagram.com/yourhandle"
              />
            </div>

            <div>
              <label htmlFor="website" className="mb-2 block text-xs font-medium text-black/60 uppercase tracking-wider">
                Website
              </label>
              <input
                id="website"
                type="url"
                inputMode="url"
                value={profileData.website}
                onChange={(e) => setProfileData({ ...profileData, website: e.target.value })}
                className="w-full border-b border-black/20 bg-transparent px-0 py-3 text-base text-black placeholder-black/30 focus:border-black focus:outline-none transition-colors"
                placeholder="https://yourwebsite.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
            <div>
              <label htmlFor="email" className="mb-2 block text-xs font-medium text-black/60 uppercase tracking-wider">
                Email
              </label>
              <input
                id="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                value={profileData.email}
                onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                className="w-full border-b border-black/20 bg-transparent px-0 py-3 text-base text-black placeholder-black/30 focus:border-black focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label htmlFor="phone" className="mb-2 block text-xs font-medium text-black/60 uppercase tracking-wider">
                Phone
              </label>
              <input
                id="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
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
            className="w-full rounded-full bg-black px-6 py-3 sm:py-4 text-xs font-medium text-white transition-all hover:bg-black/90 active:bg-black/80 disabled:opacity-50 uppercase tracking-wider min-h-[44px] touch-manipulation"
          >
            {loading ? 'Saving...' : artist ? 'Edit Profile' : 'Create Profile'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-black/10 pb-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-light tracking-tight text-black uppercase tracking-wider">
            {artist.name}
          </h2>
          <p className="mt-2 text-xs text-black/50 uppercase tracking-wider">{artist.location}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <button
            onClick={() => setShowProfileForm(true)}
            className="rounded-full border border-black px-5 py-2.5 text-xs font-medium text-black transition-all hover:bg-black hover:text-white active:bg-black/90 active:text-white uppercase tracking-wider min-h-[44px] touch-manipulation"
          >
            Edit Profile
          </button>
          <button
            onClick={() => {
              setEditingTattoo(null);
              setShowUploadForm(true);
            }}
            className="rounded-full bg-black px-5 py-2.5 text-xs font-medium text-white transition-all hover:bg-black/90 active:bg-black/80 uppercase tracking-wider min-h-[44px] touch-manipulation"
          >
            Upload Tattoo
          </button>
        </div>
      </div>

      {error && (
        <div className="border border-black/20 bg-black/5 p-4 text-sm text-black">
          {error}
        </div>
      )}

      {/* Upload/Edit Form Modal */}
      {(showUploadForm || editingTattoo) && (
        <div className="border border-black/10 bg-white p-4 sm:p-8 md:p-12">
          <div className="mb-6 sm:mb-8 flex items-center justify-between">
            <h3 className="text-xl sm:text-2xl font-light tracking-tight text-black uppercase tracking-wider">
              {editingTattoo ? 'Edit Tattoo' : 'Upload New Tattoo'}
            </h3>
            <button
              onClick={() => {
                setShowUploadForm(false);
                setEditingTattoo(null);
              }}
              className="text-black/40 hover:text-black transition-colors"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <TattooUploadForm
            tattoo={editingTattoo || undefined}
            onSuccess={() => {
              setShowUploadForm(false);
              setEditingTattoo(null);
              loadArtistData();
            }}
            onCancel={() => {
              setShowUploadForm(false);
              setEditingTattoo(null);
            }}
          />
        </div>
      )}

      {/* My Tattoos Grid */}
      <div>
        <h3 className="mb-6 sm:mb-8 text-xl sm:text-2xl font-light tracking-tight text-black uppercase tracking-wider">
          My Tattoos ({tattoos.length})
        </h3>
        {tattoos.length === 0 ? (
          <div className="border border-black/10 bg-white p-16 text-center">
            <p className="text-black/60 text-sm tracking-wide">No tattoos uploaded yet. Start by uploading your first tattoo!</p>
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
                <div className="p-6">
                  {tattoo.description && (
                    <p className="mb-3 text-sm text-black leading-relaxed tracking-wide">{tattoo.description}</p>
                  )}
                  <div className="mb-4 flex flex-wrap gap-3 text-xs text-black/50 uppercase tracking-wider">
                    {tattoo.price && <span>€{tattoo.price}</span>}
                    {tattoo.style && <span>• {tattoo.style}</span>}
                    {tattoo.size && <span>• {tattoo.size}</span>}
                  </div>
                  <div className="flex items-center gap-4 text-xs uppercase tracking-wider">
                    <button
                      onClick={() => {
                        setEditingTattoo(tattoo);
                        setShowUploadForm(true);
                      }}
                      className="text-black/60 hover:text-black transition-colors underline underline-offset-4"
                    >
                      Edit
                    </button>
                    <button
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
  );
}

