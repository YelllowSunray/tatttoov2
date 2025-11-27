import { getTattoos, getUserLikes } from './firestore';
import { getArtists } from './firestore';
import { ArtistScore } from '@/types';
import { auth } from './firebase';

// Get user ID from Firebase Auth, fallback to anonymous
export function getUserId(): string {
  if (typeof window === 'undefined') return 'anonymous';
  
  const user = auth.currentUser;
  if (user) {
    return user.uid;
  }
  
  // Fallback to localStorage for anonymous users
  let userId = localStorage.getItem('tattooAppUserId');
  if (!userId) {
    userId = `anonymous_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('tattooAppUserId', userId);
  }
  return userId;
}

// Calculate Top 5 artists based on user likes
export async function getTop5Artists(userId: string): Promise<ArtistScore[]> {
  const [allTattoos, allArtists, userLikes] = await Promise.all([
    getTattoos(),
    getArtists(),
    getUserLikes(userId)
  ]);

  // Create a map of liked tattoo IDs for quick lookup
  const likedTattooIds = new Set(userLikes.map(like => like.tattooId));

  // Count likes per artist
  const artistScores: Map<string, ArtistScore> = new Map();

  allArtists.forEach(artist => {
    artistScores.set(artist.id, {
      artistId: artist.id,
      score: 0,
      likedTattoos: 0,
      likedTattooIds: []
    });
  });

  // Calculate scores based on liked tattoos
  allTattoos.forEach(tattoo => {
    if (likedTattooIds.has(tattoo.id)) {
      const score = artistScores.get(tattoo.artistId);
      if (score) {
        score.score += 1;
        score.likedTattoos += 1;
        score.likedTattooIds.push(tattoo.id);
      }
    }
  });

  // Convert to array, filter artists with at least one like, and sort by score
  const topArtists = Array.from(artistScores.values())
    .filter(score => score.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  return topArtists;
}

