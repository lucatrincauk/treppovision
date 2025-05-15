
"use server";

import type { Vote } from "@/types";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

interface VoteSubmission {
  nationId: string;
  userId: string;
  scores: {
    song: number;
    performance: number;
    outfit: number;
  };
}

export async function submitVoteAction(submission: VoteSubmission): Promise<{ success: boolean; message: string; vote?: Vote }> {
  if (!submission.userId) {
    return { success: false, message: "Utente non autenticato." };
  }

  if (
    submission.scores.song < 1 || submission.scores.song > 10 ||
    submission.scores.performance < 1 || submission.scores.performance > 10 ||
    submission.scores.outfit < 1 || submission.scores.outfit > 10
  ) {
    return { success: false, message: "Punteggi non validi. Devono essere tra 1 e 10." };
  }
  
  const newVote: Vote = {
    userId: submission.userId,
    nationId: submission.nationId,
    scores: submission.scores,
    timestamp: Date.now(), // Using client-side timestamp for consistency before Firestore's serverTimestamp is set
  };

  try {
    const voteDocRef = doc(db, "votes", `${submission.userId}_${submission.nationId}`);
    // We add serverTimestamp for reliable ordering/last updated, but keep client timestamp for immediate feedback if needed
    const dataToSave = { ...newVote, serverTimestamp: serverTimestamp() };
    await setDoc(voteDocRef, dataToSave);

    revalidatePath(`/nations/${submission.nationId}`);
    // revalidatePath("/charts"); // If you had a charts page

    return { success: true, message: "Voto inviato con successo!", vote: newVote };
  } catch (error) {
    console.error("Error saving vote to Firestore:", error);
    const errorMessage = error instanceof Error ? error.message : "Si è verificato un errore durante il salvataggio del voto.";
    return { success: false, message: errorMessage, vote: undefined };
  }
}

