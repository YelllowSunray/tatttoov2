export interface Artist {
  id: string;
  name: string;
  location: string;
  bio?: string;
  instagram?: string;
  website?: string;
  userId?: string; // Link to Firebase Auth user ID for verification
  email?: string;
  phone?: string;
  isVisible?: boolean; // Controls whether the parlor and its tattoos are shown publicly
}

export interface Tattoo {
  id: string;
  artistId: string;
  imageUrl: string;
  description?: string;
  price?: number;
  location?: string; // Location where tattoo was done (can differ from artist location)
  style?: string;
  tags?: string[];
  bodyPart?: string; // e.g., "Arm", "Back", "Leg", "Chest"
  color?: boolean; // true for color, false for black & white
  size?: string; // e.g., "Small", "Medium", "Large" or dimensions
  isVisible?: boolean; // Controls whether tattoo is shown in public gallery/profile
  createdAt?: number;
  updatedAt?: number;
}

export interface UserLike {
  tattooId: string;
  timestamp: number;
}

export interface ArtistScore {
  artistId: string;
  score: number;
  likedTattoos: number;
  likedTattooIds: string[]; // Array of tattoo IDs that were liked for this artist
}

export interface Inquiry {
  id?: string;
  artistId: string;
  userId?: string; // Firebase Auth user ID if logged in
  customerEmail: string;
  customerName?: string;
  preferredDate?: string;
  preferredTime?: string;
  bodyPart?: string;
  budget?: number;
  message?: string;
  status?: 'pending' | 'responded' | 'cancelled';
  createdAt?: number;
  updatedAt?: number;
}

export interface ArtistStats {
  artistId: string;
  consultationRequests?: number;
  phoneClicks?: number;
  createdAt?: number;
  updatedAt?: number;
}

export interface FilterSet {
  id: string;
  name: string;
  styles: string[];
  bodyParts: string[];
  colorPreference: 'color' | 'bw' | 'both' | null;
  sizePreference: 'small' | 'medium' | 'large' | 'all' | null;
  createdAt?: number;
  updatedAt?: number;
}

export interface UserPreferences {
  filterSets: FilterSet[];
  createdAt?: number;
  updatedAt?: number;
}


