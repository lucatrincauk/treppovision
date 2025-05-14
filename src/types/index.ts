
export type NationCategory = "founders" | "day1" | "day2";

export interface Nation {
  id: string; // Firestore document ID
  name: string;
  countryCode: string; // For flagcdn
  songTitle: string;
  artistName: string;
  youtubeVideoId: string;
  category: NationCategory;
  dataAiHintFlag?: string; 
}

// Used for form validation and submission when adding/editing nations
export interface NationFormData {
  id: string; // country code, will be used as Firestore document ID
  name: string;
  countryCode: string;
  songTitle: string;
  artistName: string;
  youtubeVideoId: string;
  category: NationCategory;
}

export interface User {
  uid: string; 
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  isAdmin?: boolean; 
}

export interface Vote {
  nationId: string;
  userId: string; 
  scores: {
    song: number;
    performance: number;
    outfit: number;
  };
  timestamp: number;
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
  logout: () => Promise<void>;
  isLoading: boolean;
  completeEmailLinkSignIn: () => Promise<void>;
}

// For Server Actions payloads related to admin nation management
export interface AdminNationPayload {
  id: string; // document ID (usually country code)
  name: string;
  countryCode: string;
  songTitle: string;
  artistName: string;
  youtubeVideoId: string;
  category: NationCategory;
}

// Team Creation
export interface TeamFormData {
  name: string;
  founderNationId: string;
  day1NationId: string;
  day2NationId: string;
}

export interface Team extends TeamFormData {
  id: string; // Firestore document ID
  userId: string; // UID of the user who created the team
  createdAt: { // Firestore Timestamp type is complex, simplified for client
    seconds: number;
    nanoseconds: number;
  } | any; // Use 'any' for serverTimestamp() on write, then expect object on read
}
