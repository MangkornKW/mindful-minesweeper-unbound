
import { 
  Cell, 
  CellCoordinate, 
  GameState, 
  GameStats, 
  Difficulty, 
  DifficultyConfig,
  CellState,
  Block,
  BlockCoordinate
} from "@/types/game";

// Re-export enums directly so they can be used as types AND values
export { CellState, GameState, Difficulty };

// Re-export other types with the 'export type' syntax for isolated modules
export type { Cell, CellCoordinate, GameStats, DifficultyConfig, Block, BlockCoordinate };

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

export interface IInfiniteGridManager {
  checkViewport: (viewportX: number, viewportY: number, scale: number, viewportWidth: number, viewportHeight: number) => void;
  getCellAt: (row: number, col: number) => Cell | null;
  isBlockLocked: (row: number, col: number) => boolean;
  lockBlock: (row: number, col: number) => void;
  unlockBlock: (row: number, col: number, useGems?: boolean) => boolean;
  addGems: (amount: number) => void;
  getGems: () => number;
  revealCell: (row: number, col: number) => number;
  revealEmptyCells: (row: number, col: number) => number;
  toggleFlag: (row: number, col: number) => void;
  saveBlockState: (blockRow: number, blockCol: number) => void;
  loadBlockState: (blockRow: number, blockCol: number) => boolean;
  getGrid: () => Cell[][];
  getAllBlocks: () => Block[];
  reset: (rows: number, cols: number) => void;
  isValidCoord: (row: number, col: number) => boolean;
}
