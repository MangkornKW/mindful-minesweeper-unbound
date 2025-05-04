
import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { GameProvider, useGame } from "@/contexts/GameContext";
import GameBoard from "@/components/GameBoard";
import GameHUD from "@/components/GameHUD";
import GameResultDialog from "@/components/GameResultDialog";
import { Difficulty } from "@/types/game";

// GamePageContent must be inside the GameProvider
const GamePageContent: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { startNewGame } = useGame();
  
  // Initialize game on mount
  useEffect(() => {
    // Get difficulty from location state, or default to Beginner
    const state = location.state as { difficulty: Difficulty } | undefined;
    const difficulty = state?.difficulty || Difficulty.BEGINNER;
    
    // Start a new game with the selected difficulty
    startNewGame(difficulty);
    
  }, [location.state, startNewGame]); // Add startNewGame to dependencies
  
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

// Main component with provider - ensure GamePageContent is wrapped with GameProvider
const GamePage: React.FC = () => {
  return (
    <GameProvider>
      <GamePageContent />
    </GameProvider>
  );
};

export default GamePage;
