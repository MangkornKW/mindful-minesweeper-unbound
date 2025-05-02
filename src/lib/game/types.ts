
import { 
  Cell, 
  CellCoordinate, 
  GameStats, 
  DifficultyConfig,
  CellState,
  GameState,
  Difficulty
} from "@/types/game";

// Re-export enums so they can be used as both types AND values
export { CellState, GameState, Difficulty };

// Re-export other types
export type { Cell, CellCoordinate, GameStats, DifficultyConfig };

export interface ITimerManager {
  startTimer: () => void;
  stopTimer: () => void;
  updateTimer: () => void;
  getElapsedTime: () => number;
  cleanup: () => void;
  reset: () => void;
}

export interface IGridManager {
  createEmptyGrid: () => Cell[][];
  placeMines: (firstClickRow: number, firstClickCol: number) => void;
  getMineLocations: () => CellCoordinate[];
  getGrid: () => Cell[][];
  isValidCoord: (row: number, col: number) => boolean;
  revealEmptyCells: (row: number, col: number) => number;
  revealAllMines: () => void;
  flagAllMines: () => number;
  calculateAdjacentMines: () => void;
  reset: (rows: number, cols: number, mines: number) => void;
}
