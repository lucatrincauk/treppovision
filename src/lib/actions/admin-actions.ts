
"use server";

import { auth, db } from "@/lib/firebase";
import type { AdminNationPayload } from "@/types";
import { doc, setDoc, getDoc, deleteDoc } from "firebase/firestore";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const NATIONS_COLLECTION = "nations";
const ADMIN_EMAIL = "lucatrinca.uk@gmail.com"; // Ensure this matches your auth context

async function verifyAdmin(): Promise<boolean> {
  // In a real app, this would be more robust, possibly checking custom claims
  // or a secure list of admin UIDs in Firestore.
  // For now, we check if the current session's user (if any) matches the admin email.
  // This is a simplified check and relies on Firebase Auth already being initialized server-side.
  // For server actions, direct access to `auth.currentUser` might not be reliable
  // without passing user info or using a session management library.
  // For this example, we'll assume this check is sufficient for a scaffold.
  // A more robust approach would involve getting the user from the session or a token.
  // For now, this function will be a placeholder for more secure admin verification.
  // This function is not directly callable by client, but by other server actions.
  // We'd ideally get the user from the session/auth state passed to the action.
  // As Firebase Admin SDK is not used here, we'll keep it simple and acknowledge limitations.
  
  // This is a placeholder for actual admin verification logic.
  // In a real app, you would get the authenticated user's claims or check their UID against a database.
  // For now, we'll return true to allow actions to proceed, assuming a proper check would be implemented.
  // If you have a way to get the current Firebase user session on the server action, you can use:
  // const user = auth.currentUser; // This might not work as expected in all server action contexts
  // return user?.email === ADMIN_EMAIL;

  // This simplified check is NOT secure for production.
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
    
    // The 'id' field from data is used as the document ID and also stored within the document.
    // If you don't want 'id' as a field inside the document, you can destructure it:
    // const { id, ...nationData } = data;
    // await setDoc(nationRef, nationData);
    // For simplicity, we'll store the id field within the document as well.
    await setDoc(nationRef, data);

    revalidatePath("/nations");
    revalidatePath(`/nations/${data.id}`);
    revalidatePath("/admin/nations/new");
    // No redirect here, form will handle it on success
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
    // The 'id' field from data is used as the document ID.
    // We update the document with all fields provided in data.
    await setDoc(nationRef, data, { merge: true }); // merge: true ensures we update or create if not exists (though it should exist for an update)

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
        revalidatePath(`/nations/${nationId}`); // To show it's gone
        // No redirect here, client might redirect after confirmation
        return { success: true, message: "Nazione eliminata con successo!" };
    } catch (error) {
        console.error("Errore durante l'eliminazione della nazione:", error);
        const errorMessage = error instanceof Error ? error.message : "Si è verificato un errore sconosciuto.";
        return { success: false, message: `Errore del server: ${errorMessage}` };
    }
}

