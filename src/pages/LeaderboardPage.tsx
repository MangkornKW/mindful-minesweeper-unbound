
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Difficulty } from "@/types/game";
import LeaderboardTable from "@/components/LeaderboardTable";
import { ArrowLeft, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { LeaderboardEntry } from "@/types/game";
import { useAuth } from "@/contexts/AuthContext";
import LoginButton from "@/components/LoginButton";

const fetchLeaderboardData = async (difficulty: string): Promise<LeaderboardEntry[]> => {
  const { data, error } = await supabase
    .from('leaderboard')
    .select('*')
    .eq('difficulty', difficulty)
    .order('score', { ascending: false })
    .limit(20);

  if (error) {
    console.error("Error fetching leaderboard data:", error);
    throw new Error(error.message);
  }

  return data.map(entry => ({
    ...entry,
    id: entry.id,
    difficulty: entry.difficulty as Difficulty,
    date: new Date(entry.date)
  })) as LeaderboardEntry[];
};

const LeaderboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>(Difficulty.BEGINNER);
  
  const { data: leaderboardData, isLoading, error } = useQuery({
    queryKey: ['leaderboard', selectedDifficulty],
    queryFn: () => fetchLeaderboardData(selectedDifficulty),
  });

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-muted">
      <header className="p-4 border-b flex justify-between items-center">
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
        <LoginButton />
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
            <TabsTrigger value={Difficulty.INFINITE}>Infinite</TabsTrigger>
          </TabsList>
          
          {Object.values(Difficulty).map((diff) => (
            <TabsContent key={diff} value={diff}>
              {isLoading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : error ? (
                <div className="text-center py-12 text-red-500">
                  Error loading leaderboard data. Please try again later.
                </div>
              ) : (
                <LeaderboardTable 
                  entries={leaderboardData || []} 
                  selectedDifficulty={diff as Difficulty} 
                />
              )}
            </TabsContent>
          ))}
        </Tabs>
        
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>
            {user ? 
              "Your scores will be saved to the leaderboard when you complete a game." : 
              "Sign in to save your scores to the leaderboard."}
          </p>
        </div>
      </main>
    </div>
  );
};

export default LeaderboardPage;
