import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Difficulty } from "@/types/game";
import LeaderboardTable from "@/components/LeaderboardTable";
import { ArrowLeft } from "lucide-react";

// Mock leaderboard data (would typically come from a database)
const MOCK_LEADERBOARD_DATA = {
  [Difficulty.BEGINNER]: [
    { id: 'b1', playerName: 'Player1', score: 980, difficulty: Difficulty.BEGINNER, elapsedTime: 43, date: new Date(2023, 4, 15) },
    { id: 'b2', playerName: 'Player2', score: 920, difficulty: Difficulty.BEGINNER, elapsedTime: 62, date: new Date(2023, 4, 17) },
    { id: 'b3', playerName: 'Player3', score: 890, difficulty: Difficulty.BEGINNER, elapsedTime: 74, date: new Date(2023, 4, 18) },
  ],
  [Difficulty.INTERMEDIATE]: [
    { id: 'i1', playerName: 'Player2', score: 1850, difficulty: Difficulty.INTERMEDIATE, elapsedTime: 145, date: new Date(2023, 4, 10) },
    { id: 'i2', playerName: 'Player1', score: 1620, difficulty: Difficulty.INTERMEDIATE, elapsedTime: 198, date: new Date(2023, 4, 12) },
  ],
  [Difficulty.EXPERT]: [
    { id: 'e1', playerName: 'Player3', score: 3200, difficulty: Difficulty.EXPERT, elapsedTime: 382, date: new Date(2023, 4, 8) },
  ],
  [Difficulty.CUSTOM]: []
};

const LeaderboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>(Difficulty.BEGINNER);
  
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-muted">
      <header className="p-4 border-b">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate("/")}
            className="mr-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">Leaderboard</h1>
        </div>
      </header>
      
      <main className="flex-1 p-6 max-w-4xl mx-auto w-full">
        <Tabs 
          value={selectedDifficulty} 
          onValueChange={(value) => setSelectedDifficulty(value as Difficulty)}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value={Difficulty.BEGINNER}>Beginner</TabsTrigger>
            <TabsTrigger value={Difficulty.INTERMEDIATE}>Intermediate</TabsTrigger>
            <TabsTrigger value={Difficulty.EXPERT}>Expert</TabsTrigger>
            <TabsTrigger value={Difficulty.CUSTOM}>Custom</TabsTrigger>
          </TabsList>
          
          <TabsContent value={Difficulty.BEGINNER}>
            <LeaderboardTable 
              entries={MOCK_LEADERBOARD_DATA[Difficulty.BEGINNER]} 
              selectedDifficulty={Difficulty.BEGINNER} 
            />
          </TabsContent>
          
          <TabsContent value={Difficulty.INTERMEDIATE}>
            <LeaderboardTable 
              entries={MOCK_LEADERBOARD_DATA[Difficulty.INTERMEDIATE]} 
              selectedDifficulty={Difficulty.INTERMEDIATE} 
            />
          </TabsContent>
          
          <TabsContent value={Difficulty.EXPERT}>
            <LeaderboardTable 
              entries={MOCK_LEADERBOARD_DATA[Difficulty.EXPERT]} 
              selectedDifficulty={Difficulty.EXPERT} 
            />
          </TabsContent>
          
          <TabsContent value={Difficulty.CUSTOM}>
            <LeaderboardTable 
              entries={MOCK_LEADERBOARD_DATA[Difficulty.CUSTOM]} 
              selectedDifficulty={Difficulty.CUSTOM} 
            />
          </TabsContent>
        </Tabs>
        
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>Scores are saved locally on your device.</p>
        </div>
      </main>
    </div>
  );
};

export default LeaderboardPage;
