
import { Cell, CellState, GameState, CellCoordinate, GameStats, Difficulty, DifficultyConfig } from "@/types/game";

// Re-export types with the 'export type' syntax for isolated modules
export type { Cell, CellState, GameState, CellCoordinate, GameStats, Difficulty, DifficultyConfig };

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
