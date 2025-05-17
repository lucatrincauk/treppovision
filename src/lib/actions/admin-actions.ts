
"use server";

import { db } from "@/lib/firebase";
import type { AdminNationPayload, AdminSettings } from "@/types";
import { doc, setDoc, getDoc, deleteDoc, deleteField, updateDoc } from "firebase/firestore";
import { revalidatePath } from "next/cache";
import { getNations, getNationById } from "@/lib/nation-service";
import { unstable_noStore as noStore } from 'next/cache';


const NATIONS_COLLECTION = "nations";
const ADMIN_SETTINGS_COLLECTION = "adminSettings";
const ADMIN_SETTINGS_DOC_ID = "config";

async function verifyAdminServerSide(): Promise<boolean> {
  // TODO: Implement robust server-side admin verification
  // For now, this relies on the client-side check, which is not secure for server actions.
  // A proper implementation would involve Firebase Custom Claims or a server-side role check.
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
    revalidatePath("/admin/settings");
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
    revalidatePath("/admin/settings");
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
        revalidatePath("/admin/settings");
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
  noStore();
  try {
    const settingsDocRef = doc(db, ADMIN_SETTINGS_COLLECTION, ADMIN_SETTINGS_DOC_ID);
    const docSnap = await getDoc(settingsDocRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        teamsLocked: data.teamsLocked === undefined ? false : data.teamsLocked,
        leaderboardLocked: data.leaderboardLocked === undefined ? false : data.leaderboardLocked,
        finalPredictionsEnabled: data.finalPredictionsEnabled === undefined ? false : data.finalPredictionsEnabled,
        userRegistrationEnabled: data.userRegistrationEnabled === undefined ? true : data.userRegistrationEnabled,
      };
    }
    // Default settings if the document doesn't exist
    return { 
      teamsLocked: false, 
      leaderboardLocked: false, 
      finalPredictionsEnabled: false, 
      userRegistrationEnabled: true, 
    };
  } catch (error) {
    console.error("Error fetching admin settings:", error);
    // Return default settings on error
    return { 
      teamsLocked: false, 
      leaderboardLocked: false, 
      finalPredictionsEnabled: false, 
      userRegistrationEnabled: true,
    };
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

    revalidatePath("/admin/settings");
    revalidatePath("/teams", "layout"); 
    revalidatePath("/nations", "layout"); 
    if (payload.finalPredictionsEnabled !== undefined) {
      revalidatePath("/teams/[teamId]/pronostici", "page");
    }
    if (payload.userRegistrationEnabled !== undefined) {
      revalidatePath("/components/auth/signup-form", "page"); 
      revalidatePath("/components/auth/auth-button", "page");
    }
    
    return { success: true, message: "Impostazioni admin aggiornate con successo." };
  } catch (error) {
    console.error("Errore durante l'aggiornamento delle impostazioni admin:", error);
    const errorMessage = error instanceof Error ? error.message : "Si è verificato un errore sconosciuto.";
    return { success: false, message: `Errore del server: ${errorMessage}` };
  }
}

export async function updateNationRankingAction(
  nationId: string,
  newRankingString?: string | null
): Promise<{ success: boolean; message: string; newRanking?: number }> {
  noStore(); 
  const isAdmin = await verifyAdminServerSide();
  if (!isAdmin) {
    return { success: false, message: "Non autorizzato.", newRanking: undefined };
  }

  try {
    let numericRanking: number | undefined = undefined;
    if (newRankingString && newRankingString.trim() !== "") {
      const parsed = parseInt(newRankingString.trim(), 10);
      if (!isNaN(parsed) && parsed > 0) {
        numericRanking = parsed;
      }
    }

    const nationRef = doc(db, NATIONS_COLLECTION, nationId);
    const rankingUpdate = numericRanking === undefined ? deleteField() : numericRanking;

    await updateDoc(nationRef, {
      ranking: rankingUpdate,
    });
    
    revalidatePath(`/nations/${nationId}`); 
    revalidatePath("/nations/ranking"); 
    revalidatePath("/teams/leaderboard"); 
    revalidatePath("/nations/trepposcore-ranking"); 
    
    return { success: true, message: `Ranking per ${nationId} aggiornato.`, newRanking: numericRanking };
  } catch (error) {
    console.error(`Errore durante l'aggiornamento del ranking per ${nationId}:`, error);
    const errorMessage = error instanceof Error ? error.message : "Si è verificato un errore sconosciuto.";
    return { success: false, message: `Errore del server: ${errorMessage}`, newRanking: undefined };
  }
}


export async function getLeaderboardLockedStatus(): Promise<boolean> {
    noStore();
    const settings = await getAdminSettingsAction();
    return settings.leaderboardLocked;
}

export async function getFinalPredictionsEnabledStatus(): Promise<boolean> {
  noStore();
  const settings = await getAdminSettingsAction();
  return settings.finalPredictionsEnabled;
}

export async function getUserRegistrationEnabledStatus(): Promise<boolean> {
  noStore();
  const settings = await getAdminSettingsAction();
  return settings.userRegistrationEnabled;
}

export async function checkIfAnyNationIsRankedAction(): Promise<boolean> {
  noStore();
  try {
    const nations = await getNations();
    if (nations.length === 0) {
      return false; 
    }
    return nations.every(nation => nation.ranking && nation.ranking > 0);
  } catch (error) {
    console.error("Error checking if all nations are ranked:", error);
    return false; 
  }
}

    