
"use server";

import { db } from "@/lib/firebase";
import type { TeamFormData } from "@/types"; // TeamFormData now includes creatorDisplayName
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { revalidatePath } from "next/cache";

const TEAMS_COLLECTION = "teams";

export async function createTeamAction(
  data: TeamFormData, // data now includes creatorDisplayName
  userId: string | undefined
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
  if (!data.creatorDisplayName) {
    // This should ideally be set by the form, but as a fallback:
    return { success: false, message: "Nome del creatore mancante." };
  }

  try {
    // Construct the payload to be saved, ensuring all fields from TeamFormData are included.
    // The `Team` type in types/index.ts will guide what's stored, minus the `id`.
    const teamPayloadToSave = {
      name: data.name,
      founderNationId: data.founderNationId,
      day1NationId: data.day1NationId,
      day2NationId: data.day2NationId,
      creatorDisplayName: data.creatorDisplayName, // Save the creator's display name
      userId, // The UID of the user creating the team
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
