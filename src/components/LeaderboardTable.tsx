
import React from "react";
import { LeaderboardEntry, Difficulty } from "@/types/game";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Trophy } from "lucide-react";

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  selectedDifficulty: Difficulty;
}

const LeaderboardTable: React.FC<LeaderboardTableProps> = ({ entries, selectedDifficulty }) => {
  // Format date
  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };
  
  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };
  
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12 text-center">Rank</TableHead>
            <TableHead>Player</TableHead>
            <TableHead className="text-right">Score</TableHead>
            <TableHead className="text-right">Time</TableHead>
            <TableHead className="text-right">Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                No scores for {selectedDifficulty} yet. Be the first!
              </TableCell>
            </TableRow>
          ) : (
            entries.map((entry, index) => (
              <TableRow key={entry.id}>
                <TableCell className="text-center">
                  {index === 0 ? (
                    <Trophy className="w-5 h-5 text-yellow-500 mx-auto" />
                  ) : (
                    `${index + 1}`
                  )}
                </TableCell>
                <TableCell className="font-medium">{entry.playerName}</TableCell>
                <TableCell className="text-right">{entry.score}</TableCell>
                <TableCell className="text-right">{formatTime(entry.elapsedTime)}</TableCell>
                <TableCell className="text-right">{formatDate(entry.date)}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default LeaderboardTable;
