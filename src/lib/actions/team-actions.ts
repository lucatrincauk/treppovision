
"use server";

import { db } from "@/lib/firebase";
import type { TeamFormData, Team } from "@/types"; 
import { collection, addDoc, serverTimestamp, query, where, getDocs, limit, doc, updateDoc } from "firebase/firestore";
import { revalidatePath } from "next/cache";

const TEAMS_COLLECTION = "teams";

export async function createTeamAction(
  data: TeamFormData, 
  userId: string | undefined
): Promise<{ success: boolean; message: string; teamId?: string }> {
  if (!userId) {
    return { success: false, message: "Utente non autenticato. Effettua il login per creare un team." };
  }

  try {
    const teamsCollectionRef = collection(db, TEAMS_COLLECTION);
    const q = query(teamsCollectionRef, where("userId", "==", userId), limit(1));
    const existingTeamSnapshot = await getDocs(q);

    if (!existingTeamSnapshot.empty) {
      return { success: false, message: "Hai già creato un team. Puoi creare un solo team per account." };
    }
  } catch (error) {
    console.error("Errore durante la verifica del team esistente:", error);
    return { success: false, message: "Errore del server durante la verifica del team. Riprova." };
  }


  if (!data.name.trim()) {
    return { success: false, message: "Il nome del team è obbligatorio." };
  }
  if (!data.founderNationId) {
    return { success: false, message: "Devi selezionare una nazione Fondatrice." };
  }
  if (!data.day1NationId) {
    return { success: false, message: "Devi selezionare una nazione per la Prima Semifinale." };
  }
  if (!data.day2NationId) {
    return { success: false, message: "Devi selezionare una nazione per la Seconda Semifinale." };
  }
  if (!data.creatorDisplayName) {
    return { success: false, message: "Nome del creatore mancante." };
  }

  try {
    const teamPayloadToSave = {
      ...data, // includes name, founderNationId, day1NationId, day2NationId, creatorDisplayName
      userId, 
      createdAt: serverTimestamp(),
    };
    
    const docRef = await addDoc(collection(db, TEAMS_COLLECTION), teamPayloadToSave);

    revalidatePath("/teams");
    revalidatePath("/teams/new");
    
    return { success: true, message: "Team creato con successo!", teamId: docRef.id };
  } catch (error) {
    console.error("Errore durante la creazione del team:", error);
    const errorMessage = error instanceof Error ? error.message : "Si è verificato un errore sconosciuto.";
    return { success: false, message: `Errore del server: ${errorMessage}` };
  }
}


export async function updateTeamAction(
  teamId: string,
  data: TeamFormData,
  userId: string | undefined
): Promise<{ success: boolean; message: string; teamId?: string }> {
  if (!userId) {
    return { success: false, message: "Utente non autenticato." };
  }
  if (!teamId) {
    return { success: false, message: "ID del team mancante." };
  }

  try {
    const teamDocRef = doc(db, TEAMS_COLLECTION, teamId);
    const teamSnap = await getDoc(teamDocRef);

    if (!teamSnap.exists()) {
      return { success: false, message: "Team non trovato." };
    }

    const teamData = teamSnap.data() as Team;
    if (teamData.userId !== userId) {
      return { success: false, message: "Non autorizzato a modificare questo team." };
    }

    if (!data.name.trim()) {
      return { success: false, message: "Il nome del team è obbligatorio." };
    }
    // Other validations for founderNationId, day1NationId, day2NationId can be added if needed

    const teamPayloadToUpdate = {
      ...data, // includes name, founderNationId, day1NationId, day2NationId, creatorDisplayName
      updatedAt: serverTimestamp(),
    };

    await updateDoc(teamDocRef, teamPayloadToUpdate);

    revalidatePath("/teams");
    revalidatePath(`/teams/${teamId}/edit`);
    
    return { success: true, message: "Team aggiornato con successo!", teamId: teamId };
  } catch (error) {
    console.error("Errore durante l'aggiornamento del team:", error);
    const errorMessage = error instanceof Error ? error.message : "Si è verificato un errore sconosciuto.";
    return { success: false, message: `Errore del server: ${errorMessage}` };
  }
}
