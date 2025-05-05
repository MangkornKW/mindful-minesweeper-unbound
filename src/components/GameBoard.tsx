
import React, { useState, useEffect, useRef } from "react";
import GameCell from "@/components/GameCell";
import { useGame } from "@/contexts/GameContext";
import { Flag, Unlock, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const GameBoard: React.FC = () => {
  const { grid, revealCell, toggleFlag, chordCell } = useGame();
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const boardRef = useRef<HTMLDivElement>(null);
  
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
  const renderBlock = (blockRow: number, blockCol: number, cells: any[][], blockSize: number = 8) => {
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
    
    return (
      <div 
        className="block relative bg-gray-200 dark:bg-gray-800 rounded-md m-1 overflow-hidden"
        key={`block-${blockRow}-${blockCol}`}
      >
        {blockCells}
        
        {/* Block overlay for locked state would go here - to be implemented with InfiniteGridManager */}
        {false && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <Unlock className="text-white" size={24} />
          </div>
        )}
      </div>
    );
  };
  
  // Calculate how many blocks to render based on the grid size
  const renderBlocks = () => {
    if (!grid || !grid.length) return null;
    
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
    </div>
  );
};

export default GameBoard;
