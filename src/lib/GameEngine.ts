
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
import { InfiniteGridManager } from "./game/InfiniteGridManager";

export class GameEngine {
  private gridManager: GridManager | InfiniteGridManager;
  private timerManager: TimerManager;
  private gameState: GameState;
  private stats: GameStats;
  private config: DifficultyConfig;
  private isInfiniteMode: boolean;

  constructor(difficulty: Difficulty = Difficulty.BEGINNER, customConfig?: Partial<DifficultyConfig>) {
    // Get config for selected difficulty
    this.config = { ...DIFFICULTY_CONFIGS[difficulty] };
    
    // Apply custom config if provided
    if (customConfig) {
      this.config = { ...this.config, ...customConfig };
    }

    // Initialize game state
    this.gameState = GameState.NOT_STARTED;
    this.isInfiniteMode = difficulty === Difficulty.INFINITE;
    
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
    
    if (this.isInfiniteMode) {
      this.gridManager = new InfiniteGridManager(
        this.config.rows, 
        this.config.cols,
        () => this.incrementCellsRevealed(),
        (increment) => this.updateFlagCount(increment)
      );
    } else {
      this.gridManager = new GridManager(
        this.config.rows, 
        this.config.cols, 
        this.config.mines,
        () => this.incrementCellsRevealed(),
        (increment) => this.updateFlagCount(increment)
      );
    }
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

  // Check if the game is won - not used in infinite mode
  private checkVictory(): boolean {
    if (this.isInfiniteMode) {
      return false; // Infinite mode can't be "won" in the traditional sense
    }
    
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
    
    // Update if we're switching to/from infinite mode
    const newIsInfiniteMode = config.multiplier === DIFFICULTY_CONFIGS[Difficulty.INFINITE].multiplier;
    
    if (this.isInfiniteMode !== newIsInfiniteMode) {
      this.isInfiniteMode = newIsInfiniteMode;
      
      if (this.isInfiniteMode) {
        this.gridManager = new InfiniteGridManager(
          this.config.rows, 
          this.config.cols,
          () => this.incrementCellsRevealed(),
          (increment) => this.updateFlagCount(increment)
        );
      } else {
        this.gridManager = new GridManager(
          this.config.rows, 
          this.config.cols, 
          this.config.mines,
          () => this.incrementCellsRevealed(),
          (increment) => this.updateFlagCount(increment)
        );
      }
    } else if (!this.isInfiniteMode) {
      // For regular modes, just reset the grid manager
      (this.gridManager as GridManager).reset(this.config.rows, this.config.cols, this.config.mines);
    }
  }

  // PUBLIC METHODS

  // Get the current grid
  getGrid(): Cell[][] {
    if (this.isInfiniteMode) {
      return (this.gridManager as InfiniteGridManager).getViewportGrid();
    }
    return (this.gridManager as GridManager).getGrid();
  }

  // Get current game state
  getGameState(): GameState {
    return this.gameState;
  }

  // Get game statistics
  getStats(): GameStats {
    // Update elapsed time from timer manager
    this.stats.elapsedTime = this.timerManager.getElapsedTime();
    
    // In infinite mode, update mines based on revealed area
    if (this.isInfiniteMode) {
      // Adjust stats for infinite mode if needed
      const infiniteStats = (this.gridManager as InfiniteGridManager).getStats();
      this.stats.totalMines = Math.floor(this.stats.cellsRevealed * 0.15); // Approximately 15% of revealed cells
    }
    
    return { ...this.stats };
  }

  // Pan viewport for infinite mode
  panViewport(direction: 'up' | 'down' | 'left' | 'right'): void {
    if (!this.isInfiniteMode) return;
    
    (this.gridManager as InfiniteGridManager).panViewport(direction);
  }

  // Reveal a cell
  revealCell(row: number, col: number): void {
    // Ignore if game is over (except infinite mode)
    if (!this.isInfiniteMode && 
        (this.gameState === GameState.WON || this.gameState === GameState.LOST)) {
      return;
    }
    
    // Start the game if not already started
    if (this.gameState === GameState.NOT_STARTED) {
      if (!this.isInfiniteMode) {
        (this.gridManager as GridManager).placeMines(row, col);
      }
      this.gameState = GameState.IN_PROGRESS;
      this.timerManager.startTimer();
    }
    
    if (this.isInfiniteMode) {
      // In infinite mode, reveal cell using infinite grid manager
      const result = (this.gridManager as InfiniteGridManager).revealCell({ row, col });
      
      // In infinite mode, hitting a mine doesn't end the game
      if (result.hitMine) {
        // Maybe send a notification that a block is locked
      }
    } else {
      // For standard modes, use the regular grid manager
      const grid = (this.gridManager as GridManager).getGrid();
      if (!this.gridManager.isValidCoord(row, col)) {
        return;
      }
      
      const cell = grid[row][col];
      
      // Ignore if cell is already revealed or flagged
      if (cell.state === CellState.REVEALED || cell.state === CellState.FLAGGED) {
        return;
      }
      
      // Clicked on a mine - game over
      if (cell.isMine) {
        cell.state = CellState.REVEALED;
        this.gameState = GameState.LOST;
        (this.gridManager as GridManager).revealAllMines();
        this.timerManager.stopTimer();
        return;
      }
      
      // Reveal the cell
      if (cell.adjacentMines === 0) {
        // Flood fill for empty cells
        (this.gridManager as GridManager).revealEmptyCells(row, col);
      } else {
        cell.state = CellState.REVEALED;
        this.stats.cellsRevealed++;
      }
      
      // Check victory
      if (this.checkVictory()) {
        this.gameState = GameState.WON;
        (this.gridManager as GridManager).flagAllMines(); // Auto-flag all mines on win
        this.timerManager.stopTimer();
      }
    }
  }

  // Toggle flag on a cell
  toggleFlag(row: number, col: number): void {
    // Ignore if game is over or not in infinite mode
    if (!this.isInfiniteMode && 
        (this.gameState === GameState.WON || this.gameState === GameState.LOST)) {
      return;
    }
    
    // Start the game if not already started
    if (this.gameState === GameState.NOT_STARTED) {
      this.gameState = GameState.IN_PROGRESS;
      this.timerManager.startTimer();
    }
    
    if (this.isInfiniteMode) {
      // In infinite mode
      (this.gridManager as InfiniteGridManager).toggleFlag({ row, col });
    } else {
      // Standard mode
      if (!this.gridManager.isValidCoord(row, col)) {
        return;
      }
      
      const grid = (this.gridManager as GridManager).getGrid();
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
    }
  }

  // Chord (middle-click) functionality
  chordCell(row: number, col: number): void {
    // Ignore if game is over
    if (!this.isInfiniteMode && 
        (this.gameState === GameState.WON || this.gameState === GameState.LOST)) {
      return;
    }
    
    // Only allow chording on in-progress games
    if (this.gameState !== GameState.IN_PROGRESS) {
      return;
    }
    
    if (this.isInfiniteMode) {
      // In infinite mode
      const result = (this.gridManager as InfiniteGridManager).chordCell({ row, col });
    } else {
      // Standard mode
      if (!this.gridManager.isValidCoord(row, col)) {
        return;
      }
      
      const grid = (this.gridManager as GridManager).getGrid();
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
    }
  }

  // Calculate score based on time and difficulty
  calculateScore(): number {
    if (this.gameState !== GameState.WON) return 0;
    
    if (this.isInfiniteMode) {
      // For infinite mode, score based on cells revealed and time
      return Math.floor(this.stats.cellsRevealed * this.config.multiplier / 
        Math.max(1, Math.sqrt(this.stats.elapsedTime / 60))); // Scale with sqrt of minutes
    }
    
    // For regular modes
    const maxBonus = 1000 * this.config.multiplier;
    return Math.max(0, maxBonus - (this.stats.elapsedTime * this.config.multiplier));
  }

  // Restart the game with the same difficulty
  restart(): void {
    this.timerManager.reset();
    
    if (this.isInfiniteMode) {
      // Recreate infinite grid manager
      this.gridManager = new InfiniteGridManager(
        this.config.rows, 
        this.config.cols,
        () => this.incrementCellsRevealed(),
        (increment) => this.updateFlagCount(increment)
      );
    } else {
      // Reset normal grid
      (this.gridManager as GridManager).reset(this.config.rows, this.config.cols, this.config.mines);
    }
    
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
