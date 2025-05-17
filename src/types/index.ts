
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
  juryRank?: number; // New field
  televoteRank?: number; // New field
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
  juryRank?: string; // New field for form
  televoteRank?: string; // New field for form
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
  bestSongNationId: string;
  bestPerformanceNationId: string;
  bestOutfitNationId: string;
  worstSongNationId: string; // This was changed from worstTreppoScoreNationId
}


export interface Team {
  id: string;
  userId: string;
  creatorDisplayName: string;
  name: string;
  founderChoices: string[];
  
  bestSongNationId: string;
  bestPerformanceNationId: string;
  bestOutfitNationId: string;
  worstSongNationId: string; // This was changed from worstTreppoScoreNationId

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
  pickedNationId: string; 
  pickedNationName?: string;
  pickedNationCountryCode?: string;
  artistName?: string; 
  songTitle?: string;  
  actualCategoryRank?: number | null;
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

export type RankingCategoryKey = 'overallAverageScore' | 'averageSongScore' | 'averagePerformanceScore' | 'averageOutfitScore';

export interface NationGlobalCategorizedScores {
  averageSongScore: number | null;
  averagePerformanceScore: number | null;
  averageOutfitScore: number | null;
  overallAverageScore: number | null; 
  voteCount: number;
}


export interface NationWithTreppoScore extends Nation {
  globalScores?: NationGlobalCategorizedScores | null; 
  scoreForRanking: number | null; 
  rank?: number; 
  voteCount: number; 
  userAverageScore?: number | null; 
  isTied?: boolean;
}

export interface TeamWithScore extends Team {
  score?: number;
  primaSquadraDetails?: GlobalPrimaSquadraDetail[];
  categoryPicksDetails?: GlobalCategoryPickDetail[];
  rank?: number;
  isTied?: boolean;
  bonusCampionePronostici?: boolean; 
  bonusGranCampionePronostici?: boolean;
  bonusEnPleinTop5?: boolean;
  primaSquadraScore?: number;
  treppoScoreCategoryPicksScore?: number;
  bonusTotalScore?: number;
}

export interface AdminNationPayload extends Omit<NationFormData, 'ranking' | 'juryRank' | 'televoteRank'> {
  ranking?: number;
  juryRank?: number; // New field for payload
  televoteRank?: number; // New field for payload
}

export interface TeamAdminViewDetails extends Team {
  nationsNotVotedCount: number;
  unvotedNationNames?: string[]; 
  hasSubmittedFinalPredictions: boolean;
}
