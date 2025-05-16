
"use client";

import { getTeams } from "@/lib/team-service";
import { getNations } from "@/lib/nation-service";
import { getAllNationsGlobalCategorizedScores } from "@/lib/voting-service"; 
import type { Team, Nation, NationGlobalCategorizedScores, GlobalPrimaSquadraDetail as GlobalPrimaSquadraDetailType, GlobalCategoryPickDetail as GlobalCategoryPickDetailType } from "@/types";
import { TeamsSubNavigation } from "@/components/teams/teams-sub-navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, UserCircle, BarChartBig, Info, BadgeCheck, Music2, Star, Shirt, ThumbsDown, Award, TrendingUp, Lock as LockIcon, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { TeamList } from "@/components/teams/team-list";
import { getAdminSettingsAction } from "@/lib/actions/admin-actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import React, { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";


const getPointsForRank = (rank?: number): number => {
  if (rank === undefined || rank === null || rank === 0) return 0;
  if (rank === 1) return 30;
  if (rank === 2) return 25;
  if (rank === 3) return 20;
  if (rank === 4) return 18;
  if (rank === 5) return 16;
  if (rank === 6) return 14;
  if (rank >= 7 && rank <= 10) return 12;
  if (rank >= 11 && rank <= 12) return 10;
  if (rank >= 13 && rank <= 24) return -5;
  if (rank === 25) return -10;
  if (rank === 26) return -15;
  
  return 0; 
};

const getRankText = (rank?: number): string => {
  if (rank === undefined || rank === null || rank <= 0) return "";
  switch (rank) {
    case 1: return "Primo Posto";
    case 2: return "Secondo Posto";
    case 3: return "Terzo Posto";
    case 4: return "Quarto Posto";
    case 5: return "Quinto Posto";
    case 6: return "Sesto Posto";
    case 7: return "Settimo Posto";
    case 8: return "Ottavo Posto";
    case 9: return "Nono Posto";
    case 10: return "Decimo Posto";
    default: return `${rank}° Posto`;
  }
};

interface TeamWithScore extends Team {
  score: number;
  rank?: number;
  primaSquadraDetails: GlobalPrimaSquadraDetailType[];
  categoryPicksDetails: GlobalCategoryPickDetailType[];
  isTied?: boolean;
}

const getTopNationsForCategory = (
  scoresMap: Map<string, NationGlobalCategorizedScores>,
  nationsMap: Map<string, Nation>,
  categoryKey: 'averageSongScore' | 'averagePerformanceScore' | 'averageOutfitScore',
  sortOrder: 'desc' | 'asc' = 'desc'
): Array<{ id: string; name: string; score: number | null }> => { 
  if (!scoresMap || scoresMap.size === 0 || !nationsMap || nationsMap.size === 0) return [];
  return Array.from(scoresMap.entries())
    .map(([nationId, scores]) => ({
      id: nationId,
      name: nationsMap.get(nationId)?.name || 'Sconosciuto',
      score: scores[categoryKey]
    }))
    .filter(item => item.score !== null && (scoresMap.get(item.id)?.voteCount || 0) > 0) 
    .sort((a, b) => {
      if (a.score === null && b.score === null) return 0;
      if (a.score === null) return 1; 
      if (b.score === null) return -1; 
      if (a.score === b.score) {
        const voteCountA = scoresMap.get(a.id)?.voteCount || 0;
        const voteCountB = scoresMap.get(b.id)?.voteCount || 0;
        if (voteCountA !== voteCountB) {
          return sortOrder === 'desc' ? voteCountB - voteCountA : voteCountA - voteCountB;
        }
        return a.name.localeCompare(b.name);
      }
      if (sortOrder === 'desc') {
        return (b.score as number) - (a.score as number);
      }
      return (a.score as number) - (b.score as number);
    });
};

const getCategoryPickPointsAndRank = (
  pickedNationId: string | undefined,
  sortedNationsForCategory: Array<{ id: string; name: string; score: number | null }> 
): { points: number; rank?: number; score?: number | null } => {
  if (!pickedNationId || sortedNationsForCategory.length === 0) return { points: 0, rank: undefined, score: null };
  
  const rankIndex = sortedNationsForCategory.findIndex(n => n.id === pickedNationId);
  const actualRank = rankIndex !== -1 ? rankIndex + 1 : undefined;
  const actualScore = actualRank !== undefined && rankIndex < sortedNationsForCategory.length ? sortedNationsForCategory[rankIndex].score : null;

  let points = 0;
  if (actualRank === 1) points = 15;
  else if (actualRank === 2) points = 10;
  else if (actualRank === 3) points = 5;
  
  return { points, rank: actualRank, score: actualScore };
};


export default function TeamsLeaderboardPage() {
  const { user } = useAuth();
  const [adminSettings, setAdminSettings] = useState<Awaited<ReturnType<typeof getAdminSettingsAction>> | null>(null);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);

  const [teamsWithScores, setTeamsWithScores] = useState<TeamWithScore[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const [allNations, setAllNations] = useState<Nation[]>([]);
  const [globalCategorizedScoresMap, setGlobalCategorizedScoresMap] = useState<Map<string, NationGlobalCategorizedScores>>(new Map());
  
  const globalCategorizedScoresArray = useMemo(() => Array.from(globalCategorizedScoresMap.entries()), [globalCategorizedScoresMap]);

  useEffect(() => {
    async function fetchPageData() {
      setIsLoadingSettings(true);
      setIsLoadingData(true);
      try {
        const settings = await getAdminSettingsAction();
        setAdminSettings(settings);
        if (settings.leaderboardLocked) {
          setIsLoadingData(false);
          setIsLoadingSettings(false);
          setTeamsWithScores([]);
          setAllNations([]);
          setGlobalCategorizedScoresMap(new Map());
          return;
        }

        const [fetchedTeams, fetchedNations, fetchedGlobalScores] = await Promise.all([
          getTeams(),
          getNations(),
          getAllNationsGlobalCategorizedScores()
        ]);
        setAllNations(fetchedNations);
        setGlobalCategorizedScoresMap(fetchedGlobalScores);

        const nationsMap = new Map(fetchedNations.map(nation => [nation.id, nation]));
        const topSongNations = getTopNationsForCategory(fetchedGlobalScores, nationsMap, 'averageSongScore', 'desc');
        const bottomSongNations = getTopNationsForCategory(fetchedGlobalScores, nationsMap, 'averageSongScore', 'asc'); 
        const topPerformanceNations = getTopNationsForCategory(fetchedGlobalScores, nationsMap, 'averagePerformanceScore', 'desc');
        const topOutfitNations = getTopNationsForCategory(fetchedGlobalScores, nationsMap, 'averageOutfitScore', 'desc');

        let calculatedTeams: TeamWithScore[] = fetchedTeams.map(team => {
          let score = 0;
          const primaSquadraDetails: GlobalPrimaSquadraDetailType[] = [];
          const categoryPicksDetails: GlobalCategoryPickDetailType[] = [];

          (team.founderChoices || []).forEach(nationId => {
            const nation = nationsMap.get(nationId);
            if (nation) {
              const points = getPointsForRank(nation.ranking);
              score += points;
              primaSquadraDetails.push({
                id: nation.id,
                name: nation.name,
                countryCode: nation.countryCode,
                artistName: nation?.artistName,
                songTitle: nation?.songTitle,
                actualRank: nation.ranking,
                points,
              });
            }
          });

          primaSquadraDetails.sort((a, b) => {
            const rankA = a.actualRank ?? Infinity;
            const rankB = b.actualRank ?? Infinity;
            if (rankA === rankB) {
              return (a.name || '').localeCompare(b.name || '');
            }
            return rankA - rankB;
          });

          const bestSongPick = getCategoryPickPointsAndRank(team.bestSongNationId, topSongNations);
          score += bestSongPick.points;
          categoryPicksDetails.push({
            categoryName: "Miglior Canzone", pickedNationId: team.bestSongNationId, 
            pickedNationName: team.bestSongNationId ? nationsMap.get(team.bestSongNationId)?.name : undefined,
            pickedNationCountryCode: team.bestSongNationId ? nationsMap.get(team.bestSongNationId)?.countryCode : undefined,
            actualCategoryRank: bestSongPick.rank, pointsAwarded: bestSongPick.points, iconName: "Music2", pickedNationScoreInCategory: bestSongPick.score,
          });

          const bestPerformancePick = getCategoryPickPointsAndRank(team.bestPerformanceNationId, topPerformanceNations);
          score += bestPerformancePick.points;
          categoryPicksDetails.push({
            categoryName: "Miglior Performance", pickedNationId: team.bestPerformanceNationId,
            pickedNationName: team.bestPerformanceNationId ? nationsMap.get(team.bestPerformanceNationId)?.name : undefined,
            pickedNationCountryCode: team.bestPerformanceNationId ? nationsMap.get(team.bestPerformanceNationId)?.countryCode : undefined,
            actualCategoryRank: bestPerformancePick.rank, pointsAwarded: bestPerformancePick.points, iconName: "Star", pickedNationScoreInCategory: bestPerformancePick.score,
          });
          
          const bestOutfitPick = getCategoryPickPointsAndRank(team.bestOutfitNationId, topOutfitNations);
          score += bestOutfitPick.points;
          categoryPicksDetails.push({
            categoryName: "Miglior Outfit", pickedNationId: team.bestOutfitNationId,
            pickedNationName: team.bestOutfitNationId ? nationsMap.get(team.bestOutfitNationId)?.name : undefined,
            pickedNationCountryCode: team.bestOutfitNationId ? nationsMap.get(team.bestOutfitNationId)?.countryCode : undefined,
            actualCategoryRank: bestOutfitPick.rank, pointsAwarded: bestOutfitPick.points, iconName: "Shirt", pickedNationScoreInCategory: bestOutfitPick.score,
          });
          
          const worstSongPick = getCategoryPickPointsAndRank(team.worstSongNationId, bottomSongNations);
          score += worstSongPick.points;
          categoryPicksDetails.push({
            categoryName: "Peggior Canzone", pickedNationId: team.worstSongNationId,
            pickedNationName: team.worstSongNationId ? nationsMap.get(team.worstSongNationId)?.name : undefined,
            pickedNationCountryCode: team.worstSongNationId ? nationsMap.get(team.worstSongNationId)?.countryCode : undefined,
            actualCategoryRank: worstSongPick.rank, pickedNationScoreInCategory: worstSongPick.score,
            pointsAwarded: worstSongPick.points, iconName: "ThumbsDown",
          });

          return { ...team, score, primaSquadraDetails, categoryPicksDetails };
        });

        calculatedTeams.sort((a, b) => {
          if (b.score === a.score) {
            return a.name.localeCompare(b.name);
          }
          return b.score - a.score;
        });

        let currentRank = 1;
        for (let i = 0; i < calculatedTeams.length; i++) {
          if (i > 0 && calculatedTeams[i].score < calculatedTeams[i-1].score) {
            currentRank = i + 1;
          }
          calculatedTeams[i].rank = currentRank;
          
          let isTiedValue = false;
          if (i > 0 && calculatedTeams[i].rank === calculatedTeams[i-1].rank) {
            isTiedValue = true;
          }
          if (i < calculatedTeams.length - 1 && calculatedTeams[i].rank === calculatedTeams[i+1].rank) {
            isTiedValue = true;
          }
          calculatedTeams[i].isTied = isTiedValue;
        }
        setTeamsWithScores(calculatedTeams);

      } catch (error) {
        console.error("Error fetching leaderboard data:", error);
        setTeamsWithScores([]);
        setAllNations([]);
        setGlobalCategorizedScoresMap(new Map());
      } finally {
        setIsLoadingData(false);
        setIsLoadingSettings(false);
      }
    }
    fetchPageData();
  }, []);


  if (isLoadingSettings || isLoadingData || !adminSettings) {
    return (
      <div className="space-y-8">
        <TeamsSubNavigation />
        <header className="text-center sm:text-left space-y-2 mb-8">
          <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl text-primary flex items-center">
            <BarChartBig className="mr-3 h-10 w-10" />
            Classifica Squadre
          </h1>
          <p className="text-xl text-muted-foreground">
            Caricamento classifica...
          </p>
        </header>
         <div className="flex items-center justify-center py-10">
            <Loader2 className="mr-2 h-12 w-12 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (adminSettings.leaderboardLocked) {
    return (
      <div className="space-y-8">
        <TeamsSubNavigation />
        <Alert variant="destructive" className="max-w-lg mx-auto">
          <LockIcon className="h-4 w-4" />
          <AlertTitle>Classifica Bloccata</AlertTitle>
          <AlertDescription>
            L'amministratore ha temporaneamente bloccato l'accesso alla classifica squadre.
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  const podiumTeams = teamsWithScores.filter(team => (team.rank ?? Infinity) <= 3);


  const MedalIcon = ({ rank, className }: { rank?: number, className?: string }) => {
    if (rank === undefined || rank === null || rank === 0 || rank > 3) return null;
    let colorClass = "";
    if (rank === 1) colorClass = "text-yellow-400";
    else if (rank === 2) colorClass = "text-slate-400";
    else if (rank === 3) colorClass = "text-amber-500";
    return <Award className={cn("w-3.5 h-3.5 flex-shrink-0", colorClass, className)} />;
  };


  const PrimaSquadraNationDisplay = ({ detail }: { detail: GlobalPrimaSquadraDetailType }) => {
    const nationData = allNations.find(n => n.id === detail.id);
    const rankText = !adminSettings.leaderboardLocked && detail.actualRank && detail.actualRank > 0
      ? `(${detail.actualRank}°)`.trim()
      : "";
    const titleText = `${nationData?.name || 'Sconosciuto'}${rankText ? ` ${rankText}` : ''}${nationData?.artistName ? ` - ${nationData.artistName}` : ''}${nationData?.songTitle ? ` - ${nationData.songTitle}` : ''}${!adminSettings.leaderboardLocked && typeof detail.points === 'number' ? ` Punti: ${detail.points}`: ''}`;
  
    return (
      <div className={cn("px-2 py-1 flex items-start", detail.id ? "justify-between" : "justify-start")}>
        <div className="flex items-center gap-1.5">
          <BadgeCheck className="w-5 h-5 text-accent shrink-0 mr-1" />
          {nationData?.countryCode ? (
            <Image
              src={`https://flagcdn.com/w20/${nationData.countryCode.toLowerCase()}.png`}
              alt={nationData?.name || "Bandiera"}
              width={20}
              height={13}
              className="rounded-sm border border-border/30 object-contain shrink-0"
              data-ai-hint={`${nationData?.name} flag icon`}
            />
          ) : (
            <div className="w-5 h-[13px] shrink-0 bg-muted/20 rounded-sm"></div>
          )}
          <div className="flex flex-col items-start">
             <Link
                href={`/nations/${detail.id}`}
                className="group text-xs hover:underline hover:text-primary flex items-center gap-1"
                title={titleText}
              >
                <span className="font-medium">{nationData?.name || 'Sconosciuto'}</span>
                {!adminSettings.leaderboardLocked && <MedalIcon rank={detail.actualRank} className="ml-0.5" />}
                {!adminSettings.leaderboardLocked && rankText && (
                  <span className="text-muted-foreground text-xs ml-0.5">{rankText}</span>
                )}
              </Link>
              {(nationData?.artistName || nationData?.songTitle) && (
                <span className="text-xs text-muted-foreground/80 block">
                  {nationData.artistName}{nationData.artistName && nationData.songTitle && " - "}{nationData.songTitle}
                </span>
              )}
          </div>
        </div>
        {!adminSettings.leaderboardLocked && typeof detail.points === 'number' && (
          <span className={cn("text-xs ml-auto pl-1", detail.points > 0 ? "font-semibold text-primary" : detail.points < 0 ? "font-semibold text-destructive" : "text-muted-foreground")}>
            {detail.points > 0 ? `+${detail.points}pt` : `${detail.points}pt`}
          </span>
        )}
      </div>
    );
  };

  const CategoryPickDisplay = ({ detail }: { detail: GlobalCategoryPickDetailType }) => {
    let IconComponent: React.ElementType;
    const iconColorClass = "text-accent";
  
    switch (detail.iconName) {
      case 'Music2': IconComponent = Music2; break;
      case 'Star': IconComponent = Star; break;
      case 'Shirt': IconComponent = Shirt; break;
      case 'ThumbsDown': IconComponent = ThumbsDown; break;
      default: IconComponent = Info;
    }
  
    const pickedNationFullDetails = detail.pickedNationId ? allNations.find(n => n.id === detail.pickedNationId) : undefined;
    
    let rankSuffix = " in cat.";
    if (detail.categoryName === "Miglior Canzone") rankSuffix = "";
    else if (detail.categoryName === "Peggior Canzone") rankSuffix = " peggiore";
    
    const rankText = !adminSettings.leaderboardLocked && detail.actualCategoryRank && detail.actualCategoryRank > 0
      ? `(${detail.actualCategoryRank}°${rankSuffix})`.trim()
      : "";
    const titleText = `${detail.categoryName}: ${pickedNationFullDetails?.name || 'N/D'}${rankText}${!adminSettings.leaderboardLocked && typeof detail.pointsAwarded === 'number' ? ` Punti: ${detail.pointsAwarded}`: ''}`;
  
    return (
      <div className={cn("px-2 py-1")}>
        <div className="mt-1 pl-[calc(1rem+theme(spacing.1_5))]">
            <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-1.5">
                    <IconComponent className={cn("w-4 h-4 flex-shrink-0", iconColorClass)} />
                    <span className="text-xs text-foreground/90 min-w-[100px] shrink-0 font-medium">{detail.categoryName}</span>
                </div>
            {!adminSettings.leaderboardLocked && typeof detail.pointsAwarded === 'number' && detail.pointsAwarded !== 0 && (
                <span className={cn("text-xs ml-auto pl-1", detail.pointsAwarded > 0 ? "font-semibold text-primary" : "text-muted-foreground")}>
                {detail.pointsAwarded > 0 ? `+${detail.pointsAwarded}pt` : `${detail.pointsAwarded}pt`}
                </span>
            )}
            </div>

            <div className={cn(
                "w-full mt-1 pl-[calc(1rem+theme(spacing.1_5))]" 
            )}>
            {pickedNationFullDetails ? (
                <div className="flex items-center gap-1"> 
                    {pickedNationFullDetails.countryCode ? (
                    <Image
                        src={`https://flagcdn.com/w20/${pickedNationFullDetails.countryCode.toLowerCase()}.png`}
                        alt={pickedNationFullDetails.name}
                        width={20}
                        height={13}
                        className="rounded-sm border border-border/30 object-contain shrink-0"
                        data-ai-hint={`${pickedNationFullDetails.name} flag icon`}
                    />
                    ) : (
                    <div className="w-5 h-[13px] shrink-0 bg-muted/20 rounded-sm mr-1.5"></div>
                    )}
                    <div className="flex flex-col items-start"> 
                        <Link href={`/nations/${pickedNationFullDetails.id}`}
                            className={cn("group text-xs hover:underline hover:text-primary flex items-center gap-1")}
                            title={titleText}
                        >
                            <span className="font-medium">
                            {pickedNationFullDetails.name}
                            </span>
                            {!adminSettings.leaderboardLocked && detail.actualCategoryRank && [1,2,3].includes(detail.actualCategoryRank) && <MedalIcon rank={detail.actualCategoryRank} className="ml-0.5"/>}
                            {!adminSettings.leaderboardLocked && detail.actualCategoryRank && detail.actualCategoryRank > 0 && (
                                <span className="text-muted-foreground text-xs ml-0.5">{rankText}</span>
                            )}
                        </Link>
                    </div>
                </div>
            ) : (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <UserCircle className="h-4 w-4 shrink-0" />
                <span>Nessuna selezione</span>
                </div>
            )}
            </div>
        </div>
      </div>
    );
  };


  return (
    <div className="space-y-8">
      <TeamsSubNavigation />
      <header className="text-center sm:text-left space-y-2 mb-8">
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl text-primary flex items-center">
          <BarChartBig className="mr-3 h-10 w-10" />
          Classifica Squadre
        </h1>
        <p className="text-xl text-muted-foreground">
          Punteggi basati sulla classifica finale e sui pronostici degli utenti.
        </p>
      </header>

      {teamsWithScores.length === 0 ? (
        <div className="text-center text-muted-foreground py-10">
          <Trophy className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="text-lg">Nessuna squadra trovata o nessun punteggio calcolabile.</p>
          <p>Assicurati che le squadre siano state create e che le nazioni abbiano un ranking e voti utente.</p>
        </div>
      ) : (
        <>
          {podiumTeams.length > 0 && (
            <section className="mb-12">
              <h2 className="text-3xl font-bold tracking-tight mb-6 text-primary border-b-2 border-primary/30 pb-2">
                Il Podio delle Squadre
              </h2>
              <TeamList
                teams={podiumTeams}
                allNations={allNations}
                nationGlobalCategorizedScoresArray={globalCategorizedScoresArray}
                disableListItemEdit={true} 
                isLeaderboardPodiumDisplay={true}
              />
            </section>
          )}

          {teamsWithScores.length > 0 && ( 
             <section className={podiumTeams.length > 0 ? "mt-12" : ""}>
              <h2 className="text-3xl font-bold tracking-tight mb-6 text-primary border-b-2 border-primary/30 pb-2">
                Classifica Completa
              </h2>
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[80px] text-center">Pos.</TableHead>
                        <TableHead>Squadra</TableHead>
                        <TableHead className="text-right">Punteggio Totale</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {teamsWithScores.map((team) => (
                        <TableRow 
                            key={team.id}
                            className={cn(user && user.uid === team.userId && "bg-primary/10 hover:bg-primary/20 border-l-2 border-primary")}
                        >
                          <TableCell className="font-medium text-center align-top pt-4">
                            <div className="flex items-center justify-center">
                                {!adminSettings.leaderboardLocked && team.rank && [1,2,3].includes(team.rank) && <MedalIcon rank={team.rank} className="mr-1" />}
                                <span className={cn(
                                    !adminSettings.leaderboardLocked && team.rank && [1,2,3].includes(team.rank) && 
                                    (team.rank === 1 ? "text-yellow-400" : team.rank === 2 ? "text-slate-400" : "text-amber-500"),
                                    "font-semibold"
                                )}>
                                    {team.rank}{team.isTied && "*"}
                                </span>
                            </div>
                          </TableCell>
                          <TableCell className="align-top pt-4">
                              <div className="font-medium text-base">
                                {team.name}
                              </div>
                               {team.creatorDisplayName && (
                                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                                        <UserCircle className="h-3 w-3" />{team.creatorDisplayName}
                                    </div>
                                )}
                          </TableCell>
                          {!adminSettings.leaderboardLocked && 
                            <TableCell className="text-right font-semibold text-lg text-primary align-top pt-4">
                                {team.score}
                            </TableCell>
                          }
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </section>
          )}
        </>
      )}
      <Card className="mt-8 border-primary/20 bg-card/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-primary">Come Funziona il Punteggio?</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Il punteggio totale di una squadra è composto da due parti:
                </p>
                <ul className="list-disc pl-5 mt-2 text-sm text-muted-foreground space-y-1">
                    <li>
                        <strong>Pronostici TreppoVision (3 Nazioni)</strong>: Punti basati sulla classifica finale Eurovision.
                        Sistema: 1°: +30pt, 2°: +25pt, 3°: +20pt, 4°: +18pt, 5°: +16pt, 6°: +14pt, 7°-10°: +12pt, 11°-12°: +10pt, 13°-24°: -5pt, 25°: -10pt, 26°: -15pt.
                        Nazioni senza ranking valido ottengono 0 punti.
                    </li>
                    <li>
                        <strong>Pronostici TreppoScore</strong>: Punti per aver indovinato le nazioni più o meno votate dagli utenti nelle categorie Miglior Canzone, Miglior Performance, Miglior Outfit e Peggior Canzone.
                        Per ogni categoria (Migliore/Peggiore): 1° posto corretto: +15pt, 2°: +10pt, 3°: +5pt.
                    </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
    </div>
  );
}

