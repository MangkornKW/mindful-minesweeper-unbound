import { Cell, CellState, DifficultyConfig } from "@/types/game";

export interface Lesson {
  id: string;
  title: string;
  description: string;
  grid: Cell[][];
  goal: "reveal" | "flag";
  highlight: { row: number; col: number };
}

// Helper to create empty cell
const emptyCell = (row: number, col: number): Cell => ({
  row,
  col,
  isMine: false,
  adjacentMines: 0,
  state: CellState.UNREVEALED,
});

// 5x5 board basics
const createEmptyGrid = (rows = 5, cols = 5): Cell[][] =>
  Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => emptyCell(r, c))
  );

// Lesson 1 grid – one mine at bottom-right
const lesson1Grid = (() => {
  const g = createEmptyGrid();
  // set mine
  g[4][4].isMine = true;
  g[2][2].adjacentMines = 3;
  g[2][2].state = CellState.REVEALED; // show number
  return g;
})();

export const LESSONS: Lesson[] = [
  {
    id: "basics",
    title: "Reveal Cells",
    description: "Tap the highlighted cell to reveal it.",
    grid: lesson1Grid,
    goal: "reveal",
    highlight: { row: 0, col: 0 },
  },
  {
    id: "flag",
    title: "Flagging Mines",
    description: "Long-press the highlighted cell to place a flag.",
    grid: lesson1Grid,
    goal: "flag",
    highlight: { row: 4, col: 4 },
  },
]; 