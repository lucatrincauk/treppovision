
"use client"; // This directive marks this as a Client Component

import { useState, useEffect } from "react";
import { getNationById, getNations } from "@/lib/nation-service";
import { YouTubeEmbed } from "@/components/nations/youtube-embed";
import { VotingForm } from "@/components/voting/voting-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import { Music2, UserSquare2, ChevronLeft, ChevronRight, Edit, Award, FileText, Info, ListOrdered, PlayCircle, ListMusic, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AdminNationControls } from "@/components/admin/admin-nation-controls";
import { cn } from "@/lib/utils";
import { NationDetailImage } from "@/components/nations/nation-detail-image";
import { UserVoteBadge } from "@/components/nations/user-vote-badge";
import { AllUsersAverageVoteBadge } from "@/components/nations/all-users-average-vote-badge";
import type { Nation } from "@/types";
import { useParams } from 'next/navigation'; // For client-side param changes

interface NationPageClientProps {
  initialNation: Nation;
  params: { id: string }; // Passed from server for initial consistency
}

export default function NationPageClient({ initialNation, params: serverParams }: NationPageClientProps) {
  const [nation, setNation] = useState<Nation | null>(initialNation);
  const [isLoading, setIsLoading] = useState<boolean>(!initialNation);
  const [voteUpdateTrigger, setVoteUpdateTrigger] = useState<number>(Date.now());

  const [allNations, setAllNations] = useState<Nation[]>([]);
  const [previousNation, setPreviousNation] = useState<Nation | null>(null);
  const [nextNation, setNextNation] = useState<Nation | null>(null);
  const [isLoadingAllNations, setIsLoadingAllNations] = useState(true);

  const clientParams = useParams();
  const currentNationId = typeof clientParams?.id === 'string' ? clientParams.id : serverParams.id;

  useEffect(() => {
    async function fetchAllNationsForNav() {
      setIsLoadingAllNations(true);
      try {
        const nationsList = await getNations(); // Assumes getNations() sorts by performingOrder
        setAllNations(nationsList);
      } catch (error) {
        console.error("Error fetching all nations for navigation:", error);
        setAllNations([]);
      }
      setIsLoadingAllNations(false);
    }
    fetchAllNationsForNav();
  }, []);

  useEffect(() => {
    if (initialNation && initialNation.id === currentNationId) {
      setNation(initialNation);
      setIsLoading(false);
    } else {
      async function fetchNation() {
        setIsLoading(true);
        const nationData = await getNationById(currentNationId);
        setNation(nationData || null);
        setIsLoading(false);
      }
      if (currentNationId) {
        fetchNation();
      }
    }
  }, [currentNationId, initialNation]);

  useEffect(() => {
    if (nation && allNations.length > 0) {
      const currentIndex = allNations.findIndex(n => n.id === nation.id);
      if (currentIndex !== -1) {
        setPreviousNation(currentIndex > 0 ? allNations[currentIndex - 1] : null);
        setNextNation(currentIndex < allNations.length - 1 ? allNations[currentIndex + 1] : null);
      } else {
        setPreviousNation(null);
        setNextNation(null);
      }
    } else {
      setPreviousNation(null);
      setNextNation(null);
    }
  }, [nation, allNations]);


  const handleVoteSuccess = () => {
    setVoteUpdateTrigger(Date.now());
  };

  if (isLoading || isLoadingAllNations || !nation) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <ListMusic className="w-24 h-24 text-primary animate-pulse mb-6" />
        <p className="text-xl text-muted-foreground">Caricamento dettagli nazione...</p>
      </div>
    );
  }
  
  const isPlaceholderVideo = nation.youtubeVideoId === 'dQw4w9WgXcQ';
  const youtubeThumbnailUrl = isPlaceholderVideo 
    ? `https://placehold.co/480x360.png`
    : `https://i.ytimg.com/vi/${nation.youtubeVideoId}/hqdefault.jpg`;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center mb-4">
        <Link href="/nations" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary">
          <ChevronLeft className="w-4 h-4 mr-1" />
          Torna all'Elenco Nazioni
        </Link>
        <AdminNationControls nationId={nation.id}>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href={`/admin/nations/${nation.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Modifica
              </Link>
            </Button>
          </div>
        </AdminNationControls>
      </div>

      {/* Next/Previous Nation Navigation */}
      <div className="flex justify-between items-center">
        {previousNation ? (
          <Button asChild variant="outline" size="sm">
            <Link href={`/nations/${previousNation.id}`} title={`Precedente: ${previousNation.name}`}>
              <ChevronLeft className="w-4 h-4 mr-2" />
              {previousNation.name}
            </Link>
          </Button>
        ) : (
          <Button variant="outline" size="sm" disabled>
            <ChevronLeft className="w-4 h-4 mr-2" />
            Precedente
          </Button>
        )}
        {nextNation ? (
          <Button asChild variant="outline" size="sm">
            <Link href={`/nations/${nextNation.id}`} title={`Successiva: ${nextNation.name}`}>
              {nextNation.name}
              <ChevronRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        ) : (
          <Button variant="outline" size="sm" disabled>
            Successiva
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>

      <header className="relative rounded-lg overflow-hidden shadow-2xl border border-border">
        <div className="absolute inset-0">
           <Image
            src={youtubeThumbnailUrl}
            alt={`Miniatura YouTube ${nation.name}`}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            style={{ objectFit: "cover" }}
            className="opacity-30 blur-sm scale-110"
            data-ai-hint={isPlaceholderVideo ? "music stage" : `youtube thumbnail ${nation.artistName}`}
          />
        </div>
        <div className="relative p-8 md:p-12 bg-gradient-to-tr from-background/90 via-background/70 to-transparent">
          <div className="flex flex-col md:flex-row items-start gap-6">
            <NationDetailImage 
              nationId={nation.id}
              nationName={nation.name}
              countryCode={nation.countryCode}
            />
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Image
                  src={`https://flagcdn.com/w40/${nation.countryCode.toLowerCase()}.png`}
                  alt={`Bandiera ${nation.name}`}
                  width={30}
                  height={20}
                  className="rounded-sm border border-white/30 shadow-sm object-contain"
                  data-ai-hint={`${nation.name} flag icon`}
                />
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-primary drop-shadow-sm">
                  {nation.name}
                </h1>
              </div>
              <div className="flex items-center space-x-2 mb-1">
                <Music2 className="w-5 h-5 text-accent" />
                <p className="text-xl md:text-2xl text-foreground font-semibold">{nation.songTitle}</p>
              </div>
              <div className="flex items-center space-x-2">
                <UserSquare2 className="w-5 h-5 text-accent" />
                <p className="text-lg text-foreground/80">{nation.artistName}</p>
              </div>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 items-center">
            <UserVoteBadge nationId={nation.id} refreshTrigger={voteUpdateTrigger} />
            <AllUsersAverageVoteBadge nationId={nation.id} />
            <Badge variant="outline" className="text-sm py-1 px-3">
              <ListOrdered className="w-3 h-3 mr-1.5" />
              Ordine Esibizione: {nation.performingOrder}
            </Badge>
            {nation.ranking && nation.ranking > 0 && (
              <Badge
                variant={ ![1,2,3].includes(nation.ranking) ? "outline" : undefined }
                className={cn(
                  "text-sm py-1 px-3",
                  nation.ranking === 1 && "bg-yellow-400 border-yellow-500 text-yellow-900 hover:bg-yellow-400/90 font-semibold",
                  nation.ranking === 2 && "bg-slate-300 border-slate-400 text-slate-900 hover:bg-slate-300/90 font-semibold",
                  nation.ranking === 3 && "bg-amber-400 border-amber-500 text-amber-900 hover:bg-amber-400/90 font-semibold"
                )}
              >
                <Award className="w-3 h-3 mr-1.5" />
                Posizione: {nation.ranking}°
                {nation.ranking === 1 && " (Vincitore!)"}
              </Badge>
            )}
          </div>
        </div>
      </header>
      
      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          {nation.songDescription && (
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl text-secondary flex items-center">
                  <Info className="w-5 h-5 mr-2" />
                  L'artista
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-line">{nation.songDescription}</p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-secondary flex items-center">
                <PlayCircle className="w-5 h-5 mr-2" />
                Guarda la Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <YouTubeEmbed videoId={nation.youtubeVideoId} title={`${nation.artistName} - ${nation.songTitle}`} />
            </CardContent>
          </Card>

          {nation.songLyrics && (
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl text-secondary flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Testo della Canzone
                </CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-sm text-muted-foreground whitespace-pre-line bg-muted/30 p-4 rounded-md font-mono overflow-x-auto">
                  {nation.songLyrics}
                </pre>
              </CardContent>
            </Card>
          )}
        </div>

        <div id="voting-form" className="md:col-span-1">
          <VotingForm nation={nation} onVoteSuccess={handleVoteSuccess} />
        </div>
      </div>
    </div>
  );
}
