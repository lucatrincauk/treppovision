
"use client";

import type { TeamWithScore, Nation, NationGlobalCategorizedScores, GlobalPrimaSquadraDetail, GlobalCategoryPickDetail } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCircle, Edit, Music2, Star, ThumbsDown, Shirt, Lock, BadgeCheck, Award, ListOrdered, Loader2, Info, CheckCircle, Trophy } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth"; // Added this import
import { getTeamsLockedStatus } from "@/lib/actions/team-actions"; 
import { getLeaderboardLockedStatus } from "@/lib/actions/admin-actions";
import React, { useEffect, useState, useMemo, memo } from "react";
import { cn } from "@/lib/utils";

const MedalIcon = React.memo(({ rank, className }: { rank?: number, className?: string }) => {
  if (rank === undefined || rank === null || rank === 0 || rank > 3) return null;
  let colorClass = "";
  if (rank === 1) colorClass = "text-yellow-400";
  else if (rank === 2) colorClass = "text-slate-400";
  else if (rank === 3) colorClass = "text-amber-500";
  return <Award className={cn("w-3.5 h-3.5 shrink-0", colorClass, className)} />;
});
MedalIcon.displayName = 'MedalIconLocal';

const PrimaSquadraNationDisplayDetailPodium = memo(({
  detail,
  leaderboardLockedAdmin,
  isEvenRow,
}: {
  detail: GlobalPrimaSquadraDetail;
  leaderboardLockedAdmin: boolean | null;
  isEvenRow?: boolean;
}) => {
  let rankText = "";
   const nationRank = detail.actualRank;

  if (!leaderboardLockedAdmin && nationRank && nationRank > 0) {
    rankText = `(${nationRank}°)`;
  }
  const titleText = `${detail.name}${rankText ? ` ${rankText}` : ''}${detail.artistName ? ` - ${detail.artistName}` : ''}${detail.songTitle ? ` - ${detail.songTitle}` : ''}${!leaderboardLockedAdmin && typeof detail.points === 'number' ? ` Punti: ${detail.points}`: ''}`;
  
  return (
     <div className={cn("flex items-center", isEvenRow ? "bg-muted/50 rounded-md" : "", "py-1.5")}>
       <div className="flex items-center gap-1.5 w-full">
        <div className="flex items-center shrink-0 w-5 h-5 mr-1.5">
          <BadgeCheck className="w-5 h-5 text-accent" />
        </div>
        <div className="flex items-center gap-1.5 flex-grow">
            {detail.countryCode ? (
            <Image
                src={`https://flagcdn.com/w20/${detail.countryCode.toLowerCase()}.png`}
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
                {!leaderboardLockedAdmin && nationRank && [1,2,3].includes(nationRank) && <MedalIcon rank={nationRank} />}
                {rankText && !leaderboardLockedAdmin && (
                <span className="text-muted-foreground/80 text-xs ml-0.5">{rankText}</span>
                )}
            </Link>
            {(!leaderboardLockedAdmin && (detail.artistName || detail.songTitle)) && (
                <span className="text-xs text-muted-foreground/80 block">
                {detail.artistName}{detail.artistName && detail.songTitle && " - "}{detail.songTitle}
                </span>
            )}
            </div>
        </div>
        {!leaderboardLockedAdmin && typeof detail.points === 'number' && (
            <span className={cn(
                "text-xs ml-auto pl-1 shrink-0 self-center", 
                detail.points > 0 ? "font-semibold text-primary" : detail.points < 0 ? "font-semibold text-destructive" : "font-medium text-muted-foreground"
            )}>
                {detail.points > 0 ? `+${detail.points}pt` : (detail.points === 0 ? "0pt" : `${detail.points}pt`)}
            </span>
        )}
       </div>
    </div>
  );
});
PrimaSquadraNationDisplayDetailPodium.displayName = 'PrimaSquadraNationDisplayDetailPodium';


const CategoryPickDisplayDetailPodium = memo(({
  detail,
  leaderboardLockedAdmin,
  isEvenRow,
}: {
  detail: GlobalCategoryPickDetail & { iconName: string; pickedNationCountryCode?: string; artistName?: string; songTitle?: string;};
  leaderboardLockedAdmin: boolean | null;
  isEvenRow?: boolean;
}) => {
  let IconComponent: React.ElementType;
  const iconColorClass = "text-accent";


  switch (detail.iconName) {
    case 'Award': IconComponent = Award; break;
    case 'Music2': IconComponent = Music2; break;
    case 'Star': IconComponent = Star; break;
    case 'Shirt': IconComponent = Shirt; break;
    case 'ThumbsDown': IconComponent = ThumbsDown; break;
    default: IconComponent = Info;
  }

  let rankSuffix = "";
   if (detail.categoryName === "Peggior TreppoScore") {
    rankSuffix = " peggiore";
   }
  
  const rankText = !leaderboardLockedAdmin && detail.actualCategoryRank && detail.actualCategoryRank > 0 
    ? `(${detail.actualCategoryRank}°${rankSuffix})`
    : "";

  const titleText = `${detail.categoryName}: ${detail.pickedNationName || 'N/D'}${rankText}${!leaderboardLockedAdmin && typeof detail.pointsAwarded === 'number' ? ` Punti: ${detail.pointsAwarded}`: ''}${!leaderboardLockedAdmin && typeof detail.pickedNationScoreInCategory === 'number' ? ` Media: ${detail.pickedNationScoreInCategory.toFixed(2)}` : ''}`;
  
  return (
    <div className={cn("py-1.5", isEvenRow && "bg-muted/50 rounded-md")}>
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-1.5">
          <IconComponent className={cn("h-5 w-5 shrink-0", iconColorClass)} />
          <span className="text-sm text-foreground/90 min-w-[120px] shrink-0 font-medium">
            {detail.categoryName}
          </span>
        </div>
        {typeof detail.pointsAwarded === 'number' && !leaderboardLockedAdmin && (
           <span
            className={cn(
              "text-xs shrink-0 ml-auto", 
              detail.pointsAwarded > 0 ? "font-semibold text-primary" :
              detail.pointsAwarded === 0 ? "text-muted-foreground font-medium" : 
              "font-semibold text-destructive"
            )}
          >
            {detail.pointsAwarded > 0 ? `+${detail.pointsAwarded}pt` : `${detail.pointsAwarded}pt`}
          </span>
        )}
      </div>

      <div className={cn("w-full mt-1", "pl-[calc(1.25rem+0.375rem)]")}>
        <div className="flex items-center gap-1.5">
            {detail.pickedNationCountryCode ? (
            <Image
                src={`https://flagcdn.com/w20/${detail.pickedNationCountryCode.toLowerCase()}.png`}
                alt={detail.pickedNationName || "Nazione"}
                width={20}
                height={13}
                className="rounded-sm border border-border/30 object-contain shrink-0"
                data-ai-hint={`${detail.pickedNationName} flag icon`}
            />
            ) : (
            <div className="w-5 h-[13px] shrink-0 bg-muted/20 rounded-sm"></div>
            )}
            <div className="flex flex-col items-start"> 
                <Link href={`/nations/${detail.pickedNationId || '#'}`}
                    className={cn("group text-xs hover:underline hover:text-primary flex items-center gap-0.5", !detail.pickedNationId && "pointer-events-none")}
                    title={titleText}
                >
                    <span className="font-medium">
                    {detail.pickedNationName || "Nessuna selezione"}
                    </span>
                    {!leaderboardLockedAdmin && detail.actualCategoryRank && [1,2,3].includes(detail.actualCategoryRank) && <MedalIcon rank={detail.actualCategoryRank}/>}
                    {rankText && !leaderboardLockedAdmin && detail.actualCategoryRank && detail.actualCategoryRank > 0 && (
                    <span className="text-muted-foreground/80 text-xs ml-0.5">
                        {rankText}
                    </span>
                    )}
                </Link>
                {(!leaderboardLockedAdmin && (detail.artistName || detail.songTitle)) && (
                  <span className="text-xs text-muted-foreground/80 block">
                    {detail.artistName}{detail.artistName && detail.songTitle && " - "}{detail.songTitle}
                  </span>
                )}
            </div>
        </div>
      </div>
    </div>
  );
});
CategoryPickDisplayDetailPodium.displayName = 'CategoryPickDisplayDetailPodium';


interface TeamListItemProps {
  team: TeamWithScore;
  allNations: Nation[]; 
  nationGlobalCategorizedScoresArray: [string, NationGlobalCategorizedScores][];
  isOwnTeamCard?: boolean;
  isLeaderboardPodiumDisplay?: boolean;
  disableEdit?: boolean;
}


const getRankTextColorPodium = (rank?: number) => {
  if (rank === undefined || rank === null || rank === 0 || rank > 3) return "text-muted-foreground";
  if (rank === 1) return "text-yellow-400";
  if (rank === 2) return "text-slate-400";
  if (rank === 3) return "text-amber-500";
  return "text-muted-foreground";
};

const getRankTextPodium = (rank?: number, isTied?: boolean): string => {
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


export function TeamListItem({
  team,
  allNations,
  nationGlobalCategorizedScoresArray = [], 
  isOwnTeamCard = false,
  isLeaderboardPodiumDisplay = false,
  disableEdit = false,
}: TeamListItemProps) {
  const { user } = useAuth();
  const [teamsLocked, setTeamsLocked] = useState<boolean | null>(null);
  const [leaderboardLockedAdmin, setLeaderboardLockedAdmin] = useState<boolean | null>(null);
  const [isLoadingAdminSettings, setIsLoadingAdminSettings] = useState(true);
  
  const [categoryRanksAndCorrectness, setCategoryRanksAndCorrectness] = useState<{
    [key: string]: { rank?: number | null; isCorrectPick?: boolean; categoryRankText?: string };
  }>({});

  const nationGlobalCategorizedScoresMap = useMemo(() => {
    if (nationGlobalCategorizedScoresArray && nationGlobalCategorizedScoresArray.length > 0) {
        return new Map(nationGlobalCategorizedScoresArray);
    }
    return new Map<string, NationGlobalCategorizedScores>();
  }, [nationGlobalCategorizedScoresArray]);

  const treppoScoreCategoriesConfig = useMemo(() => [
    { teamPickNationId: team.bestTreppoScoreNationId, Icon: Award, label: "Miglior TreppoScore", rankInfoKey: 'TreppoScore', categoryKey: 'overallAverageScore' as keyof NationGlobalCategorizedScores },
    { teamPickNationId: team.bestSongNationId, Icon: Music2, label: "Miglior Canzone", rankInfoKey: 'Music2', categoryKey: 'averageSongScore' as keyof NationGlobalCategorizedScores },
    { teamPickNationId: team.bestPerformanceNationId, Icon: Star, label: "Miglior Performance", rankInfoKey: 'Star', categoryKey: 'averagePerformanceScore' as keyof NationGlobalCategorizedScores },
    { teamPickNationId: team.bestOutfitNationId, Icon: Shirt, label: "Miglior Outfit", rankInfoKey: 'Shirt', categoryKey: 'averageOutfitScore' as keyof NationGlobalCategorizedScores },
    { teamPickNationId: team.worstTreppoScoreNationId, Icon: ThumbsDown, label: "Peggior TreppoScore", rankInfoKey: 'ThumbsDown', categoryKey: 'overallAverageScore' as keyof NationGlobalCategorizedScores },
  ], [team.bestTreppoScoreNationId, team.bestSongNationId, team.bestPerformanceNationId, team.bestOutfitNationId, team.worstTreppoScoreNationId]);


  const sortedFounderNationsDetails = useMemo(() => {
    if (!allNations || allNations.length === 0) return [];
    if (team.primaSquadraDetails && team.primaSquadraDetails.length > 0) {
      return [...team.primaSquadraDetails].sort((a, b) => (a.actualRank ?? Infinity) - (b.actualRank ?? Infinity));
    }
    return (team.founderChoices || []).map(id => {
        const nation = allNations.find(n => n.id === id);
        return {
            id,
            name: nation?.name || 'Sconosciuto',
            countryCode: nation?.countryCode || 'xx',
            artistName: nation?.artistName || undefined,
            songTitle: nation?.songTitle || undefined,
            actualRank: nation?.ranking,
            points: 0, 
        };
    }).sort((a, b) => (a.actualRank ?? Infinity) - (b.actualRank ?? Infinity));
  }, [team.primaSquadraDetails, team.founderChoices, allNations]);
  
  const treppoScorePicksForDisplay = useMemo(() => {
    if (!allNations || allNations.length === 0) {
      return treppoScoreCategoriesConfig.map(pick => ({
        ...pick,
        pickedNationId: pick.teamPickNationId || "",
        pickedNationName: undefined,
        pickedNationCountryCode: undefined,
        artistName: undefined,
        songTitle: undefined,
        actualCategoryRank: undefined,
        isCorrectPick: false,
        categoryRankText: undefined,
        pointsAwarded: 0,
        pickedNationScoreInCategory: null,
      }));
    }

    return treppoScoreCategoriesConfig.map(pick => {
      const nation = pick.teamPickNationId ? allNations.find(n => n.id === pick.teamPickNationId) : undefined;
      const rankInfo = categoryRanksAndCorrectness[pick.rankInfoKey] || {};
      const originalDetail = team.categoryPicksDetails?.find(d => d.categoryName === pick.label);
      const nationScores = pick.teamPickNationId && nationGlobalCategorizedScoresMap ? nationGlobalCategorizedScoresMap.get(pick.teamPickNationId) : undefined;
      
      let globalScoreForCategory: number | null = null;
      if (nationScores && pick.categoryKey) {
        const scoreValue = nationScores[pick.categoryKey];
        if (typeof scoreValue === 'number') {
            globalScoreForCategory = scoreValue;
        }
      }
      return {
        ...pick,
        pickedNationId: pick.teamPickNationId || "",
        pickedNationName: nation?.name,
        pickedNationCountryCode: nation?.countryCode,
        artistName: nation?.artistName,
        songTitle: nation?.songTitle,
        actualCategoryRank: rankInfo.rank,
        isCorrectPick: rankInfo.isCorrectPick ?? false,
        categoryRankText: rankInfo.categoryRankText,
        pointsAwarded: originalDetail?.pointsAwarded ?? 0,
        pickedNationScoreInCategory: globalScoreForCategory,
      };
    });
  }, [treppoScoreCategoriesConfig, categoryRanksAndCorrectness, allNations, nationGlobalCategorizedScoresMap, team.categoryPicksDetails]);
  

  useEffect(() => {
    async function fetchAdminSettings() {
      setIsLoadingAdminSettings(true);
      try {
        const [teamsLockStatus, lbLockedStatus] = await Promise.all([
          getTeamsLockedStatus(),
          getLeaderboardLockedStatus()
        ]);
        setTeamsLocked(teamsLockStatus);
        setLeaderboardLockedAdmin(lbLockedStatus);
      } catch (error) {
        console.error("Failed to fetch admin settings for TeamListItem:", error);
        setTeamsLocked(false);
        setLeaderboardLockedAdmin(false);
      } finally {
        setIsLoadingAdminSettings(false);
      }
    }
    fetchAdminSettings();
  }, []);

  useEffect(() => {
    if (nationGlobalCategorizedScoresMap && nationGlobalCategorizedScoresMap.size > 0 && allNations && allNations.length > 0) {
        const getSortedList = (categoryKeyToUse: keyof Omit<NationGlobalCategorizedScores, 'voteCount'>, order: 'asc' | 'desc') => {
          if (!allNations || allNations.length === 0) return [];
          return Array.from(nationGlobalCategorizedScoresMap.entries())
            .map(([nationId, scores]) => {
                const currentNation = allNations.find(n => n.id === nationId);
                return {
                id: nationId,
                name: currentNation?.name || 'Sconosciuto',
                score: scores[categoryKeyToUse]
              }
            })
            .filter(item => item.score !== null && (nationGlobalCategorizedScoresMap.get(item.id)?.voteCount || 0) > 0)
            .sort((a, b) => {
              if (a.score === null && b.score === null) return 0;
              if (a.score === null) return 1;
              if (b.score === null) return -1;
              if (a.score === b.score) {
                const voteCountA = nationGlobalCategorizedScoresMap.get(a.id)?.voteCount || 0;
                const voteCountB = nationGlobalCategorizedScoresMap.get(b.id)?.voteCount || 0;
                if (voteCountA !== voteCountB) {
                  return order === 'desc' ? voteCountB - voteCountA : voteCountA - voteCountB;
                }
                return a.name.localeCompare(b.name);
              }
              return order === 'desc' ? (b.score as number) - (a.score as number) : (a.score as number) - (b.score as number);
            });
        };

        const getRankAndText = (nationId?: string, sortedList?: Array<{ id: string }>, categoryName?: string): { rank?: number | null; categoryRankText?: string } => {
            if (!nationId || !sortedList || sortedList.length === 0) return { rank: undefined, categoryRankText: undefined };
            const rankIndex = sortedList.findIndex(n => n.id === nationId);
            const rank = rankIndex !== -1 ? rankIndex + 1 : undefined;

            let suffix = "";
            if (categoryName === "Peggior TreppoScore") {
                suffix = " peggiore";
            } else if (["Miglior Canzone", "Miglior Performance", "Miglior Outfit", "Miglior TreppoScore"].includes(categoryName || "")){
                // No suffix
            }
            return { rank, categoryRankText: rank ? `(${rank}°${suffix})` : undefined };
        };

        const newRanks: typeof categoryRanksAndCorrectness = {};

        const bestTreppoScoreNations = getSortedList('overallAverageScore', 'desc');
        if (team.bestTreppoScoreNationId) {
          const { rank, categoryRankText } = getRankAndText(team.bestTreppoScoreNationId, bestTreppoScoreNations, "Miglior TreppoScore");
          newRanks['TreppoScore'] = { rank, isCorrectPick: !leaderboardLockedAdmin && rank !== undefined && rank <= 3, categoryRankText };
        }

        const topSongNations = getSortedList('averageSongScore', 'desc');
        if (team.bestSongNationId) {
            const { rank, categoryRankText } = getRankAndText(team.bestSongNationId, topSongNations, "Miglior Canzone");
            newRanks['Music2'] = { rank, isCorrectPick: !leaderboardLockedAdmin && rank !== undefined && rank <= 3, categoryRankText };
        }
        
        const topPerfNations = getSortedList('averagePerformanceScore', 'desc');
        if (team.bestPerformanceNationId) {
            const { rank, categoryRankText } = getRankAndText(team.bestPerformanceNationId, topPerfNations, "Miglior Performance");
            newRanks['Star'] = { rank, isCorrectPick: !leaderboardLockedAdmin && rank !== undefined && rank <= 3, categoryRankText };
        }

        const topOutfitNations = getSortedList('averageOutfitScore', 'desc');
        if (team.bestOutfitNationId) {
            const { rank, categoryRankText } = getRankAndText(team.bestOutfitNationId, topOutfitNations, "Miglior Outfit");
            newRanks['Shirt'] = { rank, isCorrectPick: !leaderboardLockedAdmin && rank !== undefined && rank <= 3, categoryRankText };
        }
        
        const worstOverallScoreNations = getSortedList('overallAverageScore', 'asc');
        if (team.worstTreppoScoreNationId) {
            const { rank, categoryRankText } = getRankAndText(team.worstTreppoScoreNationId, worstOverallScoreNations, "Peggior TreppoScore");
            newRanks['ThumbsDown'] = { rank, isCorrectPick: !leaderboardLockedAdmin && rank !== undefined && rank <= 3, categoryRankText };
        }
        setCategoryRanksAndCorrectness(newRanks);
    } else {
         setCategoryRanksAndCorrectness({});
    }
  }, [nationGlobalCategorizedScoresMap, allNations, team, leaderboardLockedAdmin]);
  
  const hasTreppoScorePredictions = !!(team.bestSongNationId || team.bestPerformanceNationId || team.bestOutfitNationId || team.worstTreppoScoreNationId || team.bestTreppoScoreNationId);
  
  if (isLoadingAdminSettings || (!allNations && !isLeaderboardPodiumDisplay)) {
    return (
      <Card className={cn(
        "flex flex-col h-full shadow-lg p-4 items-center justify-center min-w-[280px]",
        isLeaderboardPodiumDisplay && !leaderboardLockedAdmin && team.rank && team.rank <=3 ?
          (team.rank === 1 ? "border-yellow-400 border-2 shadow-yellow-400/30" :
           team.rank === 2 ? "border-slate-400 border-2 shadow-slate-400/30" :
           "border-amber-500 border-2 shadow-amber-500/30")
        : "border-border"
      )}>
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground mt-2 text-xs">Caricamento dettagli team...</p>
      </Card>
    );
  }

  const borderClass =
    isLeaderboardPodiumDisplay && !leaderboardLockedAdmin && team.rank && team.rank <=3 ?
      (team.rank === 1 ? "border-yellow-400 border-2 shadow-yellow-400/30" :
       team.rank === 2 ? "border-slate-400 border-2 shadow-slate-400/30" :
       "border-amber-500 border-2 shadow-amber-500/30")
    : "border-border";


  const PodiumHeader = () => (
    <>
      <div className="flex flex-col space-y-0">
        <div className="flex items-baseline justify-between w-full">
          <div className="flex items-center gap-2 text-xl text-primary">
            <Users className="h-5 w-5 text-accent shrink-0" />
            <CardTitle className="text-xl">{team.name}</CardTitle>
          </div>
          {typeof team.score === 'number' && !leaderboardLockedAdmin && (
            <div className="text-2xl font-bold text-primary whitespace-nowrap ml-2 shrink-0">
              {team.score}pt
            </div>
          )}
        </div>
        <div className="flex items-baseline justify-between w-full text-xs">
          {team.creatorDisplayName && !isOwnTeamCard && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <UserCircle className="h-3 w-3" />
              <span>{team.creatorDisplayName}</span>
            </div>
          )}
          {!leaderboardLockedAdmin && team.rank && (
            <div className={cn("font-semibold flex items-center", getRankTextColorPodium(team.rank), (!team.creatorDisplayName || isOwnTeamCard) ? "ml-auto" : "")}>
              <MedalIcon rank={team.rank} className="mr-1" />
              {getRankTextPodium(team.rank, team.isTied)}
            </div>
          )}
        </div>
      </div>
    </>
  );
  
  const DefaultHeader = () => (
     <div className="flex flex-row justify-between items-start">
        <div className="flex-grow">
          <div className="flex items-center gap-2 text-xl text-primary">
            <Users className="h-5 w-5 text-accent" />
            <CardTitle className="text-xl">
                {team.name}
            </CardTitle>
             {team.creatorDisplayName && !isOwnTeamCard && (
              <span className="ml-1 text-xs text-muted-foreground flex items-center gap-1" title={`Utente: ${team.creatorDisplayName}`}>
                (<UserCircle className="h-3 w-3" />{team.creatorDisplayName})
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
            {typeof team.score === 'number' && !leaderboardLockedAdmin && (
                <div className="text-lg font-bold text-primary">
                    {team.score}pt
                </div>
            )}
        </div>
    </div>
  );
  
  const renderDetailedView = isLeaderboardPodiumDisplay || isOwnTeamCard;

  return (
    <Card className={cn(
      "flex flex-col h-full shadow-lg hover:shadow-primary/20 transition-shadow duration-300",
      borderClass
    )}>
      <CardHeader className={cn(
        "pt-4 px-4 pb-3", 
        isLeaderboardPodiumDisplay && "space-y-0",
        renderDetailedView && (team.primaSquadraDetails || hasTreppoScorePredictions || team.bonusCampionePronostici || team.bonusGranCampionePronostici || team.bonusEnPleinTop5) && "border-b border-border"
      )}>
        {isLeaderboardPodiumDisplay ? <PodiumHeader /> : <DefaultHeader />}
      </CardHeader>

      <CardContent className="flex-grow space-y-1 pt-3 pb-4 px-4">
        { renderDetailedView && allNations && allNations.length > 0 ? (
          <>
            <div className={cn("mb-[15px]", (hasTreppoScorePredictions || team.bonusCampionePronostici || team.bonusGranCampionePronostici || team.bonusEnPleinTop5) && "pb-3 border-b border-border")}>
              <div className="flex justify-between items-center mb-1">
                <p className="text-lg font-bold text-primary">
                  Pronostici TreppoVision
                </p>
                {typeof team.primaSquadraScore === 'number' && !leaderboardLockedAdmin && (
                  <span className={cn(
                    "text-sm font-semibold",
                    team.primaSquadraScore > 0 ? "text-primary" : team.primaSquadraScore < 0 ? "text-destructive" : "text-muted-foreground"
                  )}>
                    {team.primaSquadraScore >= 0 ? "+" : ""}{team.primaSquadraScore}pt
                  </span>
                )}
              </div>
              { (sortedFounderNationsDetails).map((detail, index) => (
                <PrimaSquadraNationDisplayDetailPodium
                  key={`${team.id}-${detail.id}-prima-detail-${index}`}
                  detail={detail}
                  leaderboardLockedAdmin={leaderboardLockedAdmin}
                  isEvenRow={index % 2 !== 0}
                />
              ))}
            </div>

            {(hasTreppoScorePredictions) && (
              <div className={cn("pt-0 mb-[15px]", (team.bonusCampionePronostici || team.bonusGranCampionePronostici || team.bonusEnPleinTop5) && "pb-3 border-b border-border")}>
                 <div className="flex justify-between items-center mb-1">
                  <p className="text-lg font-bold text-primary">
                    Pronostici TreppoScore
                  </p>
                  {typeof team.treppoScoreCategoryPicksScore === 'number' && !leaderboardLockedAdmin && (
                    <span className={cn(
                      "text-sm font-semibold",
                      team.treppoScoreCategoryPicksScore > 0 ? "text-primary" : team.treppoScoreCategoryPicksScore < 0 ? "text-destructive" : "text-muted-foreground"
                    )}>
                      {team.treppoScoreCategoryPicksScore >= 0 ? "+" : ""}{team.treppoScoreCategoryPicksScore}pt
                    </span>
                  )}
                </div>
                {treppoScorePicksForDisplay.map((detailConfig, index) => {
                   const detail = team.categoryPicksDetails?.find(d => d.categoryName === detailConfig.label);
                   if (!detail) return null; 
                   return (
                      <CategoryPickDisplayDetailPodium
                        key={`${team.id}-${detailConfig.label}-detail-${index}`}
                        detail={{...detail, ...detailConfig}} 
                        leaderboardLockedAdmin={leaderboardLockedAdmin}
                        isEvenRow={index % 2 !== 0}
                      />
                   )
                })}
              </div>
            )}

           {(team.bonusCampionePronostici || team.bonusGranCampionePronostici || team.bonusEnPleinTop5) && !leaderboardLockedAdmin && (
              <div className="pt-0">
                <div className="flex justify-between items-center mb-1">
                  <p className="text-lg font-bold text-primary"> 
                    Bonus
                  </p>
                  {typeof team.bonusTotalScore === 'number' && !leaderboardLockedAdmin && (
                    <span className={cn(
                      "text-sm font-semibold",
                      team.bonusTotalScore > 0 ? "text-primary" : "text-muted-foreground" 
                    )}>
                      {team.bonusTotalScore > 0 ? `+${team.bonusTotalScore}pt` : `${team.bonusTotalScore}pt`}
                    </span>
                  )}
                </div>
                {team.bonusGranCampionePronostici && (
                  <div className={cn("flex items-center justify-between px-2 py-1 text-xs")}>
                    <div className="flex items-center gap-1.5">
                      <Trophy className="w-5 h-5 text-yellow-500 shrink-0" />
                      <span className="font-medium text-foreground/90">Gran Campione di Pronostici</span>
                    </div>
                    <span className="font-semibold text-primary ml-auto">+30pt</span>
                  </div>
                )}
                {team.bonusCampionePronostici && !team.bonusGranCampionePronostici && (
                   <div className={cn("flex items-center justify-between px-2 py-1 text-xs", team.bonusGranCampionePronostici && "bg-muted/50 rounded-md")}>
                    <div className="flex items-center gap-1.5">
                      <Trophy className="w-5 h-5 text-yellow-500 shrink-0" />
                      <span className="font-medium text-foreground/90">Campione di Pronostici</span>
                    </div>
                    <span className="font-semibold text-primary ml-auto">+5pt</span>
                  </div>
                )}
                {team.bonusEnPleinTop5 && (
                   <div className={cn("flex items-center justify-between px-2 py-1 text-xs", 
                        ( (team.bonusGranCampionePronostici) || (team.bonusCampionePronostici && !team.bonusGranCampionePronostici) )
                         && "bg-muted/50 rounded-md")}>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                      <span className="font-medium text-foreground/90">En Plein Top 5</span>
                    </div>
                    <span className="font-semibold text-primary ml-auto">+30pt</span>
                  </div>
                )}
              </div>
            )}
          </>
        ) : ( 
          <> 
             <div className="mb-2">
                <p className="text-sm font-semibold text-primary">Pronostici TreppoVision</p>
                {(team.founderChoices || []).map((nationId, index) => {
                    const nation = allNations?.find(n => n.id === nationId);
                    if (!nation) return <div key={index} className="text-xs text-muted-foreground">Nazione non trovata</div>;
                    return (
                        <div key={nationId} className={cn("flex items-center gap-1.5 py-0.5 text-xs", index % 2 !== 0 && "bg-muted/50 rounded-md px-2")}>
                             <Image
                                src={`https://flagcdn.com/w20/${nation.countryCode.toLowerCase()}.png`}
                                alt={nation.name} width={20} height={13} className="rounded-sm border border-border/30 object-contain shrink-0"
                                data-ai-hint={`${nation.name} flag icon`}
                            />
                            <span>{nation.name}</span>
                            {!leaderboardLockedAdmin && nation.ranking && nation.ranking > 0 && (
                                <span className="text-muted-foreground/80 ml-0.5">({nation.ranking}°)</span>
                            )}
                        </div>
                    );
                })}
            </div>
            {hasTreppoScorePredictions && (
                <div>
                    <p className="text-sm font-semibold text-primary">Pronostici TreppoScore</p>
                     {treppoScorePicksForDisplay.map((pick, index) => {
                         const nation = pick.pickedNationId ? allNations?.find(n => n.id === pick.pickedNationId) : null;
                         return (
                             <div key={pick.label} className={cn("flex items-center gap-1.5 py-0.5 text-xs", index % 2 !== 0 && "bg-muted/50 rounded-md px-2")}>
                                 <pick.Icon className={cn("w-4 h-4 shrink-0", pick.isCorrectPick ? "text-accent" : "text-muted-foreground/80")} />
                                 <span className="font-medium min-w-[120px]">{pick.label}:</span>
                                 {nation ? (
                                     <>
                                        <Image
                                            src={`https://flagcdn.com/w20/${nation.countryCode.toLowerCase()}.png`}
                                            alt={nation.name} width={20} height={13} className="rounded-sm border border-border/30 object-contain shrink-0"
                                            data-ai-hint={`${nation.name} flag icon`}
                                        />
                                        <span>{nation.name}</span>
                                         {!leaderboardLockedAdmin && pick.categoryRankText && (
                                            <span className={cn("text-xs ml-0.5", pick.isCorrectPick ? "text-accent font-semibold" : "text-muted-foreground/80")}>
                                                {pick.categoryRankText}
                                            </span>
                                        )}
                                     </>
                                 ) : (
                                     <span className="text-muted-foreground">Nessuna selezione</span>
                                 )}
                             </div>
                         );
                     })}
                </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
