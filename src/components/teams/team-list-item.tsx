
"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Users,
  UserCircle,
  Lock,
  BadgeCheck,
  Award,
  Loader2,
  Info,
  CheckCircle,
  Trophy,
  ChevronDown,
  Music2,
  Star,
  Shirt,
  ThumbsDown,
  Edit3,
  ListChecks,
  Flag,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { getTeamsLockedStatus } from "@/lib/actions/team-actions";
import { getLeaderboardLockedStatus, getFinalPredictionsEnabledStatus } from "@/lib/actions/admin-actions";
import React, { useEffect, useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import type {
  TeamWithScore,
  Nation,
  NationGlobalCategorizedScores,
  GlobalPrimaSquadraDetail,
  GlobalCategoryPickDetail,
} from "@/types";

// Define MedalIcon at the module level
const MedalIcon = React.memo(
  ({ rank, className }: { rank?: number; className?: string }) => {
    if (rank === undefined || rank === null || rank === 0 || rank > 3)
      return null;
    let colorClass = "";
    if (rank === 1) colorClass = "text-yellow-400";
    else if (rank === 2) colorClass = "text-slate-400";
    else if (rank === 3) colorClass = "text-amber-500";
    return <Award className={cn("w-4 h-4 shrink-0", colorClass, className)} />;
  }
);
MedalIcon.displayName = "MedalIcon";

const rankTextColorClass = (rank?: number) => {
  if (rank === undefined || rank === null || rank === 0 || rank > 3)
    return "text-muted-foreground";
  if (rank === 1) return "text-yellow-400";
  if (rank === 2) return "text-slate-400";
  if (rank === 3) return "text-amber-500";
  return "text-muted-foreground";
};

const getRankTextPodium = (rank?: number, isTied?: boolean): string => {
  if (rank === undefined || rank === null || rank <= 0) return "";
  let rankStr = "";
  switch (rank) {
    case 1:
      rankStr = "Primo Posto";
      break;
    case 2:
      rankStr = "Secondo Posto";
      break;
    case 3:
      rankStr = "Terzo Posto";
      break;
    default:
      rankStr = `${rank}° Posto`;
  }
  return isTied ? `${rankStr}*` : rankStr;
};

interface PrimaSquadraNationDisplayDetailPodiumProps {
  detail: GlobalPrimaSquadraDetail & { isEvenRow?: boolean };
  leaderboardLockedAdmin: boolean | null;
}

const PrimaSquadraNationDisplayDetailPodium: React.FC<PrimaSquadraNationDisplayDetailPodiumProps> = ({
  detail,
  leaderboardLockedAdmin,
}) => {
  const nationRank = detail.actualRank;
  const rankText =
    !leaderboardLockedAdmin && nationRank && nationRank > 0
      ? `(${nationRank}°) `
      : "";

  const titleText = `${detail.name || "Nazione Sconosciuta"} ${
    rankText ? `${rankText} ` : ""
  }${detail.artistName ? `- ${detail.artistName} ` : ""}${
    detail.songTitle ? `- ${detail.songTitle}` : ""
  }${
    !leaderboardLockedAdmin && typeof detail.points === "number"
      ? ` Punti: ${detail.points}`
      : ""
  }`;

  return (
    <div
      className={cn(
        "w-full flex items-center justify-between pl-2 py-1",
        detail.isEvenRow ? "bg-muted/50 rounded-md" : ""
      )}
    >
      <div className="flex items-center gap-1"> {/* Reduced gap */}
        <BadgeCheck className="w-5 h-5 text-accent shrink-0 mr-1.5" /> {/* Icon */}
        <div className="flex items-center gap-1"> {/* Container for flag and text */}
          {detail.countryCode ? (
            <Image
              src={`https://flagcdn.com/w20/${detail.countryCode.toLowerCase()}.png`}
              alt={detail.name || "Nazione"}
              width={20}
              height={13}
              className="rounded-sm border border-border/30 object-contain shrink-0"
              data-ai-hint={`${detail.name} flag`}
            />
          ) : (
            <div className="w-5 h-[13px] shrink-0 bg-muted/20 rounded-sm"></div>
          )}
          <div className="flex flex-col items-start"> {/* Text block */}
            <Link
              href={`/nations/${detail.id}`}
              className="group text-sm hover:underline hover:text-primary flex items-center"
              title={titleText}
            >
              <span className="font-medium">
                {detail.name || "Nazione Sconosciuta"}
              </span>
              {!leaderboardLockedAdmin &&
                nationRank &&
                [1, 2, 3].includes(nationRank) && (
                  <MedalIcon rank={nationRank} className="ml-1" />
                )}
              {!leaderboardLockedAdmin && rankText && (
                <span
                  className={cn(
                    "text-xs ml-1",
                     nationRank && [1,2,3].includes(nationRank) ?
                     rankTextColorClass(nationRank)
                     : "text-muted-foreground/80"
                  )}
                >
                  {rankText}
                </span>
              )}
            </Link>
            {!leaderboardLockedAdmin && (detail.artistName || detail.songTitle) && (
              <span className="text-[11px] text-muted-foreground/80 block">
                {detail.artistName}
                {detail.artistName && detail.songTitle && " - "}
                {detail.songTitle}
              </span>
            )}
          </div>
        </div>
      </div>
      {!leaderboardLockedAdmin && typeof detail.points === "number" && (
        <span
          className={cn(
            "text-sm ml-auto shrink-0 self-center font-semibold",
            detail.points > 0
              ? "text-primary"
              : detail.points < 0
              ? "text-destructive"
              : "text-muted-foreground"
          )}
        >
          {detail.points > 0 ? `+${detail.points}` : detail.points}pt
        </span>
      )}
    </div>
  );
};
PrimaSquadraNationDisplayDetailPodium.displayName = "PrimaSquadraNationDisplayDetailPodium";


interface CategoryPickDisplayDetailPodiumProps {
  detail: GlobalCategoryPickDetail & { actualCategoryRank?: number | null; iconName: string; };
  leaderboardLockedAdmin: boolean | null;
  isEvenRow?: boolean;
}

const CategoryPickDisplayDetailPodium: React.FC<CategoryPickDisplayDetailPodiumProps> = ({
  detail,
  leaderboardLockedAdmin,
  isEvenRow,
}) => {
  let IconComponent: React.ElementType = Info;
  switch (detail.iconName) {
    case "EurovisionWinner": IconComponent = Award; break;
    case "JuryWinner": IconComponent = Users; break;
    case "TelevoteWinner": IconComponent = Flag; break;
    case "Award": IconComponent = Award; break; // For Miglior TreppoScore
    case "Music2": IconComponent = Music2; break;
    case "Star": IconComponent = Star; break;
    case "Shirt": IconComponent = Shirt; break;
    case "ThumbsDown": IconComponent = ThumbsDown; break;
    default: IconComponent = Info;
  }

  const actualCategoryRank = detail.actualCategoryRank;
  
  let rankSuffix = "";
  if (detail.categoryName === "Peggior TreppoScore") {
    rankSuffix = " peggiore";
  }

  const rankText = !leaderboardLockedAdmin && actualCategoryRank && actualCategoryRank > 0 
    ? `(${actualCategoryRank}°${rankSuffix})`
    : "";

  return (
    <div className={cn("w-full", isEvenRow ? "bg-muted/50 rounded-md" : "")}>
      {/* Line 1: Category Label and Points */}
      <div className="flex items-center justify-between w-full px-2 py-1.5">
        <div className="flex items-center gap-1.5">
          <IconComponent className={cn("w-5 h-5 flex-shrink-0", "text-accent")} />
          <p className="text-sm font-medium text-foreground/90">
            {detail.categoryName}
          </p>
        </div>
        {!leaderboardLockedAdmin && typeof detail.pointsAwarded === 'number' && (
          <span
            className={cn(
              "text-sm font-semibold ml-auto",
              detail.pointsAwarded > 0 ? "text-primary" :
              detail.pointsAwarded === 0 ? "text-muted-foreground" :
              "text-destructive"
            )}
          >
            {detail.pointsAwarded >= 0 ? "+" : ""}{detail.pointsAwarded}pt
          </span>
        )}
      </div>

      {/* Line 2: Picked Nation Details (indented) */}
      <div className={cn("w-full mt-0.5 pl-[calc(1.25rem+0.375rem)] px-2 pb-1.5")}> {/* Adjusted padding */}
        {detail.pickedNationName ? (
          <div className="flex items-center gap-1.5">
            {detail.pickedNationCountryCode && (
              <Image
                src={`https://flagcdn.com/w20/${detail.pickedNationCountryCode.toLowerCase()}.png`}
                alt={detail.pickedNationName}
                width={20}
                height={13}
                className="rounded-sm border border-border/30 object-contain shrink-0"
                data-ai-hint={`${detail.pickedNationName} flag`}
              />
            )}
            <div className="flex flex-col items-start">
              <Link
                href={`/nations/${detail.pickedNationId}`}
                className="group text-sm hover:underline hover:text-primary flex items-center"
                title={`${detail.pickedNationName} ${rankText ? rankText + " " : ""}${detail.artistName ? `- ${detail.artistName} ` : ''}${detail.songTitle ? `- ${detail.songTitle}` : ''}`}
              >
                <span className="font-medium">
                  {detail.pickedNationName}
                </span>
                {!leaderboardLockedAdmin && actualCategoryRank && [1, 2, 3].includes(actualCategoryRank) && (
                  <MedalIcon rank={actualCategoryRank} className="ml-1" />
                )}
                {!leaderboardLockedAdmin && rankText && (
                  <span className={cn(
                    "text-xs ml-1",
                    actualCategoryRank && [1,2,3].includes(actualCategoryRank) ?
                    rankTextColorClass(actualCategoryRank) :
                    "text-muted-foreground/80"
                  )}>
                    {rankText}
                  </span>
                )}
              </Link>
              {!leaderboardLockedAdmin && (detail.artistName || detail.songTitle) && (
                <span className="text-[11px] text-muted-foreground/80 block">
                  {detail.artistName}{detail.artistName && detail.songTitle && " - "}{detail.songTitle}
                </span>
              )}
            </div>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">Nessuna selezione</span>
        )}
      </div>
    </div>
  );
};
CategoryPickDisplayDetailPodium.displayName = "CategoryPickDisplayDetailPodium";


interface TeamListItemProps {
  team: TeamWithScore;
  allNations: Nation[];
  nationGlobalCategorizedScoresArray: [string, NationGlobalCategorizedScores][];
  isOwnTeamCard?: boolean;
  isLeaderboardPodiumDisplay?: boolean;
  disableEdit?: boolean;
  defaultOpenSections?: string[];
}

export function TeamListItem({
  team,
  allNations,
  nationGlobalCategorizedScoresArray,
  isOwnTeamCard = false,
  isLeaderboardPodiumDisplay = false,
  disableEdit = false,
  defaultOpenSections = [],
}: TeamListItemProps) {
  const { user } = useAuth();
  const [teamsLocked, setTeamsLocked] = useState<boolean | null>(null);
  const [leaderboardLockedAdmin, setLeaderboardLockedAdmin] = useState<boolean | null>(null);
  const [finalPredictionsEnabled, setFinalPredictionsEnabled] = useState<boolean | null>(null);
  const [isLoadingAdminSettings, setIsLoadingAdminSettings] = useState(true);

  const nationGlobalCategorizedScoresMap = useMemo(() => {
    if (!nationGlobalCategorizedScoresArray || nationGlobalCategorizedScoresArray.length === 0) {
      return new Map<string, NationGlobalCategorizedScores>();
    }
    return new Map(nationGlobalCategorizedScoresArray);
  }, [nationGlobalCategorizedScoresArray]);

  const renderDetailedView = !!(team.primaSquadraDetails && team.categoryPicksDetails);

  const sortedFounderNationsDetails = useMemo(() => {
    if (!allNations || allNations.length === 0) return [];
    if (team.primaSquadraDetails && team.primaSquadraDetails.length > 0) {
      return [...team.primaSquadraDetails].sort((a, b) => (a.actualRank ?? Infinity) - (b.actualRank ?? Infinity));
    }
    return (team.founderChoices || [])
      .map((id) => {
        const nation = allNations.find((n) => n.id === id);
        return {
          id,
          name: nation?.name || "Sconosciuto",
          countryCode: nation?.countryCode || "xx",
          artistName: nation?.artistName,
          songTitle: nation?.songTitle,
          actualRank: nation?.ranking,
          points: 0,
        };
      })
      .sort((a, b) => (a.actualRank ?? Infinity) - (b.actualRank ?? Infinity));
  }, [team.primaSquadraDetails, team.founderChoices, allNations]);

  const eurovisionPicksForDisplay = useMemo(() => {
    if (!renderDetailedView || !team.categoryPicksDetails) return [];
    return team.categoryPicksDetails.filter(p => ["Vincitore Eurovision", "Vincitore Giuria", "Vincitore Televoto"].includes(p.categoryName));
  }, [renderDetailedView, team.categoryPicksDetails]);

  const userVotePicksForDisplay = useMemo(() => {
    if (!renderDetailedView || !team.categoryPicksDetails) return [];
    const userVoteCategories = ["Miglior TreppoScore", "Miglior Canzone", "Miglior Performance", "Miglior Outfit", "Peggior TreppoScore"];
    return team.categoryPicksDetails.filter(p => userVoteCategories.includes(p.categoryName));
  }, [renderDetailedView, team.categoryPicksDetails]);

  useEffect(() => {
    setIsLoadingAdminSettings(true);
    Promise.all([
      getTeamsLockedStatus(),
      getLeaderboardLockedStatus(),
      getFinalPredictionsEnabledStatus(),
    ])
      .then(([teamsLockResult, lbLockResult, finalPredResult]) => {
        setTeamsLocked(teamsLockResult);
        setLeaderboardLockedAdmin(lbLockResult);
        setFinalPredictionsEnabled(finalPredResult);
      })
      .catch((error) => {
        console.error("Failed to fetch admin settings for TeamListItem:", error);
        setTeamsLocked(false);
        setLeaderboardLockedAdmin(false);
        setFinalPredictionsEnabled(true);
      })
      .finally(() => {
        setIsLoadingAdminSettings(false);
      });
  }, []);

  const hasAnyBonus = !!(team.bonusCampionePronostici || team.bonusGranCampionePronostici || team.bonusEnPleinTop5);

  if (isLoadingAdminSettings || !allNations || (!nationGlobalCategorizedScoresArray && renderDetailedView) ) {
    const cardHeightClass = isLeaderboardPodiumDisplay ? "min-h-[400px]" : "min-h-[200px]";
    const borderClassLoading = isLeaderboardPodiumDisplay && team.rank && team.rank <=3 ? 
      (team.rank === 1 ? "border-yellow-400 border-2 shadow-yellow-400/30" : 
       team.rank === 2 ? "border-slate-400 border-2 shadow-slate-400/30" : 
       "border-amber-500 border-2 shadow-amber-500/30") 
      : "border-border";
    return (
      <Card
        className={cn(
          "flex flex-col h-full shadow-lg p-4 items-center justify-center",
           cardHeightClass,
           borderClassLoading
        )}
      >
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground mt-2 text-xs">
          Caricamento team...
        </p>
      </Card>
    );
  }
  
  const borderClass =
    isLeaderboardPodiumDisplay &&
    !leaderboardLockedAdmin &&
    team.rank &&
    team.rank <= 3
      ? team.rank === 1
        ? "border-yellow-400 border-2 shadow-yellow-400/30"
        : team.rank === 2
        ? "border-slate-400 border-2 shadow-slate-400/30"
        : "border-amber-500 border-2 shadow-amber-500/30"
      : "border-border";

  const PodiumHeader = () => (
    <>
      {/* First row: Team Name & Score */}
      <div className="flex items-baseline justify-between w-full">
        <CardTitle className="text-xl text-primary flex items-center gap-2">
          <Users className="h-5 w-5 text-accent shrink-0" />
          {team.name}
        </CardTitle>
        {typeof team.score === "number" && !leaderboardLockedAdmin && (
          <div className="text-2xl font-bold text-primary whitespace-nowrap">
            {team.score}pt
          </div>
        )}
      </div>
      {/* Second row: Owner & Rank */}
      <div className="flex items-baseline justify-between w-full">
        {team.creatorDisplayName && (
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <UserCircle className="h-3 w-3" />
            <span>{team.creatorDisplayName}</span>
          </div>
        )}
        {!leaderboardLockedAdmin && team.rank && (
          <div className={cn("font-semibold flex items-center", rankTextColorClass(team.rank), "ml-auto")}>
            <MedalIcon rank={team.rank} className="mr-1" />
            {getRankTextPodium(team.rank, team.isTied)}
          </div>
        )}
      </div>
    </>
  );

  const DefaultHeader = () => (
    <div className="flex flex-row justify-between items-start">
      <div className="flex-grow">
        <CardTitle className="text-xl text-primary flex items-center gap-2">
          <Users className="h-5 w-5 text-accent shrink-0" />
          {team.name}
        </CardTitle>
        {team.creatorDisplayName && !isOwnTeamCard && (
          <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
            <UserCircle className="h-3 w-3" />
            {team.creatorDisplayName}
          </div>
        )}
      </div>
      <div className="flex flex-col items-end">
        {typeof team.score === "number" && !leaderboardLockedAdmin && (
          <div className="text-lg font-bold text-primary">
            {team.score}pt
          </div>
        )}
      </div>
    </div>
  );

  return (
    <Card className={cn(
      "flex flex-col h-full shadow-lg hover:shadow-primary/20 transition-shadow duration-300",
      borderClass
    )}>
      <CardHeader
        className={cn(
          "pt-4 px-4 pb-3",
          isLeaderboardPodiumDisplay && "space-y-0 border-b border-border pb-3" // Added space-y-0 and consistent pb
        )}
      >
        {isLeaderboardPodiumDisplay ? <PodiumHeader /> : <DefaultHeader />}
      </CardHeader>

      <CardContent className="flex-grow space-y-1 pt-3 pb-4 px-4">
        { renderDetailedView && allNations && allNations.length > 0 ? (
          <Accordion type="multiple" className="w-full" defaultValue={defaultOpenSections}>
            {/* Nazioni Squadra (Pronostici TreppoVision) Section */}
            <AccordionItem value="treppovision">
              <AccordionTrigger asChild className="py-2 hover:no-underline">
                <div className="group flex justify-between items-center w-full font-medium cursor-pointer">
                  <div className="flex items-center gap-1">
                    <p className="text-lg font-bold text-primary">
                      Nazioni Squadra
                    </p>
                    <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
                  </div>
                  {typeof team.primaSquadraScore === "number" && !leaderboardLockedAdmin && (
                      <span className={cn("text-sm font-semibold ml-auto", team.primaSquadraScore > 0 ? "text-primary" : team.primaSquadraScore < 0 ? "text-destructive" : "text-muted-foreground")}>
                        {team.primaSquadraScore >= 0 ? "+" : ""}{team.primaSquadraScore}pt
                      </span>
                    )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-1 pb-0">
                 <div className={cn("space-y-0.5", (eurovisionPicksForDisplay.length > 0 || userVotePicksForDisplay.length > 0 || hasAnyBonus) && "pb-3 border-b border-border")}>
                  {sortedFounderNationsDetails.map((detail, index) => (
                    <PrimaSquadraNationDisplayDetailPodium
                      key={`${team.id}-${detail.id}-prima-detail-${index}`}
                      detail={{...detail, isEvenRow: index % 2 !== 0}}
                      leaderboardLockedAdmin={leaderboardLockedAdmin}
                    />
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Pronostici Eurovision Section */}
            {renderDetailedView && finalPredictionsEnabled && eurovisionPicksForDisplay.length > 0 && (
              <AccordionItem value="pronosticiEurovision">
                 <AccordionTrigger asChild className="py-2 hover:no-underline">
                    <div className="group flex justify-between items-center w-full font-medium cursor-pointer">
                        <div className="flex items-center gap-1">
                            <p className="text-lg font-bold text-primary mt-3 pt-0">
                                Pronostici Eurovision
                            </p>
                            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
                        </div>
                        {typeof team.eurovisionPicksScore === "number" && !leaderboardLockedAdmin && (
                            <span className={cn("text-sm font-semibold ml-auto", team.eurovisionPicksScore > 0 ? "text-primary" : team.eurovisionPicksScore < 0 ? "text-destructive" : "text-muted-foreground")}>
                                {team.eurovisionPicksScore >= 0 ? "+" : ""}{team.eurovisionPicksScore}pt
                            </span>
                        )}
                    </div>
                </AccordionTrigger>
                <AccordionContent className="pt-1 pb-0">
                   <div className={cn("space-y-0.5", (userVotePicksForDisplay.length > 0 || hasAnyBonus) && "pb-3 border-b border-border")}>
                    {eurovisionPicksForDisplay.map((detail, index) => (
                      <CategoryPickDisplayDetailPodium
                        key={`${team.id}-${detail.categoryName}-euro-detail-${index}`}
                        detail={detail}
                        leaderboardLockedAdmin={leaderboardLockedAdmin}
                        isEvenRow={index % 2 !== 0}
                        allNations={allNations}
                      />
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}

            {/* Pronostici TreppoScore Section */}
            {renderDetailedView && finalPredictionsEnabled && userVotePicksForDisplay.length > 0 && (
              <AccordionItem value="pronosticiTreppoScore">
                <AccordionTrigger asChild className="py-2 hover:no-underline">
                    <div className="group flex justify-between items-center w-full font-medium cursor-pointer">
                        <div className="flex items-center gap-1">
                            <p className="text-lg font-bold text-primary mt-3 pt-0">
                                Pronostici TreppoScore
                            </p>
                            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
                        </div>
                        {typeof team.treppoScoreCategoryPicksScore === "number" && !leaderboardLockedAdmin && (
                            <span className={cn("text-sm font-semibold ml-auto", team.treppoScoreCategoryPicksScore > 0 ? "text-primary" : team.treppoScoreCategoryPicksScore < 0 ? "text-destructive" : "text-muted-foreground")}>
                                {team.treppoScoreCategoryPicksScore >= 0 ? "+" : ""}{team.treppoScoreCategoryPicksScore}pt
                            </span>
                        )}
                    </div>
                </AccordionTrigger>
                <AccordionContent className="pt-1 pb-0">
                   <div className={cn("space-y-0.5", hasAnyBonus && "pb-3 border-b border-border")}>
                    {userVotePicksForDisplay.map((detail, index) => (
                      <CategoryPickDisplayDetailPodium
                        key={`${team.id}-${detail.categoryName}-treppo-detail-${index}`}
                        detail={detail}
                        leaderboardLockedAdmin={leaderboardLockedAdmin}
                        isEvenRow={index % 2 !== 0}
                        allNations={allNations}
                      />
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}

            {/* Bonus Section */}
            {renderDetailedView && hasAnyBonus && !leaderboardLockedAdmin && (
              <AccordionItem value="bonus">
                 <AccordionTrigger asChild className="py-2 hover:no-underline">
                     <div className="group flex justify-between items-center w-full font-medium cursor-pointer">
                        <div className="flex items-center gap-1">
                            <p className="text-lg font-bold text-primary mt-3 pt-0">Bonus</p>
                            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
                        </div>
                        {typeof team.bonusTotalScore === "number" && !leaderboardLockedAdmin && (
                            <span className={cn("text-sm font-semibold ml-auto", team.bonusTotalScore > 0 ? "text-primary" : "text-muted-foreground")}>
                                {team.bonusTotalScore > 0 ? "+" : ""}{team.bonusTotalScore}pt
                            </span>
                        )}
                    </div>
                </AccordionTrigger>
                <AccordionContent className="pt-1 pb-0">
                  <div className="space-y-0.5 pb-3">
                    {[
                      team.bonusGranCampionePronostici && { label: "Gran Campione di Pronostici", points: 30, Icon: Trophy, iconColor: "text-yellow-500" },
                      team.bonusCampionePronostici && !team.bonusGranCampionePronostici && { label: "Campione di Pronostici", points: 5, Icon: Trophy, iconColor: "text-yellow-500" },
                      team.bonusEnPleinTop5 && { label: "En Plein Top 5", points: 30, Icon: CheckCircle, iconColor: "text-green-500" },
                    ]
                      .filter(Boolean)
                      .map((bonusItem, index) =>
                        bonusItem ? (
                          <div
                            key={bonusItem.label}
                            className={cn(
                              "flex items-center justify-between pl-2 py-1 text-xs",
                              index % 2 !== 0 ? "bg-muted/50 rounded-md" : ""
                            )}
                          >
                            <div className="flex items-center gap-1.5">
                              <bonusItem.Icon className={cn("w-5 h-5 shrink-0", bonusItem.iconColor)} />
                              <span className="font-medium text-foreground/90">{bonusItem.label}</span>
                            </div>
                            <span className="font-semibold text-primary ml-auto">+{bonusItem.points}pt</span>
                          </div>
                        ) : null
                      )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}
          </Accordion>
        ) : (
          <div className="text-xs text-muted-foreground py-4 text-center">
            <Info className="inline h-4 w-4 mr-1" />
            I dettagli delle scelte e dei punteggi appariranno qui una volta che i dati saranno disponibili e i pronostici saranno stati inseriti.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
