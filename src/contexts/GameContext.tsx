import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { GameEngine } from "@/lib/GameEngine";
import { 
  Cell, 
  CellCoordinate, 
  GameState, 
  GameStats, 
  Difficulty, 
  GameResult,
  DifficultyConfig,
  DIFFICULTY_CONFIGS
} from "@/types/game";
import { useSettings } from "@/contexts/SettingsContext";
import { useToast } from "@/components/ui/use-toast";

interface GameContextType {
  grid: Cell[][];
  gameState: GameState;
  stats: GameStats;
  difficulty: Difficulty;
  revealCell: (row: number, col: number) => void;
  toggleFlag: (row: number, col: number) => void;
  chordCell: (row: number, col: number) => void;
  generateSuggestions: () => void;
  startNewGame: (difficulty: Difficulty, customConfig?: Partial<DifficultyConfig>) => void;
  restartGame: () => void;
  gameResult: GameResult | null;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [gameEngine] = useState<GameEngine>(() => new GameEngine());
  const [grid, setGrid] = useState<Cell[][]>([]);
  const [gameState, setGameState] = useState<GameState>(GameState.NOT_STARTED);
  const [stats, setStats] = useState<GameStats>({ elapsedTime: 0, flagsPlaced: 0, cellsRevealed: 0, totalMines: 0, flagsRemaining: 0 });
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.BEGINNER);
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [shouldUpdateState, setShouldUpdateState] = useState(false);
  const { settings } = useSettings();
  const { toast } = useToast();
  
  // Update game state from engine
  const updateGameState = useCallback(() => {
    setGrid(gameEngine.getGrid());
    setGameState(gameEngine.getGameState());
    setStats(gameEngine.getStats());
    
    // Check for game over conditions
    const currentState = gameEngine.getGameState();
    if (currentState === GameState.WON || currentState === GameState.LOST) {
      const score = gameEngine.calculateScore();
      const result: GameResult = {
        score,
        victory: currentState === GameState.WON,
        elapsedTime: gameEngine.getStats().elapsedTime,
        difficulty,
        date: new Date()
      };
      setGameResult(result);
      
      // Show toast notification
      toast({
        title: currentState === GameState.WON ? "Victory!" : "Game Over",
        description: currentState === GameState.WON 
          ? `You won in ${gameEngine.getStats().elapsedTime} seconds with a score of ${score}!` 
          : "Better luck next time!",
        variant: currentState === GameState.WON ? "default" : "destructive",
      });
    }
  }, [gameEngine, difficulty, toast]);
  
  // Timer effect to update stats periodically
  useEffect(() => {
    if (gameState === GameState.IN_PROGRESS) {
      const interval = setInterval(() => {
        setStats(gameEngine.getStats());
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [gameEngine, gameState]);

  // Update game state when needed
  useEffect(() => {
    if (shouldUpdateState) {
      updateGameState();
      setShouldUpdateState(false);
    }
  }, [shouldUpdateState, updateGameState]);
  
  // Reveal a cell
  const revealCell = useCallback((row: number, col: number) => {
    gameEngine.revealCell(row, col);
    setShouldUpdateState(true);
  }, [gameEngine]);
  
  // Toggle flag on a cell
  const toggleFlag = useCallback((row: number, col: number) => {
    gameEngine.toggleFlag(row, col);
    setShouldUpdateState(true);
  }, [gameEngine]);
  
  // Chord (middle-click) functionality
  const chordCell = useCallback((row: number, col: number) => {
    gameEngine.chordCell(row, col);
    setShouldUpdateState(true);
  }, [gameEngine]);
  
  // Generate suggestions for border cells
  const generateSuggestions = useCallback(() => {
    gameEngine.generateSuggestions();
    setShouldUpdateState(true);
  }, [gameEngine]);
  
  // Start a new game
  const startNewGame = useCallback((newDifficulty: Difficulty, customConfig?: Partial<DifficultyConfig>) => {
    // Reset the game engine with new difficulty
    gameEngine.restart();
    
    // Update difficulty and config if needed
    if (newDifficulty !== difficulty || customConfig) {
      const config = { ...DIFFICULTY_CONFIGS[newDifficulty], ...customConfig };
      gameEngine.setConfig(config);
      setDifficulty(newDifficulty);
    }
    
    setGameResult(null);
    setShouldUpdateState(true);
  }, [gameEngine, difficulty]);
  
  // Restart the current game
  const restartGame = useCallback(() => {
    gameEngine.restart();
    setGameResult(null);
    setShouldUpdateState(true);
  }, [gameEngine]);
  
  // Initialize game on mount
  useEffect(() => {
    updateGameState();
    return () => gameEngine.cleanup();
  }, [gameEngine, updateGameState]);
  
  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    grid,
    gameState,
    stats,
    difficulty,
    revealCell,
    toggleFlag,
    chordCell,
    generateSuggestions,
    startNewGame,
    restartGame,
    gameResult
  }), [grid, gameState, stats, difficulty, revealCell, toggleFlag, chordCell, generateSuggestions, startNewGame, restartGame, gameResult]);
  
  return (
    <GameContext.Provider value={contextValue}>
      {children}
    </GameContext.Provider>
  );
};

// Custom hook to use the game context
export const useGame = (): GameContextType => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error("useGame must be used within a GameProvider");
  }
  return context;
};
