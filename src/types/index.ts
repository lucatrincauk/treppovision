
export type NationCategory = "founders" | "day1" | "day2";

export interface Nation {
  id: string;
  name: string;
  countryCode: string; // For flagcdn
  songTitle: string;
  artistName: string;
  youtubeVideoId: string;
  category: NationCategory;
  dataAiHintFlag?: string; // If using picsum as fallback
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
