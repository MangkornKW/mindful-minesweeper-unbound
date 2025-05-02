
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/contexts/SettingsContext";
import DifficultySelector from "@/components/DifficultySelector";
import { Difficulty } from "@/types/game";
import TutorialOverlay from "@/components/TutorialOverlay";
import { Bomb, Moon, Sun } from "lucide-react";

const MainMenu: React.FC = () => {
  const navigate = useNavigate();
  const { settings, toggleDarkMode } = useSettings();
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>(Difficulty.BEGINNER);
  const [showTutorial, setShowTutorial] = useState(false);
  
  const handlePlay = () => {
    // If they haven't seen the tutorial, show it first
    if (!settings.seenTutorial) {
      setShowTutorial(true);
    } else {
      navigate('/game', { state: { difficulty: selectedDifficulty } });
    }
  };
  
  const handleTutorialComplete = () => {
    setShowTutorial(false);
    navigate('/game', { state: { difficulty: selectedDifficulty } });
  };
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-background to-muted">
      {showTutorial && (
        <TutorialOverlay 
          onComplete={handleTutorialComplete}
          onSkip={() => setShowTutorial(false)}
        />
      )}
      
      <div className="absolute top-4 right-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleDarkMode}
          aria-label="Toggle dark mode"
        >
          {settings.darkMode ? (
            <Sun className="h-6 w-6" />
          ) : (
            <Moon className="h-6 w-6" />
          )}
        </Button>
      </div>
      
      <div className="text-center mb-12">
        <div className="flex items-center justify-center mb-4">
          <Bomb className="w-10 h-10 text-minesweeper-primary mr-2" />
          <h1 className="text-4xl font-bold">Minesweeper</h1>
        </div>
        <p className="text-muted-foreground">Clear the minefield without triggering any explosions!</p>
      </div>
      
      <div className="w-full max-w-xs space-y-8">
        <DifficultySelector value={selectedDifficulty} onChange={setSelectedDifficulty} />
        
        <div className="space-y-4">
          <Button onClick={handlePlay} className="main-menu-button">
            Play Game
          </Button>
          
          <Button
            variant="outline"
            className="w-64"
            onClick={() => setShowTutorial(true)}
          >
            How to Play
          </Button>
          
          <Button
            variant="outline"
            className="w-64"
            onClick={() => navigate('/settings')}
          >
            Settings
          </Button>
          
          <Button
            variant="outline"
            className="w-64"
            onClick={() => navigate('/leaderboard')}
          >
            Leaderboard
          </Button>
        </div>
      </div>
      
      <div className="mt-12 text-xs text-muted-foreground">
        © 2025 Minesweeper App
      </div>
    </div>
  );
};

export default MainMenu;
