
import { db } from "@/lib/firebase";
import type { Team } from "@/types";
import { collection, getDocs, query, orderBy } from "firebase/firestore";

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
