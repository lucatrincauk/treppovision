
"use server";

import { db } from "@/lib/firebase";
import type { TeamCoreFormData, TeamFinalAnswersFormData, Team } from "@/types";
import { collection, addDoc, serverTimestamp, query, where, getDocs, limit, doc, updateDoc, getDoc } from "firebase/firestore";
import { revalidatePath } from "next/cache";
import { getAdminSettingsAction, getFinalPredictionsEnabledStatus } from "./admin-actions"; 

const TEAMS_COLLECTION = "teams";

export async function createTeamAction(
  data: TeamCoreFormData,
  userId: string | undefined
): Promise<{ success: boolean; message: string; teamId?: string }> {
  if (!userId) {
    return { success: false, message: "Utente non autenticato. Effettua il login per creare un team." };
  }

  const adminSettings = await getAdminSettingsAction();
  if (adminSettings.teamsLocked) {
    return { success: false, message: "La creazione e modifica delle squadre è temporaneamente bloccata dall'amministratore." };
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
  if (!data.founderChoices || data.founderChoices.length !== 3) {
    return { success: false, message: "Devi selezionare esattamente tre nazioni per la squadra principale." };
  }
  if (new Set(data.founderChoices).size !== 3) {
    return { success: false, message: "Le tre nazioni per la squadra principale devono essere diverse." };
  }
  if (!data.creatorDisplayName) {
    return { success: false, message: "Nome dell'utente mancante." };
  }

  try {
    const teamPayloadToSave: Omit<Team, 'id' | 'createdAt' | 'updatedAt' | 'score' | 'rank' | 'primaSquadraDetails' | 'categoryPicksDetails'> & { createdAt: any } = {
      userId,
      name: data.name,
      founderChoices: data.founderChoices,
      creatorDisplayName: data.creatorDisplayName,
      bestSongNationId: "", 
      bestPerformanceNationId: "",
      bestOutfitNationId: "",
      worstSongNationId: "",
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, TEAMS_COLLECTION), teamPayloadToSave);

    revalidatePath("/teams");
    revalidatePath("/teams/new");
    revalidatePath("/teams/leaderboard");

    return { success: true, message: "Team creato con successo! Ora puoi inserire i tuoi pronostici finali.", teamId: docRef.id };
  } catch (error) {
    console.error("Errore durante la creazione del team:", error);
    const errorMessage = error instanceof Error ? error.message : "Si è verificato un errore sconosciuto.";
    return { success: false, message: `Errore del server: ${errorMessage}` };
  }
}

export async function updateTeamAction(
  teamId: string,
  data: TeamCoreFormData, // Now only core data
  userId: string | undefined
): Promise<{ success: boolean; message: string; teamId?: string }> {
  if (!userId) {
    return { success: false, message: "Utente non autenticato." };
  }
  if (!teamId) {
    return { success: false, message: "ID del team mancante." };
  }

  const adminSettings = await getAdminSettingsAction();
  if (adminSettings.teamsLocked) {
    return { success: false, message: "La modifica delle squadre è temporaneamente bloccata dall'amministratore." };
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
    if (!data.founderChoices || data.founderChoices.length !== 3) {
      return { success: false, message: "Devi selezionare esattamente tre nazioni per la squadra principale." };
    }
    if (new Set(data.founderChoices).size !== 3) {
      return { success: false, message: "Le tre nazioni per la squadra principale devono essere diverse." };
    }
    
    const teamPayloadToUpdate = {
      name: data.name,
      founderChoices: data.founderChoices,
      updatedAt: serverTimestamp(),
    };

    await updateDoc(teamDocRef, teamPayloadToUpdate);

    revalidatePath("/teams");
    revalidatePath(`/teams/${teamId}/edit`);
    revalidatePath("/teams/leaderboard");

    return { success: true, message: "Dettagli Team aggiornati con successo!", teamId: teamId };
  } catch (error) {
    console.error("Errore durante l'aggiornamento del team:", error);
    const errorMessage = error instanceof Error ? error.message : "Si è verificato un errore sconosciuto.";
    return { success: false, message: `Errore del server: ${errorMessage}` };
  }
}

export async function updateTeamFinalAnswersAction(
  teamId: string,
  data: TeamFinalAnswersFormData,
  userId: string | undefined
): Promise<{ success: boolean; message: string; teamId?: string }> {
  if (!userId) {
    return { success: false, message: "Utente non autenticato." };
  }
  if (!teamId) {
    return { success: false, message: "ID del team mancante." };
  }

  const adminSettings = await getAdminSettingsAction();
  if (adminSettings.teamsLocked) {
    return { success: false, message: "La modifica dei pronostici è temporaneamente bloccata dall'amministratore." };
  }
  if (!adminSettings.finalPredictionsEnabled) {
    return { success: false, message: "L'inserimento dei pronostici finali è attualmente disabilitato dall'amministratore." };
  }

  try {
    const teamDocRef = doc(db, TEAMS_COLLECTION, teamId);
    const teamSnap = await getDoc(teamDocRef);

    if (!teamSnap.exists()) {
      return { success: false, message: "Team non trovato." };
    }
    const teamDataInDb = teamSnap.data() as Team; 
    if (teamDataInDb.userId !== userId) {
      return { success: false, message: "Non sei autorizzato a modificare i pronostici di questo team." };
    }
    
    if (!data.bestSongNationId || !data.bestPerformanceNationId || !data.bestOutfitNationId || !data.worstSongNationId) {
        return { success: false, message: "Tutti i campi dei pronostici finali sono obbligatori." };
    }
    
    const finalAnswersToUpdate = {
      bestSongNationId: data.bestSongNationId,
      bestPerformanceNationId: data.bestPerformanceNationId,
      bestOutfitNationId: data.bestOutfitNationId,
      worstSongNationId: data.worstSongNationId,
      updatedAt: serverTimestamp(),
    };

    await updateDoc(teamDocRef, finalAnswersToUpdate);

    revalidatePath("/teams");
    revalidatePath("/teams/leaderboard");
    revalidatePath(`/teams/${teamId}/pronostici`);


    return { success: true, message: "Pronostici finali aggiornati con successo!", teamId: teamId };
  } catch (error) {
    console.error("Errore durante l'aggiornamento dei pronostici finali del team:", error);
    const errorMessage = error instanceof Error ? error.message : "Si è verificato un errore sconosciuto.";
    return { success: false, message: `Errore del server: ${errorMessage}` };
  }
}

export async function updateTeamCreatorDisplayNameAction(
  teamId: string,
  newDisplayName: string,
  userId: string
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
      console.warn(`Team con ID ${teamId} non trovato durante l'aggiornamento del nome dell'utente.`);
      return { success: false, message: "Team non trovato." };
    }

    const teamData = teamSnap.data() as Team;
    if (teamData.userId !== userId) {
      return { success: false, message: "Non sei autorizzato a modificare questo team." };
    }

    await updateDoc(teamDocRef, {
      creatorDisplayName: newDisplayName,
      updatedAt: serverTimestamp(),
    });

    revalidatePath("/teams");
    revalidatePath(`/teams/${teamId}/edit`);
    revalidatePath("/teams/leaderboard");

    return { success: true, message: "Nome utente del team aggiornato." };
  } catch (error) {
    console.error(`Errore durante l'aggiornamento del nome dell'utente per il team ${teamId}:`, error);
    const errorMessage = error instanceof Error ? error.message : "Si è verificato un errore sconosciuto.";
    return { success: false, message: `Errore del server: ${errorMessage}` };
  }
}

export async function getTeamsLockedStatus(): Promise<boolean> {
    const settings = await getAdminSettingsAction();
    return settings.teamsLocked;
}

