
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

// Updated User type for Firebase Authentication
export interface User {
  uid: string; // Firebase User ID
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  // isAdmin could be added here if you have a system to determine admin status
  // e.g., by checking UID against a list of admins in your database or custom claims
  isAdmin?: boolean; 
}

export interface Vote {
  nationId: string;
  userId: string; // This will store user.uid
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
