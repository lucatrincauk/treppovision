
"use server";

import { auth, db } from "@/lib/firebase";
import type { AdminNationPayload, AdminSettings } from "@/types";
import { doc, setDoc, getDoc, deleteDoc, deleteField, updateDoc } from "firebase/firestore"; // Added updateDoc
import { revalidatePath } from "next/cache";
import { getNations } from "@/lib/nation-service";
import { unstable_noStore as noStore } from 'next/cache';


const NATIONS_COLLECTION = "nations";
const ADMIN_SETTINGS_COLLECTION = "adminSettings";
const ADMIN_SETTINGS_DOC_ID = "config";

async function verifyAdminServerSide(): Promise<boolean> {
  // TODO: Implement robust server-side admin verification
  // For now, this is a placeholder. In a real app, you'd check Firebase Custom Claims
  // or a secure role management system.
  // const user = auth.currentUser; // This won't work directly in server actions without passing user context
  // This needs a proper implementation based on your auth strategy.
  // For now, we'll assume if the action is called, it's by an authorized client.
  return true;
}


export async function addNationAction(
  data: AdminNationPayload
): Promise<{ success: boolean; message: string; nationId?: string }> {
  const isAdmin = await verifyAdminServerSide();
  if (!isAdmin) {
    return { success: false, message: "Non autorizzato." };
  }

  try {
    const nationRef = doc(db, NATIONS_COLLECTION, data.id);
    const docSnap = await getDoc(nationRef);

    if (docSnap.exists()) {
      return { success: false, message: `Una nazione con ID '${data.id}' esiste già.` };
    }

    await setDoc(nationRef, data);

    revalidatePath("/nations");
    revalidatePath(`/nations/${data.id}`);
    revalidatePath("/admin/nations/new");
    revalidatePath("/teams/leaderboard");
    revalidatePath("/nations/ranking");
    revalidatePath("/nations/trepposcore-ranking");
    return { success: true, message: "Nazione aggiunta con successo!", nationId: data.id };
  } catch (error) {
    console.error("Errore durante l'aggiunta della nazione:", error);
    const errorMessage = error instanceof Error ? error.message : "Si è verificato un errore sconosciuto.";
    return { success: false, message: `Errore del server: ${errorMessage}` };
  }
}

export async function updateNationAction(
  data: AdminNationPayload
): Promise<{ success: boolean; message: string; nationId?: string }> {
  const isAdmin = await verifyAdminServerSide();
  if (!isAdmin) {
    return { success: false, message: "Non autorizzato." };
  }

  try {
    const nationRef = doc(db, NATIONS_COLLECTION, data.id);

    const payloadForFirestore: { [key: string]: any } = { ...data };
    if (data.ranking === undefined) {
      payloadForFirestore.ranking = deleteField();
    }

    await setDoc(nationRef, payloadForFirestore, { merge: true });

    revalidatePath("/nations");
    revalidatePath(`/nations/${data.id}`);
    revalidatePath(`/admin/nations/${data.id}/edit`);
    revalidatePath("/teams/leaderboard");
    revalidatePath("/nations/ranking");
    revalidatePath("/nations/trepposcore-ranking");
    return { success: true, message: "Nazione aggiornata con successo!", nationId: data.id };
  } catch (error) {
    console.error("Errore durante l'aggiornamento della nazione:", error);
    const errorMessage = error instanceof Error ? error.message : "Si è verificato un errore sconosciuto.";
    return { success: false, message: `Errore del server: ${errorMessage}` };
  }
}

export async function deleteNationAction(
  nationId: string
): Promise<{ success: boolean; message: string }> {
    const isAdmin = await verifyAdminServerSide();
    if (!isAdmin) {
        return { success: false, message: "Non autorizzato." };
    }

    try {
        const nationRef = doc(db, NATIONS_COLLECTION, nationId);
        await deleteDoc(nationRef);

        revalidatePath("/nations");
        revalidatePath(`/nations/${nationId}`);
        revalidatePath("/teams/leaderboard");
        revalidatePath("/nations/ranking");
        revalidatePath("/nations/trepposcore-ranking");
        return { success: true, message: "Nazione eliminata con successo!" };
    } catch (error) {
        console.error("Errore durante l'eliminazione della nazione:", error);
        const errorMessage = error instanceof Error ? error.message : "Si è verificato un errore sconosciuto.";
        return { success: false, message: `Errore del server: ${errorMessage}` };
    }
}

export async function getAdminSettingsAction(): Promise<AdminSettings> {
  noStore(); // Prevent caching of this action
  try {
    const settingsDocRef = doc(db, ADMIN_SETTINGS_COLLECTION, ADMIN_SETTINGS_DOC_ID);
    const docSnap = await getDoc(settingsDocRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        teamsLocked: data.teamsLocked === undefined ? false : data.teamsLocked,
        leaderboardLocked: data.leaderboardLocked === undefined ? false : data.leaderboardLocked,
      };
    }
    // Default settings if the document doesn't exist
    return { teamsLocked: false, leaderboardLocked: false };
  } catch (error) {
    console.error("Error fetching admin settings:", error);
    // Return default settings on error as well
    return { teamsLocked: false, leaderboardLocked: false };
  }
}

export async function updateAdminSettingsAction(
  payload: Partial<AdminSettings>
): Promise<{ success: boolean; message: string }> {
  const isAdmin = await verifyAdminServerSide();
  if (!isAdmin) {
    return { success: false, message: "Non autorizzato." };
  }

  try {
    const settingsDocRef = doc(db, ADMIN_SETTINGS_COLLECTION, ADMIN_SETTINGS_DOC_ID);
    await setDoc(settingsDocRef, payload, { merge: true });

    // Revalidate paths that depend on these settings
    revalidatePath("/admin/settings");
    revalidatePath("/teams", "layout"); // Revalidate all team-related pages
    revalidatePath("/nations", "layout"); // Revalidate all nation-related pages

    return { success: true, message: "Impostazioni admin aggiornate con successo." };
  } catch (error) {
    console.error("Errore durante l'aggiornamento delle impostazioni admin:", error);
    const errorMessage = error instanceof Error ? error.message : "Si è verificato un errore sconosciuto.";
    return { success: false, message: `Errore del server: ${errorMessage}` };
  }
}

export async function updateNationRankingAction(
  nationId: string,
  newRanking?: number | null
): Promise<{ success: boolean; message: string }> {
  const isAdmin = await verifyAdminServerSide();
  if (!isAdmin) {
    return { success: false, message: "Non autorizzato." };
  }

  try {
    const nationRef = doc(db, NATIONS_COLLECTION, nationId);
    const rankingUpdate = newRanking === undefined || newRanking === null || newRanking <= 0
      ? deleteField()
      : newRanking;

    await updateDoc(nationRef, {
      ranking: rankingUpdate,
    });

    revalidatePath("/nations");
    revalidatePath(`/nations/${nationId}`);
    revalidatePath("/admin/settings"); // Revalidate admin page itself
    revalidatePath("/teams/leaderboard");
    revalidatePath("/nations/ranking");
    revalidatePath("/nations/trepposcore-ranking");
    return { success: true, message: `Ranking per ${nationId} aggiornato.` };
  } catch (error) {
    console.error(`Errore durante l'aggiornamento del ranking per ${nationId}:`, error);
    const errorMessage = error instanceof Error ? error.message : "Si è verificato un errore sconosciuto.";
    return { success: false, message: `Errore del server: ${errorMessage}` };
  }
}


export async function getLeaderboardLockedStatus(): Promise<boolean> {
    noStore(); // Prevent caching of this action
    const settings = await getAdminSettingsAction();
    return settings.leaderboardLocked;
}

export async function checkIfAnyNationIsRankedAction(): Promise<boolean> {
  noStore(); // Prevent caching of this action
  try {
    const nations = await getNations();
    if (nations.length === 0) {
      return false; // If no nations, then "not all nations are ranked"
    }
    // Check if every nation has a ranking that is a positive number
    return nations.every(nation => nation.ranking && nation.ranking > 0);
  } catch (error) {
    console.error("Error checking if all nations are ranked:", error);
    return false; // Default to false on error
  }
}
