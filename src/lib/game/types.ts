
import { 
  Cell, 
  CellCoordinate, 
  GameState, 
  GameStats, 
  Difficulty, 
  DifficultyConfig,
  CellState
} from "@/types/game";

// Re-export enums directly so they can be used as types AND values
export { CellState, GameState, Difficulty };

// Re-export other types with the 'export type' syntax for isolated modules
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

// New types for infinite mode
export interface BlockCoordinate {
  x: number;
  y: number;
}

export interface GameBlock {
  coord: BlockCoordinate;
  cells: Cell[][];
  isLocked: boolean;
  distanceFromCenter: number;
}

export interface ViewportState {
  x: number;
  y: number;
  zoom: number;
}
