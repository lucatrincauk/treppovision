

import { getTeams } from "@/lib/team-service";
import { getNations } from "@/lib/nation-service";
import { getAllNationsGlobalCategorizedScores } from "@/lib/voting-service"; 
import type { Team, Nation, NationGlobalCategorizedScores, GlobalPrimaSquadraDetail, GlobalCategoryPickDetail as GlobalCategoryPickDetailType } from "@/types";
import { TeamsSubNavigation } from "@/components/teams/teams-sub-navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, UserCircle, BarChartBig, Info, BadgeCheck, Music2, Star, Shirt, ThumbsDown, Award, TrendingUp, Lock as LockIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { TeamList } from "@/components/teams/team-list";
import { getAdminSettingsAction } from "@/lib/actions/admin-actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


export const dynamic = 'force-dynamic'; 

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

interface NationScoreDetail extends GlobalPrimaSquadraDetail {}

interface CategoryPickDetail extends GlobalCategoryPickDetailType {
  iconName: string; 
}

interface TeamWithScore extends Team {
  score: number;
  rank?: number;
  primaSquadraDetails: NationScoreDetail[];
  categoryPicksDetails: CategoryPickDetail[];
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
      if (a.score === b.score) return a.name.localeCompare(b.name);
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


export default async function TeamsLeaderboardPage() {
  const adminSettings = await getAdminSettingsAction();

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

  const allTeams = await getTeams();
  const allNations = await getNations();
  const globalCategorizedScoresMap = await getAllNationsGlobalCategorizedScores(); 
  const globalCategorizedScoresArray = Array.from(globalCategorizedScoresMap.entries());

  const nationsMap = new Map(allNations.map(nation => [nation.id, nation]));

  const topSongNations = getTopNationsForCategory(globalCategorizedScoresMap, nationsMap, 'averageSongScore', 'desc');
  const bottomSongNations = getTopNationsForCategory(globalCategorizedScoresMap, nationsMap, 'averageSongScore', 'asc'); 
  const topPerformanceNations = getTopNationsForCategory(globalCategorizedScoresMap, nationsMap, 'averagePerformanceScore', 'desc');
  const topOutfitNations = getTopNationsForCategory(globalCategorizedScoresMap, nationsMap, 'averageOutfitScore', 'desc');

  let teamsWithScores: TeamWithScore[] = allTeams.map(team => {
    let score = 0;
    const primaSquadraDetails: NationScoreDetail[] = [];
    const categoryPicksDetails: CategoryPickDetail[] = [];

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
    const bestSongNation = team.bestSongNationId ? nationsMap.get(team.bestSongNationId) : undefined;
    categoryPicksDetails.push({
      categoryName: "Miglior Canzone",
      pickedNationId: team.bestSongNationId,
      pickedNationName: bestSongNation?.name,
      pickedNationCountryCode: bestSongNation?.countryCode,
      actualCategoryRank: bestSongPick.rank,
      pickedNationScoreInCategory: bestSongPick.score,
      pointsAwarded: bestSongPick.points,
      iconName: "Music2",
    });

    const bestPerformancePick = getCategoryPickPointsAndRank(team.bestPerformanceNationId, topPerformanceNations);
    score += bestPerformancePick.points;
    const bestPerformanceNation = team.bestPerformanceNationId ? nationsMap.get(team.bestPerformanceNationId) : undefined;
    categoryPicksDetails.push({
      categoryName: "Miglior Performance",
      pickedNationId: team.bestPerformanceNationId,
      pickedNationName: bestPerformanceNation?.name,
      pickedNationCountryCode: bestPerformanceNation?.countryCode,
      actualCategoryRank: bestPerformancePick.rank,
      pickedNationScoreInCategory: bestPerformancePick.score,
      pointsAwarded: bestPerformancePick.points,
      iconName: "Star",
    });

    const bestOutfitPick = getCategoryPickPointsAndRank(team.bestOutfitNationId, topOutfitNations);
    score += bestOutfitPick.points;
    const bestOutfitNation = team.bestOutfitNationId ? nationsMap.get(team.bestOutfitNationId) : undefined;
    categoryPicksDetails.push({
      categoryName: "Miglior Outfit",
      pickedNationId: team.bestOutfitNationId,
      pickedNationName: bestOutfitNation?.name,
      pickedNationCountryCode: bestOutfitNation?.countryCode,
      actualCategoryRank: bestOutfitPick.rank,
      pickedNationScoreInCategory: bestOutfitPick.score,
      pointsAwarded: bestOutfitPick.points,
      iconName: "Shirt",
    });
    
    const worstSongPick = getCategoryPickPointsAndRank(team.worstSongNationId, bottomSongNations);
    score += worstSongPick.points;
    const worstSongNation = team.worstSongNationId ? nationsMap.get(team.worstSongNationId) : undefined;
     categoryPicksDetails.push({
      categoryName: "Peggior Canzone",
      pickedNationId: team.worstSongNationId,
      pickedNationName: worstSongNation?.name,
      pickedNationCountryCode: worstSongNation?.countryCode,
      actualCategoryRank: worstSongPick.rank, 
      pickedNationScoreInCategory: worstSongPick.score,
      pointsAwarded: worstSongPick.points,
      iconName: "ThumbsDown",
    });


    return { ...team, score, primaSquadraDetails, categoryPicksDetails };
  });

  teamsWithScores.sort((a, b) => {
    if (b.score === a.score) {
      return a.name.localeCompare(b.name);
    }
    return b.score - a.score;
  });

  let currentRank = 1;
  for (let i = 0; i < teamsWithScores.length; i++) {
    if (i > 0 && teamsWithScores[i].score < teamsWithScores[i-1].score) {
      currentRank = i + 1;
    }
    teamsWithScores[i].rank = currentRank;
  }

  for (let i = 0; i < teamsWithScores.length; i++) {
    let isTiedValue = false;
    if (i > 0 && teamsWithScores[i].rank === teamsWithScores[i-1].rank) {
      isTiedValue = true;
    }
    if (i < teamsWithScores.length - 1 && teamsWithScores[i].rank === teamsWithScores[i+1].rank) {
      isTiedValue = true;
    }
    teamsWithScores[i].isTied = isTiedValue;
  }

  const podiumTeams = teamsWithScores.filter(team => (team.rank ?? Infinity) <= 3);
  const tableTeams = teamsWithScores.filter(team => (team.rank ?? Infinity) > 3);

  const MedalIcon = ({ rank, className }: { rank?: number, className?: string }) => {
    if (rank === undefined || rank === null || rank === 0 || rank > 3) return null;
    let colorClass = "";
    if (rank === 1) colorClass = "text-yellow-400";
    else if (rank === 2) colorClass = "text-slate-400";
    else if (rank === 3) colorClass = "text-amber-500";
    return <Award className={cn("w-3.5 h-3.5 flex-shrink-0", colorClass, className)} />;
  };

  const PrimaSquadraNationDisplay = ({ detail }: { detail: NationScoreDetail }) => {
      const nationData = nationsMap.get(detail.id);
      const rankText = detail.actualRank && detail.actualRank > 0 ? `(${detail.actualRank}°)` : "";
      const titleText = `${detail.name}${rankText ? ` ${rankText}` : ''}${nationData?.artistName ? ` - ${nationData.artistName}` : ''}${nationData?.songTitle ? ` - ${nationData.songTitle}` : ''}${!adminSettings.leaderboardLocked && typeof detail.points === 'number' ? ` Punti: ${detail.points}`: ''}`;

      return (
        <div className="px-2 py-1 flex items-start"> 
          <div className="flex items-center gap-1.5">
            <BadgeCheck className="w-5 h-5 text-accent flex-shrink-0 mr-1.5" />
            <div className="flex items-center gap-1.5">
                {nationData?.countryCode ? (
                    <Image
                    src={`https://flagcdn.com/w20/${nationData.countryCode.toLowerCase()}.png`}
                    alt={detail.name}
                    width={20} 
                    height={13}
                    className="rounded-sm border border-border/30 object-contain flex-shrink-0"
                    data-ai-hint={`${detail.name} flag`}
                    />
                ) : (
                  <div className="w-5 h-[13px] flex-shrink-0 bg-muted/20 rounded-sm"></div>
                )}
                <div className="flex flex-col items-start">
                <Link 
                    href={`/nations/${detail.id}`} 
                    className="group text-xs hover:underline hover:text-primary flex items-center gap-1" 
                    title={titleText}
                >
                    <span className="font-medium">{detail.name}</span>
                    {!adminSettings.leaderboardLocked && <MedalIcon rank={detail.actualRank} className="ml-0.5"/>}
                    {!adminSettings.leaderboardLocked && rankText && (
                        <span className="text-muted-foreground text-xs ml-0.5">{rankText}</span>
                    )}
                </Link>
                {nationData && (nationData.artistName || nationData.songTitle) && !adminSettings.leaderboardLocked && (
                    <span className="text-xs text-muted-foreground/80 block">
                        {nationData.artistName}{nationData.artistName && nationData.songTitle && " - "}{nationData.songTitle}
                    </span>
                )}
                </div>
            </div>
          </div>
          {!adminSettings.leaderboardLocked && typeof detail.points === 'number' && (
            <span className={cn(
              "text-xs ml-auto pl-1", 
              detail.points > 0 ? "font-semibold text-primary" : detail.points < 0 ? "font-semibold text-destructive" : "text-muted-foreground"
            )}>
              {detail.points > 0 ? `+${detail.points}pt` : `${detail.points}pt`}
            </span>
          )}
        </div>
      );
  };

  const CategoryPickDisplay = ({ detail }: { detail: CategoryPickDetail }) => {
    let IconComponent: React.ElementType;
    const iconColorClass = "text-accent";

    switch (detail.iconName) {
        case 'Music2': IconComponent = Music2; break;
        case 'Star': IconComponent = Star; break;
        case 'Shirt': IconComponent = Shirt; break;
        case 'ThumbsDown': IconComponent = ThumbsDown; break;
        default: IconComponent = Info; 
    }
    
    let rankSuffix = "in cat.";
    if (detail.categoryName === "Miglior Canzone") rankSuffix = "";
    else if (detail.categoryName === "Peggior Canzone") rankSuffix = "peggiore";
    
    const rankText = !adminSettings.leaderboardLocked && detail.actualCategoryRank && detail.actualCategoryRank > 0
    ? `(${detail.actualCategoryRank}°${detail.categoryName !== "Miglior Canzone" ? ` ${rankSuffix}` : ''})`.trim()
    : "";

    const pickedNationFullDetails = detail.pickedNationId ? nationsMap.get(detail.pickedNationId) : undefined;
    const titleText = `${detail.categoryName}: ${pickedNationFullDetails?.name || 'N/D'}${rankText}${!adminSettings.leaderboardLocked && typeof detail.pointsAwarded === 'number' ? ` Punti: ${detail.pointsAwarded}`: ''}`;

    return (
    <div className="px-2 py-1">
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-1.5">
                <IconComponent className={cn("w-4 h-4 flex-shrink-0", iconColorClass)} />
                <span className="text-xs text-foreground/90 min-w-[120px] flex-shrink-0 font-medium">{detail.categoryName}</span>
            </div>
            {!adminSettings.leaderboardLocked && typeof detail.pointsAwarded === 'number' && (
                <span className={cn("text-xs ml-auto pl-1", detail.pointsAwarded > 0 ? "font-semibold text-primary" : "text-muted-foreground")}>
                {detail.pointsAwarded > 0 ? `+${detail.pointsAwarded}pt` : `${detail.pointsAwarded}pt`}
                </span>
            )}
        </div>

        <div className={cn(
            "w-full mt-1",
            "pl-[calc(1rem+theme(spacing.1_5))]" 
        )}>
          {pickedNationFullDetails ? (
            <div className="flex items-center gap-1.5"> 
                {pickedNationFullDetails.countryCode ? (
                <Image
                    src={`https://flagcdn.com/w20/${pickedNationFullDetails.countryCode.toLowerCase()}.png`}
                    alt={pickedNationFullDetails.name}
                    width={20}
                    height={13}
                    className="rounded-sm border border-border/30 object-contain flex-shrink-0 mr-0"
                    data-ai-hint={`${pickedNationFullDetails.name} flag`}
                />
                ) : (
                  <div className="w-5 h-[13px] flex-shrink-0 bg-muted/20 rounded-sm mr-1.5"></div>
                )}
                <div className="flex flex-col items-start">
                    <Link href={`/nations/${pickedNationFullDetails.id}`}
                        className={cn("group text-xs hover:underline hover:text-primary flex items-center gap-1")}
                        title={titleText}
                    >
                        <span className="font-medium">
                        {pickedNationFullDetails.name}
                        </span>
                        {!adminSettings.leaderboardLocked && <MedalIcon rank={detail.actualCategoryRank} className="ml-0.5"/>}
                        {!adminSettings.leaderboardLocked && rankText && (
                        <span className="text-muted-foreground text-xs ml-0.5">{rankText}</span>
                        )}
                    </Link>
                </div>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <UserCircle className="h-4 w-4 flex-shrink-0" />
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

          {tableTeams.length > 0 && (
             <section className={podiumTeams.length > 0 ? "mt-12" : ""}>
              <h2 className="text-3xl font-bold tracking-tight mb-6 text-primary border-b-2 border-primary/30 pb-2">
                Classifica Completa (dal 4° posto)
              </h2>
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Squadra</TableHead>
                        <TableHead className="text-right">Punteggio Totale</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tableTeams.map((team) => (
                        <TableRow key={team.id}>
                          <TableCell className="align-top pt-4">
                              <div className={cn("text-sm font-semibold flex items-center mb-1", 
                                !adminSettings.leaderboardLocked && team.rank === 1 ? "text-yellow-400" :
                                !adminSettings.leaderboardLocked && team.rank === 2 ? "text-slate-400" :
                                !adminSettings.leaderboardLocked && team.rank === 3 ? "text-amber-500" :
                                "text-muted-foreground"
                                )}>
                                  {!adminSettings.leaderboardLocked && <MedalIcon rank={team.rank} className="mr-1" />}
                                  {!adminSettings.leaderboardLocked && getRankText(team.rank)}{!adminSettings.leaderboardLocked && team.isTied ? "*" : ""}
                              </div>
                              <div className="font-medium text-base mb-0.5">
                                {team.name}
                              </div>
                              {team.creatorDisplayName && (
                                    <div className="text-xs text-muted-foreground flex items-center gap-1 mb-2" title={`Utente: ${team.creatorDisplayName}`}>
                                        <UserCircle className="h-3 w-3" />{team.creatorDisplayName}
                                    </div>
                                )}
                              
                              <div className="mt-2 mb-2">
                                  <p className="text-xs font-semibold text-muted-foreground mb-0.5">Pronostici TreppoVision:</p>
                                  {team.primaSquadraDetails.map(detail => (
                                      <PrimaSquadraNationDisplay key={`${team.id}-${detail.id}-prima`} detail={detail} />
                                  ))}
                              </div>
                              <div className="mt-2">
                                  <p className="text-xs font-semibold text-muted-foreground mb-0.5">Pronostici TreppoScore:</p>
                                  {team.categoryPicksDetails.map(detail => (
                                      <CategoryPickDisplay key={`${team.id}-${detail.categoryName}`} detail={detail} />
                                  ))}
                              </div>
                          </TableCell>
                          {!adminSettings.leaderboardLocked && <TableCell className="text-right font-semibold text-lg text-primary align-top pt-4">{team.score}</TableCell>}
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
