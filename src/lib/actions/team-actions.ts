
"use server";

import { db } from "@/lib/firebase";
import type { TeamFormData, Team } from "@/types"; 
import { collection, addDoc, serverTimestamp, query, where, getDocs, limit, doc, updateDoc, getDoc } from "firebase/firestore";
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
    // This should ideally be pulled from the authenticated user on the server if possible,
    // but for now, we trust the client-provided display name during creation.
    return { success: false, message: "Nome del creatore mancante." };
  }

  try {
    const teamPayloadToSave: Omit<Team, 'id' | 'createdAt' | 'updatedAt'> & { createdAt: any } = { // Ensure correct type for payload
      userId,
      name: data.name,
      founderNationId: data.founderNationId,
      day1NationId: data.day1NationId,
      day2NationId: data.day2NationId,
      creatorDisplayName: data.creatorDisplayName,
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
  data: TeamFormData, // Full form data
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
      return { success: false, message: "Non sei autorizzato a modificare questo team." };
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
    // When updating, ensure creatorDisplayName is also updated if it changed for the current user.
    // data.creatorDisplayName should be the user's current display name passed from the form.
    if (!data.creatorDisplayName) {
      return { success: false, message: "Nome del creatore mancante per l'aggiornamento." };
    }


    const teamPayloadToUpdate = {
      name: data.name,
      founderNationId: data.founderNationId,
      day1NationId: data.day1NationId,
      day2NationId: data.day2NationId,
      creatorDisplayName: data.creatorDisplayName, // Use current display name
      updatedAt: serverTimestamp(),
    };

    await updateDoc(teamDocRef, teamPayloadToUpdate);

    revalidatePath("/teams");
    revalidatePath(`/teams/${teamId}/edit`);
    revalidatePath(`/teams`); // Revalidate teams list page
    
    return { success: true, message: "Team aggiornato con successo!", teamId: teamId };
  } catch (error)
 {
    console.error("Errore durante l'aggiornamento del team:", error);
    const errorMessage = error instanceof Error ? error.message : "Si è verificato un errore sconosciuto.";
    return { success: false, message: `Errore del server: ${errorMessage}` };
  }
}


export async function updateTeamCreatorDisplayNameAction(
  teamId: string,
  newDisplayName: string,
  userId: string // For verification
): Promise<{ success: boolean; message: string }> {
  if (!userId) {
    return { success: false, message: "Utente non autenticato." };
  }
  if (!teamId) {
    return { success: false, message: "ID del team mancante." };
  }
  if (!newDisplayName.trim()) {
    return { success: false, message: "Il nuovo nome visualizzato non può essere vuoto." };
  }

  try {
    const teamDocRef = doc(db, TEAMS_COLLECTION, teamId);
    const teamSnap = await getDoc(teamDocRef);

    if (!teamSnap.exists()) {
      // It's possible the team was deleted, or this is an old/invalid ID.
      // We can choose to silently ignore or return an error.
      console.warn(`Team con ID ${teamId} non trovato durante l'aggiornamento del nome del creatore.`);
      return { success: false, message: "Team non trovato." };
    }

    const teamData = teamSnap.data() as Team;
    if (teamData.userId !== userId) {
      // Should not happen if getTeamsByUserId was used correctly, but good to double-check.
      return { success: false, message: "Non sei autorizzato a modificare questo team." };
    }

    await updateDoc(teamDocRef, {
      creatorDisplayName: newDisplayName,
      updatedAt: serverTimestamp(),
    });

    revalidatePath("/teams"); // Revalidate the main teams list
    revalidatePath(`/teams/${teamId}/edit`); // Revalidate edit page if open
    
    return { success: true, message: "Nome del creatore del team aggiornato." };
  } catch (error) {
    console.error(`Errore durante l'aggiornamento del nome del creatore per il team ${teamId}:`, error);
    const errorMessage = error instanceof Error ? error.message : "Si è verificato un errore sconosciuto.";
    return { success: false, message: `Errore del server: ${errorMessage}` };
  }
}
