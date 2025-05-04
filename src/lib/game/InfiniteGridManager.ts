import { 
  Cell, 
  CellState, 
  CellCoordinate, 
  BlockCoordinate,
  InfiniteBlock
} from "./types";

export class InfiniteGridManager {
  private blocks: Map<string, InfiniteBlock>;
  private viewportOrigin: CellCoordinate;
  private viewportSize: { rows: number, cols: number };
  private blockSize: number = 8; // Each block is 8x8 cells
  private baseMinePercent: number = 0.15; // Starting mine density
  private onCellRevealed: () => void;
  private onFlagToggled: (increment: boolean) => void;

  constructor(
    initialViewportRows: number, 
    initialViewportCols: number,
    onCellRevealed: () => void,
    onFlagToggled: (increment: boolean) => void
  ) {
    this.blocks = new Map();
    this.viewportOrigin = { row: 0, col: 0 };
    this.viewportSize = { 
      rows: initialViewportRows,
      cols: initialViewportCols
    };
    this.onCellRevealed = onCellRevealed;
    this.onFlagToggled = onFlagToggled;
    
    // Initialize the visible blocks
    this.ensureViewportBlocksExist();
  }
  
  // Get block key for Map storage
  private getBlockKey(blockCoord: BlockCoordinate): string {
    return `${blockCoord.blockRow},${blockCoord.blockCol}`;
  }
  
  // Convert cell coordinate to block coordinate
  private getBlockCoordFromCell(cellCoord: CellCoordinate): BlockCoordinate {
    return {
      blockRow: Math.floor(cellCoord.row / this.blockSize),
      blockCol: Math.floor(cellCoord.col / this.blockSize)
    };
  }
  
  // Convert block coordinate to cell range
  private getBlockCellRange(blockCoord: BlockCoordinate): { startRow: number, startCol: number } {
    return {
      startRow: blockCoord.blockRow * this.blockSize,
      startCol: blockCoord.blockCol * this.blockSize
    };
  }
  
  // Create a new block at the specified coordinates
  private createBlock(blockCoord: BlockCoordinate): InfiniteBlock {
    const { startRow, startCol } = this.getBlockCellRange(blockCoord);
    
    // Calculate difficulty based on distance from origin
    const distanceFromOrigin = Math.sqrt(
      Math.pow(blockCoord.blockRow, 2) + Math.pow(blockCoord.blockCol, 2)
    );
    const difficulty = Math.min(1.0, 0.5 + (distanceFromOrigin * 0.05));
    
    // Create cells for this block
    const cells: Cell[][] = [];
    for (let r = 0; r < this.blockSize; r++) {
      const row: Cell[] = [];
      for (let c = 0; c < this.blockSize; c++) {
        const absoluteRow = startRow + r;
        const absoluteCol = startCol + c;
        
        // Generate mines with increasing probability based on difficulty
        const isMine = Math.random() < (this.baseMinePercent * difficulty);
        
        row.push({
          isMine,
          state: CellState.UNREVEALED,
          adjacentMines: 0,
          row: absoluteRow,
          col: absoluteCol
        });
      }
      cells.push(row);
    }
    
    // Create block
    const block: InfiniteBlock = {
      coordinate: blockCoord,
      cells,
      isLocked: false,
      isExplored: false,
      difficulty
    };
    
    // Calculate adjacent mines for all cells in this block
    this.calculateAdjacentMinesForBlock(block);
    
    return block;
  }
  
  // Calculate adjacent mines for all cells in a block
  private calculateAdjacentMinesForBlock(block: InfiniteBlock): void {
    const { startRow, startCol } = this.getBlockCellRange(block.coordinate);
    
    for (let r = 0; r < this.blockSize; r++) {
      for (let c = 0; c < this.blockSize; c++) {
        if (block.cells[r][c].isMine) continue;
        
        let count = 0;
        // Check all 8 surrounding cells
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            
            const checkRow = r + dr;
            const checkCol = c + dc;
            const absoluteRow = startRow + checkRow;
            const absoluteCol = startCol + checkCol;
            
            // If we're looking outside the current block
            if (checkRow < 0 || checkRow >= this.blockSize || 
                checkCol < 0 || checkCol >= this.blockSize) {
              const neighborCell = this.getCellAt({ row: absoluteRow, col: absoluteCol });
              if (neighborCell?.isMine) count++;
            } else {
              // Check within current block
              if (block.cells[checkRow][checkCol].isMine) count++;
            }
          }
        }
        
        block.cells[r][c].adjacentMines = count;
      }
    }
  }
  
  // Ensure all blocks in the current viewport exist
  private ensureViewportBlocksExist(): void {
    const startBlockRow = Math.floor(this.viewportOrigin.row / this.blockSize);
    const startBlockCol = Math.floor(this.viewportOrigin.col / this.blockSize);
    
    const endBlockRow = Math.ceil((this.viewportOrigin.row + this.viewportSize.rows) / this.blockSize);
    const endBlockCol = Math.ceil((this.viewportOrigin.col + this.viewportSize.cols) / this.blockSize);
    
    for (let blockRow = startBlockRow; blockRow < endBlockRow; blockRow++) {
      for (let blockCol = startBlockCol; blockCol < endBlockCol; blockCol++) {
        const blockCoord = { blockRow, blockCol };
        const blockKey = this.getBlockKey(blockCoord);
        
        if (!this.blocks.has(blockKey)) {
          const newBlock = this.createBlock(blockCoord);
          this.blocks.set(blockKey, newBlock);
        }
      }
    }
  }
  
  // Get a cell at specific coordinates
  public getCellAt(coord: CellCoordinate): Cell | undefined {
    const blockCoord = this.getBlockCoordFromCell(coord);
    const blockKey = this.getBlockKey(blockCoord);
    
    // Ensure the block exists
    if (!this.blocks.has(blockKey)) {
      const newBlock = this.createBlock(blockCoord);
      this.blocks.set(blockKey, newBlock);
    }
    
    const block = this.blocks.get(blockKey)!;
    const { startRow, startCol } = this.getBlockCellRange(blockCoord);
    
    const relativeRow = coord.row - startRow;
    const relativeCol = coord.col - startCol;
    
    if (relativeRow >= 0 && relativeRow < this.blockSize && 
        relativeCol >= 0 && relativeCol < this.blockSize) {
      return block.cells[relativeRow][relativeCol];
    }
    
    return undefined;
  }
  
  // Pan the viewport in a specified direction
  public panViewport(direction: 'up' | 'down' | 'left' | 'right', amount: number = 1): void {
    switch (direction) {
      case 'up':
        this.viewportOrigin.row = Math.max(0, this.viewportOrigin.row - amount);
        break;
      case 'down':
        this.viewportOrigin.row += amount;
        break;
      case 'left':
        this.viewportOrigin.col = Math.max(0, this.viewportOrigin.col - amount);
        break;
      case 'right':
        this.viewportOrigin.col += amount;
        break;
    }
    
    // Make sure all necessary blocks exist after panning
    this.ensureViewportBlocksExist();
  }
  
  // Get the current viewport grid
  public getViewportGrid(): Cell[][] {
    const grid: Cell[][] = [];
    
    for (let r = 0; r < this.viewportSize.rows; r++) {
      const row: Cell[] = [];
      for (let c = 0; c < this.viewportSize.cols; c++) {
        const absoluteRow = this.viewportOrigin.row + r;
        const absoluteCol = this.viewportOrigin.col + c;
        
        const cell = this.getCellAt({ row: absoluteRow, col: absoluteCol });
        if (cell) {
          row.push(cell);
        } else {
          // This shouldn't happen if ensureViewportBlocksExist works correctly
          row.push({
            isMine: false,
            state: CellState.UNREVEALED,
            adjacentMines: 0,
            row: absoluteRow,
            col: absoluteCol
          });
        }
      }
      grid.push(row);
    }
    
    return grid;
  }
  
  // Reveal a cell
  public revealCell(coord: CellCoordinate): { cellsRevealed: number, hitMine: boolean } {
    const cell = this.getCellAt(coord);
    let cellsRevealed = 0;
    let hitMine = false;
    
    if (!cell || cell.state !== CellState.UNREVEALED) {
      return { cellsRevealed, hitMine };
    }
    
    if (cell.isMine) {
      cell.state = CellState.REVEALED;
      hitMine = true;
      // Lock the block
      const blockCoord = this.getBlockCoordFromCell(coord);
      const blockKey = this.getBlockKey(blockCoord);
      const block = this.blocks.get(blockKey);
      if (block) {
        block.isLocked = true;
      }
      return { cellsRevealed: 1, hitMine };
    }
    
    // For empty cells, perform flood fill
    if (cell.adjacentMines === 0) {
      cellsRevealed = this.floodFillReveal(coord);
    } else {
      cell.state = CellState.REVEALED;
      cellsRevealed = 1;
      this.onCellRevealed();
    }
    
    return { cellsRevealed, hitMine };
  }
  
  // Flood fill to reveal empty cells
  private floodFillReveal(coord: CellCoordinate): number {
    const cell = this.getCellAt(coord);
    let cellsRevealed = 0;
    
    if (!cell || cell.state !== CellState.UNREVEALED) {
      return cellsRevealed;
    }
    
    cell.state = CellState.REVEALED;
    cellsRevealed++;
    this.onCellRevealed();
    
    // If it has adjacent mines, stop recursion
    if (cell.adjacentMines > 0) {
      return cellsRevealed;
    }
    
    // Otherwise, reveal all adjacent cells
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue; // Skip the current cell
        
        const newCoord = {
          row: coord.row + dr,
          col: coord.col + dc
        };
        
        cellsRevealed += this.floodFillReveal(newCoord);
      }
    }
    
    return cellsRevealed;
  }
  
  // Toggle flag on a cell
  public toggleFlag(coord: CellCoordinate): boolean {
    const cell = this.getCellAt(coord);
    
    if (!cell || cell.state === CellState.REVEALED) {
      return false;
    }
    
    // Toggle flag state
    switch (cell.state) {
      case CellState.UNREVEALED:
        cell.state = CellState.FLAGGED;
        this.onFlagToggled(true);
        return true;
        
      case CellState.FLAGGED:
        cell.state = CellState.QUESTION;
        this.onFlagToggled(false);
        return true;
        
      case CellState.QUESTION:
        cell.state = CellState.UNREVEALED;
        return true;
        
      default:
        return false;
    }
  }
  
  // Chord cell (reveal surrounding cells if correctly flagged)
  public chordCell(coord: CellCoordinate): { cellsRevealed: number, hitMine: boolean } {
    const cell = this.getCellAt(coord);
    let totalCellsRevealed = 0;
    let hitMine = false;
    
    if (!cell || cell.state !== CellState.REVEALED || cell.adjacentMines === 0) {
      return { cellsRevealed: 0, hitMine };
    }
    
    // Count adjacent flags
    let adjacentFlags = 0;
    const adjacentUnrevealed: CellCoordinate[] = [];
    
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        
        const checkCoord = {
          row: coord.row + dr,
          col: coord.col + dc
        };
        
        const adjacentCell = this.getCellAt(checkCoord);
        if (!adjacentCell) continue;
        
        if (adjacentCell.state === CellState.FLAGGED) {
          adjacentFlags++;
        } else if (adjacentCell.state === CellState.UNREVEALED) {
          adjacentUnrevealed.push(checkCoord);
        }
      }
    }
    
    // If flag count matches adjacent mine count, reveal all adjacent unrevealed cells
    if (adjacentFlags === cell.adjacentMines) {
      for (const coord of adjacentUnrevealed) {
        const result = this.revealCell(coord);
        totalCellsRevealed += result.cellsRevealed;
        if (result.hitMine) {
          hitMine = true;
        }
      }
    }
    
    return { cellsRevealed: totalCellsRevealed, hitMine };
  }
  
  // Get statistics for infinite mode
  public getStats(): {
    totalBlocks: number,
    exploredBlocks: number,
    lockedBlocks: number
  } {
    let exploredBlocks = 0;
    let lockedBlocks = 0;
    
    for (const block of this.blocks.values()) {
      if (block.isExplored) exploredBlocks++;
      if (block.isLocked) lockedBlocks++;
    }
    
    return {
      totalBlocks: this.blocks.size,
      exploredBlocks,
      lockedBlocks
    };
  }
}
