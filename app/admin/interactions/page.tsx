'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { getAllArtists } from '@/lib/artist';
import { getArtistStats } from '@/lib/firestore';
import type { Artist, ArtistStats } from '@/types';

// Reuse the same admin-email logic as the main admin page
const ADMIN_EMAILS: string[] =
  (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '')
    .split(',')
    .map((email) => email.trim())
    .filter(Boolean);

function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  if (ADMIN_EMAILS.length === 0) {
    return email.endsWith('@example.com');
  }
  return ADMIN_EMAILS.includes(email);
}

interface ArtistWithStats {
  artist: Artist;
  stats: ArtistStats | null;
}

export default function AdminInteractionsPage() {
  const { user, loading, signOut } = useAuth();
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState('');
  const [rows, setRows] = useState<ArtistWithStats[]>([]);

  const isAdmin = user && isAdminEmail(user.email);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingData(true);
        setError('');

        const artists = await getAllArtists();
        const rowsWithStats: ArtistWithStats[] = await Promise.all(
          artists.map(async (artist) => {
            const stats = await getArtistStats(artist.id);
            return { artist, stats };
          }),
        );

        // Sort by consultations desc, then phone clicks desc, then artist name
        rowsWithStats.sort((a, b) => {
          const aConsult = a.stats?.consultationRequests ?? 0;
          const bConsult = b.stats?.consultationRequests ?? 0;
          if (bConsult !== aConsult) return bConsult - aConsult;

          const aPhone = a.stats?.phoneClicks ?? 0;
          const bPhone = b.stats?.phoneClicks ?? 0;
          if (bPhone !== aPhone) return bPhone - aPhone;

          return a.artist.name.localeCompare(b.artist.name);
        });

        setRows(rowsWithStats);
      } catch (err: any) {
        setError(err.message || 'Failed to load interaction stats');
      } finally {
        setLoadingData(false);
      }
    };

    if (user && isAdmin) {
      loadData();
    }
  }, [user, isAdmin]);

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

  if (!user) {
    return (
      <div className="min-h-screen bg-white">
        <header className="border-b border-black/10 bg-white">
          <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h1 className="text-lg sm:text-xl font-light tracking-tight text-black uppercase tracking-wider">
                Admin Interactions
              </h1>
              <Link
                href="/"
                className="text-xs text-black/40 hover:text-black transition-colors uppercase tracking-wider min-h-[44px] flex items-center"
              >
                ← Back to Gallery
              </Link>
            </div>
          </div>
        </header>
        <main className="container mx-auto px-4 sm:px-6 py-12 sm:py-20">
          <div className="mx-auto max-w-lg text-center">
            <p className="mb-6 text-sm text-black/60 leading-relaxed tracking-wide">
              Sign in with an admin account to view interaction statistics.
            </p>
            <Link
              href="/admin"
              className="rounded-full bg-black px-6 py-3 text-xs font-medium text-white transition-all hover:bg-black/90 active:bg-black/80 uppercase tracking-wider min-h-[44px] inline-flex items-center justify-center touch-manipulation"
            >
              Go to Admin Login
            </Link>
          </div>
        </main>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-white">
        <header className="border-b border-black/10 bg-white">
          <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h1 className="text-lg sm:text-xl font-light tracking-tight text-black uppercase tracking-wider">
                Admin Interactions
              </h1>
              <Link
                href="/"
                className="text-xs text-black/40 hover:text-black transition-colors uppercase tracking-wider min-h-[44px] flex items-center"
              >
                ← Back to Gallery
              </Link>
            </div>
          </div>
        </header>
        <main className="container mx-auto px-4 sm:px-6 py-12 sm:py-20">
          <div className="mx-auto max-w-lg text-center border border-black/10 bg-white p-8 sm:p-10">
            <h2 className="mb-4 text-2xl sm:text-3xl font-light tracking-tight text-black uppercase tracking-wider">
              Access Restricted
            </h2>
            <p className="mb-6 text-sm text-black/60 leading-relaxed tracking-wide">
              Your account does not have admin permissions. Please sign in with an admin email address
              configured in <code className="text-xs bg-black/5 px-1 py-0.5 rounded">NEXT_PUBLIC_ADMIN_EMAILS</code>.
            </p>
            <button
              onClick={signOut}
              className="rounded-full border border-black px-6 py-3 text-xs font-medium text-black transition-all hover:bg-black hover:text-white active:bg-black/90 active:text-white uppercase tracking-wider min-h-[44px] touch-manipulation"
            >
              Sign Out
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-black/10 bg-white/95 backdrop-blur-sm">
        <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-lg sm:text-xl font-light tracking-tight text-black uppercase tracking-wider">
                Admin Interactions
              </h1>
              {user.email && (
                <p className="mt-1 text-xs text-black/50 tracking-wide">
                  {user.email}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3 sm:gap-6">
              <Link
                href="/admin"
                className="text-xs text-black/40 hover:text-black transition-colors uppercase tracking-wider min-h-[44px] flex items-center"
              >
                ← Back to Admin
              </Link>
              <button
                onClick={signOut}
                className="rounded-full border border-black px-4 py-2.5 text-xs font-medium text-black transition-all hover:bg-black hover:text-white active:bg-black/90 active:text-white uppercase tracking-wider min-h-[44px] touch-manipulation"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 py-8 sm:py-16">
        <div className="mx-auto max-w-5xl border border-black/10 bg-white p-4 sm:p-6 md:p-8">
          <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-light tracking-tight text-black uppercase tracking-wider">
                Parlor Interactions
              </h2>
              <p className="mt-1 text-xs text-black/50 tracking-wide">
                Consultation requests and phone reveals per tattoo parlor
              </p>
            </div>
            {loadingData ? (
              <p className="text-xs text-black/40 tracking-wider">Loading data…</p>
            ) : (
              <p className="text-xs text-black/40 tracking-wider">
                {rows.length} parlor{rows.length === 1 ? '' : 's'}
              </p>
            )}
          </div>

          {error && (
            <div className="mb-6 border border-black/20 bg-black/5 p-4 text-sm text-black">
              {error}
            </div>
          )}

          {loadingData ? (
            <div className="py-16 text-center text-sm text-black/60">
              Loading interaction statistics…
            </div>
          ) : rows.length === 0 ? (
            <div className="py-16 text-center text-sm text-black/60">
              No parlors found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-black/10 text-black/50 uppercase tracking-[0.12em]">
                    <th className="py-3 pr-4">Parlor</th>
                    <th className="py-3 pr-4 hidden sm:table-cell">Location</th>
                    <th className="py-3 pr-4 text-right">Consultations</th>
                    <th className="py-3 pr-4 text-right">Phone Clicks</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(({ artist, stats }) => (
                    <tr key={artist.id} className="border-b border-black/5 last:border-0">
                      <td className="py-3 pr-4 align-top">
                        <div className="flex flex-col">
                          <span className="text-sm text-black">{artist.name}</span>
                          <span className="sm:hidden text-[11px] text-black/40 uppercase tracking-[0.12em] mt-1">
                            {artist.location}
                          </span>
                          <span className="text-[10px] text-black/30 uppercase tracking-[0.12em] mt-1">
                            ID: {artist.id}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 pr-4 align-top hidden sm:table-cell text-xs text-black/60">
                        {artist.location}
                      </td>
                      <td className="py-3 pr-4 align-top text-right text-xs text-black">
                        {stats?.consultationRequests ?? 0}
                      </td>
                      <td className="py-3 pr-4 align-top text-right text-xs text-black">
                        {stats?.phoneClicks ?? 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}



