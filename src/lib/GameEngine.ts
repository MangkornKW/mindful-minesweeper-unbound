
import { 
  Cell, 
  CellState, 
  CellCoordinate, 
  GameState, 
  GameStats, 
  Difficulty, 
  DifficultyConfig,
  DIFFICULTY_CONFIGS
} from "@/types/game";

import { GridManager } from "./game/GridManager";
import { TimerManager } from "./game/TimerManager";

export class GameEngine {
  private grid: Cell[][] = [];
  private rows: number;
  private cols: number;
  private mines: number;
  private gameState: GameState;
  private flagsPlaced: number = 0;
  private cellsRevealed: number = 0;
  private difficulty: Difficulty = Difficulty.BEGINNER;
  
  private gridManager: GridManager;
  private timerManager: TimerManager;
  
  constructor() {
    // Initialize with beginner difficulty
    const config = DIFFICULTY_CONFIGS[Difficulty.BEGINNER];
    this.rows = config.rows;
    this.cols = config.cols;
    this.mines = config.mines;
    
    // Initialize game state
    this.gameState = GameState.NOT_STARTED;
    
    // Create grid manager and timer manager
    this.gridManager = new GridManager();
    this.timerManager = new TimerManager();
    
    // Create initial empty grid
    this.restart();
  }
  
  // Set difficulty configuration
  public setConfig(config: DifficultyConfig): void {
    this.rows = config.rows;
    this.cols = config.cols;
    this.mines = config.mines;
    
    this.restart();
  }
  
  // Create a new game
  public restart(): void {
    this.gameState = GameState.NOT_STARTED;
    this.flagsPlaced = 0;
    this.cellsRevealed = 0;
    
    // Reset timer
    this.timerManager.reset();
    
    // Create empty grid
    this.gridManager.reset(this.rows, this.cols, this.mines);
    this.grid = this.gridManager.getGrid();
  }
  
  // Reveal a cell
  public revealCell(row: number, col: number): void {
    // Check if coordinates are valid
    if (!this.gridManager.isValidCoord(row, col)) {
      return;
    }
    
    // Get cell from grid
    const cell = this.grid[row][col];
    
    // Check if game is over or cell is already revealed
    if (this.gameState === GameState.WON || this.gameState === GameState.LOST) {
      return;
    }
    
    // Check if cell is flagged
    if (cell.state === CellState.FLAGGED || cell.state === CellState.QUESTION) {
      return;
    }
    
    // Check if cell is already revealed
    if (cell.state === CellState.REVEALED) {
      return;
    }
    
    // First click - start game and place mines
    if (this.gameState === GameState.NOT_STARTED) {
      this.gameState = GameState.IN_PROGRESS;
      this.gridManager.placeMines(row, col);
      this.timerManager.startTimer();
    }
    
    // Reveal cell
    cell.state = CellState.REVEALED;
    this.cellsRevealed++;
    
    // Check if cell contains a mine
    if (cell.isMine) {
      this.gameState = GameState.LOST;
      this.timerManager.stopTimer();
      this.gridManager.revealAllMines();
      return;
    }
    
    // If cell has no adjacent mines, reveal adjacent cells
    if (cell.adjacentMines === 0) {
      const revealedCount = this.gridManager.revealEmptyCells(row, col);
      this.cellsRevealed += revealedCount;
    }
    
    // Check for win condition
    this.checkWinCondition();
  }
  
  // Toggle flag on a cell
  public toggleFlag(row: number, col: number): void {
    // Check if coordinates are valid
    if (!this.gridManager.isValidCoord(row, col)) {
      return;
    }
    
    // Get cell from grid
    const cell = this.grid[row][col];
    
    // Check if game is over or cell is revealed
    if (this.gameState === GameState.WON || this.gameState === GameState.LOST) {
      return;
    }
    
    if (cell.state === CellState.REVEALED) {
      return;
    }
    
    // Start game if not started
    if (this.gameState === GameState.NOT_STARTED) {
      this.gameState = GameState.IN_PROGRESS;
      this.timerManager.startTimer();
    }
    
    // Toggle flag state
    switch (cell.state) {
      case CellState.UNREVEALED:
        cell.state = CellState.FLAGGED;
        this.flagsPlaced++;
        break;
      case CellState.FLAGGED:
        // Toggle through question mark if enabled in settings
        cell.state = CellState.QUESTION;
        this.flagsPlaced--;
        break;
      case CellState.QUESTION:
        cell.state = CellState.UNREVEALED;
        break;
    }
  }
  
  // Chord (middle-click) functionality
  public chordCell(row: number, col: number): void {
    // Check if coordinates are valid
    if (!this.gridManager.isValidCoord(row, col)) {
      return;
    }
    
    // Only allow chording on in-progress games
    if (this.gameState !== GameState.IN_PROGRESS) {
      return;
    }
    
    const cell = this.grid[row][col];
    
    // Only chord on revealed cells with adjacent mines
    if (cell.state !== CellState.REVEALED || cell.adjacentMines === 0) {
      return;
    }
    
    // Count adjacent flags
    let flagCount = 0;
    const directions = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1],           [0, 1],
      [1, -1],  [1, 0],  [1, 1]
    ];
    
    for (const [dx, dy] of directions) {
      const newRow = row + dx;
      const newCol = col + dy;
      
      if (this.gridManager.isValidCoord(newRow, newCol) && 
          this.grid[newRow][newCol].state === CellState.FLAGGED) {
        flagCount++;
      }
    }
    
    // If flag count matches adjacent mines, reveal all unflagged adjacent cells
    if (flagCount === cell.adjacentMines) {
      let hitMine = false;
      
      for (const [dx, dy] of directions) {
        const newRow = row + dx;
        const newCol = col + dy;
        
        if (this.gridManager.isValidCoord(newRow, newCol)) {
          const adjacentCell = this.grid[newRow][newCol];
          
          if (adjacentCell.state !== CellState.REVEALED && 
              adjacentCell.state !== CellState.FLAGGED) {
            // Reveal the cell
            if (adjacentCell.isMine) {
              hitMine = true;
              adjacentCell.state = CellState.REVEALED;
            } else {
              this.revealCell(newRow, newCol);
            }
          }
        }
      }
      
      // If we hit a mine, game over
      if (hitMine) {
        this.gameState = GameState.LOST;
        this.timerManager.stopTimer();
        this.gridManager.revealAllMines();
      }
    }
  }
  
  // Check win condition
  private checkWinCondition(): void {
    const totalCells = this.rows * this.cols;
    const safeCells = totalCells - this.mines;
    
    if (this.cellsRevealed === safeCells) {
      this.gameState = GameState.WON;
      this.timerManager.stopTimer();
      this.flagsPlaced += this.gridManager.flagAllMines();
    }
  }
  
  // Calculate score based on time and difficulty
  public calculateScore(): number {
    if (this.gameState !== GameState.WON) {
      return 0;
    }
    
    const timeBonus = Math.max(1, 1000 - this.timerManager.getElapsedTime() * 10);
    const difficultyMultiplier = DIFFICULTY_CONFIGS[this.difficulty].multiplier;
    
    return Math.floor(timeBonus * difficultyMultiplier);
  }
  
  // Get current grid
  public getGrid(): Cell[][] {
    return this.grid;
  }
  
  // Get current game state
  public getGameState(): GameState {
    return this.gameState;
  }
  
  // Get current game stats
  public getStats(): GameStats {
    return {
      elapsedTime: this.timerManager.getElapsedTime(),
      flagsPlaced: this.flagsPlaced,
      cellsRevealed: this.cellsRevealed,
      totalMines: this.mines,
      flagsRemaining: this.mines - this.flagsPlaced
    };
  }
  
  // Cleanup resources
  public cleanup(): void {
    this.timerManager.cleanup();
  }
}
