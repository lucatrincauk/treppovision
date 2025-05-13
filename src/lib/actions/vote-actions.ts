
"use server";

import type { Vote } from "@/types";
import { revalidatePath } from "next/cache";

// This is a server action. In a real app, this would interact with a database.
// For this scaffold, we'll return data that the client can use to update localStorage.
// This is a bit of a hybrid approach for demonstration; ideally, server actions fully manage server state.

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
    return { success: false, message: "User not authenticated." };
  }

  if (
    submission.scores.song < 1 || submission.scores.song > 10 ||
    submission.scores.performance < 1 || submission.scores.performance > 10 ||
    submission.scores.outfit < 1 || submission.scores.outfit > 10
  ) {
    return { success: false, message: "Invalid scores. Must be between 1 and 10." };
  }
  
  const newVote: Vote = {
    ...submission,
    timestamp: Date.now(),
  };

  // In a real app, save 'newVote' to your database here.
  // For this example, we're indicating success and the client will handle localStorage.
  // We can revalidate paths if the data displayed on other pages changes.
  revalidatePath(`/nations/${submission.nationId}`);
  revalidatePath("/charts");

  return { success: true, message: "Vote submitted successfully!", vote: newVote };
}
