
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

// Team Creation and Editing - Core Details
export interface TeamCoreFormData {
  name: string;
  founderChoices: string[]; // Array of 3 nation IDs
  creatorDisplayName: string;
}

// Team Final Answers (Category Predictions)
export interface TeamFinalAnswersFormData {
  // bestTreppoScoreNationId: string; // REMOVED
  bestSongNationId: string;
  bestPerformanceNationId: string;
  bestOutfitNationId: string;
  worstSongNationId: string; // This should refer to the original "Peggior Canzone", not "Peggior TreppoScore"
}


export interface Team {
  id: string;
  userId: string;
  creatorDisplayName: string;
  name: string;
  founderChoices: string[];

  // bestTreppoScoreNationId: string; // REMOVED
  bestSongNationId: string;
  bestPerformanceNationId: string;
  bestOutfitNationId: string;
  worstSongNationId: string; // This should refer to the original "Peggior Canzone"

  createdAt: number | null;
  updatedAt?: number | null;
}

export interface GlobalPrimaSquadraDetail {
  id: string;
  name: string;
  countryCode: string;
  artistName?: string;
  songTitle?: string;
  actualRank?: number;
  points: number;
}
export interface GlobalCategoryPickDetail {
  categoryName: string;
  pickedNationId?: string;
  pickedNationName?: string;
  pickedNationCountryCode?: string;
  actualCategoryRank?: number;
  pickedNationScoreInCategory?: number | null;
  pointsAwarded: number;
  iconName: string;
}


export interface AdminSettings {
  teamsLocked: boolean;
  leaderboardLocked: boolean;
  finalPredictionsEnabled: boolean;
  userRegistrationEnabled: boolean; 
}

export interface NationGlobalCategorizedScores {
  averageSongScore: number | null;
  averagePerformanceScore: number | null;
  averageOutfitScore: number | null;
  overallAverageScore: number | null; // Still needed for general TreppoScore ranking if used elsewhere
  voteCount: number;
}


export interface NationWithTreppoScore extends Nation {
  globalTreppoScore: number | null; // Based on overallAverageScore
  globalVoteCount: number;
  userAverageScore?: number | null;
}

export interface TeamWithScore extends Team {
  score?: number;
  primaSquadraDetails?: GlobalPrimaSquadraDetail[];
  categoryPicksDetails?: GlobalCategoryPickDetail[];
  rank?: number;
  isTied?: boolean;
  bonusCampionePronostici?: boolean;
  bonusEnPleinTop5?: boolean;
  // bestTreppoScoreNationId?: string; // REMOVED
  // worstTreppoScoreNationId?: string; // Keep worstSongNationId as per schema
}
