
"use client";

import type { Nation } from "@/types";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Music2, UserSquare2, Award } from "lucide-react";
import { useState, useEffect } from "react";

interface NationListItemProps {
  nation: Nation;
}

export function NationListItem({ nation }: NationListItemProps) {
  const localThumbnailUrl = `/${nation.id}.jpg`; // Assumes images like /es.jpg, /it.jpg are in the public folder
  const fallbackFlagUrl = `https://flagcdn.com/w160/${nation.countryCode.toLowerCase()}.png`;

  const [imageUrl, setImageUrl] = useState(localThumbnailUrl);
  const [imageAlt, setImageAlt] = useState(`Miniatura ${nation.name}`);

  // Effect to reset to local thumbnail if the nation prop changes.
  // This is important if the component is re-used in a list where keys might not force a full remount.
  useEffect(() => {
    setImageUrl(localThumbnailUrl);
    setImageAlt(`Miniatura ${nation.name}`);
  }, [nation.id, localThumbnailUrl]);

  const handleImageError = () => {
    // If the local thumbnail fails to load, switch to the fallback flag URL.
    // Check imageUrl to prevent infinite loop if fallbackFlagUrl also somehow errors,
    // though very unlikely for flagcdn.
    if (imageUrl !== fallbackFlagUrl) {
      setImageUrl(fallbackFlagUrl);
      setImageAlt(`Bandiera ${nation.name}`);
    }
  };

  return (
    <Link href={`/nations/${nation.id}`} className="group">
      <Card className="h-full flex flex-col overflow-hidden transition-all duration-300 ease-in-out group-hover:shadow-xl group-hover:border-primary/50 group-hover:scale-[1.02]">
        <CardHeader className="p-0 relative">
          <div className="aspect-[3/2] w-full relative">
            <Image
              src={imageUrl}
              alt={imageAlt}
              width={160} // Intrinsic width for next/image optimization for the 3:2 container
              height={107} // Intrinsic height for next/image optimization for the 3:2 container
              className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-110"
              priority={['gb', 'fr', 'de', 'it', 'es', 'ch'].includes(nation.id) && imageUrl === fallbackFlagUrl} // Prioritize founder flags if it's the fallback
              onError={handleImageError}
              data-ai-hint={imageUrl === fallbackFlagUrl ? `${nation.name} flag` : `${nation.name} thumbnail`}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
            <CardTitle className="absolute bottom-3 left-4 text-xl font-bold text-white drop-shadow-md flex items-center gap-2">
              <Image
                src={`https://flagcdn.com/w20/${nation.countryCode.toLowerCase()}.png`}
                alt={`Bandiera ${nation.name}`}
                width={20}
                height={13} // Approximate height for a 20px wide flag
                className="rounded-sm object-contain border border-white/20 shadow-sm"
                data-ai-hint={`${nation.name} flag icon`}
              />
              <span>{nation.name}</span>
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-4 flex-grow">
          <div className="space-y-2 text-sm">
            <p className="flex items-center text-muted-foreground">
              <Music2 className="w-4 h-4 mr-2 text-accent" />
              <span className="font-medium text-foreground truncate" title={nation.songTitle}>{nation.songTitle}</span>
            </p>
            <p className="flex items-center text-muted-foreground">
              <UserSquare2 className="w-4 h-4 mr-2 text-accent" />
              <span className="truncate" title={nation.artistName}>{nation.artistName}</span>
            </p>
            {nation.ranking && nation.ranking > 0 && (
              <p className="flex items-center text-muted-foreground">
                <Award className="w-4 h-4 mr-2 text-accent" />
                <span className="font-medium text-foreground">Posizione: {nation.ranking}</span>
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter className="p-4 pt-0">
          <Button variant="outline" size="sm" className="w-full group-hover:bg-accent group-hover:text-accent-foreground">
            Vedi Dettagli <ArrowRight className="w-4 h-4 ml-2 transition-transform duration-300 group-hover:translate-x-1" />
          </Button>
        </CardFooter>
      </Card>
    </Link>
  );
}
