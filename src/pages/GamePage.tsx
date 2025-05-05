
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { GameProvider, useGame } from "@/contexts/GameContext";
import GameBoard from "@/components/GameBoard";
import GameHUD from "@/components/GameHUD";
import GameResultDialog from "@/components/GameResultDialog";
import GameMinimap from "@/components/GameMinimap";
import { Difficulty } from "@/types/game";

// Wrapper component to use game context
const GamePageContent: React.FC = () => {
  const { startNewGame, difficulty } = useGame();
  const location = useLocation();
  const navigate = useNavigate();
  const [showMinimap, setShowMinimap] = useState(false);
  
  // Initialize game on mount, only once
  useEffect(() => {
    // Get difficulty from location state, or default to Beginner
    const state = location.state as { difficulty: Difficulty } | undefined;
    const selectedDifficulty = state?.difficulty || Difficulty.BEGINNER;
    
    // Start a new game with the selected difficulty
    startNewGame(selectedDifficulty);
  }, [location.state, startNewGame]); // Include startNewGame in dependencies
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-background to-muted">
      <GameHUD />
      
      {/* Add minimap toggle button for infinite mode */}
      {difficulty === Difficulty.INFINITE && (
        <div className="absolute top-20 right-4 z-20">
          <button 
            onClick={() => setShowMinimap(prev => !prev)}
            className="bg-primary text-primary-foreground p-2 rounded-md mb-2"
          >
            {showMinimap ? "Hide Minimap" : "Show Minimap"}
          </button>
          
          {showMinimap && <GameMinimap />}
        </div>
      )}
      
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
