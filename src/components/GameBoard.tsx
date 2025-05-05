import React, { useState, useEffect, useRef } from "react";
import GameCell from "@/components/GameCell";
import { useGame } from "@/contexts/GameContext";
import { Flag, Unlock, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Difficulty, Cell } from "@/types/game";

const GameBoard: React.FC = () => {
  const { grid, revealCell, toggleFlag, chordCell, difficulty } = useGame();
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [visibleBlocks, setVisibleBlocks] = useState<Record<string, boolean>>({});
  const boardRef = useRef<HTMLDivElement>(null);
  const lastViewportCheck = useRef<{ x: number, y: number, scale: number }>({ x: 0, y: 0, scale: 1 });
  
  // Track visible viewport for infinite mode
  useEffect(() => {
    if (difficulty !== Difficulty.INFINITE) return;
    
    // Check if we need to generate new blocks based on viewport
    const checkViewport = () => {
      const currentView = {
        x: position.x,
        y: position.y,
        scale
      };
      
      // Only check if viewport has moved significantly
      const xDiff = Math.abs(currentView.x - lastViewportCheck.current.x);
      const yDiff = Math.abs(currentView.y - lastViewportCheck.current.y);
      const scaleDiff = Math.abs(currentView.scale - lastViewportCheck.current.scale);
      
      if (xDiff > 50 || yDiff > 50 || scaleDiff > 0.1) {
        // This would call the InfiniteGridManager.checkViewport method
        // For now, we'll just update visible blocks for demonstration
        const newVisibleBlocks: Record<string, boolean> = {};
        
        // Calculate which blocks should be visible (3x3 grid around center)
        const blockSize = 8 * 24; // 8 cells × 24px per cell
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        // How many blocks fit in viewport
        const visibleBlocksX = Math.ceil(viewportWidth / (blockSize * scale)) + 2; // +2 for buffer
        const visibleBlocksY = Math.ceil(viewportHeight / (blockSize * scale)) + 2;
        
        // Center block coordinates
        const centerBlockX = Math.floor(-position.x / (blockSize * scale));
        const centerBlockY = Math.floor(-position.y / (blockSize * scale));
        
        // Generate blocks in viewport
        for (let r = centerBlockY - visibleBlocksY; r <= centerBlockY + visibleBlocksY; r++) {
          for (let c = centerBlockX - visibleBlocksX; c <= centerBlockX + visibleBlocksX; c++) {
            newVisibleBlocks[`${r},${c}`] = true;
          }
        }
        
        setVisibleBlocks(newVisibleBlocks);
        lastViewportCheck.current = currentView;
        
        console.log(`Visible blocks updated. Center: (${centerBlockX}, ${centerBlockY})`);
      }
    };
    
    checkViewport();
    
    // Also check viewport after user interactions
    const interval = setInterval(checkViewport, 500);
    
    return () => clearInterval(interval);
  }, [position, scale, difficulty]);
  
  // Handle zooming with mouse wheel or buttons
  const handleZoom = (delta: number) => {
    setScale(prev => {
      const newScale = Math.max(0.5, Math.min(2, prev + delta * 0.1));
      return newScale;
    });
  };
  
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -1 : 1;
    handleZoom(delta);
  };
  
  // Handle dragging for pan
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only start dragging if it's not a left click on cell (which is for revealing)
    if (e.button === 1 || e.button === 2 || (e.target as HTMLElement).classList.contains('game-board')) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };
  
  const handleMouseUp = () => {
    setIsDragging(false);
  };
  
  // Handle touch events for mobile devices
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({ 
        x: e.touches[0].clientX - position.x, 
        y: e.touches[0].clientY - position.y 
      });
    }
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging && e.touches.length === 1) {
      setPosition({
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y,
      });
    }
  };
  
  const handleTouchEnd = () => {
    setIsDragging(false);
  };
  
  useEffect(() => {
    // Add event listeners to handle dragging outside the board
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("touchend", handleTouchEnd);
    
    return () => {
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, []);
  
  // Prevent context menu from appearing on right-click
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };
  
  // Render a block of cells (8x8)
  const renderBlock = (blockRow: number, blockCol: number, cells: Cell[][], blockSize: number = 8) => {
    const startRow = blockRow * blockSize;
    const startCol = blockCol * blockSize;
    const blockCells = [];
    
    // Get cells for this block (8x8)
    for (let r = 0; r < blockSize && startRow + r < cells.length; r++) {
      const rowCells = [];
      for (let c = 0; c < blockSize && startCol + c < cells[0].length; c++) {
        const actualRow = startRow + r;
        const actualCol = startCol + c;
        
        if (actualRow < cells.length && actualCol < cells[0].length) {
          const cell = cells[actualRow][actualCol];
          rowCells.push(
            <GameCell
              key={`cell-${cell.row}-${cell.col}`}
              cell={cell}
              onReveal={revealCell}
              onFlag={toggleFlag}
              onChord={chordCell}
            />
          );
        }
      }
      blockCells.push(
        <div key={`block-row-${blockRow}-${r}`} className="flex">
          {rowCells}
        </div>
      );
    }
    
    // Is this block locked? (would be determined by InfiniteGridManager)
    const isLocked = false;
    
    return (
      <div 
        className="block relative bg-gray-200 dark:bg-gray-800 rounded-md m-1 overflow-hidden"
        key={`block-${blockRow}-${blockCol}`}
        data-block-row={blockRow}
        data-block-col={blockCol}
      >
        {blockCells}
        
        {/* Block overlay for locked state */}
        {isLocked && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <Button variant="outline" size="sm" className="bg-primary/80 text-white border-none">
              <Unlock className="mr-1" size={16} />
              Unlock
            </Button>
          </div>
        )}
      </div>
    );
  };
  
  // Calculate how many blocks to render based on the grid size or visible blocks for infinite mode
  const renderBlocks = () => {
    if (!grid || !grid.length) return null;
    
    if (difficulty === Difficulty.INFINITE) {
      // Render blocks based on visible viewport
      const blockKeys = Object.keys(visibleBlocks);
      const blocks = [];
      
      // Sort blocks by row for proper rendering
      const blocksByRow: Record<number, { row: number, col: number }[]> = {};
      
      blockKeys.forEach(key => {
        const [row, col] = key.split(',').map(Number);
        if (!blocksByRow[row]) blocksByRow[row] = [];
        blocksByRow[row].push({ row, col });
      });
      
      // Sort rows and render blocks
      Object.keys(blocksByRow).sort((a, b) => Number(a) - Number(b)).forEach(rowKey => {
        const rowBlocks = blocksByRow[Number(rowKey)].sort((a, b) => a.col - b.col);
        const blockRow = [];
        
        rowBlocks.forEach(({ row, col }) => {
          blockRow.push(renderBlock(row, col, grid, 8));
        });
        
        blocks.push(
          <div key={`block-container-row-${rowKey}`} className="flex">
            {blockRow}
          </div>
        );
      });
      
      return blocks;
    } else {
      // Standard mode - fixed grid
      const blockSize = 8; // Each block is 8x8 cells
      const numRows = Math.ceil(grid.length / blockSize);
      const numCols = Math.ceil(grid[0].length / blockSize);
      const blocks = [];
      
      for (let r = 0; r < numRows; r++) {
        const blockRow = [];
        for (let c = 0; c < numCols; c++) {
          blockRow.push(renderBlock(r, c, grid, blockSize));
        }
        blocks.push(
          <div key={`block-container-row-${r}`} className="flex">
            {blockRow}
          </div>
        );
      }
      
      return blocks;
    }
  };
  
  return (
    <div className="relative flex flex-col items-center justify-center w-full">
      {/* Zoom controls */}
      <div className="absolute top-2 right-2 flex flex-col gap-2 z-10">
        <Button 
          variant="outline" 
          size="icon"
          onClick={() => handleZoom(1)}
          className="bg-white dark:bg-gray-800"
        >
          <ZoomIn size={18} />
        </Button>
        <Button 
          variant="outline" 
          size="icon"
          onClick={() => handleZoom(-1)}
          className="bg-white dark:bg-gray-800"
        >
          <ZoomOut size={18} />
        </Button>
      </div>
      
      {/* Game board container */}
      <div 
        className="overflow-hidden h-[calc(100vh-240px)] w-full max-w-4xl border-2 border-gray-300 dark:border-gray-700 rounded-lg"
        onWheel={handleWheel}
        onContextMenu={handleContextMenu}
      >
        {/* Draggable and zoomable game board */}
        <div
          ref={boardRef}
          className={cn(
            "game-board cursor-grab origin-center transition-transform",
            isDragging && "cursor-grabbing"
          )}
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            touchAction: "none", // Prevent browser handling of touch gestures
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="flex flex-col items-center justify-center p-4">
            {renderBlocks()}
          </div>
        </div>
      </div>
      
      {/* Info text for infinite mode */}
      {difficulty === Difficulty.INFINITE && (
        <div className="text-sm text-muted-foreground mt-2">
          Pan and zoom to explore. Blocks get harder the further you go!
        </div>
      )}
    </div>
  );
};

export default GameBoard;
