import { Cell, CellState, GameState, CellCoordinate, GameStats, Difficulty, DifficultyConfig, DIFFICULTY_CONFIGS } from "@/types/game";

export class GameEngine {
  private grid: Cell[][];
  private mineLocations: CellCoordinate[];
  private gameState: GameState;
  private startTime: number | null;
  private elapsedTime: number;
  private stats: GameStats;
  private config: DifficultyConfig;
  private lastTimerUpdate: number;
  private timerInterval: NodeJS.Timeout | null;

  constructor(difficulty: Difficulty = Difficulty.BEGINNER, customConfig?: Partial<DifficultyConfig>) {
    // Get config for selected difficulty
    this.config = { ...DIFFICULTY_CONFIGS[difficulty] };
    
    // Apply custom config if provided
    if (customConfig) {
      this.config = { ...this.config, ...customConfig };
    }

    // Initialize game state
    this.gameState = GameState.NOT_STARTED;
    this.startTime = null;
    this.elapsedTime = 0;
    this.lastTimerUpdate = 0;
    this.timerInterval = null;
    this.mineLocations = [];
    
    // Initialize stats
    this.stats = {
      elapsedTime: 0,
      flagsPlaced: 0,
      cellsRevealed: 0,
      totalMines: this.config.mines,
      flagsRemaining: this.config.mines
    };

    // Initialize grid
    this.grid = this.createEmptyGrid();
  }

  // Create an empty grid with no mines
  private createEmptyGrid(): Cell[][] {
    const { rows, cols } = this.config;
    return Array(rows).fill(null).map((_, rowIndex) => 
      Array(cols).fill(null).map((_, colIndex) => ({
        isMine: false,
        state: CellState.UNREVEALED,
        adjacentMines: 0,
        row: rowIndex,
        col: colIndex
      }))
    );
  }

  // Place mines randomly, avoiding the first clicked cell
  private placeMines(firstClickRow: number, firstClickCol: number): void {
    const { rows, cols, mines } = this.config;
    this.mineLocations = [];

    // Create a list of all possible positions excluding the first click
    const possiblePositions: CellCoordinate[] = [];
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
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
    for (let i = 0; i < Math.min(mines, possiblePositions.length); i++) {
      const { row, col } = possiblePositions[i];
      this.grid[row][col].isMine = true;
      this.mineLocations.push({ row, col });
    }

    // Calculate adjacent mine counts for each cell
    this.calculateAdjacentMines();
  }

  // Calculate the number of adjacent mines for each cell
  private calculateAdjacentMines(): void {
    const { rows, cols } = this.config;
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        if (this.grid[row][col].isMine) continue;
        
        let count = 0;
        // Check all 8 surrounding cells
        for (let r = Math.max(0, row - 1); r <= Math.min(rows - 1, row + 1); r++) {
          for (let c = Math.max(0, col - 1); c <= Math.min(cols - 1, col + 1); c++) {
            if (r === row && c === col) continue;
            if (this.grid[r][c].isMine) count++;
          }
        }
        
        this.grid[row][col].adjacentMines = count;
      }
    }
  }

  // Check if coordinates are valid
  private isValidCoord(row: number, col: number): boolean {
    return row >= 0 && row < this.config.rows && col >= 0 && col < this.config.cols;
  }

  // Start the game timer
  private startTimer(): void {
    if (this.startTime === null) {
      this.startTime = Date.now();
      this.lastTimerUpdate = Date.now();
      this.timerInterval = setInterval(() => this.updateTimer(), 1000);
    }
  }

  // Update the timer
  private updateTimer(): void {
    const now = Date.now();
    const delta = now - this.lastTimerUpdate;
    this.lastTimerUpdate = now;
    
    if (this.gameState === GameState.IN_PROGRESS) {
      this.elapsedTime += delta / 1000;
      this.stats.elapsedTime = Math.floor(this.elapsedTime);
    }
  }

  // Stop the timer
  private stopTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
      this.updateTimer(); // One final update
    }
  }

  // Flood fill algorithm to reveal empty cells
  private revealEmptyCells(row: number, col: number): void {
    // Base cases
    if (!this.isValidCoord(row, col)) return;
    
    const cell = this.grid[row][col];
    
    // Skip if already revealed or flagged
    if (cell.state !== CellState.UNREVEALED) return;
    
    // Reveal this cell
    cell.state = CellState.REVEALED;
    this.stats.cellsRevealed++;
    
    // If it has adjacent mines, stop recursion
    if (cell.adjacentMines > 0) return;
    
    // Otherwise, reveal all adjacent cells
    for (let r = row - 1; r <= row + 1; r++) {
      for (let c = col - 1; c <= col + 1; c++) {
        if (r === row && c === col) continue; // Skip the current cell
        this.revealEmptyCells(r, c);
      }
    }
  }

  // Check if the game is won
  private checkVictory(): boolean {
    const { rows, cols, mines } = this.config;
    const totalCells = rows * cols;
    
    // Game is won when all non-mine cells are revealed
    return this.stats.cellsRevealed === totalCells - mines;
  }

  // PUBLIC METHODS

  // Get the current grid
  getGrid(): Cell[][] {
    return this.grid.map(row => [...row]);
  }

  // Get current game state
  getGameState(): GameState {
    return this.gameState;
  }

  // Get game statistics
  getStats(): GameStats {
    return { ...this.stats };
  }

  // Reveal a cell
  revealCell(row: number, col: number): void {
    // Ignore if game is over or cell is invalid
    if (this.gameState === GameState.WON || this.gameState === GameState.LOST || !this.isValidCoord(row, col)) {
      return;
    }
    
    const cell = this.grid[row][col];
    
    // Ignore if cell is already revealed or flagged
    if (cell.state === CellState.REVEALED || cell.state === CellState.FLAGGED) {
      return;
    }
    
    // First click - initialize the game
    if (this.gameState === GameState.NOT_STARTED) {
      this.placeMines(row, col);
      this.gameState = GameState.IN_PROGRESS;
      this.startTimer();
    }
    
    // Clicked on a mine - game over
    if (cell.isMine) {
      cell.state = CellState.REVEALED;
      this.gameState = GameState.LOST;
      this.revealAllMines();
      this.stopTimer();
      return;
    }
    
    // Reveal the cell
    if (cell.adjacentMines === 0) {
      // Flood fill for empty cells
      this.revealEmptyCells(row, col);
    } else {
      cell.state = CellState.REVEALED;
      this.stats.cellsRevealed++;
    }
    
    // Check victory
    if (this.checkVictory()) {
      this.gameState = GameState.WON;
      this.flagAllMines(); // Auto-flag all mines on win
      this.stopTimer();
    }
  }

  // Toggle flag on a cell
  toggleFlag(row: number, col: number): void {
    // Ignore if game is over or not started
    if (this.gameState === GameState.WON || this.gameState === GameState.LOST || !this.isValidCoord(row, col)) {
      return;
    }
    
    // Start the game if not already started
    if (this.gameState === GameState.NOT_STARTED) {
      this.gameState = GameState.IN_PROGRESS;
      this.startTimer();
    }
    
    const cell = this.grid[row][col];
    
    // Cannot flag revealed cells
    if (cell.state === CellState.REVEALED) {
      return;
    }
    
    // Toggle flag state
    switch (cell.state) {
      case CellState.UNREVEALED:
        if (this.stats.flagsRemaining > 0) {
          cell.state = CellState.FLAGGED;
          this.stats.flagsPlaced++;
          this.stats.flagsRemaining--;
        }
        break;
        
      case CellState.FLAGGED:
        cell.state = CellState.QUESTION;
        this.stats.flagsPlaced--;
        this.stats.flagsRemaining++;
        break;
        
      case CellState.QUESTION:
        cell.state = CellState.UNREVEALED;
        break;
    }
  }

  // Chord (middle-click) functionality - reveal adjacent cells when a numbered cell has correct flags
  chordCell(row: number, col: number): void {
    // Ignore if game is not in progress or cell is invalid
    if (this.gameState !== GameState.IN_PROGRESS || !this.isValidCoord(row, col)) {
      return;
    }
    
    const cell = this.grid[row][col];
    
    // Can only chord on revealed numbered cells
    if (cell.state !== CellState.REVEALED || cell.adjacentMines === 0) {
      return;
    }
    
    // Count adjacent flags
    let flagCount = 0;
    const adjacentCells: CellCoordinate[] = [];
    
    for (let r = Math.max(0, row - 1); r <= Math.min(this.config.rows - 1, row + 1); r++) {
      for (let c = Math.max(0, col - 1); c <= Math.min(this.config.cols - 1, col + 1); c++) {
        if (r === row && c === col) continue;
        
        const adjacentCell = this.grid[r][c];
        if (adjacentCell.state === CellState.FLAGGED) {
          flagCount++;
        } else if (adjacentCell.state === CellState.UNREVEALED) {
          adjacentCells.push({ row: r, col: c });
        }
      }
    }
    
    // If the number of flags matches the number on the cell, reveal all adjacent non-flagged cells
    if (flagCount === cell.adjacentMines) {
      for (const { row: r, col: c } of adjacentCells) {
        this.revealCell(r, c);
        
        // Stop if game is over after revealing a cell
        if (this.gameState === GameState.WON || this.gameState === GameState.LOST) {
          break;
        }
      }
    }
  }

  // Reveal all mines when the game is lost
  private revealAllMines(): void {
    for (const { row, col } of this.mineLocations) {
      const cell = this.grid[row][col];
      if (cell.state !== CellState.FLAGGED) {
        cell.state = CellState.REVEALED;
      }
    }
  }

  // Flag all mines when the game is won
  private flagAllMines(): void {
    for (const { row, col } of this.mineLocations) {
      const cell = this.grid[row][col];
      if (cell.state !== CellState.FLAGGED) {
        cell.state = CellState.FLAGGED;
        this.stats.flagsPlaced++;
        this.stats.flagsRemaining--;
      }
    }
  }

  // Calculate score based on time and difficulty
  calculateScore(): number {
    if (this.gameState !== GameState.WON) return 0;
    
    const maxBonus = 1000 * this.config.multiplier;
    return Math.max(0, maxBonus - (this.stats.elapsedTime * this.config.multiplier));
  }

  // Restart the game with the same difficulty
  restart(): void {
    this.stopTimer();
    this.grid = this.createEmptyGrid();
    this.mineLocations = [];
    this.gameState = GameState.NOT_STARTED;
    this.startTime = null;
    this.elapsedTime = 0;
    this.stats = {
      elapsedTime: 0,
      flagsPlaced: 0,
      cellsRevealed: 0,
      totalMines: this.config.mines,
      flagsRemaining: this.config.mines
    };
  }

  // Clean up when component unmounts
  cleanup(): void {
    this.stopTimer();
  }
}
