import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { GameProvider, useGame } from "@/contexts/GameContext";
import GameBoard from "@/components/GameBoard";
import GameHUD from "@/components/GameHUD";
import GameResultDialog from "@/components/GameResultDialog";
import { Difficulty, DifficultyConfig } from "@/types/game";

// Wrapper component to use game context
const GamePageContent: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { startNewGame } = useGame();
  
  // Initialize game on mount
  useEffect(() => {
    // Get difficulty and custom config from navigation state
    const state = location.state as { difficulty: Difficulty; customConfig?: Partial<DifficultyConfig> } | undefined;
    const difficulty = state?.difficulty || Difficulty.BEGINNER;
    const customConfig = state?.customConfig;
    
    startNewGame(difficulty, customConfig);
  }, [location.state, startNewGame]);
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-background to-muted">
      <GameHUD />
      <GameBoard />
      <GameResultDialog />
      
      <div className="mt-8">
        <button
          onClick={() => navigate("/")}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Return to Main Menu
        </button>
      </div>
    </div>
  );
};

// Main component with provider
const GamePage: React.FC = () => {
  return (
    <GameProvider>
      <GamePageContent />
    </GameProvider>
  );
};

export default GamePage;
