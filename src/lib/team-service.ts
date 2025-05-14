
import { db } from "@/lib/firebase";
import type { Team } from "@/types";
import { collection, getDocs, query, orderBy, where, doc, getDoc } from "firebase/firestore";

const TEAMS_COLLECTION = "teams";

export async function getTeams(): Promise<Team[]> {
  try {
    const teamsCollection = collection(db, TEAMS_COLLECTION);
    // Order by creation time, newest first
    const q = query(teamsCollection, orderBy("createdAt", "desc"));
    const teamSnapshot = await getDocs(q);
    
    const teamsList = teamSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as Team));
    
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
    
    const teamsList = teamSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as Team));
    
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
      return { id: teamSnap.id, ...teamSnap.data() } as Team;
    } else {
      console.warn(`Team with ID ${teamId} not found.`);
      return undefined;
    }
  } catch (error) {
    console.error(`Error fetching team with ID ${teamId}:`, error);
    return undefined;
  }
}
