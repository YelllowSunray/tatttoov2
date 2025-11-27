'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { getAllArtists } from '@/lib/artist';
import type { Artist } from '@/types';

export default function ShopsPage() {
  const { user, loading } = useAuth();
  const [artists, setArtists] = useState<Artist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        const all = await getAllArtists();
        setArtists(all);
      } catch (err: any) {
        setError(err.message || 'Unable to load shops');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <main className="container mx-auto px-4 sm:px-6 py-10 sm:py-16 max-w-5xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-light tracking-tight text-black">
              Tattoo Shops
            </h1>
            <p className="text-black/60">
              Explore all studios featured on Tattoo Discovery.
            </p>
          </div>
          <Link
            href="/"
            className="text-sm text-black/40 hover:text-black transition-colors"
          >
            ← Back to Gallery
          </Link>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="mb-4 h-8 w-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
              <p className="text-black/60 text-sm">Loading shops...</p>
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-20 text-sm text-black/60">{error}</div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {artists.map((artist) => (
              <Link
                key={artist.id}
                href={`/artist/${artist.id}`}
                className="border border-black/10 p-6 hover:border-black transition-colors bg-white flex flex-col gap-3"
              >
                <h2 className="text-lg font-medium text-black">{artist.name}</h2>
                <p className="text-sm text-black/50">{artist.location || 'Location TBD'}</p>
                {artist.bio && (
                  <p className="text-sm text-black/60 line-clamp-3">{artist.bio}</p>
                )}
                <div className="mt-auto text-xs uppercase text-black/40">
                  View shop →
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}


