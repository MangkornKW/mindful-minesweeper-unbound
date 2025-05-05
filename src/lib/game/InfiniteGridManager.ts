
import { Cell, CellState, CellCoordinate, Block, BlockCoordinate } from "@/types/game";

const BLOCK_SIZE = 8; // Each block is 8x8 cells

export class InfiniteGridManager {
  private blocks: Map<string, Block> = new Map();
  private onCellRevealed: () => void;
  private onFlagToggled: (increment: boolean) => void;
  private totalRows: number;
  private totalCols: number;
  private gems: number = 0;

  constructor(
    initialRows: number,
    initialCols: number,
    onCellRevealed: () => void,
    onFlagToggled: (increment: boolean) => void
  ) {
    this.totalRows = initialRows;
    this.totalCols = initialCols;
    this.onCellRevealed = onCellRevealed;
    this.onFlagToggled = onFlagToggled;
    
    // Initialize the visible area with blocks
    this.initializeVisibleArea();
  }
  
  // Get block key from coordinates
  private getBlockKey(blockRow: number, blockCol: number): string {
    return `${blockRow},${blockCol}`;
  }
  
  // Get or create a block at the specified coordinates
  private getOrCreateBlock(blockRow: number, blockCol: number): Block {
    const key = this.getBlockKey(blockRow, blockCol);
    if (!this.blocks.has(key)) {
      const block = this.createBlock(blockRow, blockCol);
      this.blocks.set(key, block);
      return block;
    }
    return this.blocks.get(key)!;
  }
  
  // Create a new block at the specified coordinates
  private createBlock(blockRow: number, blockCol: number): Block {
    // Calculate distance from center (0,0) for difficulty
    const distance = Math.sqrt(blockRow * blockRow + blockCol * blockCol);
    
    // Initialize block structure
    const block: Block = {
      coordinate: { blockRow, blockCol },
      cells: [],
      isLocked: false,
      distance
    };
    
    // Create cells for this block
    for (let r = 0; r < BLOCK_SIZE; r++) {
      block.cells[r] = [];
      for (let c = 0; c < BLOCK_SIZE; c++) {
        const absoluteRow = blockRow * BLOCK_SIZE + r;
        const absoluteCol = blockCol * BLOCK_SIZE + c;
        
        block.cells[r][c] = {
          isMine: false, // Will be set later during mine placement
          state: CellState.UNREVEALED,
          adjacentMines: 0, // Will be calculated after mines are placed
          row: absoluteRow,
          col: absoluteCol
        };
      }
    }
    
    // Calculate bomb density based on distance from center
    let bombProbability = 0.1 + (distance * 0.02); // 10% + 2% per block distance
    bombProbability = Math.min(bombProbability, 0.4); // Cap at 40%
    
    // Place mines
    for (let r = 0; r < BLOCK_SIZE; r++) {
      for (let c = 0; c < BLOCK_SIZE; c++) {
        if (Math.random() < bombProbability) {
          block.cells[r][c].isMine = true;
        }
      }
    }
    
    // Calculate adjacent mines
    this.calculateAdjacentMinesForBlock(block);
    
    return block;
  }
  
  // Calculate adjacent mines for cells in a block
  private calculateAdjacentMinesForBlock(block: Block): void {
    const { blockRow, blockCol } = block.coordinate;
    
    for (let r = 0; r < BLOCK_SIZE; r++) {
      for (let c = 0; c < BLOCK_SIZE; c++) {
        // Skip if this cell is a mine
        if (block.cells[r][c].isMine) continue;
        
        let count = 0;
        
        // Check all 8 adjacent cells
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            
            const nr = r + dr;
            const nc = c + dc;
            
            // If adjacent cell is within the same block
            if (nr >= 0 && nr < BLOCK_SIZE && nc >= 0 && nc < BLOCK_SIZE) {
              if (block.cells[nr][nc].isMine) {
                count++;
              }
            } else {
              // We need to check in adjacent blocks
              const adjBlockRow = blockRow + Math.floor(nr / BLOCK_SIZE);
              const adjBlockCol = blockCol + Math.floor(nc / BLOCK_SIZE);
              const localR = (nr + BLOCK_SIZE) % BLOCK_SIZE;
              const localC = (nc + BLOCK_SIZE) % BLOCK_SIZE;
              
              // Check if the adjacent block exists, if not we'll need the info
              // but we won't create the block just for this count
              const key = this.getBlockKey(adjBlockRow, adjBlockCol);
              if (this.blocks.has(key)) {
                const adjBlock = this.blocks.get(key)!;
                if (adjBlock.cells[localR][localC].isMine) {
                  count++;
                }
              }
            }
          }
        }
        
        block.cells[r][c].adjacentMines = count;
      }
    }
  }
  
  // Initialize the visible area with blocks
  private initializeVisibleArea(): void {
    const initialBlockRows = Math.ceil(this.totalRows / BLOCK_SIZE);
    const initialBlockCols = Math.ceil(this.totalCols / BLOCK_SIZE);
    
    // Generate blocks for the initial visible area
    for (let br = -Math.floor(initialBlockRows/2); br < Math.ceil(initialBlockRows/2); br++) {
      for (let bc = -Math.floor(initialBlockCols/2); bc < Math.ceil(initialBlockCols/2); bc++) {
        this.getOrCreateBlock(br, bc);
      }
    }
  }
  
  // Check and update viewport to load/unload blocks as needed
  checkViewport(viewportX: number, viewportY: number, scale: number, viewportWidth: number, viewportHeight: number): void {
    // Calculate which blocks are visible in the current viewport
    const blockSize = BLOCK_SIZE * scale;
    const visibleBlockXMin = Math.floor((viewportX - blockSize) / blockSize);
    const visibleBlockYMin = Math.floor((viewportY - blockSize) / blockSize);
    const visibleBlockXMax = Math.ceil((viewportX + viewportWidth + blockSize) / blockSize);
    const visibleBlockYMax = Math.ceil((viewportY + viewportHeight + blockSize) / blockSize);
    
    // Generate new blocks if needed
    for (let br = visibleBlockYMin; br <= visibleBlockYMax; br++) {
      for (let bc = visibleBlockXMin; bc <= visibleBlockXMax; bc++) {
        this.getOrCreateBlock(br, bc);
      }
    }
    
    // Optionally: Remove blocks far from the viewport to save memory
    // This is more important for large worlds or memory-constrained devices
  }
  
  // Map global coordinates to block and local coordinates
  private getBlockAndLocalCoords(row: number, col: number): { 
    blockCoord: BlockCoordinate, 
    localRow: number, 
    localCol: number 
  } {
    const blockRow = Math.floor(row / BLOCK_SIZE);
    const blockCol = Math.floor(col / BLOCK_SIZE);
    const localRow = ((row % BLOCK_SIZE) + BLOCK_SIZE) % BLOCK_SIZE;
    const localCol = ((col % BLOCK_SIZE) + BLOCK_SIZE) % BLOCK_SIZE;
    
    return {
      blockCoord: { blockRow, blockCol },
      localRow,
      localCol
    };
  }
  
  // Get a cell at the specified coordinates
  getCellAt(row: number, col: number): Cell | null {
    const { blockCoord, localRow, localCol } = this.getBlockAndLocalCoords(row, col);
    const blockKey = this.getBlockKey(blockCoord.blockRow, blockCoord.blockCol);
    
    // If the block doesn't exist yet, create it
    if (!this.blocks.has(blockKey)) {
      const block = this.getOrCreateBlock(blockCoord.blockRow, blockCoord.blockCol);
      return block.cells[localRow][localCol];
    }
    
    const block = this.blocks.get(blockKey)!;
    return block.cells[localRow][localCol];
  }
  
  // Check if the block containing the specified cell is locked
  isBlockLocked(row: number, col: number): boolean {
    const { blockCoord } = this.getBlockAndLocalCoords(row, col);
    const blockKey = this.getBlockKey(blockCoord.blockRow, blockCoord.blockCol);
    
    if (!this.blocks.has(blockKey)) {
      return false; // Block doesn't exist yet, so not locked
    }
    
    return this.blocks.get(blockKey)!.isLocked;
  }
  
  // Lock a block after hitting a mine
  lockBlock(row: number, col: number): void {
    const { blockCoord } = this.getBlockAndLocalCoords(row, col);
    const blockKey = this.getBlockKey(blockCoord.blockRow, blockCoord.blockCol);
    
    if (this.blocks.has(blockKey)) {
      const block = this.blocks.get(blockKey)!;
      block.isLocked = true;
      
      // Optional: Save block state here
      this.saveBlockState(blockCoord.blockRow, blockCoord.blockCol);
    }
  }
  
  // Unlock a block using gems or ads
  unlockBlock(row: number, col: number, useGems: boolean = true): boolean {
    const { blockCoord } = this.getBlockAndLocalCoords(row, col);
    const blockKey = this.getBlockKey(blockCoord.blockRow, blockCoord.blockCol);
    
    if (!this.blocks.has(blockKey)) {
      return false;
    }
    
    const block = this.blocks.get(blockKey)!;
    if (!block.isLocked) {
      return false;
    }
    
    // Cost to unlock increases with distance
    const gemCost = Math.max(1, Math.floor(block.distance));
    
    if (useGems) {
      if (this.gems >= gemCost) {
        this.gems -= gemCost;
        block.isLocked = false;
        return true;
      }
      return false;
    } else {
      // Ad-based unlock logic would go here
      // For demo purposes, just unlock it
      block.isLocked = false;
      return true;
    }
  }
  
  // Add gems to the player's account
  addGems(amount: number): void {
    this.gems += amount;
  }
  
  // Get the current gem count
  getGems(): number {
    return this.gems;
  }
  
  // Check for automatic unlocking of blocks
  checkAutoUnlock(blockRow: number, blockCol: number): void {
    // Check if all four adjacent blocks are fully cleared (no hidden bombs)
    const adjacent = [
      { r: blockRow - 1, c: blockCol }, // top
      { r: blockRow + 1, c: blockCol }, // bottom
      { r: blockRow, c: blockCol - 1 }, // left
      { r: blockRow, c: blockCol + 1 }  // right
    ];
    
    let allAdjacentsCleared = true;
    
    for (const { r, c } of adjacent) {
      const key = this.getBlockKey(r, c);
      if (!this.blocks.has(key)) {
        allAdjacentsCleared = false;
        break;
      }
      
      const block = this.blocks.get(key)!;
      
      // Check if this adjacent block is fully cleared (all non-mine cells revealed)
      let blockFullyCleared = true;
      for (let lr = 0; lr < BLOCK_SIZE; lr++) {
        for (let lc = 0; lc < BLOCK_SIZE; lc++) {
          const cell = block.cells[lr][lc];
          if (!cell.isMine && cell.state !== CellState.REVEALED) {
            blockFullyCleared = false;
            break;
          }
        }
        if (!blockFullyCleared) break;
      }
      
      if (!blockFullyCleared) {
        allAdjacentsCleared = false;
        break;
      }
    }
    
    // If all adjacent blocks are cleared, unlock this one
    if (allAdjacentsCleared) {
      const key = this.getBlockKey(blockRow, blockCol);
      if (this.blocks.has(key)) {
        const block = this.blocks.get(key)!;
        block.isLocked = false;
      }
    }
  }
  
  // Reveal a cell
  revealCell(row: number, col: number): number {
    const cell = this.getCellAt(row, col);
    if (!cell) return 0;
    
    // Check if the block is locked
    if (this.isBlockLocked(row, col)) {
      return 0;
    }
    
    // Already revealed or flagged
    if (cell.state === CellState.REVEALED || cell.state === CellState.FLAGGED) {
      return 0;
    }
    
    // Reveal the cell
    cell.state = CellState.REVEALED;
    this.onCellRevealed();
    
    // If it's a mine, lock the block
    if (cell.isMine) {
      this.lockBlock(row, col);
      return 1;
    }
    
    // If it's an empty cell, flood fill
    if (cell.adjacentMines === 0) {
      return 1 + this.revealEmptyCells(row, col);
    }
    
    return 1;
  }
  
  // Reveal empty cells (flood fill)
  revealEmptyCells(row: number, col: number): number {
    let cellsRevealed = 0;
    
    // Check all 8 adjacent cells
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        
        const nr = row + dr;
        const nc = col + dc;
        const cell = this.getCellAt(nr, nc);
        
        // Skip if cell doesn't exist or block is locked
        if (!cell || this.isBlockLocked(nr, nc)) continue;
        
        // Skip if already revealed or flagged
        if (cell.state === CellState.REVEALED || cell.state === CellState.FLAGGED) continue;
        
        // Reveal this cell
        cell.state = CellState.REVEALED;
        this.onCellRevealed();
        cellsRevealed++;
        
        // Continue flood fill for empty cells
        if (cell.adjacentMines === 0) {
          cellsRevealed += this.revealEmptyCells(nr, nc);
        }
      }
    }
    
    return cellsRevealed;
  }
  
  // Toggle flag on a cell
  toggleFlag(row: number, col: number): void {
    const cell = this.getCellAt(row, col);
    if (!cell) return;
    
    // Check if the block is locked
    if (this.isBlockLocked(row, col)) {
      return;
    }
    
    // Cannot flag revealed cells
    if (cell.state === CellState.REVEALED) {
      return;
    }
    
    // Toggle flag state
    switch (cell.state) {
      case CellState.UNREVEALED:
        cell.state = CellState.FLAGGED;
        this.onFlagToggled(true);
        break;
        
      case CellState.FLAGGED:
        cell.state = CellState.QUESTION;
        this.onFlagToggled(false);
        break;
        
      case CellState.QUESTION:
        cell.state = CellState.UNREVEALED;
        break;
    }
  }
  
  // Save block state to local storage
  saveBlockState(blockRow: number, blockCol: number): void {
    const key = this.getBlockKey(blockRow, blockCol);
    if (!this.blocks.has(key)) return;
    
    const block = this.blocks.get(key)!;
    const blockData = {
      coordinate: block.coordinate,
      isLocked: block.isLocked,
      cells: block.cells.map(row => 
        row.map(cell => ({
          isMine: cell.isMine,
          state: cell.state,
          adjacentMines: cell.adjacentMines,
          row: cell.row,
          col: cell.col
        }))
      )
    };
    
    try {
      localStorage.setItem(`block_${key}`, JSON.stringify(blockData));
    } catch (e) {
      console.error("Failed to save block state:", e);
    }
  }
  
  // Load block state from local storage
  loadBlockState(blockRow: number, blockCol: number): boolean {
    const key = this.getBlockKey(blockRow, blockCol);
    const savedData = localStorage.getItem(`block_${key}`);
    
    if (!savedData) return false;
    
    try {
      const blockData = JSON.parse(savedData);
      
      // Create the block if it doesn't exist
      if (!this.blocks.has(key)) {
        const distance = Math.sqrt(blockRow * blockRow + blockCol * blockCol);
        const block: Block = {
          coordinate: { blockRow, blockCol },
          cells: blockData.cells,
          isLocked: blockData.isLocked,
          distance
        };
        this.blocks.set(key, block);
      } else {
        // Update existing block
        const block = this.blocks.get(key)!;
        block.cells = blockData.cells;
        block.isLocked = blockData.isLocked;
      }
      
      return true;
    } catch (e) {
      console.error("Failed to load block state:", e);
      return false;
    }
  }
  
  // Get a flattened representation of the grid for the game board
  getGrid(): Cell[][] {
    // Determine bounds of the currently loaded blocks
    let minRow = Infinity, maxRow = -Infinity;
    let minCol = Infinity, maxCol = -Infinity;
    
    for (const block of this.blocks.values()) {
      const { blockRow, blockCol } = block.coordinate;
      minRow = Math.min(minRow, blockRow);
      maxRow = Math.max(maxRow, blockRow);
      minCol = Math.min(minCol, blockCol);
      maxCol = Math.max(maxCol, blockCol);
    }
    
    // If no blocks loaded yet, return empty grid
    if (minRow === Infinity) {
      return [];
    }
    
    // Calculate grid dimensions
    const rowCount = (maxRow - minRow + 1) * BLOCK_SIZE;
    const colCount = (maxCol - minCol + 1) * BLOCK_SIZE;
    
    // Create empty grid
    const grid: Cell[][] = Array(rowCount).fill(null).map(() => 
      Array(colCount).fill(null).map(() => ({
        isMine: false,
        state: CellState.UNREVEALED,
        adjacentMines: 0,
        row: 0,
        col: 0
      }))
    );
    
    // Fill in cells from loaded blocks
    for (const block of this.blocks.values()) {
      const { blockRow, blockCol } = block.coordinate;
      const baseRow = (blockRow - minRow) * BLOCK_SIZE;
      const baseCol = (blockCol - minCol) * BLOCK_SIZE;
      
      // Copy cells from this block to the grid
      for (let r = 0; r < BLOCK_SIZE; r++) {
        for (let c = 0; c < BLOCK_SIZE; c++) {
          grid[baseRow + r][baseCol + c] = { ...block.cells[r][c] };
        }
      }
    }
    
    return grid;
  }
  
  // Get all blocks for direct rendering
  getAllBlocks(): Block[] {
    return Array.from(this.blocks.values());
  }
  
  // Reset the entire grid
  reset(rows: number, cols: number): void {
    this.blocks.clear();
    this.totalRows = rows;
    this.totalCols = cols;
    this.initializeVisibleArea();
  }
  
  // Check if coordinates are valid
  isValidCoord(row: number, col: number): boolean {
    return this.getCellAt(row, col) !== null;
  }
}
