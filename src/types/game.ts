export enum CellState {
  UNREVEALED,
  REVEALED,
  FLAGGED,
  QUESTION
}

export enum GameState {
  NOT_STARTED,
  IN_PROGRESS,
  WON,
  LOST
}

export enum Difficulty {
  BEGINNER = "BEGINNER",
  INTERMEDIATE = "INTERMEDIATE",
  EXPERT = "EXPERT",
  CUSTOM = "CUSTOM"
}

export type DifficultyConfig = {
  rows: number;
  cols: number;
  mines: number;
  multiplier: number; // For score calculation
};

export const DIFFICULTY_CONFIGS: Record<Difficulty, DifficultyConfig> = {
  [Difficulty.BEGINNER]: {
    rows: 9,
    cols: 9,
    mines: 10,
    multiplier: 0.5
  },
  [Difficulty.INTERMEDIATE]: {
    rows: 16,
    cols: 16,
    mines: 40,
    multiplier: 1
  },
  [Difficulty.EXPERT]: {
    rows: 16,
    cols: 30,
    mines: 99,
    multiplier: 2
  },
  [Difficulty.CUSTOM]: {
    rows: 10,
    cols: 10,
    mines: 15,
    multiplier: 1
  }
};

export interface Cell {
  isMine: boolean;
  state: CellState;
  adjacentMines: number;
  row: number;
  col: number;
}

export interface CellCoordinate {
  row: number;
  col: number;
}

export interface GameConfig {
  difficulty: Difficulty;
  rows: number;
  cols: number;
  mines: number;
}

export interface GameStats {
  elapsedTime: number;
  flagsPlaced: number;
  cellsRevealed: number;
  totalMines: number;
  flagsRemaining: number;
}

export interface GameResult {
  score: number;
  victory: boolean;
  elapsedTime: number;
  difficulty: Difficulty;
  date: Date;
}

export interface AppSettings {
  darkMode: boolean;
  soundEnabled: boolean;
  musicEnabled: boolean;
  hapticEnabled: boolean;
  highContrastMode: boolean;
  seenTutorial: boolean;
}

export interface LeaderboardEntry {
  id: string;
  playerName: string;
  score: number;
  difficulty: Difficulty;
  elapsedTime: number;
  date: Date;
}
