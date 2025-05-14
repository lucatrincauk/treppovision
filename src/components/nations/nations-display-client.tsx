
"use client";

import type { Nation } from "@/types";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { NationList } from "@/components/nations/nation-list";
import { Search } from "lucide-react";

interface NationsDisplayClientProps {
  initialNations: Nation[];
  listTitle: string;
}

export function NationsDisplayClient({ initialNations, listTitle }: NationsDisplayClientProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredNations, setFilteredNations] = useState<Nation[]>(initialNations);

  useEffect(() => {
    // Ensure initialNations are set when the component mounts or initialNations prop changes
    setFilteredNations(initialNations);
  }, [initialNations]);

  useEffect(() => {
    if (!searchTerm) {
      setFilteredNations(initialNations);
      return;
    }

    const lowercasedSearchTerm = searchTerm.toLowerCase();
    const results = initialNations.filter(
      (nation) =>
        nation.name.toLowerCase().includes(lowercasedSearchTerm) ||
        nation.songTitle.toLowerCase().includes(lowercasedSearchTerm) ||
        nation.artistName.toLowerCase().includes(lowercasedSearchTerm)
    );
    setFilteredNations(results);
  }, [searchTerm, initialNations]);

  return (
    <div className="space-y-6">
      <div className="relative w-full max-w-lg mx-auto my-4">
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

      {initialNations.length > 0 && filteredNations.length === 0 && searchTerm && (
        <p className="text-center text-muted-foreground py-10">
          Nessuna nazione trovata per "{searchTerm}".
        </p>
      )}
      
      {(filteredNations.length > 0 || (!searchTerm && initialNations.length > 0)) && (
         <NationList nations={filteredNations} title={listTitle} />
      )}
    </div>
  );
}
