
"use client";

import type { Nation, Vote } from "@/types";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { NationList } from "@/components/nations/nation-list";
import { Search, EyeOff, Eye, Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { getAllUserVotes } from "@/lib/voting-service";

interface NationsDisplayClientProps {
  initialNations: Nation[];
  listTitle: string;
}

export function NationsDisplayClient({ initialNations, listTitle }: NationsDisplayClientProps) {
  const { user, isLoading: authLoading } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredNations, setFilteredNations] = useState<Nation[]>(initialNations);
  const [hideVotedNations, setHideVotedNations] = useState(false);
  const [userVotesMap, setUserVotesMap] = useState<Map<string, Vote | null>>(new Map());
  const [isLoadingUserVotes, setIsLoadingUserVotes] = useState(false);

  useEffect(() => {
    // Ensure initialNations are set when the component mounts or initialNations prop changes
    setFilteredNations(initialNations);
  }, [initialNations]);

  useEffect(() => {
    if (authLoading) {
      setIsLoadingUserVotes(true);
      return;
    }
    if (user) {
      setIsLoadingUserVotes(true);
      getAllUserVotes(user.uid)
        .then(votes => {
          setUserVotesMap(votes);
        })
        .catch(error => {
          console.error("Error fetching user votes for filtering:", error);
          setUserVotesMap(new Map()); // Clear on error
        })
        .finally(() => {
          setIsLoadingUserVotes(false);
        });
    } else {
      setUserVotesMap(new Map()); // Clear votes if user logs out
      setHideVotedNations(false); // Reset toggle if user logs out
      setIsLoadingUserVotes(false);
    }
  }, [user, authLoading]);

  useEffect(() => {
    let results = initialNations;

    // Apply search filter
    if (searchTerm) {
      const lowercasedSearchTerm = searchTerm.toLowerCase();
      results = results.filter(
        (nation) =>
          nation.name.toLowerCase().includes(lowercasedSearchTerm) ||
          nation.songTitle.toLowerCase().includes(lowercasedSearchTerm) ||
          nation.artistName.toLowerCase().includes(lowercasedSearchTerm)
      );
    }

    // Apply hide voted nations filter
    if (user && hideVotedNations && !isLoadingUserVotes) {
      results = results.filter(nation => !userVotesMap.has(nation.id));
    }

    setFilteredNations(results);
  }, [searchTerm, initialNations, hideVotedNations, user, userVotesMap, isLoadingUserVotes]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 my-4">
        <div className="relative w-full sm:max-w-lg">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Cerca nazioni, canzoni o artisti..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full"
            aria-label="Cerca nazioni"
          />
        </div>
        {user && !authLoading && (
          <div className="flex items-center space-x-2 self-center sm:self-end">
            {isLoadingUserVotes ? (
              <div className="flex items-center text-muted-foreground text-sm">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Caricamento voti...
              </div>
            ) : (
              <>
                <Switch
                  id="hide-voted-switch"
                  checked={hideVotedNations}
                  onCheckedChange={setHideVotedNations}
                  aria-label="Nascondi nazioni già votate"
                />
                <Label htmlFor="hide-voted-switch" className="cursor-pointer flex items-center">
                  {hideVotedNations ? <EyeOff className="mr-1.5 h-4 w-4" /> : <Eye className="mr-1.5 h-4 w-4" />}
                  Nascondi già votate
                </Label>
              </>
            )}
          </div>
        )}
      </div>

      {initialNations.length > 0 && filteredNations.length === 0 && searchTerm && (
        <p className="text-center text-muted-foreground py-10">
          Nessuna nazione trovata per "{searchTerm}".
        </p>
      )}
       {initialNations.length > 0 && filteredNations.length === 0 && hideVotedNations && !searchTerm && (
        <p className="text-center text-muted-foreground py-10">
          Hai votato per tutte le nazioni attualmente visibili.
        </p>
      )}
      
      {(filteredNations.length > 0 || (!searchTerm && initialNations.length > 0)) && (
         <NationList nations={filteredNations} title={listTitle} />
      )}
    </div>
  );
}
