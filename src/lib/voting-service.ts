
import type { Vote, NationGlobalScore, NationGlobalCategorizedScores } from "@/types";
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


// Listens to all votes for ALL nations and provides detailed categorized aggregated data in real-time
export const listenToAllVotesForAllNationsCategorized = (
  callback: (scores: Map<string, NationGlobalCategorizedScores>) => void
): Unsubscribe => {
  const votesCollectionRef = collection(db, "votes");

  const unsubscribe = onSnapshot(votesCollectionRef, (querySnapshot) => {
    const nationAggregates = new Map<string, {
      totalSong: number;
      totalPerformance: number;
      totalOutfit: number;
      voteCount: number;
    }>();

    querySnapshot.forEach((docSnap) => {
      const vote = docSnap.data() as Vote;
      if (vote && vote.scores && vote.nationId) {
        const currentAgg = nationAggregates.get(vote.nationId) || {
          totalSong: 0,
          totalPerformance: 0,
          totalOutfit: 0,
          voteCount: 0,
        };
        currentAgg.totalSong += vote.scores.song;
        currentAgg.totalPerformance += vote.scores.performance;
        currentAgg.totalOutfit += vote.scores.outfit;
        currentAgg.voteCount += 1;
        nationAggregates.set(vote.nationId, currentAgg);
      }
    });

    const result = new Map<string, NationGlobalCategorizedScores>();
    nationAggregates.forEach((data, nationId) => {
      const voteCount = data.voteCount;
      const avgSong = voteCount > 0 ? data.totalSong / voteCount : null;
      const avgPerf = voteCount > 0 ? data.totalPerformance / voteCount : null;
      const avgOutfit = voteCount > 0 ? data.totalOutfit / voteCount : null;
      const overallAvg = (avgSong !== null && avgPerf !== null && avgOutfit !== null)
                         ? (avgSong + avgPerf + avgOutfit) / 3
                         : null;
      result.set(nationId, {
        averageSongScore: avgSong,
        averagePerformanceScore: avgPerf,
        averageOutfitScore: avgOutfit,
        overallAverageScore: overallAvg,
        voteCount: voteCount,
      });
    });
    callback(result);
  }, (error) => {
    console.error("Error listening to all votes for all nations (categorized):", error);
    callback(new Map()); // Return empty map on error
  });

  return unsubscribe;
};


// Fetches all votes for a specific user
export const getAllUserVotes = async (userId: string): Promise<Map<string, Vote | null>> => {
  const userVotesMap = new Map<string, Vote | null>();
  if (!userId) return userVotesMap;

  try {
    const votesCollectionRef = collection(db, "votes");
    const q = query(votesCollectionRef, where("userId", "==", userId));
    const querySnapshot = await getDocs(q);

    querySnapshot.forEach((docSnap) => {
      const vote = docSnap.data() as Vote; // Assuming Vote type has nationId
      if (vote && vote.nationId) {
        userVotesMap.set(vote.nationId, vote);
      }
    });
    return userVotesMap;
  } catch (error) {
    console.error(`Error fetching all votes for user ${userId}:`, error);
    return userVotesMap; // Return empty map on error
  }
};


export const getVotesForNationFromLocalStorage_DEPRECATED = (nationId: string): Vote[] => {
  console.warn("getVotesForNationFromLocalStorage_DEPRECATED is called. Ensure this is intended if Firestore is primary.");
  return [];
};

export const getUserVoteForNationFromLocalStorage_DEPRECATED = (nationId: string, userId: string): Vote | undefined => {
  console.warn("getUserVoteForNationFromLocalStorage_DEPRECATED is called. Ensure this is intended if Firestore is primary.");
  return undefined;
};
