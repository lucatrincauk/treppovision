
import { db } from "@/lib/firebase";
import type { Nation } from "@/types";
import { collection, getDocs, doc, getDoc, query, orderBy } from "firebase/firestore";

const NATIONS_COLLECTION = "nations";

export async function getNations(): Promise<Nation[]> {
  try {
    const nationsCollection = collection(db, NATIONS_COLLECTION);
    // Order by performingOrder, then by name as a secondary sort
    const q = query(nationsCollection, orderBy("performingOrder", "asc"), orderBy("name", "asc"));
    const nationSnapshot = await getDocs(q);
    const nationsList = nationSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Nation));
    return nationsList;
  } catch (error) {
    console.error("Error fetching nations:", error);
    return []; // Return empty array on error
  }
}

export async function getNationById(id: string): Promise<Nation | undefined> {
  try {
    const nationDocRef = doc(db, NATIONS_COLLECTION, id);
    const nationSnap = await getDoc(nationDocRef);
    if (nationSnap.exists()) {
      return { id: nationSnap.id, ...nationSnap.data() } as Nation;
    } else {
      console.warn(`Nation with ID ${id} not found.`);
      return undefined;
    }
  } catch (error) {
    console.error(`Error fetching nation with ID ${id}:`, error);
    return undefined;
  }
}
