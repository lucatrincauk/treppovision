
export type NationCategory = "founders" | "day1" | "day2";

export interface Nation {
  id: string; // Firestore document ID
  name: string;
  countryCode: string; // For flagcdn
  songTitle: string;
  artistName: string;
  youtubeVideoId: string;
  category: NationCategory;
  ranking?: number;
  performingOrder: number;
  songDescription?: string;
  songLyrics?: string;
  dataAiHintFlag?: string;
}

export interface NationFormData {
  id: string;
  name: string;
  countryCode: string;
  songTitle: string;
  artistName: string;
  youtubeVideoId: string;
  category: NationCategory;
  ranking?: string;
  performingOrder: number;
  songDescription?: string;
  songLyrics?: string;
}

export interface User {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  isAdmin?: boolean;
}

export interface Vote {
  userId: string;
  nationId: string;
  scores: {
    song: number;
    performance: number;
    outfit: number;
  };
  timestamp: number; // Client-side timestamp
  serverTimestamp?: any; // Firestore server timestamp
}

export interface AggregatedScore extends Nation {
  averageSong: number;
  averagePerformance: number;
  averageOutfit: number;
  totalScore: number;
  voteCount: number;
}

// Form data types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface SignupFormData {
  email: string;
  password: string;
  displayName?: string;
}

export interface EmailLinkFormData {
  email: string;
}

// AuthContext types
export interface AuthContextType {
  user: User | null;
  loginWithEmail: (data: LoginFormData) => Promise<boolean>;
  signupWithEmail: (data: SignupFormData) => Promise<boolean>;
  sendLoginLink: (email: string) => Promise<boolean>;
  sendPasswordReset: (email: string) => Promise<boolean>; 
  logout: () => Promise<void>;
  isLoading: boolean;
  completeEmailLinkSignIn: () => Promise<void>;
  updateUserProfileName: (newName: string) => Promise<boolean>;
}

export interface AdminNationPayload {
  id: string;
  name: string;
  countryCode: string;
  songTitle: string;
  artistName: string;
  youtubeVideoId: string;
  category: NationCategory;
  ranking?: number;
  performingOrder: number;
  songDescription?: string;
  songLyrics?: string;
}

// Team Creation
export interface TeamFormData {
  name: string;
  founderChoices: string[]; // Array of nation IDs
  creatorDisplayName: string;
  bestSongNationId: string;
  bestPerformanceNationId: string;
  bestOutfitNationId: string;
  worstSongNationId: string;
}

export interface Team {
  id: string; // Firestore document ID
  userId: string; // UID of the user who created the team
  creatorDisplayName: string;
  name: string;
  founderChoices: string[]; // Array of nation IDs
  bestSongNationId: string;
  bestPerformanceNationId: string;
  bestOutfitNationId: string;
  worstSongNationId: string;
  createdAt: {
    seconds: number;
    nanoseconds: number;
  } | number | null; 
  updatedAt?: { 
    seconds: number;
    nanoseconds: number;
  } | number | null;
}

export interface AdminSettings {
  teamsLocked: boolean;
}

export interface NationGlobalScore {
  averageScore: number | null;
  voteCount: number;
}

export interface NationWithTreppoScore extends Nation {
  globalTreppoScore: number | null;
  globalVoteCount: number;
}
