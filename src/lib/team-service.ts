
import { db } from "@/lib/firebase";
import type { Team } from "@/types";
import { collection, getDocs, query, orderBy, where, doc, getDoc, onSnapshot, type Unsubscribe, Timestamp } from "firebase/firestore";

const TEAMS_COLLECTION = "teams";

// Helper function to convert Firestore Timestamp to milliseconds or return null/undefined
const serializeTimestamp = (timestamp: any): number | null => {
  if (timestamp instanceof Timestamp) {
    return timestamp.toMillis();
  }
  if (timestamp && typeof timestamp.toMillis === 'function') { // Handle cases where it's an object with toMillis
    return timestamp.toMillis();
  }
  if (typeof timestamp === 'number') { // Already serialized
    return timestamp;
  }
  return null;
};


export async function getTeams(): Promise<Team[]> {
  try {
    const teamsCollection = collection(db, TEAMS_COLLECTION);
    // Order by creation time, newest first
    const q = query(teamsCollection, orderBy("createdAt", "desc"));
    const teamSnapshot = await getDocs(q);

    const teamsList = teamSnapshot.docs.map(docSnap => { // Renamed doc to docSnap
      const data = docSnap.data();
      return {
        id: docSnap.id,
        userId: data.userId,
        creatorDisplayName: data.creatorDisplayName,
        name: data.name,
        founderChoices: data.founderChoices || [],
        bestTreppoScoreNationId: data.bestTreppoScoreNationId || "",
        bestSongNationId: data.bestSongNationId || "",
        bestPerformanceNationId: data.bestPerformanceNationId || "",
        bestOutfitNationId: data.bestOutfitNationId || "",
        worstTreppoScoreNationId: data.worstTreppoScoreNationId || "",
        createdAt: serializeTimestamp(data.createdAt),
        updatedAt: data.updatedAt ? serializeTimestamp(data.updatedAt) : undefined,
      } as Team;
    });

    return teamsList;
  } catch (error) {
    console.error("Error fetching teams:", error);
    return []; // Return empty array on error
  }
}

export async function getTeamsByUserId(userId: string): Promise<Team[]> {
  if (!userId) return [];
  try {
    const teamsCollection = collection(db, TEAMS_COLLECTION);
    const q = query(teamsCollection, where("userId", "==", userId), orderBy("createdAt", "desc"));
    const teamSnapshot = await getDocs(q);

    const teamsList = teamSnapshot.docs.map(docSnap => { // Renamed doc to docSnap
      const data = docSnap.data();
      return {
        id: docSnap.id,
        userId: data.userId,
        creatorDisplayName: data.creatorDisplayName,
        name: data.name,
        founderChoices: data.founderChoices || [],
        bestTreppoScoreNationId: data.bestTreppoScoreNationId || "",
        bestSongNationId: data.bestSongNationId || "",
        bestPerformanceNationId: data.bestPerformanceNationId || "",
        bestOutfitNationId: data.bestOutfitNationId || "",
        worstTreppoScoreNationId: data.worstTreppoScoreNationId || "",
        createdAt: serializeTimestamp(data.createdAt),
        updatedAt: data.updatedAt ? serializeTimestamp(data.updatedAt) : undefined,
      } as Team;
    });

    return teamsList;
  } catch (error) {
    console.error(`Error fetching teams for userId ${userId}:`, error);
    return []; // Return empty array on error
  }
}

export async function getTeamById(teamId: string): Promise<Team | undefined> {
  if (!teamId) return undefined;
  try {
    const teamDocRef = doc(db, TEAMS_COLLECTION, teamId);
    const teamSnap = await getDoc(teamDocRef);
    if (teamSnap.exists()) {
      const data = teamSnap.data();
      return {
        id: teamSnap.id,
        userId: data.userId,
        creatorDisplayName: data.creatorDisplayName,
        name: data.name,
        founderChoices: data.founderChoices || [],
        bestTreppoScoreNationId: data.bestTreppoScoreNationId || "",
        bestSongNationId: data.bestSongNationId || "",
        bestPerformanceNationId: data.bestPerformanceNationId || "",
        bestOutfitNationId: data.bestOutfitNationId || "",
        worstTreppoScoreNationId: data.worstTreppoScoreNationId || "",
        createdAt: serializeTimestamp(data.createdAt),
        updatedAt: data.updatedAt ? serializeTimestamp(data.updatedAt) : undefined,
      } as Team;
    } else {
      console.warn(`Team with ID ${teamId} not found.`);
      return undefined;
    }
  } catch (error) {
    console.error(`Error fetching team with ID ${teamId}:`, error);
    return undefined;
  }
}

export const listenToTeams = (
  callback: (teams: Team[]) => void,
  onError: (error: Error) => void
): Unsubscribe => {
  const teamsCollectionRef = collection(db, TEAMS_COLLECTION);
  const q = query(teamsCollectionRef, orderBy("createdAt", "desc"));

  const unsubscribe = onSnapshot(q,
    (querySnapshot) => {
      const teamsList = querySnapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          userId: data.userId,
          creatorDisplayName: data.creatorDisplayName,
          name: data.name,
          founderChoices: data.founderChoices || [],
          bestTreppoScoreNationId: data.bestTreppoScoreNationId || "",
          bestSongNationId: data.bestSongNationId || "",
          bestPerformanceNationId: data.bestPerformanceNationId || "",
          bestOutfitNationId: data.bestOutfitNationId || "",
          worstTreppoScoreNationId: data.worstTreppoScoreNationId || "",
          createdAt: serializeTimestamp(data.createdAt),
          updatedAt: data.updatedAt ? serializeTimestamp(data.updatedAt) : undefined,
        } as Team;
      });
      callback(teamsList);
    },
    (error) => {
      console.error("Error listening to teams collection:", error);
      onError(error);
    }
  );
  return unsubscribe;
};
