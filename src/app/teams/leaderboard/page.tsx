
import { getTeams } from "@/lib/team-service";
import { getNations } from "@/lib/nation-service";
import { getAllNationsGlobalCategorizedScores } from "@/lib/voting-service"; 
import type { Team, Nation, NationGlobalCategorizedScores } from "@/types";
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

interface NationScoreDetail {
  id: string;
  name: string;
  countryCode: string;
  artistName?: string;
  songTitle?: string;
  actualRank?: number;
  points: number;
}

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

interface TeamWithScore extends Team {
  score: number;
  rank?: number;
  primaSquadraDetails: NationScoreDetail[];
  categoryPicksDetails: CategoryPickDetail[];
}

const getTopNationsForCategory = (
  scoresMap: Map<string, NationGlobalCategorizedScores>,
  nationsMap: Map<string, Nation>,
  categoryKey: 'averageSongScore' | 'averagePerformanceScore' | 'averageOutfitScore',
  sortOrder: 'desc' | 'asc' = 'desc'
): Array<{ id: string; name: string; score: number | null }> => { 
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
      if (sortOrder === 'desc') {
        return (b.score as number) - (a.score as number);
      }
      return (a.score as number) - (b.score as number);
    });
};

const getCategoryPickPointsAndRank = (
  pickedNationId: string | undefined,
  sortedNationsForCategory: Array<{ id: string; score: number | null }> 
): { points: number; rank?: number; score?: number | null } => {
  if (!pickedNationId) return { points: 0, rank: undefined, score: null };
  
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
          artistName: nation.artistName,
          songTitle: nation.songTitle,
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

  const top3Teams = teamsWithScores.slice(0, 3);
  const otherRankedTeams = teamsWithScores.slice(3);


  const PrimaSquadraNationDisplay = ({ detail }: { detail: NationScoreDetail }) => {
      const MedalIcon = ({ rank }: { rank?: number }) => {
        if (rank === 1) return <Award className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0 ml-1" />;
        if (rank === 2) return <Award className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 ml-1" />;
        if (rank === 3) return <Award className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 ml-1" />; 
        return null;
      };
      return (
        <div className="flex items-start gap-1.5 px-2 py-1 hover:bg-muted/30 rounded-md"> 
          <BadgeCheck className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
           <Image
            src={`https://flagcdn.com/w20/${detail.countryCode.toLowerCase()}.png`}
            alt={detail.name}
            width={20} 
            height={13}
            className="rounded-sm border border-border/30 object-contain flex-shrink-0 mt-1"
            data-ai-hint={`${detail.name} flag`}
          />
          <div className="flex-grow">
            <Link 
              href={`/nations/${detail.id}`} 
              className="text-xs hover:underline hover:text-primary flex items-center" 
              title={`${detail.name}${detail.artistName ? ` - ${detail.artistName}` : ''}${detail.songTitle ? ` - ${detail.songTitle}` : ''} (Classifica Finale: ${detail.actualRank ?? 'N/D'}) - Punti: ${detail.points}`}
            >
              <span className="font-medium">{detail.name}</span>
              <MedalIcon rank={detail.actualRank} />
              <span className="text-muted-foreground ml-1">({detail.actualRank ? `${detail.actualRank}°` : 'N/D'})</span>
            </Link>
             {detail.artistName && detail.songTitle && (
                <p className="text-[10px] text-muted-foreground truncate" title={`${detail.artistName} - ${detail.songTitle}`}>
                    {detail.artistName} - {detail.songTitle}
                </p>
            )}
          </div>
          <span className={cn(
            "text-xs ml-auto pl-1 mt-0.5", 
            detail.points > 0 ? "font-semibold text-primary" : detail.points < 0 ? "font-semibold text-destructive" : "text-muted-foreground"
          )}>
            {detail.points > 0 ? `+${detail.points}pt` : `${detail.points}pt`}
          </span>
        </div>
      );
  };

  const CategoryPickDisplay = ({ detail }: { detail: CategoryPickDetail }) => {
    let IconComponent: React.ElementType;
    switch (detail.iconName) {
        case 'Music2': IconComponent = Music2; break;
        case 'Star': IconComponent = Star; break;
        case 'Shirt': IconComponent = Shirt; break;
        case 'ThumbsDown': IconComponent = ThumbsDown; break;
        default: IconComponent = Info; 
    }

    const CategoryMedalIcon = ({ rank }: { rank?: number }) => {
        if (!rank || rank < 1 || rank > 3) return null;
        const colorClass = rank === 1 ? "text-yellow-400" : rank === 2 ? "text-slate-400" : "text-amber-500";
        return <Award className={cn("w-3.5 h-3.5 flex-shrink-0 ml-1", colorClass)} />;
    };
    
    const iconColorClass = "text-accent";
    
    let rankText = "";
    let rankSuffix = "";
    if (detail.actualCategoryRank && detail.actualCategoryRank > 0) {
        if (detail.categoryName === "Miglior Canzone") rankSuffix = "";
        else if (detail.categoryName === "Peggior Canzone") rankSuffix = " peggiore";
        else rankSuffix = " in cat.";
        rankText = `(${detail.actualCategoryRank}°${rankSuffix})`;
    }
    
    const pickedNationFullDetails = detail.pickedNationId ? nationsMap.get(detail.pickedNationId) : undefined;
    const titleText = `${detail.pickedNationName || 'N/D'}${pickedNationFullDetails ? ` - ${pickedNationFullDetails.artistName} - ${pickedNationFullDetails.songTitle}` : ''} ${rankText} - Punti: ${detail.pointsAwarded}`;


    return (
      <div className={cn("px-2 py-1.5 flex flex-col gap-0.5")}>
        {/* Line 1: Icon, Category Name, and Points Awarded */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <IconComponent className={cn("w-4 h-4 flex-shrink-0", iconColorClass)} />
            <span className="text-xs text-foreground/90 font-medium">{detail.categoryName}</span>
          </div>
          <span className={cn("text-xs", detail.pointsAwarded > 0 ? "font-semibold text-primary" : "text-muted-foreground")}>
            {detail.pointsAwarded > 0 ? `+${detail.pointsAwarded}pt` : `${detail.pointsAwarded}pt`}
          </span>
        </div>

        {/* Line 2: Indented Nation Details (if picked) */}
        {detail.pickedNationId && detail.pickedNationCountryCode && detail.pickedNationName ? (
          <div className={cn("pl-[calc(1rem+theme(spacing.1_5))]")}> {/* Indent based on icon size (1rem) + gap (0.375rem) */}
            <Link href={`/nations/${detail.pickedNationId}`}
                  className={cn("text-xs hover:underline hover:text-primary flex flex-col items-start")}
                  title={titleText}
            >
              <div className="flex items-center gap-1"> {/* Flag, Name, Medal, Rank */}
                <Image
                  src={`https://flagcdn.com/w20/${detail.pickedNationCountryCode.toLowerCase()}.png`}
                  alt={detail.pickedNationName || ""}
                  width={20}
                  height={13}
                  className="rounded-sm border border-border/30 object-contain flex-shrink-0"
                  data-ai-hint={`${detail.pickedNationName} flag`}
                />
                <span className="font-medium">{detail.pickedNationName}</span>
                <CategoryMedalIcon rank={detail.actualCategoryRank} />
                {rankText && (
                  <span className="text-muted-foreground ml-0.5 text-xs flex items-center">
                    {rankText}
                  </span>
                )}
              </div>
              {pickedNationFullDetails && ( /* Artist - Song */
                <span className="text-[10px] text-muted-foreground truncate max-w-[180px] block" title={`${pickedNationFullDetails.artistName} - ${pickedNationFullDetails.songTitle}`}>
                  {pickedNationFullDetails.artistName} - {pickedNationFullDetails.songTitle}
                </span>
              )}
            </Link>
          </div>
        ) : ( /* No selection picked */
          <div className={cn("pl-[calc(1rem+theme(spacing.1_5))] flex items-center gap-1.5 text-xs text-muted-foreground")}>
            <UserCircle className="h-4 w-4 flex-shrink-0" />
            <span>Nessuna selezione</span>
          </div>
        )}
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
          {top3Teams.length > 0 && (
            <section className="mb-12">
              <h2 className="text-3xl font-bold tracking-tight mb-6 text-primary border-b-2 border-primary/30 pb-2">
                Il Podio delle Squadre
              </h2>
              <TeamList
                teams={top3Teams}
                nations={allNations}
                nationGlobalCategorizedScoresMap={globalCategorizedScoresMap}
                disableListItemEdit={true} 
              />
            </section>
          )}

          {otherRankedTeams.length > 0 && (
             <section className={top3Teams.length > 0 ? "mt-12" : ""}>
              <h2 className="text-3xl font-bold tracking-tight mb-6 text-primary border-b-2 border-primary/30 pb-2">
                Classifica Completa (dal 4° posto)
              </h2>
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px] text-center">Pos.</TableHead>
                        <TableHead>Squadra</TableHead>
                        <TableHead className="text-right">Punteggio Totale</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {otherRankedTeams.map((team) => (
                        <TableRow key={team.id}>
                          <TableCell className="font-medium text-center align-top pt-4">{team.rank}</TableCell>
                          <TableCell className="align-top pt-4">
                              <div className="font-medium text-base mb-1">
                                {team.name}
                                 {team.creatorDisplayName && (
                                    <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5 mb-2" title={team.creatorDisplayName}>
                                        <UserCircle className="h-3 w-3" />{team.creatorDisplayName}
                                    </div>
                                )}
                              </div>
                              
                              <div className="mb-2">
                                  <p className="text-xs font-semibold text-muted-foreground mb-0.5">Pronostici TreppoVision:</p>
                                  {team.primaSquadraDetails.map(detail => (
                                      <PrimaSquadraNationDisplay key={`${team.id}-${detail.id}-prima`} detail={detail} />
                                  ))}
                              </div>
                              <div>
                                  <p className="text-xs font-semibold text-muted-foreground mb-0.5">Pronostici TreppoScore:</p>
                                  {team.categoryPicksDetails.map(detail => (
                                      <CategoryPickDisplay key={`${team.id}-${detail.categoryName}`} detail={detail} />
                                  ))}
                              </div>
                          </TableCell>
                          <TableCell className="text-right font-semibold text-lg text-primary align-top pt-4">{team.score}</TableCell>
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
  

    
