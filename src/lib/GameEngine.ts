import { 
  Cell, 
  CellState, 
  GameState, 
  CellCoordinate, 
  GameStats, 
  Difficulty, 
  DifficultyConfig, 
  DIFFICULTY_CONFIGS 
} from "@/types/game";
import { TimerManager } from "./game/TimerManager";
import { GridManager } from "./game/GridManager";

export class GameEngine {
  private gridManager: GridManager;
  private timerManager: TimerManager;
  private gameState: GameState;
  private stats: GameStats;
  private config: DifficultyConfig;

  constructor(difficulty: Difficulty = Difficulty.BEGINNER, customConfig?: Partial<DifficultyConfig>) {
    // Get config for selected difficulty
    this.config = { ...DIFFICULTY_CONFIGS[difficulty] };
    
    // Apply custom config if provided
    if (customConfig) {
      this.config = { ...this.config, ...customConfig };
    }

    // Initialize game state
    this.gameState = GameState.NOT_STARTED;
    
    // Initialize stats
    this.stats = {
      elapsedTime: 0,
      flagsPlaced: 0,
      cellsRevealed: 0,
      totalMines: this.config.mines,
      flagsRemaining: this.config.mines
    };

    // Initialize managers
    this.timerManager = new TimerManager();
    this.gridManager = new GridManager(
      this.config.rows, 
      this.config.cols, 
      this.config.mines,
      () => this.incrementCellsRevealed(),
      (increment) => this.updateFlagCount(increment)
    );
  }

  // Helper methods for stats
  private incrementCellsRevealed(): void {
    this.stats.cellsRevealed++;
  }

  private updateFlagCount(increment: boolean): void {
    if (increment) {
      this.stats.flagsPlaced++;
      this.stats.flagsRemaining--;
    } else {
      this.stats.flagsPlaced--;
      this.stats.flagsRemaining++;
    }
  }

  // Check if the game is won
  private checkVictory(): boolean {
    const { rows, cols, mines } = this.config;
    const totalCells = rows * cols;
    
    // Game is won when all non-mine cells are revealed
    return this.stats.cellsRevealed === totalCells - mines;
  }

  // Update configuration
  public setConfig(config: DifficultyConfig): void {
    this.config = { ...config };
    this.stats.totalMines = this.config.mines;
    this.stats.flagsRemaining = this.config.mines;
    this.gridManager.reset(this.config.rows, this.config.cols, this.config.mines);
  }

  // Generate suggestions for border cells around revealed cells
  public generateSuggestions(): void {
    // Only generate suggestions if the game is in progress
    if (this.gameState !== GameState.IN_PROGRESS) {
      return;
    }
    
    // Clear any existing suggestions
    this.clearAllSuggestions();
    
    const grid = this.gridManager.getGrid();
    const rows = this.config.rows;
    const cols = this.config.cols;
    
    // Find border cells (unrevealed cells adjacent to revealed cells)
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        // Skip revealed or flagged cells
        if (grid[row][col].state !== CellState.UNREVEALED) {
          continue;
        }
        
        // Check if this is a border cell (adjacent to any revealed cell)
        let isBorder = false;
        for (let r = Math.max(0, row - 1); r <= Math.min(rows - 1, row + 1); r++) {
          for (let c = Math.max(0, col - 1); c <= Math.min(cols - 1, col + 1); c++) {
            if (r === row && c === col) continue;
            if (grid[r][c].state === CellState.REVEALED) {
              isBorder = true;
              break;
            }
          }
          if (isBorder) break;
        }
        
        // If it's a border cell, mark it as suggested
        if (isBorder) {
          this.gridManager.setSuggestion(row, col, true);
        }
      }
    }
  }
  
  // Clear all suggestions
  public clearAllSuggestions(): void {
    this.gridManager.clearAllSuggestions();
  }

  // PUBLIC METHODS

  // Get the current grid
  getGrid(): Cell[][] {
    return this.gridManager.getGrid();
  }

  // Get current game state
  getGameState(): GameState {
    return this.gameState;
  }

  // Get game statistics
  getStats(): GameStats {
    // Update elapsed time from timer manager
    this.stats.elapsedTime = this.timerManager.getElapsedTime();
    return { ...this.stats };
  }

  // Reveal a cell
  revealCell(row: number, col: number): void {
    // Ignore if game is over or cell is invalid
    if (this.gameState === GameState.WON || this.gameState === GameState.LOST || 
        !this.gridManager.isValidCoord(row, col)) {
      return;
    }
    
    const grid = this.gridManager.getGrid();
    const cell = grid[row][col];
    
    // Ignore if cell is already revealed or flagged
    if (cell.state === CellState.REVEALED || cell.state === CellState.FLAGGED) {
      return;
    }
    
    // First click - initialize the game
    if (this.gameState === GameState.NOT_STARTED) {
      this.gridManager.placeMines(row, col);
      this.gameState = GameState.IN_PROGRESS;
      this.timerManager.startTimer();
    }
    
    // Clicked on a mine - game over
    if (cell.isMine) {
      cell.state = CellState.REVEALED;
      this.gameState = GameState.LOST;
      this.gridManager.revealAllMines();
      this.timerManager.stopTimer();
      return;
    }
    
    // Reveal the cell
    if (cell.adjacentMines === 0) {
      // Flood fill for empty cells
      this.gridManager.revealEmptyCells(row, col);
    } else {
      cell.state = CellState.REVEALED;
      this.stats.cellsRevealed++;
    }
    
    // Clear any suggestions after a move
    this.clearAllSuggestions();
    
    // Check victory
    if (this.checkVictory()) {
      this.gameState = GameState.WON;
      this.gridManager.flagAllMines(); // Auto-flag all mines on win
      this.timerManager.stopTimer();
    }
  }

  // Toggle flag on a cell
  toggleFlag(row: number, col: number): void {
    // Ignore if game is over or not started
    if (this.gameState === GameState.WON || this.gameState === GameState.LOST || 
        !this.gridManager.isValidCoord(row, col)) {
      return;
    }
    
    // Start the game if not already started
    if (this.gameState === GameState.NOT_STARTED) {
      this.gameState = GameState.IN_PROGRESS;
      this.timerManager.startTimer();
    }
    
    const grid = this.gridManager.getGrid();
    const cell = grid[row][col];
    
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
    
    // Clear any suggestions after flagging
    this.clearAllSuggestions();
  }

  // Chord (middle-click) functionality - reveal adjacent cells when a numbered cell has correct flags
  chordCell(row: number, col: number): void {
    // Ignore if game is over or cell is invalid
    if (this.gameState === GameState.WON || this.gameState === GameState.LOST) {
      return;
    }
    
    if (!this.gridManager.isValidCoord(row, col)) {
      return;
    }
    
    // Only allow chording on in-progress games
    if (this.gameState !== GameState.IN_PROGRESS) {
      return;
    }
    
    const grid = this.gridManager.getGrid();
    const cell = grid[row][col];
    
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
        
        const adjacentCell = grid[r][c];
        if (adjacentCell.state === CellState.FLAGGED) {
          flagCount++;
        } else if (adjacentCell.state === CellState.UNREVEALED) {
          adjacentCells.push({ row: r, col: c });
        }
      }
    }
    
    // If the number of flags matches the number on the cell, reveal all adjacent non-flagged cells
    if (flagCount === cell.adjacentMines) {
      let gameEnded = false;
      for (const { row: r, col: c } of adjacentCells) {
        this.revealCell(r, c);
        
        // Stop if game is over after revealing a cell
        if (this.gameState === GameState.WON || this.gameState === GameState.LOST) {
          gameEnded = true;
          break;
        }
      }
    }
    
    // Clear any suggestions after chording
    this.clearAllSuggestions();
  }

  // Calculate score based on time and difficulty
  calculateScore(): number {
    if (this.gameState !== GameState.WON) return 0;
    
    const maxBonus = 1000 * this.config.multiplier;
    return Math.max(0, maxBonus - (this.stats.elapsedTime * this.config.multiplier));
  }

  // Restart the game with the same difficulty
  restart(): void {
    this.timerManager.reset();
    this.gridManager.reset(this.config.rows, this.config.cols, this.config.mines);
    this.gameState = GameState.NOT_STARTED;
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
    this.timerManager.cleanup();
  }
}
