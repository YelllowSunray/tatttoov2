import { 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  increment,
} from 'firebase/firestore';
import { db } from './firebase';
import { Artist, Tattoo, UserLike, Inquiry, ArtistStats, UserPreferences, FilterSet } from '@/types';

// Collection names
const ARTISTS_COLLECTION = 'artists';
const TATTOOS_COLLECTION = 'tattoos';
const LIKES_COLLECTION = 'likes';
const INQUIRIES_COLLECTION = 'inquiries';
const ARTIST_STATS_COLLECTION = 'artist_stats';
const USER_PREFERENCES_COLLECTION = 'user_preferences';

// Get all artists
export async function getArtists(): Promise<Artist[]> {
  const snapshot = await getDocs(collection(db, ARTISTS_COLLECTION));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Artist));
}

// Get artist by ID
export async function getArtist(artistId: string): Promise<Artist | null> {
  const docRef = doc(db, ARTISTS_COLLECTION, artistId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Artist;
  }
  return null;
}

// Get all tattoos
export async function getTattoos(): Promise<Tattoo[]> {
  const snapshot = await getDocs(collection(db, TATTOOS_COLLECTION));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Tattoo));
}

// Get tattoo by ID
export async function getTattoo(tattooId: string): Promise<Tattoo | null> {
  const docRef = doc(db, TATTOOS_COLLECTION, tattooId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Tattoo;
  }
  return null;
}

// Get tattoos by artist
export async function getTattoosByArtist(artistId: string): Promise<Tattoo[]> {
  const q = query(collection(db, TATTOOS_COLLECTION), where('artistId', '==', artistId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Tattoo));
}

// Get user likes (using localStorage user ID for simplicity)
export async function getUserLikes(userId: string): Promise<UserLike[]> {
  const docRef = doc(db, LIKES_COLLECTION, userId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data().likes || [];
  }
  return [];
}

// Add or remove a like
export async function toggleLike(userId: string, tattooId: string): Promise<boolean> {
  const docRef = doc(db, LIKES_COLLECTION, userId);
  const docSnap = await getDoc(docRef);
  
  const currentLikes: UserLike[] = docSnap.exists() ? docSnap.data().likes || [] : [];
  const isLiked = currentLikes.some(like => like.tattooId === tattooId);
  
  let updatedLikes: UserLike[];
  if (isLiked) {
    // Remove like
    updatedLikes = currentLikes.filter(like => like.tattooId !== tattooId);
  } else {
    // Add like
    updatedLikes = [...currentLikes, { tattooId, timestamp: Date.now() }];
  }
  
  await setDoc(docRef, {
    likes: updatedLikes,
    updatedAt: serverTimestamp()
  }, { merge: true });
  
  return !isLiked;
}

// Check if a tattoo is liked
export async function isTattooLiked(userId: string, tattooId: string): Promise<boolean> {
  const likes = await getUserLikes(userId);
  return likes.some(like => like.tattooId === tattooId);
}

// Clear all likes for a user
export async function clearUserLikes(userId: string): Promise<void> {
  const docRef = doc(db, LIKES_COLLECTION, userId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) {
    return;
  }
  await deleteDoc(docRef);
}

// Create a new inquiry and increment consultation stats
export async function createInquiry(inquiry: Omit<Inquiry, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const docRef = doc(collection(db, INQUIRIES_COLLECTION));
  await setDoc(docRef, {
    ...inquiry,
    status: 'pending',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  // Increment consultationRequests metric for the artist
  if (inquiry.artistId) {
    const statsRef = doc(db, ARTIST_STATS_COLLECTION, inquiry.artistId);
    await setDoc(
      statsRef,
      {
        artistId: inquiry.artistId,
        consultationRequests: increment(1),
        updatedAt: serverTimestamp(),
        // createdAt is set on first write only
        createdAt: serverTimestamp(),
      },
      { merge: true },
    );
  }

  return docRef.id;
}

// Get inquiries by artist (for artist dashboard)
export async function getInquiriesByArtist(artistId: string): Promise<Inquiry[]> {
  const q = query(collection(db, INQUIRIES_COLLECTION), where('artistId', '==', artistId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Inquiry));
}

// Increment phone click metric for an artist
export async function trackArtistPhoneClick(artistId: string): Promise<void> {
  if (!artistId) return;
  const statsRef = doc(db, ARTIST_STATS_COLLECTION, artistId);
  await setDoc(
    statsRef,
    {
      artistId,
      phoneClicks: increment(1),
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    },
    { merge: true },
  );
}

// Get stats for a single artist (for admin analytics)
export async function getArtistStats(artistId: string): Promise<ArtistStats | null> {
  const statsRef = doc(db, ARTIST_STATS_COLLECTION, artistId);
  const statsSnap = await getDoc(statsRef);
  if (!statsSnap.exists()) return null;
  return { artistId, ...(statsSnap.data() as Omit<ArtistStats, 'artistId'>) };
}

// Save user preferences (with multiple filter sets)
export async function saveUserPreferences(userId: string, preferences: UserPreferences): Promise<void> {
  const docRef = doc(db, USER_PREFERENCES_COLLECTION, userId);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    // Update existing preferences
    await updateDoc(docRef, {
      ...preferences,
      updatedAt: serverTimestamp(),
    });
  } else {
    // Create new preferences
    await setDoc(docRef, {
      ...preferences,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
}

// Get user preferences
export async function getUserPreferences(userId: string): Promise<UserPreferences | null> {
  const docRef = doc(db, USER_PREFERENCES_COLLECTION, userId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data() as UserPreferences;
  }
  return null;
}

// Add a new filter set to user preferences
export async function addFilterSet(userId: string, filterSet: Omit<FilterSet, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const docRef = doc(db, USER_PREFERENCES_COLLECTION, userId);
  const docSnap = await getDoc(docRef);
  
  // Generate a unique ID
  const filterSetId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const newFilterSet: FilterSet = {
    ...filterSet,
    id: filterSetId,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  
  if (docSnap.exists()) {
    const currentData = docSnap.data() as UserPreferences;
    const updatedFilterSets = [...(currentData.filterSets || []), newFilterSet];
    await updateDoc(docRef, {
      filterSets: updatedFilterSets,
      updatedAt: serverTimestamp(),
    });
  } else {
    await setDoc(docRef, {
      filterSets: [newFilterSet],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
  
  return filterSetId;
}

// Delete a filter set from user preferences
export async function deleteFilterSet(userId: string, filterSetId: string): Promise<void> {
  const docRef = doc(db, USER_PREFERENCES_COLLECTION, userId);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    const currentData = docSnap.data() as UserPreferences;
    const updatedFilterSets = (currentData.filterSets || []).filter(fs => fs.id !== filterSetId);
    await updateDoc(docRef, {
      filterSets: updatedFilterSets,
      updatedAt: serverTimestamp(),
    });
  }
}



