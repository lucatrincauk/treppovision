
"use client";

import { getTeams, getTeamById } from "@/lib/team-service";
import { getNations } from "@/lib/nation-service";
import { getAllNationsGlobalCategorizedScores } from "@/lib/voting-service"; 
import type { Team, Nation, NationGlobalCategorizedScores, GlobalPrimaSquadraDetail, TeamWithScore as TeamWithScoreType } from "@/types";
import { TeamsSubNavigation } from "@/components/teams/teams-sub-navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, UserCircle, BarChartBig, Info, BadgeCheck, Music2, Star, Shirt, ThumbsDown, ThumbsUp, Award, TrendingUp, Lock as LockIcon, Loader2, Edit } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { TeamList } from "@/components/teams/team-list";
import { getAdminSettingsAction } from "@/lib/actions/admin-actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import React, { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { TeamListItem } from "@/components/teams/team-list-item";


interface CategoryPickDetail {
  categoryName: string;
  pickedNationId?: string;
  pickedNationName?: string;
  pickedNationCountryCode?: string;
  actualCategoryRank?: number;
  pickedNationScoreInCategory?: number | null;
  pointsAwarded: number;
  iconName: string; 
}

interface TeamWithScore extends TeamWithScoreType {
  primaSquadraDetails?: GlobalPrimaSquadraDetail[];
  categoryPicksDetails?: CategoryPickDetail[];
  bonusCampionePronostici?: boolean;
  bonusEnPleinTop5?: boolean;
  rank?: number;
  isTied?: boolean;
}

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

const getRankText = (rank?: number, isTied?: boolean): string => {
  if (rank === undefined || rank === null || rank <= 0) return "";
  let rankStr = "";
  switch (rank) {
    case 1: rankStr = "Primo Posto"; break;
    case 2: rankStr = "Secondo Posto"; break;
    case 3: rankStr = "Terzo Posto"; break;
    default: rankStr = `${rank}º Posto`;
  }
  return isTied ? `${rankStr}*` : rankStr;
};


const getTopNationsForCategory = (
  scoresMap: Map<string, NationGlobalCategorizedScores>,
  nationsMap: Map<string, Nation>,
  categoryKey: keyof Omit<NationGlobalCategorizedScores, 'voteCount'>,
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
  const [nationsMap, setNationsMap] = useState<Map<string, Nation>>(new Map());
  const [globalCategorizedScoresMap, setGlobalCategorizedScoresMap] = useState<Map<string, NationGlobalCategorizedScores>>(new Map());
  
  const globalCategorizedScoresArray = useMemo(() => Array.from(globalCategorizedScoresMap.entries()), [globalCategorizedScoresMap]);

  const [selectedTeamDetail, setSelectedTeamDetail] = useState<TeamWithScore | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

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

        const [fetchedTeams, fetchedNationsData, fetchedGlobalScoresMap] = await Promise.all([
          getTeams(),
          getNations(),
          getAllNationsGlobalCategorizedScores()
        ]);
        setAllNations(fetchedNationsData);
        const currentNationsMap = new Map(fetchedNationsData.map(nation => [nation.id, nation]));
        setNationsMap(currentNationsMap);
        setGlobalCategorizedScoresMap(fetchedGlobalScoresMap);
        
        const topSongNations = getTopNationsForCategory(fetchedGlobalScoresMap, currentNationsMap, 'averageSongScore', 'desc');
        const bestOverallScoreNations = getTopNationsForCategory(fetchedGlobalScoresMap, currentNationsMap, 'overallAverageScore', 'desc'); 
        const worstOverallScoreNations = getTopNationsForCategory(fetchedGlobalScoresMap, currentNationsMap, 'overallAverageScore', 'asc'); 
        const topPerformanceNations = getTopNationsForCategory(fetchedGlobalScoresMap, currentNationsMap, 'averagePerformanceScore', 'desc');
        const topOutfitNations = getTopNationsForCategory(fetchedGlobalScoresMap, currentNationsMap, 'averageOutfitScore', 'desc');

        let calculatedTeams: TeamWithScore[] = fetchedTeams.map(team => {
          let score = 0;
          const primaSquadraDetails: GlobalPrimaSquadraDetail[] = [];
          const categoryPicksDetails: CategoryPickDetail[] = [];
          let firstPlaceCategoryPicksCount = 0; 
          let bonusCampionePronostici = false;
          let bonusEnPleinTop5 = false;

          (team.founderChoices || []).forEach(nationId => {
            const nation = currentNationsMap.get(nationId);
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

          if (primaSquadraDetails.length === 3 && primaSquadraDetails.every(detail => detail.actualRank && detail.actualRank >= 1 && detail.actualRank <= 5)) {
            score += 30; 
            bonusEnPleinTop5 = true;
          }
          
          const bestPick = getCategoryPickPointsAndRank(team.bestTreppoScoreNationId, 
            bestOverallScoreNations);
          score += bestPick.points;
          if(bestPick.rank === 1) firstPlaceCategoryPicksCount++;
          categoryPicksDetails.push({
            categoryName: "Miglior TreppoScore", pickedNationId: team.bestTreppoScoreNationId || undefined, 
            pickedNationName: team.bestTreppoScoreNationId ? currentNationsMap.get(team.bestTreppoScoreNationId)?.name : undefined,
            pickedNationCountryCode: team.bestTreppoScoreNationId ? currentNationsMap.get(team.bestTreppoScoreNationId)?.countryCode : undefined,
            actualCategoryRank: bestPick.rank, pickedNationScoreInCategory: bestPick.score,
            pointsAwarded: bestPick.points, iconName: "ThumbsUp",
          });

          const bestSongPick = getCategoryPickPointsAndRank(team.bestSongNationId, topSongNations);
          score += bestSongPick.points;
          if (bestSongPick.rank === 1) firstPlaceCategoryPicksCount++;
          categoryPicksDetails.push({
            categoryName: "Miglior Canzone", pickedNationId: team.bestSongNationId || undefined, 
            pickedNationName: team.bestSongNationId ? currentNationsMap.get(team.bestSongNationId)?.name : undefined,
            pickedNationCountryCode: team.bestSongNationId ? currentNationsMap.get(team.bestSongNationId)?.countryCode : undefined,
            actualCategoryRank: bestSongPick.rank, pointsAwarded: bestSongPick.points, iconName: "Music2", pickedNationScoreInCategory: bestSongPick.score,
          });

          const bestPerformancePick = getCategoryPickPointsAndRank(team.bestPerformanceNationId, topPerformanceNations);
          score += bestPerformancePick.points;
          if (bestPerformancePick.rank === 1) firstPlaceCategoryPicksCount++;
          categoryPicksDetails.push({
            categoryName: "Miglior Performance", pickedNationId: team.bestPerformanceNationId || undefined,
            pickedNationName: team.bestPerformanceNationId ? currentNationsMap.get(team.bestPerformanceNationId)?.name : undefined,
            pickedNationCountryCode: team.bestPerformanceNationId ? currentNationsMap.get(team.bestPerformanceNationId)?.countryCode : undefined,
            actualCategoryRank: bestPerformancePick.rank, pointsAwarded: bestPerformancePick.points, iconName: "Star", pickedNationScoreInCategory: bestPerformancePick.score,
          });
          
          const bestOutfitPick = getCategoryPickPointsAndRank(team.bestOutfitNationId, topOutfitNations);
          score += bestOutfitPick.points;
          if (bestOutfitPick.rank === 1) firstPlaceCategoryPicksCount++;
          categoryPicksDetails.push({
            categoryName: "Miglior Outfit", pickedNationId: team.bestOutfitNationId || undefined,
            pickedNationName: team.bestOutfitNationId ? currentNationsMap.get(team.bestOutfitNationId)?.name : undefined,
            pickedNationCountryCode: team.bestOutfitNationId ? currentNationsMap.get(team.bestOutfitNationId)?.countryCode : undefined,
            actualCategoryRank: bestOutfitPick.rank, pointsAwarded: bestOutfitPick.points, iconName: "Shirt", pickedNationScoreInCategory: bestOutfitPick.score,
          });
          
          const worstPick = getCategoryPickPointsAndRank(team.worstSongNationId, worstOverallScoreNations);
          score += worstPick.points;
          if(worstPick.rank === 1) firstPlaceCategoryPicksCount++;
          categoryPicksDetails.push({
            categoryName: "Peggior TreppoScore", pickedNationId: team.worstSongNationId || undefined, 
            pickedNationName: team.worstSongNationId ? currentNationsMap.get(team.worstSongNationId)?.name : undefined,
            pickedNationCountryCode: team.worstSongNationId ? currentNationsMap.get(team.worstSongNationId)?.countryCode : undefined,
            actualCategoryRank: worstPick.rank, pickedNationScoreInCategory: worstPick.score,
            pointsAwarded: worstPick.points, iconName: "ThumbsDown",
          });
          
          if (firstPlaceCategoryPicksCount >= 2) {
            score += 5; 
            bonusCampionePronostici = true;
          }

          return { 
            ...team, 
            score, 
            primaSquadraDetails, 
            categoryPicksDetails,
            bonusCampionePronostici,
            bonusEnPleinTop5 
          };
        });

        calculatedTeams.sort((a, b) => {
          if (b.score === a.score) {
            return a.name.localeCompare(b.name);
          }
          return (b.score ?? -Infinity) - (a.score ?? -Infinity);
        });

        let currentRank = 1;
        for (let i = 0; i < calculatedTeams.length; i++) {
          if (i > 0 && (calculatedTeams[i].score ?? -Infinity) < (calculatedTeams[i-1].score ?? -Infinity)) {
            currentRank = i + 1;
          }
          calculatedTeams[i].rank = currentRank;
        }

        for (let i = 0; i < calculatedTeams.length; i++) {
          let isTiedValue = false;
          if (i > 0 && calculatedTeams[i].rank === calculatedTeams[i - 1].rank && calculatedTeams[i].score === calculatedTeams[i-1].score) {
            isTiedValue = true;
          }
          if (i < calculatedTeams.length - 1 && calculatedTeams[i].rank === calculatedTeams[i + 1].rank && calculatedTeams[i].score === calculatedTeams[i+1].score) {
            isTiedValue = true;
          }
          calculatedTeams[i].isTied = isTiedValue;
        }

        setTeamsWithScores(calculatedTeams);

      } catch (error) {
        console.error("Error fetching leaderboard data:", error);
        setTeamsWithScores([]);
        setAllNations([]);
        setNationsMap(new Map());
        setGlobalCategorizedScoresMap(new Map());
      } finally {
        setIsLoadingData(false);
        setIsLoadingSettings(false);
      }
    }
    fetchPageData();
  }, []);

  const podiumTeams = useMemo(() => teamsWithScores.filter(team => (team.rank ?? Infinity) <= 3), [teamsWithScores]);
  
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
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
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
  
  const MedalIconTable = React.memo(({ rank }: { rank?: number }) => {
    if (rank === undefined || rank === null || rank === 0 || rank > 3) return null;
    let colorClass = "";
    if (rank === 1) colorClass = "text-yellow-400";
    else if (rank === 2) colorClass = "text-slate-400";
    else if (rank === 3) colorClass = "text-amber-500";
    return <Award className={cn("w-4 h-4 inline-block mr-1", colorClass)} />;
  });
  MedalIconTable.displayName = 'MedalIconTable';

  const PrimaSquadraNationDisplay = React.memo(({ detail }: { detail: GlobalPrimaSquadraDetail }) => {
    const nationData = nationsMap.get(detail.id);
    const rankText = !adminSettings?.leaderboardLocked && detail.actualRank && detail.actualRank > 0
      ? `(${detail.actualRank}°)`.trim()
      : "";
    const titleText = `${detail.name}${rankText ? ` ${rankText}` : ''}${nationData?.artistName ? ` - ${nationData.artistName}` : ''}${nationData?.songTitle ? ` - ${nationData.songTitle}` : ''}${!adminSettings?.leaderboardLocked && typeof detail.points === 'number' ? ` Punti: ${detail.points}`: ''}`;
    
    const MedalIcon = React.memo(({ rank, className }: { rank?: number, className?: string }) => {
      if (rank === undefined || rank === null || rank === 0 || rank > 3) return null;
      let colorClass = "";
      if (rank === 1) colorClass = "text-yellow-400";
      else if (rank === 2) colorClass = "text-slate-400";
      else if (rank === 3) colorClass = "text-amber-500";
      return <Award className={cn("w-3.5 h-3.5 shrink-0", colorClass, className)} />;
    });
    MedalIcon.displayName = 'MedalIconEuroRank';


    return (
      <div className={cn(
        "px-2 py-1 w-full"
      )}>
        <div className="flex items-center"> 
          <BadgeCheck className="w-5 h-5 text-accent shrink-0 mr-1.5" />
          <div className="flex items-center gap-1.5 flex-grow"> 
            {nationData?.countryCode ? (
                <Image
                    src={`https://flagcdn.com/w20/${nationData.countryCode.toLowerCase()}.png`}
                    alt={detail.name}
                    width={20}
                    height={13}
                    className="rounded-sm border border-border/30 object-contain shrink-0"
                    data-ai-hint={`${detail.name} flag icon`}
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
                    <span className="font-medium">{detail.name}</span>
                    {!adminSettings?.leaderboardLocked && <MedalIcon rank={detail.actualRank} className="ml-0.5" />}
                    {rankText && !adminSettings?.leaderboardLocked && (
                    <span className="text-muted-foreground text-xs ml-0.5">{rankText}</span>
                    )}
                </Link>
            </div>
          </div>
        </div>
        {!adminSettings?.leaderboardLocked && typeof detail.points === 'number' && (
          <div className={cn(
            "text-xs ml-auto pl-1 shrink-0 self-center text-right", 
             "pl-[calc(1.25rem+0.375rem)]" 
          )}>
            <span className={cn(
                 detail.points > 0 ? "font-semibold text-primary" : detail.points < 0 ? "font-semibold text-destructive" : "text-muted-foreground"
            )}>
              {detail.points > 0 ? `+${detail.points}pt` : `${detail.points}pt`}
            </span>
          </div>
        )}
      </div>
    );
  });
  PrimaSquadraNationDisplay.displayName = 'PrimaSquadraNationDisplay';


const CategoryPickDisplay = React.memo(({ detail }: { detail: CategoryPickDetail }) => {
    let IconComponent: React.ElementType;
    const iconColorClass = "text-accent";
  
    switch (detail.iconName) {
      case 'Award': IconComponent = Award; break;
      case 'Music2': IconComponent = Music2; break;
      case 'Star': IconComponent = Star; break;
      case 'Shirt': IconComponent = Shirt; break;
      case 'ThumbsDown': IconComponent = ThumbsDown; break;
      case 'ThumbsUp': IconComponent = ThumbsUp; break;
      default: IconComponent = Info;
    }
  
    const pickedNationFullDetails = detail.pickedNationId ? nationsMap.get(detail.pickedNationId) : undefined;
    
    let rankSuffix = "";
    if (detail.categoryName === "Peggior TreppoScore") {
      rankSuffix = " peggiore";
    }
    
    const rankText = !adminSettings?.leaderboardLocked && detail.actualCategoryRank && detail.actualCategoryRank > 0
      ? `(${detail.actualCategoryRank}º${rankSuffix})`
      : "";

    const titleText = `${detail.categoryName}: ${pickedNationFullDetails?.name || 'N/D'}${rankText}${!adminSettings?.leaderboardLocked && typeof detail.pointsAwarded === 'number' ? ` Punti: ${detail.pointsAwarded}`: ''}`;
    
    const CategoryMedalIcon = React.memo(({ rank }: { rank?: number }) => {
        if (rank === undefined || rank === null || rank === 0 || rank > 3) return null;
        let colorClass = "";
        if (rank === 1) colorClass = "text-yellow-400";
        else if (rank === 2) colorClass = "text-slate-400";
        else if (rank === 3) colorClass = "text-amber-500";
        return <Award className={cn("w-3.5 h-3.5 inline-block ml-0.5", colorClass)} />;
    });
    CategoryMedalIcon.displayName = 'CategoryMedalIcon';
  
    return (
     <div className={cn(
      "px-2 py-1.5"
    )}>
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-1.5">
          <IconComponent className={cn("w-4 h-4 flex-shrink-0", iconColorClass)} />
          <span className="text-xs text-foreground/90 min-w-[120px] shrink-0 font-medium">{detail.categoryName}</span>
        </div>
        {!adminSettings?.leaderboardLocked && typeof detail.pointsAwarded === 'number' && (
          <span className={cn("text-xs ml-auto pl-1 shrink-0", detail.pointsAwarded > 0 ? "font-semibold text-primary" : (detail.pointsAwarded === 0 ? "text-muted-foreground" : "font-semibold text-destructive"))}>
            {detail.pointsAwarded > 0 ? `+${detail.pointsAwarded}pt` : `${detail.pointsAwarded}pt`}
          </span>
        )}
      </div>

      <div className={cn(
        "w-full mt-1",
        "pl-[calc(1rem+theme(spacing.1_5))]"
      )}>
        <div className="flex items-center gap-1.5"> 
          {pickedNationFullDetails?.countryCode ? (
            <Image
              src={`https://flagcdn.com/w20/${pickedNationFullDetails.countryCode.toLowerCase()}.png`}
              alt={pickedNationFullDetails.name}
              width={20}
              height={13}
              className="rounded-sm border border-border/30 object-contain shrink-0"
              data-ai-hint={`${pickedNationFullDetails.name} flag icon`}
            />
          ) : (
            <div className="w-5 h-[13px] shrink-0 bg-muted/20 rounded-sm"></div>
          )}
          <div className="flex flex-col items-start"> 
            <Link href={`/nations/${pickedNationFullDetails ? pickedNationFullDetails.id : '#'}`}
                className="group text-xs hover:underline hover:text-primary flex items-center gap-0.5"
                title={titleText}
            >
              <span className="font-medium">
                {pickedNationFullDetails ? pickedNationFullDetails.name : "Nessuna selezione"}
              </span>
              {!adminSettings?.leaderboardLocked && detail.actualCategoryRank && [1,2,3].includes(detail.actualCategoryRank) && <CategoryMedalIcon rank={detail.actualCategoryRank}/>}
              {rankText && !adminSettings?.leaderboardLocked && detail.actualCategoryRank && detail.actualCategoryRank > 0 && (
                <span className="text-muted-foreground text-xs ml-0.5">
                  {rankText}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>
    </div>
    );
  });
CategoryPickDisplay.displayName = 'CategoryPickDisplay';


  return (
    <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
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
        
        {isLoadingData ? (
             <div className="flex items-center justify-center py-10">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        ) : teamsWithScores.length === 0 ? (
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
                  isLeaderboardPodiumDisplay={true} 
                  disableListItemEdit={true} 
                />
              </section>
            )}

            {teamsWithScores.length > 0 && ( 
              <section className={podiumTeams.length > 0 ? "mt-12" : ""}>
                <h2 className="text-3xl font-bold tracking-tight mb-6 text-primary border-b-2 border-primary/30 pb-2">
                  Classifica Completa
                </h2>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                  <Info className="h-4 w-4" />
                  <span>Clicca sul nome di una squadra per vederne il dettaglio del punteggio in una nuova pagina.</span>
                </div>
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
                                  {!adminSettings?.leaderboardLocked && team.rank && <MedalIconTable rank={team.rank} />}
                                  <span className={cn(
                                      !adminSettings?.leaderboardLocked && team.rank && [1,2,3].includes(team.rank) && 
                                      (team.rank === 1 ? "text-yellow-400" : team.rank === 2 ? "text-slate-400" : "text-amber-500"),
                                      "font-semibold"
                                  )}>
                                      {team.rank}{team.isTied && "*"}
                                  </span>
                              </div>
                            </TableCell>
                            <TableCell className="align-top pt-4">
                               <Link href={`/teams/${team.id}/details`}
                                  className="text-left hover:text-primary group w-full"
                                >
                                  <div className="font-medium text-base group-hover:underline">
                                    {team.name}
                                  </div>
                                </Link>
                                {team.creatorDisplayName && (
                                    <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5" title={`Utente: ${team.creatorDisplayName}`}>
                                        <UserCircle className="h-3 w-3" />{team.creatorDisplayName}
                                    </div>
                                )}
                            </TableCell>
                            {!adminSettings?.leaderboardLocked && 
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
                    Il punteggio totale di una squadra è composto da:
                  </p>
                  <ul className="list-disc pl-5 mt-2 text-sm text-muted-foreground space-y-1">
                      <li>
                          <strong>Pronostici TreppoVision (3 Nazioni)</strong>: Punti basati sulla classifica finale Eurovision.
                          Sistema: 1°: +30pt, 2°: +25pt, 3°: +20pt, 4°: +18pt, 5°: +16pt, 6°: +14pt, 7°-10°: +12pt, 11°-12°: +10pt, 13°-24°: -5pt, 25°: -10pt, 26°: -15pt.
                          Nazioni senza ranking valido ottengono 0 punti.
                      </li>
                      <li>
                          <strong>Pronostici TreppoScore</strong>: Punti per aver indovinato le nazioni più (o meno, per "Peggior TreppoScore") votate dagli utenti nelle categorie Miglior TreppoScore, Miglior Canzone, Miglior Performance, e Miglior Outfit.
                          Per ogni categoria: 1° posto corretto: +15pt, 2°: +10pt, 3°: +5pt.
                      </li>
                      <li>
                          <strong>Bonus "Campione di Pronostici"</strong>: Un bonus di +5 punti viene assegnato se una squadra indovina il 1° posto in almeno due categorie dei "Pronostici TreppoScore".
                      </li>
                      <li>
                          <strong>Bonus "En Plein Top 5"</strong>: Un bonus di +30 punti viene assegnato se tutte e tre le nazioni scelte per "Pronostici TreppoVision" si classificano nelle prime 5 posizioni della classifica finale Eurovision.
                      </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
      </div>
      {selectedTeamDetail && (
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto p-0">
            <TeamListItem
                team={selectedTeamDetail}
                allNations={allNations}
                nationGlobalCategorizedScoresArray={globalCategorizedScoresArray}
                isLeaderboardPodiumDisplay={true}
                disableEdit={true}
                isOwnTeamCard={user?.uid === selectedTeamDetail.userId}
            />
        </DialogContent>
      )}
    </Dialog>
  );
}

