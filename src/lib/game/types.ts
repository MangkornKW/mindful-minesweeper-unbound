
import { Cell, CellState, GameState, CellCoordinate, GameStats, Difficulty, DifficultyConfig } from "@/types/game";

export {
  Cell,
  CellState,
  GameState,
  CellCoordinate,
  GameStats,
  Difficulty,
  DifficultyConfig
};

export interface ITimerManager {
  startTimer: () => void;
  stopTimer: () => void;
  updateTimer: () => void;
  getElapsedTime: () => number;
  cleanup: () => void;
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
}
