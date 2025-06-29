import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/contexts/SettingsContext";
import DifficultySelector from "@/components/DifficultySelector";
import { Difficulty, DifficultyConfig } from "@/types/game";
import { Bomb, Moon, Sun } from "lucide-react";

const MainMenu: React.FC = () => {
  const navigate = useNavigate();
  const { settings, toggleDarkMode } = useSettings();
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>(Difficulty.BEGINNER);
  const [customConfig, setCustomConfig] = useState<Partial<DifficultyConfig>>({ rows: 10, cols: 10, mines: 15 });
  
  const handlePlay = () => {
    if (selectedDifficulty === Difficulty.CUSTOM) {
      const { rows, cols, mines } = customConfig;
      if (!rows || !cols || !mines) {
        alert("Please fill out rows, cols, and mines for custom mode.");
        return;
      }
      if (mines >= rows * cols) {
        alert("Mines must be fewer than total cells.");
        return;
      }
    }
    navigate('/game', { state: { difficulty: selectedDifficulty, customConfig } });
  };
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-background to-muted">
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
        <DifficultySelector 
          value={selectedDifficulty} 
          onChange={setSelectedDifficulty} 
          customConfig={customConfig}
          onCustomConfigChange={setCustomConfig}
        />
        
        <div className="space-y-4">
          <Button onClick={handlePlay} className="w-full h-12 text-lg font-semibold">
            Play Game
          </Button>
          
          <Button
            variant="outline"
            className="w-full"
            onClick={() => navigate('/settings')}
          >
            Settings
          </Button>
          
          <Button
            variant="outline"
            className="w-full"
            onClick={() => navigate('/leaderboard')}
          >
            Leaderboard
          </Button>
          
          <Button
            variant="outline"
            className="w-full"
            onClick={() => navigate('/how-to-play')}
          >
            How to Play
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
