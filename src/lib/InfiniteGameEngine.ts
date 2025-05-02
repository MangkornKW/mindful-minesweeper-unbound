import { Cell, CellState, GameState } from "@/types/game";

// Define a sector in the infinite world
export interface Sector {
  id: string;
  x: number;
  y: number;
  grid: Cell[][];
  locked: boolean;
  completed: boolean;
  mineCount: number;
  flagCount: number;
  revealedCount: number;
}

// Viewport tracking
export interface Viewport {
  centerX: number;
  centerY: number;
  zoom: number;
}

export class InfiniteGameEngine {
  private sectors: Map<string, Sector> = new Map();
  private viewport: Viewport = { centerX: 0, centerY: 0, zoom: 1 };
  private globalSeed: number;
  private sectorSize: number = 16;
  private preloadRadius: number = 2;
  private keepRadius: number = 5;
  private baseDifficulty: number = 0.15;
  private difficultyScaling: number = 0.02;
  private gameState: GameState = GameState.NOT_STARTED;
  
  constructor(seed?: number) {
    this.globalSeed = seed || Math.floor(Math.random() * 1000000);
    this.generateInitialSectors();
  }
  
  // Generate a sector ID from coordinates
  private getSectorId(x: number, y: number): string {
    return `${x}:${y}`;
  }
  
  // Deterministic RNG for a sector
  private getSectorSeed(x: number, y: number): number {
    const sectorHash = (x * 73856093) ^ (y * 19349663);
    return this.globalSeed ^ sectorHash;
  }
  
  // Calculate mine density based on distance from origin
  private getMineCountForSector(x: number, y: number): number {
    const distanceFromOrigin = Math.max(Math.abs(x), Math.abs(y));
    const scaledDensity = this.baseDifficulty + distanceFromOrigin * this.difficultyScaling;
    const clampedDensity = Math.min(0.35, scaledDensity); // Cap at 35% density
    
    // Calculate mines for a sector
    const cellCount = this.sectorSize * this.sectorSize;
    return Math.floor(cellCount * clampedDensity);
  }
  
  // Create a new sector
  private createSector(x: number, y: number): Sector {
    const sectorId = this.getSectorId(x, y);
    const sectorSeed = this.getSectorSeed(x, y);
    const mineCount = this.getMineCountForSector(x, y);
    
    // Create empty grid for the sector
    const grid: Cell[][] = [];
    for (let row = 0; row < this.sectorSize; row++) {
      grid[row] = [];
      for (let col = 0; col < this.sectorSize; col++) {
        grid[row][col] = {
          row: row,
          col: col,
          isMine: false,
          adjacentMines: 0,
          state: CellState.UNREVEALED
        };
      }
    }
    
    // Create sector object
    const sector: Sector = {
      id: sectorId,
      x: x,
      y: y,
      grid: grid,
      locked: false,
      completed: false,
      mineCount: mineCount,
      flagCount: 0,
      revealedCount: 0
    };
    
    // Store sector
    this.sectors.set(sectorId, sector);
    
    return sector;
  }
  
  // Generate mines for a sector after first click
  private generateMines(sector: Sector, firstClickRow: number, firstClickCol: number): void {
    // Use sector seed for deterministic generation
    const random = this.createSeededRandom(this.getSectorSeed(sector.x, sector.y));
    
    // Place mines
    let minesToPlace = sector.mineCount;
    while (minesToPlace > 0) {
      const row = Math.floor(random() * this.sectorSize);
      const col = Math.floor(random() * this.sectorSize);
      
      // Skip the first click and adjacent cells
      const isFirstClick = (row === firstClickRow && col === firstClickCol);
      const isAdjacentToFirstClick = Math.abs(row - firstClickRow) <= 1 && Math.abs(col - firstClickCol) <= 1;
      
      if (!isFirstClick && !isAdjacentToFirstClick && !sector.grid[row][col].isMine) {
        sector.grid[row][col].isMine = true;
        minesToPlace--;
      }
    }
    
    // Calculate adjacent mines
    this.calculateAdjacentMines(sector);
  }
  
  // Calculate adjacent mines for each cell in a sector
  private calculateAdjacentMines(sector: Sector): void {
    const directions = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1],           [0, 1],
      [1, -1],  [1, 0],  [1, 1]
    ];
    
    for (let row = 0; row < this.sectorSize; row++) {
      for (let col = 0; col < this.sectorSize; col++) {
        if (!sector.grid[row][col].isMine) {
          let count = 0;
          
          // Count adjacent mines within the sector
          for (const [dx, dy] of directions) {
            const newRow = row + dx;
            const newCol = col + dy;
            
            if (this.isValidSectorCoord(newRow, newCol)) {
              if (sector.grid[newRow][newCol].isMine) {
                count++;
              }
            } else {
              // Handle cross-sector adjacency here if needed
              // This would require checking adjacent sectors
            }
          }
          
          sector.grid[row][col].adjacentMines = count;
        }
      }
    }
  }
  
  // Check if coordinates are valid within a sector
  private isValidSectorCoord(row: number, col: number): boolean {
    return row >= 0 && row < this.sectorSize && col >= 0 && col < this.sectorSize;
  }
  
  // Create a seeded random number generator
  private createSeededRandom(seed: number): () => number {
    return function() {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
  }
  
  // Generate initial sectors around the viewport
  public generateInitialSectors(): void {
    const { centerX, centerY } = this.viewport;
    const sectorX = Math.floor(centerX / this.sectorSize);
    const sectorY = Math.floor(centerY / this.sectorSize);
    
    // Generate sectors in preload radius
    for (let x = sectorX - this.preloadRadius; x <= sectorX + this.preloadRadius; x++) {
      for (let y = sectorY - this.preloadRadius; y <= sectorY + this.preloadRadius; y++) {
        this.createSector(x, y);
      }
    }
  }
  
  // Update visible sectors based on viewport changes
  public updateVisibleSectors(viewport: Viewport): void {
    this.viewport = viewport;
    
    const sectorX = Math.floor(viewport.centerX / this.sectorSize);
    const sectorY = Math.floor(viewport.centerY / this.sectorSize);
    
    // Generate new sectors in preload radius
    for (let x = sectorX - this.preloadRadius; x <= sectorX + this.preloadRadius; x++) {
      for (let y = sectorY - this.preloadRadius; y <= sectorY + this.preloadRadius; y++) {
        const sectorId = this.getSectorId(x, y);
        if (!this.sectors.has(sectorId)) {
          this.createSector(x, y);
        }
      }
    }
    
    // Unload sectors outside keep radius
    const sectorsToRemove: string[] = [];
    for (const [id, sector] of this.sectors.entries()) {
      const distance = Math.max(
        Math.abs(sector.x - sectorX),
        Math.abs(sector.y - sectorY)
      );
      
      if (distance > this.keepRadius) {
        sectorsToRemove.push(id);
      }
    }
    
    // Remove sectors
    for (const id of sectorsToRemove) {
      this.sectors.delete(id);
    }
  }
  
  // Reveal a cell in a sector
  public revealCell(sectorX: number, sectorY: number, row: number, col: number): void {
    const sectorId = this.getSectorId(sectorX, sectorY);
    const sector = this.sectors.get(sectorId);
    
    if (!sector || sector.locked) {
      return;
    }
    
    // Check if cell is valid
    if (!this.isValidSectorCoord(row, col)) {
      return;
    }
    
    const cell = sector.grid[row][col];
    
    // Check if cell is already revealed or flagged
    if (cell.state === CellState.REVEALED || cell.state === CellState.FLAGGED) {
      return;
    }
    
    // Check if mines have been generated for this sector
    let isFirstClick = sector.revealedCount === 0;
    if (isFirstClick) {
      this.generateMines(sector, row, col);
    }
    
    // Reveal cell
    cell.state = CellState.REVEALED;
    sector.revealedCount++;
    
    // Check if cell is a mine
    if (cell.isMine) {
      sector.locked = true;
      return;
    }
    
    // If cell has no adjacent mines, reveal adjacent cells
    if (cell.adjacentMines === 0) {
      this.revealAdjacentEmptyCells(sector, row, col);
    }
    
    // Check if sector is completed
    this.checkSectorCompletion(sector);
  }
  
  // Reveal adjacent empty cells (flood fill)
  private revealAdjacentEmptyCells(sector: Sector, row: number, col: number): void {
    const directions = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1],           [0, 1],
      [1, -1],  [1, 0],  [1, 1]
    ];
    
    const queue: [number, number][] = [];
    queue.push([row, col]);
    
    while (queue.length > 0) {
      const [currentRow, currentCol] = queue.shift()!;
      
      for (const [dx, dy] of directions) {
        const newRow = currentRow + dx;
        const newCol = currentCol + dy;
        
        if (this.isValidSectorCoord(newRow, newCol)) {
          const adjacentCell = sector.grid[newRow][newCol];
          
          if (adjacentCell.state === CellState.UNREVEALED && !adjacentCell.isMine) {
            adjacentCell.state = CellState.REVEALED;
            sector.revealedCount++;
            
            if (adjacentCell.adjacentMines === 0) {
              queue.push([newRow, newCol]);
            }
          }
        }
      }
    }
  }
  
  // Toggle flag on a cell
  public toggleFlag(sectorX: number, sectorY: number, row: number, col: number): void {
    const sectorId = this.getSectorId(sectorX, sectorY);
    const sector = this.sectors.get(sectorId);
    
    if (!sector || sector.locked) {
      return;
    }
    
    // Check if cell is valid
    if (!this.isValidSectorCoord(row, col)) {
      return;
    }
    
    const cell = sector.grid[row][col];
    
    // Check if cell is already revealed
    if (cell.state === CellState.REVEALED) {
      return;
    }
    
    // Toggle flag
    if (cell.state === CellState.UNREVEALED) {
      cell.state = CellState.FLAGGED;
      sector.flagCount++;
    } else if (cell.state === CellState.FLAGGED) {
      cell.state = CellState.QUESTION;
      sector.flagCount--;
    } else {
      cell.state = CellState.UNREVEALED;
    }
  }
  
  // Chord (reveal adjacent cells if enough flags)
  public chordCell(sectorX: number, sectorY: number, row: number, col: number): void {
    const sectorId = this.getSectorId(sectorX, sectorY);
    const sector = this.sectors.get(sectorId);
    
    if (!sector || sector.locked) {
      return;
    }
    
    // Check if cell is valid
    if (!this.isValidSectorCoord(row, col)) {
      return;
    }
    
    const cell = sector.grid[row][col];
    
    // Check if cell is revealed and has adjacent mines
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
      
      if (this.isValidSectorCoord(newRow, newCol)) {
        if (sector.grid[newRow][newCol].state === CellState.FLAGGED) {
          flagCount++;
        }
      }
    }
    
    // If flag count matches adjacent mines, reveal unflagged adjacent cells
    if (flagCount === cell.adjacentMines) {
      for (const [dx, dy] of directions) {
        const newRow = row + dx;
        const newCol = col + dy;
        
        if (this.isValidSectorCoord(newRow, newCol)) {
          const adjacentCell = sector.grid[newRow][newCol];
          
          if (adjacentCell.state !== CellState.REVEALED && adjacentCell.state !== CellState.FLAGGED) {
            this.revealCell(sectorX, sectorY, newRow, newCol);
          }
        }
      }
    }
  }
  
  // Unlock a locked sector (if all adjacent sectors are complete or by spending gems)
  public unlockSector(sectorX: number, sectorY: number, useGems: boolean = false): boolean {
    const sectorId = this.getSectorId(sectorX, sectorY);
    const sector = this.sectors.get(sectorId);
    
    if (!sector || !sector.locked) {
      return false;
    }
    
    // Check if all orthogonally adjacent sectors are completed
    if (!useGems) {
      const adjacentDirections = [[-1, 0], [1, 0], [0, -1], [0, 1]];
      for (const [dx, dy] of adjacentDirections) {
        const adjacentX = sectorX + dx;
        const adjacentY = sectorY + dy;
        const adjacentId = this.getSectorId(adjacentX, adjacentY);
        const adjacentSector = this.sectors.get(adjacentId);
        
        // If any adjacent sector isn't completed, can't unlock
        if (!adjacentSector || !adjacentSector.completed) {
          return false;
        }
      }
    }
    
    // Unlock the sector
    sector.locked = false;
    return true;
  }
  
  // Check if a sector is completed (all non-mine cells revealed)
  private checkSectorCompletion(sector: Sector): void {
    const totalCells = this.sectorSize * this.sectorSize;
    const safeCount = totalCells - sector.mineCount;
    
    if (sector.revealedCount === safeCount) {
      sector.completed = true;
    }
  }
  
  // Get all sectors
  public getSectors(): Map<string, Sector> {
    return this.sectors;
  }
  
  // Get viewport
  public getViewport(): Viewport {
    return this.viewport;
  }
  
  // Get revealed sectors count
  public getCompletedSectorsCount(): number {
    let count = 0;
    for (const sector of this.sectors.values()) {
      if (sector.completed) {
        count++;
      }
    }
    return count;
  }
}
