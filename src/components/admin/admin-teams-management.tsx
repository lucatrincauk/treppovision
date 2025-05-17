
"use client";

import * as React from "react";
import type { Nation, Team, TeamAdminViewDetails, Vote } from "@/types";
import { getTeams } from "@/lib/team-service";
import { getAllUserVotes } from "@/lib/voting-service";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Users, ListChecks, CheckCircle, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AdminTeamsManagementProps {
  allNations: Nation[];
}

export function AdminTeamsManagement({ allNations }: AdminTeamsManagementProps) {
  const [teamsWithDetails, setTeamsWithDetails] = React.useState<TeamAdminViewDetails[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    async function fetchTeamData() {
      setIsLoading(true);
      try {
        const fetchedTeams = await getTeams();
        const totalNationsCount = allNations.length;

        const teamsDetailsPromises = fetchedTeams.map(async (team) => {
          const userVotesMap = await getAllUserVotes(team.userId);
          const nationsVotedCount = userVotesMap.size;
          const nationsNotVotedCount = totalNationsCount - nationsVotedCount;

          const hasSubmittedFinalPredictions = !!(
            team.bestSongNationId ||
            team.bestPerformanceNationId ||
            team.bestOutfitNationId ||
            team.worstSongNationId
          );

          return {
            ...team,
            nationsNotVotedCount,
            hasSubmittedFinalPredictions,
          };
        });

        const resolvedTeamsDetails = await Promise.all(teamsDetailsPromises);
        setTeamsWithDetails(resolvedTeamsDetails);
      } catch (error) {
        console.error("Error fetching team management data:", error);
        // Potentially set an error state here to show in UI
      } finally {
        setIsLoading(false);
      }
    }

    if (allNations.length > 0) {
      fetchTeamData();
    } else {
      setIsLoading(false); // No nations, so nothing to process
    }
  }, [allNations]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[30vh]">
        <Loader2 className="w-10 h-10 animate-spin text-primary mb-3" />
        <p className="text-muted-foreground">Caricamento dati squadre...</p>
      </div>
    );
  }

  if (allNations.length === 0) {
    return (
         <Card>
            <CardHeader>
                <CardTitle className="flex items-center">
                <Users className="mr-2 h-6 w-6" />
                Gestione Squadre Utenti
                </CardTitle>
                <CardDescription>
                Nessuna nazione trovata. Aggiungi prima le nazioni per poter gestire le squadre.
                </CardDescription>
            </CardHeader>
        </Card>
    )
  }

  if (teamsWithDetails.length === 0) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center">
                <Users className="mr-2 h-6 w-6" />
                Gestione Squadre Utenti
                </CardTitle>
                <CardDescription>
                Nessuna squadra creata dagli utenti.
                </CardDescription>
            </CardHeader>
        </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Users className="mr-2 h-6 w-6" />
          Gestione Squadre Utenti
        </CardTitle>
        <CardDescription>
          Visualizza lo stato di voto e di invio dei pronostici finali per ogni squadra.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome Squadra</TableHead>
                <TableHead>Utente</TableHead>
                <TableHead className="text-center">Nazioni Non Votate</TableHead>
                <TableHead className="text-center">Pronostici Finali Inviati?</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teamsWithDetails.map((team) => (
                <TableRow key={team.id}>
                  <TableCell className="font-medium">{team.name}</TableCell>
                  <TableCell>{team.creatorDisplayName}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant={team.nationsNotVotedCount > 0 ? "destructive" : "default"} className="text-sm">
                      {team.nationsNotVotedCount}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    {team.hasSubmittedFinalPredictions ? (
                      <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500 mx-auto" />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
