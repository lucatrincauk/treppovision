
"use client";
import type { Vote } from "@/types";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

// This key can be removed or repurposed if localStorage backup is no longer needed.
// const VOTES_STORAGE_KEY = "treppoVotes";

// Fetches a user's vote for a specific nation from Firestore
export const getUserVoteForNationFromDB = async (nationId: string, userId: string): Promise<Vote | null> => {
  if (!userId || !nationId) return null;
  try {
    const voteDocRef = doc(db, "votes", `${userId}_${nationId}`);
    const voteSnap = await getDoc(voteDocRef);
    if (voteSnap.exists()) {
      // The document data might include serverTimestamp, but we only care about the Vote structure for the app
      const voteData = voteSnap.data();
      return {
        userId: voteData.userId,
        nationId: voteData.nationId,
        scores: voteData.scores,
        timestamp: voteData.timestamp, // Use the original client timestamp
      } as Vote;
    }
    return null;
  } catch (error) {
    console.error("Error fetching user vote from Firestore:", error);
    return null;
  }
};


// --- Potentially keep localStorage functions for specific offline/quick-access scenarios if needed,
// --- but ensure they are not the source of truth for voting.
// --- For this refactor, we are focusing on Firestore as the source of truth.

export const getVotesForNationFromLocalStorage = (nationId: string): Vote[] => {
  // This function would read from localStorage if you still needed it for some reason.
  // For now, it's not directly used by the Firestore-backed voting form.
  console.warn("getVotesForNationFromLocalStorage is called. Ensure this is intended if Firestore is primary.");
  return []; 
};

export const getUserVoteForNationFromLocalStorage = (nationId: string, userId: string): Vote | undefined => {
  // This function would read from localStorage if you still needed it for some reason.
  console.warn("getUserVoteForNationFromLocalStorage is called. Ensure this is intended if Firestore is primary.");
  return undefined;
};
