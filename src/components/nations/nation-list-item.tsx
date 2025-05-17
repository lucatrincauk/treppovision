
"use client";

import type { Nation } from "@/types";
import Image from "next/image";
import Link from "next/link";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Music2, UserSquare2 } from "lucide-react"; // Added Music2, UserSquare2
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface NationListItemProps {
  nation: Nation & { userAverageScore?: number | null };
}

export function NationListItem({ nation }: NationListItemProps) {
  const localThumbnailUrl = `/${nation.id}.jpg`;
  const fallbackFlagUrl = `https://flagcdn.com/w160/${nation.countryCode.toLowerCase()}.png`;

  const [imageUrl, setImageUrl] = useState(localThumbnailUrl);
  const [imageAlt, setImageAlt] = useState(`Miniatura ${nation.name}`);

  useEffect(() => {
    setImageUrl(localThumbnailUrl);
    setImageAlt(`Miniatura ${nation.name}`);
  }, [nation.id, localThumbnailUrl, nation.name]);

  const handleImageError = () => {
    if (imageUrl !== fallbackFlagUrl) {
      setImageUrl(fallbackFlagUrl);
      setImageAlt(`Bandiera ${nation.name}`);
    }
  };
  
  const rankBorderClass =
    nation.ranking === 1 ? "border-yellow-400 border-2 shadow-yellow-400/30" :
    nation.ranking === 2 ? "border-slate-400 border-2 shadow-slate-400/30" :
    nation.ranking === 3 ? "border-amber-500 border-2 shadow-amber-500/30" :
    "border-border group-hover:border-primary/50";

  return (
    <Link href={`/nations/${nation.id}`} className="group block h-full">
      <Card className={cn(
        "h-full flex flex-col overflow-hidden transition-all duration-300 ease-in-out group-hover:shadow-xl group-hover:scale-[1.02]",
        rankBorderClass
      )}>
        <CardHeader className="p-0 relative flex-grow">
          <div className="aspect-[3/2] w-full h-full relative">
            <Image
              src={imageUrl}
              alt={imageAlt}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
              className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-110"
              priority={['gb', 'fr', 'de', 'it', 'es', 'ch'].includes(nation.id) && imageUrl === fallbackFlagUrl}
              onError={handleImageError}
              data-ai-hint={imageUrl === fallbackFlagUrl ? `${nation.name} flag` : `${nation.name} thumbnail`}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/20 flex flex-col justify-end items-start p-3">
              <div> {/* Container for all text */}
                <CardTitle className="text-xl font-bold text-white drop-shadow-md flex items-center gap-2 mb-1">
                  <Image
                    src={`https://flagcdn.com/w20/${nation.countryCode.toLowerCase()}.png`}
                    alt={`Bandiera ${nation.name}`}
                    width={20}
                    height={13}
                    className="rounded-sm object-contain border border-white/20 shadow-sm"
                    data-ai-hint={`${nation.name} flag icon`}
                  />
                  <span>{nation.name}</span>
                </CardTitle>
                <div className="pl-0"> {/* Align artist/song under nation name text */}
                  <p className="text-sm text-white/90 drop-shadow-sm flex items-center gap-1" title={nation.artistName}>
                    <UserSquare2 className="w-3 h-3" />
                    <span>{nation.artistName}</span>
                  </p>
                  <p className="text-sm text-white/80 drop-shadow-sm flex items-center gap-1" title={nation.songTitle}>
                    <Music2 className="w-3 h-3" />
                    <span>{nation.songTitle}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>
    </Link>
  );
}
