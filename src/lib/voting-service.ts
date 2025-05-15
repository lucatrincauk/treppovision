
"use client";
import type { Vote, NationGlobalScore } from "@/types";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, onSnapshot, type Unsubscribe, getDocs } from "firebase/firestore";

// Fetches a user's vote for a specific nation from Firestore
export const getUserVoteForNationFromDB = async (nationId: string, userId: string): Promise<Vote | null> => {
  if (!userId || !nationId) return null;
  try {
    const voteDocRef = doc(db, "votes", `${userId}_${nationId}`);
    const voteSnap = await getDoc(voteDocRef);
    if (voteSnap.exists()) {
      const voteData = voteSnap.data();
      return {
        userId: voteData.userId,
        nationId: voteData.nationId,
        scores: voteData.scores,
        timestamp: voteData.timestamp, 
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
      const vote = docSnap.data() as Vote; 
      const individualAverage = (vote.scores.song + vote.scores.performance + vote.scores.outfit) / 3;
      totalIndividualAverageSum += individualAverage;
    });

    const globalAverage = totalIndividualAverageSum / voteCount;
    callback(globalAverage, voteCount);
  }, (error) => {
    console.error("Error listening to all votes for nation:", error);
    callback(null, 0); 
  });

  return unsubscribe; 
};

// Fetches all votes and calculates global scores for all nations
export const getAllNationsGlobalScores = async (): Promise<Map<string, NationGlobalScore>> => {
  const nationScoresMap = new Map<string, { totalAverageSum: number; voteCount: number }>();
  
  try {
    const votesCollectionRef = collection(db, "votes");
    const querySnapshot = await getDocs(votesCollectionRef);

    querySnapshot.forEach((docSnap) => {
      const vote = docSnap.data() as Vote;
      if (vote && vote.scores && vote.nationId) {
        const individualAverage = (vote.scores.song + vote.scores.performance + vote.scores.outfit) / 3;
        
        const currentNationData = nationScoresMap.get(vote.nationId) || { totalAverageSum: 0, voteCount: 0 };
        currentNationData.totalAverageSum += individualAverage;
        currentNationData.voteCount += 1;
        nationScoresMap.set(vote.nationId, currentNationData);
      }
    });

    const result = new Map<string, NationGlobalScore>();
    nationScoresMap.forEach((data, nationId) => {
      result.set(nationId, {
        averageScore: data.voteCount > 0 ? data.totalAverageSum / data.voteCount : null,
        voteCount: data.voteCount,
      });
    });
    return result;

  } catch (error) {
    console.error("Error fetching all nations global scores:", error);
    return new Map(); // Return empty map on error
  }
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
