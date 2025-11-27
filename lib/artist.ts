import { 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  deleteDoc,
  writeBatch,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { Artist, Tattoo } from '@/types';

// Collection names
const ARTISTS_COLLECTION = 'artists';
const TATTOOS_COLLECTION = 'tattoos';

/**
 * Remove undefined values from object (Firestore doesn't accept undefined)
 */
function removeUndefined(obj: any): any {
  const cleaned: any = {};
  for (const key in obj) {
    if (obj[key] !== undefined) {
      cleaned[key] = obj[key];
    }
  }
  return cleaned;
}

/**
 * Get artist by Firebase Auth user ID
 */
export async function getArtistByUserId(userId: string): Promise<Artist | null> {
  const q = query(collection(db, ARTISTS_COLLECTION), where('userId', '==', userId));
  const snapshot = await getDocs(q);
  if (snapshot.empty) {
    return null;
  }
  return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Artist;
}

/**
 * Get all artists (for admin tooling)
 */
export async function getAllArtists(): Promise<Artist[]> {
  const snapshot = await getDocs(collection(db, ARTISTS_COLLECTION));
  return snapshot.docs.map((artistDoc) => ({ id: artistDoc.id, ...artistDoc.data() } as Artist));
}

/**
 * Admin: create a new artist (parlor) without requiring a linked user account
 */
export async function adminCreateArtist(artist: Omit<Artist, 'id'>): Promise<string> {
  const docRef = doc(collection(db, ARTISTS_COLLECTION));
  await setDoc(
    docRef,
    removeUndefined({
      ...artist,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }),
  );
  return docRef.id;
}

/**
 * Create or update artist profile
 */
export async function createOrUpdateArtist(artist: Omit<Artist, 'id'>, userId: string): Promise<string> {
  // Check if artist already exists
  const existingArtist = await getArtistByUserId(userId);
  
  if (existingArtist) {
    // Update existing artist
    const docRef = doc(db, ARTISTS_COLLECTION, existingArtist.id);
    await updateDoc(
      docRef,
      removeUndefined({
      ...artist,
      userId,
        updatedAt: serverTimestamp(),
      }),
    );
    return existingArtist.id;
  } else {
    // Create new artist
    const docRef = doc(collection(db, ARTISTS_COLLECTION));
    await setDoc(
      docRef,
      removeUndefined({
      ...artist,
      userId,
      createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }),
    );
    return docRef.id;
  }
}

/**
 * Admin: update an artist by id (no ownership checks)
 */
export async function adminUpdateArtist(artistId: string, updates: Partial<Artist>): Promise<void> {
  const docRef = doc(db, ARTISTS_COLLECTION, artistId);
  await updateDoc(
    docRef,
    removeUndefined({
      ...updates,
      updatedAt: serverTimestamp(),
    }),
  );
}

/**
 * Admin: delete an artist and all their tattoos (no ownership checks)
 */
export async function adminDeleteArtist(artistId: string): Promise<void> {
  const batch = writeBatch(db);

  // Delete all tattoos for this artist
  const tattoosQuery = query(collection(db, TATTOOS_COLLECTION), where('artistId', '==', artistId));
  const tattoosSnapshot = await getDocs(tattoosQuery);
  tattoosSnapshot.forEach((tattooDoc) => {
    batch.delete(tattooDoc.ref);
  });

  // Delete the artist document itself
  const artistRef = doc(db, ARTISTS_COLLECTION, artistId);
  batch.delete(artistRef);

  await batch.commit();
}

/**
 * Admin: set visibility for an artist and all their tattoos (no ownership checks)
 */
export async function adminSetParlorVisibility(artistId: string, isVisible: boolean): Promise<void> {
  const batch = writeBatch(db);

  // Update artist visibility
  const artistRef = doc(db, ARTISTS_COLLECTION, artistId);
  batch.update(
    artistRef,
    removeUndefined({
      isVisible,
      updatedAt: serverTimestamp(),
    }),
  );

  // Update visibility for all tattoos belonging to this artist
  const tattoosQuery = query(collection(db, TATTOOS_COLLECTION), where('artistId', '==', artistId));
  const tattoosSnapshot = await getDocs(tattoosQuery);
  tattoosSnapshot.forEach((tattooDoc) => {
    batch.update(
      tattooDoc.ref,
      removeUndefined({
        isVisible,
        updatedAt: serverTimestamp(),
      }),
    );
  });

  await batch.commit();
}

/**
 * Upload a new tattoo
 */
export async function uploadTattoo(tattoo: Omit<Tattoo, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const docRef = doc(collection(db, TATTOOS_COLLECTION));
  await setDoc(
    docRef,
    removeUndefined({
      // New tattoos are visible by default unless explicitly hidden
      isVisible: true,
    ...tattoo,
    createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }),
  );
  return docRef.id;
}

/**
 * Admin: update a tattoo by id (no ownership checks)
 */
export async function adminUpdateTattoo(tattooId: string, updates: Partial<Tattoo>): Promise<void> {
  const docRef = doc(db, TATTOOS_COLLECTION, tattooId);
  await updateDoc(
    docRef,
    removeUndefined({
      ...updates,
      updatedAt: serverTimestamp(),
    }),
  );
}

/**
 * Admin: delete a tattoo by id (no ownership checks)
 */
export async function adminDeleteTattoo(tattooId: string): Promise<void> {
  const docRef = doc(db, TATTOOS_COLLECTION, tattooId);
  await deleteDoc(docRef);
}

/**
 * Update an existing tattoo (only if user owns it)
 */
export async function updateTattoo(tattooId: string, updates: Partial<Tattoo>, userId: string): Promise<void> {
  // Verify ownership
  const tattooDoc = await getDoc(doc(db, TATTOOS_COLLECTION, tattooId));
  if (!tattooDoc.exists()) {
    throw new Error('Tattoo not found');
  }
  
  const tattoo = tattooDoc.data() as Tattoo;
  const artist = await getArtistByUserId(userId);
  
  if (!artist || tattoo.artistId !== artist.id) {
    throw new Error('You do not have permission to update this tattoo');
  }
  
  const docRef = doc(db, TATTOOS_COLLECTION, tattooId);
  await updateDoc(
    docRef,
    removeUndefined({
    ...updates,
      updatedAt: serverTimestamp(),
    }),
  );
}

/**
 * Delete a tattoo (only if user owns it)
 */
export async function deleteTattoo(tattooId: string, userId: string): Promise<void> {
  // Verify ownership
  const tattooDoc = await getDoc(doc(db, TATTOOS_COLLECTION, tattooId));
  if (!tattooDoc.exists()) {
    throw new Error('Tattoo not found');
  }
  
  const tattoo = tattooDoc.data() as Tattoo;
  const artist = await getArtistByUserId(userId);
  
  if (!artist || tattoo.artistId !== artist.id) {
    throw new Error('You do not have permission to delete this tattoo');
  }
  
  await deleteDoc(doc(db, TATTOOS_COLLECTION, tattooId));
}

/**
 * Get tattoos by artist (for artist dashboard)
 */
export async function getMyTattoos(userId: string): Promise<Tattoo[]> {
  const artist = await getArtistByUserId(userId);
  if (!artist) {
    return [];
  }
  
  const q = query(collection(db, TATTOOS_COLLECTION), where('artistId', '==', artist.id));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((tattooDoc) => ({ id: tattooDoc.id, ...tattooDoc.data() } as Tattoo));
}

/**
 * Get tattoos for a specific artist by id (admin tooling)
 */
export async function getTattoosByArtistId(artistId: string): Promise<Tattoo[]> {
  const q = query(collection(db, TATTOOS_COLLECTION), where('artistId', '==', artistId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((tattooDoc) => ({ id: tattooDoc.id, ...tattooDoc.data() } as Tattoo));
}

