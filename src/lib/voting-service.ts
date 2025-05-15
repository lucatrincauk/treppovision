
"use client";
import type { Vote } from "@/types";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, onSnapshot, type Unsubscribe } from "firebase/firestore";

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

// Listens to all votes for a specific nation and provides aggregated data
export const listenToAllVotesForNation = (
  nationId: string,
  callback: (averageScore: number | null, voteCount: number) => void
): Unsubscribe => {
  const votesCollectionRef = collection(db, "votes");
  const q = query(votesCollectionRef, where("nationId", "==", nationId));

  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    let totalIndividualAverageSum = 0;
    const voteCount = querySnapshot.size;

    if (voteCount === 0) {
      callback(null, 0);
      return;
    }

    querySnapshot.forEach((docSnap) => {
      const vote = docSnap.data() as Vote; // Assuming data matches Vote type
      const individualAverage = (vote.scores.song + vote.scores.performance + vote.scores.outfit) / 3;
      totalIndividualAverageSum += individualAverage;
    });

    const globalAverage = totalIndividualAverageSum / voteCount;
    callback(globalAverage, voteCount);
  }, (error) => {
    console.error("Error listening to all votes for nation:", error);
    callback(null, 0); // Call with null/0 on error
  });

  return unsubscribe; // Return the unsubscribe function for cleanup
};


// --- Potentially keep localStorage functions for specific offline/quick-access scenarios if needed,
// --- but ensure they are not the source of truth for voting.
// --- For this refactor, we are focusing on Firestore as the source of truth.

export const getVotesForNationFromLocalStorage_DEPRECATED = (nationId: string): Vote[] => {
  // This function would read from localStorage if you still needed it for some reason.
  // For now, it's not directly used by the Firestore-backed voting form.
  console.warn("getVotesForNationFromLocalStorage_DEPRECATED is called. Ensure this is intended if Firestore is primary.");
  return []; 
};

export const getUserVoteForNationFromLocalStorage_DEPRECATED = (nationId: string, userId: string): Vote | undefined => {
  // This function would read from localStorage if you still needed it for some reason.
  console.warn("getUserVoteForNationFromLocalStorage_DEPRECATED is called. Ensure this is intended if Firestore is primary.");
  return undefined;
};
