
"use server";

import { db } from "@/lib/firebase";
import type { TeamFormData, Team } from "@/types";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { revalidatePath } from "next/cache";

const TEAMS_COLLECTION = "teams";

export async function createTeamAction(
  data: TeamFormData,
  userId: string | undefined // Changed from string to string | undefined
): Promise<{ success: boolean; message: string; teamId?: string }> {
  if (!userId) {
    return { success: false, message: "Utente non autenticato. Effettua il login per creare un team." };
  }

  if (!data.name.trim()) {
    return { success: false, message: "Il nome del team è obbligatorio." };
  }
  if (!data.founderNationId) {
    return { success: false, message: "Devi selezionare una nazione Fondatrice." };
  }
  if (!data.day1NationId) {
    return { success: false, message: "Devi selezionare una nazione per il Giorno 1." };
  }
  if (!data.day2NationId) {
    return { success: false, message: "Devi selezionare una nazione per il Giorno 2." };
  }

  try {
    const teamPayload = {
      ...data,
      userId,
      createdAt: serverTimestamp(), // Use Firestore server timestamp
    };
    
    const docRef = await addDoc(collection(db, TEAMS_COLLECTION), teamPayload);

    revalidatePath("/teams"); // For the future teams list page
    revalidatePath("/teams/new");
    
    return { success: true, message: "Team creato con successo!", teamId: docRef.id };
  } catch (error) {
    console.error("Errore durante la creazione del team:", error);
    const errorMessage = error instanceof Error ? error.message : "Si è verificato un errore sconosciuto.";
    return { success: false, message: `Errore del server: ${errorMessage}` };
  }
}
