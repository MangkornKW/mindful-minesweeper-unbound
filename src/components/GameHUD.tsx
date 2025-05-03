
import React from "react";
import { GameState } from "@/types/game";
import { useGame } from "@/contexts/GameContext";
import { Button } from "@/components/ui/button";
import { 
  Flag, 
  Clock,
  RefreshCw,
  Home,
  Pause,
  Play,
  BorderOuter
} from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";
import { useNavigate } from "react-router-dom";

const GameHUD: React.FC = () => {
  const { stats, gameState, restartGame, generateSuggestions } = useGame();
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
  
  // Handle suggestion button click
  const handleSuggestion = () => {
    generateSuggestions();
  };
  
  return (
    <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-4 flex justify-between items-center">
      <div className="flex items-center">
        <Flag className="mr-2 text-yellow-500" size={20} />
        <span className="text-lg font-bold">{stats.flagsRemaining}</span>
      </div>
      
      <div className="flex items-center space-x-2">
        <Button 
          variant="outline" 
          size="icon"
          onClick={handleSuggestion}
          className="h-8 w-8"
          title="Get suggestions"
          disabled={gameState !== GameState.IN_PROGRESS}
        >
          <BorderOuter size={16} />
        </Button>
        
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
  );
};

export default GameHUD;
