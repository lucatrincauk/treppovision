
"use server";

import { auth, db } from "@/lib/firebase";
import type { AdminNationPayload } from "@/types";
import { doc, setDoc, getDoc, deleteDoc, deleteField } from "firebase/firestore"; // Import deleteField
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const NATIONS_COLLECTION = "nations";
const ADMIN_EMAIL = "lucatrinca.uk@gmail.com"; // Ensure this matches your auth context

async function verifyAdmin(): Promise<boolean> {
  // This is a placeholder for actual admin verification logic.
  // In a real app, you would get the authenticated user's claims or check their UID against a database.
  // console.warn("Admin verification is simplified for this example. Implement robust checks for production.");
  return true; 
}


export async function addNationAction(
  data: AdminNationPayload
): Promise<{ success: boolean; message: string; nationId?: string }> {
  const isAdmin = await verifyAdmin();
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
  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    return { success: false, message: "Non autorizzato." };
  }

  try {
    const nationRef = doc(db, NATIONS_COLLECTION, data.id);
    
    // Prepare payload for Firestore, using deleteField() for undefined ranking
    const payloadForFirestore: { [key: string]: any } = { ...data };
    if (data.ranking === undefined) {
      payloadForFirestore.ranking = deleteField();
    }
    // If other fields were optional and could be undefined, and you wanted to remove them,
    // you'd apply similar logic. For now, only ranking is explicitly handled for removal.

    await setDoc(nationRef, payloadForFirestore, { merge: true });

    revalidatePath("/nations");
    revalidatePath(`/nations/${data.id}`);
    revalidatePath(`/admin/nations/${data.id}/edit`);
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
    const isAdmin = await verifyAdmin();
    if (!isAdmin) {
        return { success: false, message: "Non autorizzato." };
    }

    try {
        const nationRef = doc(db, NATIONS_COLLECTION, nationId);
        await deleteDoc(nationRef);

        revalidatePath("/nations");
        revalidatePath(`/nations/${nationId}`); 
        return { success: true, message: "Nazione eliminata con successo!" };
    } catch (error) {
        console.error("Errore durante l'eliminazione della nazione:", error);
        const errorMessage = error instanceof Error ? error.message : "Si è verificato un errore sconosciuto.";
        return { success: false, message: `Errore del server: ${errorMessage}` };
    }
}
