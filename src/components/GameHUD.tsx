
import React from "react";
import { GameState, Difficulty } from "@/types/game";
import { useGame } from "@/contexts/GameContext";
import { Button } from "@/components/ui/button";
import { 
  Flag, 
  Clock,
  RefreshCw,
  Home,
  Pause,
  Play,
  GridIcon
} from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";
import { useNavigate } from "react-router-dom";

const GameHUD: React.FC = () => {
  const { stats, gameState, restartGame, difficulty } = useGame();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const [isPaused, setIsPaused] = React.useState(false);
  
  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Handle pause button
  const handlePause = () => {
    // This is just a visual pause - actual game pause would need to be implemented in GameEngine
    setIsPaused(!isPaused);
  };
  
  // Navigate to main menu
  const handleMainMenu = () => {
    navigate('/');
  };
  
  return (
    <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-4 flex flex-col">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center">
          <Flag className="mr-2 text-yellow-500" size={20} />
          <span className="text-lg font-bold">{stats.flagsRemaining}</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="icon"
            onClick={handlePause}
            className="h-8 w-8"
          >
            {isPaused ? <Play size={16} /> : <Pause size={16} />}
          </Button>
          
          <Button 
            variant="outline" 
            size="icon"
            onClick={restartGame}
            className="h-8 w-8"
          >
            <RefreshCw size={16} />
          </Button>
          
          <Button 
            variant="outline" 
            size="icon"
            onClick={handleMainMenu}
            className="h-8 w-8"
          >
            <Home size={16} />
          </Button>
        </div>
        
        <div className="flex items-center">
          <Clock className="mr-2 text-blue-500" size={20} />
          <span className="text-lg font-bold">{formatTime(stats.elapsedTime)}</span>
        </div>
      </div>
      
      {/* Infinite mode specific stats */}
      {difficulty === Difficulty.INFINITE && (
        <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <GridIcon className="mr-1" size={14} />
            <span>Cells Revealed: {stats.cellsRevealed}</span>
          </div>
          <div>
            <span>Mode: Infinite Exploration</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameHUD;
