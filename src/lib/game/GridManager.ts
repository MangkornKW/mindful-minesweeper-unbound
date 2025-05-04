import { Cell, CellState, CellCoordinate, IGridManager } from "./types";

export class GridManager implements IGridManager {
  private grid: Cell[][];
  private mineLocations: CellCoordinate[];
  private rows: number;
  private cols: number;
  private mines: number;
  private onCellRevealed: () => void;
  private onFlagToggled: (increment: boolean) => void;

  constructor(
    rows: number, 
    cols: number, 
    mines: number, 
    onCellRevealed: () => void,
    onFlagToggled: (increment: boolean) => void
  ) {
    this.rows = rows;
    this.cols = cols;
    this.mines = mines;
    this.mineLocations = [];
    this.onCellRevealed = onCellRevealed;
    this.onFlagToggled = onFlagToggled;
    this.grid = this.createEmptyGrid();
  }

  createEmptyGrid(): Cell[][] {
    return Array(this.rows).fill(null).map((_, rowIndex) => 
      Array(this.cols).fill(null).map((_, colIndex) => ({
        isMine: false,
        state: CellState.UNREVEALED,
        adjacentMines: 0,
        row: rowIndex,
        col: colIndex
      }))
    );
  }

  placeMines(firstClickRow: number, firstClickCol: number): void {
    this.mineLocations = [];

    // Create a list of all possible positions excluding the first click
    const possiblePositions: CellCoordinate[] = [];
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        // Skip the first clicked cell and its immediate neighbors
        if (Math.abs(row - firstClickRow) <= 1 && Math.abs(col - firstClickCol) <= 1) {
          continue;
        }
        possiblePositions.push({ row, col });
      }
    }

    // Shuffle the array
    for (let i = possiblePositions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [possiblePositions[i], possiblePositions[j]] = [possiblePositions[j], possiblePositions[i]];
    }

    // Place mines using the first 'mines' positions
    for (let i = 0; i < Math.min(this.mines, possiblePositions.length); i++) {
      const { row, col } = possiblePositions[i];
      this.grid[row][col].isMine = true;
      this.mineLocations.push({ row, col });
    }

    // Calculate adjacent mine counts for each cell
    this.calculateAdjacentMines();
  }

  calculateAdjacentMines(): void {
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        if (this.grid[row][col].isMine) continue;
        
        let count = 0;
        // Check all 8 surrounding cells
        for (let r = Math.max(0, row - 1); r <= Math.min(this.rows - 1, row + 1); r++) {
          for (let c = Math.max(0, col - 1); c <= Math.min(this.cols - 1, col + 1); c++) {
            if (r === row && c === col) continue;
            if (this.grid[r][c].isMine) count++;
          }
        }
        
        this.grid[row][col].adjacentMines = count;
      }
    }
  }

  isValidCoord(row: number, col: number): boolean {
    return row >= 0 && row < this.rows && col >= 0 && col < this.cols;
  }

  revealEmptyCells(row: number, col: number): number {
    let cellsRevealed = 0;
    
    // Base cases
    if (!this.isValidCoord(row, col)) return cellsRevealed;
    
    const cell = this.grid[row][col];
    
    // Skip if already revealed or flagged
    if (cell.state !== CellState.UNREVEALED) return cellsRevealed;
    
    // Reveal this cell
    cell.state = CellState.REVEALED;
    cellsRevealed++;
    this.onCellRevealed();
    
    // If it has adjacent mines, stop recursion
    if (cell.adjacentMines > 0) return cellsRevealed;
    
    // Otherwise, reveal all adjacent cells
    for (let r = row - 1; r <= row + 1; r++) {
      for (let c = col - 1; c <= col + 1; c++) {
        if (r === row && c === col) continue; // Skip the current cell
        cellsRevealed += this.revealEmptyCells(r, c);
      }
    }
    
    return cellsRevealed;
  }

  revealAllMines(): void {
    for (const { row, col } of this.mineLocations) {
      const cell = this.grid[row][col];
      if (cell.state !== CellState.FLAGGED) {
        cell.state = CellState.REVEALED;
      }
    }
  }

  flagAllMines(): number {
    let flagsPlaced = 0;
    for (const { row, col } of this.mineLocations) {
      const cell = this.grid[row][col];
      if (cell.state !== CellState.FLAGGED) {
        cell.state = CellState.FLAGGED;
        flagsPlaced++;
        this.onFlagToggled(true);
      }
    }
    return flagsPlaced;
  }

  getMineLocations(): CellCoordinate[] {
    return [...this.mineLocations];
  }

  getGrid(): Cell[][] {
    return this.grid.map(row => [...row]);
  }
  
  reset(rows: number, cols: number, mines: number): void {
    this.rows = rows;
    this.cols = cols;
    this.mines = mines;
    this.mineLocations = [];
    this.grid = this.createEmptyGrid();
  }
}
