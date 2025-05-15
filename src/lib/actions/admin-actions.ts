
"use server";

import { auth, db } from "@/lib/firebase";
import type { AdminNationPayload, AdminSettings } from "@/types";
import { doc, setDoc, getDoc, deleteDoc, deleteField } from "firebase/firestore";
import { revalidatePath } from "next/cache";

const NATIONS_COLLECTION = "nations";
const ADMIN_SETTINGS_COLLECTION = "adminSettings";
const ADMIN_SETTINGS_DOC_ID = "config";

// Placeholder - in a real app, use Firebase Custom Claims or a secure roles system.
// This function is now only used internally by actions in this file.
// Client-side admin checks should use the isAdmin flag from AuthContext.
async function verifyAdminServerSide(): Promise<boolean> {
  // This check would be more robust if it verified a custom claim on the auth token
  // or checked against a secure list of admin UIDs in Firestore.
  // For now, it's a simplified placeholder.
  // console.warn("Admin verification in server actions is simplified. Implement robust checks for production.");
  return true; // Assume admin for server actions if they reach here after client checks.
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
    revalidatePath("/teams/leaderboard"); // Revalidate leaderboard
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
    revalidatePath("/teams/leaderboard"); // Revalidate leaderboard
    revalidatePath("/nations/ranking"); // Revalidate final ranking
    revalidatePath("/nations/trepposcore-ranking"); // Revalidate trepposcore ranking
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
        revalidatePath("/teams/leaderboard"); // Revalidate leaderboard
        revalidatePath("/nations/ranking");
        revalidatePath("/nations/trepposcore-ranking");
        return { success: true, message: "Nazione eliminata con successo!" };
    } catch (error) {
        console.error("Errore durante l'eliminazione della nazione:", error);
        const errorMessage = error instanceof Error ? error.message : "Si è verificato un errore sconosciuto.";
        return { success: false, message: `Errore del server: ${errorMessage}` };
    }
}

// Admin Settings Actions
export async function getAdminSettingsAction(): Promise<AdminSettings> {
  try {
    const settingsDocRef = doc(db, ADMIN_SETTINGS_COLLECTION, ADMIN_SETTINGS_DOC_ID);
    const docSnap = await getDoc(settingsDocRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        teamsLocked: data.teamsLocked === undefined ? false : data.teamsLocked, // Default to false
        leaderboardLocked: data.leaderboardLocked === undefined ? false : data.leaderboardLocked, // Default to false
      };
    }
    // Return default settings if document doesn't exist
    return { teamsLocked: false, leaderboardLocked: false };
  } catch (error) {
    console.error("Error fetching admin settings:", error);
    // Return default settings on error
    return { teamsLocked: false, leaderboardLocked: false };
  }
}

export async function updateAdminSettingsAction(
  payload: Partial<AdminSettings> // Accept partial updates
): Promise<{ success: boolean; message: string }> {
  const isAdmin = await verifyAdminServerSide(); // Ensure this check is robust in production
  if (!isAdmin) {
    return { success: false, message: "Non autorizzato." };
  }

  try {
    const settingsDocRef = doc(db, ADMIN_SETTINGS_COLLECTION, ADMIN_SETTINGS_DOC_ID);
    await setDoc(settingsDocRef, payload, { merge: true });
    revalidatePath("/admin/settings"); 
    revalidatePath("/teams"); 
    revalidatePath("/teams/[teamId]/edit", "layout"); 
    revalidatePath("/teams/leaderboard"); 
    revalidatePath("/components/teams/teams-sub-navigation"); // This won't directly revalidate a component, but revalidates pages that use it

    return { success: true, message: "Impostazioni admin aggiornate con successo." };
  } catch (error) {
    console.error("Errore durante l'aggiornamento delle impostazioni admin:", error);
    const errorMessage = error instanceof Error ? error.message : "Si è verificato un errore sconosciuto.";
    return { success: false, message: `Errore del server: ${errorMessage}` };
  }
}

export async function getLeaderboardLockedStatus(): Promise<boolean> {
    const settings = await getAdminSettingsAction();
    return settings.leaderboardLocked;
}
