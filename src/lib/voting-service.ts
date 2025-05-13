
"use client";
import type { Vote } from "@/types";

const VOTES_STORAGE_KEY = "treppoVotes";

export const getVotes = (): Vote[] => {
  if (typeof window === "undefined") return [];
  try {
    const storedVotes = localStorage.getItem(VOTES_STORAGE_KEY);
    return storedVotes ? JSON.parse(storedVotes) : [];
  } catch (error) {
    console.error("Error reading votes from localStorage:", error);
    return [];
  }
};

export const saveVote = (newVote: Vote): Vote[] => {
  if (typeof window === "undefined") return [];
  const votes = getVotes();
  // Remove previous vote by the same user for the same nation
  const updatedVotes = votes.filter(
    vote => !(vote.userId === newVote.userId && vote.nationId === newVote.nationId)
  );
  updatedVotes.push(newVote);
  try {
    localStorage.setItem(VOTES_STORAGE_KEY, JSON.stringify(updatedVotes));
  } catch (error) {
    console.error("Error saving vote to localStorage:", error);
  }
  return updatedVotes;
};

export const getVotesForNation = (nationId: string): Vote[] => {
  const votes = getVotes();
  return votes.filter(vote => vote.nationId === nationId);
};

export const getUserVoteForNation = (nationId: string, userId: string): Vote | undefined => {
  const votes = getVotes();
  return votes.find(vote => vote.nationId === nationId && vote.userId === userId);
};
