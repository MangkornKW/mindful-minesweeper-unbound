
import React, { useState, useEffect, useRef, useCallback } from "react";
import GameCell from "@/components/GameCell";
import { useGame } from "@/contexts/GameContext";
import { Cell, CellState } from "@/types/game";
import { Button } from "@/components/ui/button";
import { LockIcon, UnlockIcon, GemIcon } from "lucide-react";

// Block size constants
const BLOCK_SIZE = 8;
const CELL_SIZE = 30; // in pixels
const DEFAULT_ZOOM = 1.0;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2.0;
const ZOOM_STEP = 0.1;

// Interface for block coordinates
interface BlockCoord {
  x: number;
  y: number;
}

// Interface for viewport
interface Viewport {
  x: number;
  y: number;
  zoom: number;
}

// Interface for a game block
interface GameBlock {
  coord: BlockCoord;
  cells: Cell[][];
  isLocked: boolean;
  distanceFromCenter: number;
}

const GameBoard: React.FC = () => {
  const { 
    revealCell, 
    toggleFlag, 
    chordCell,
    gameState,
    stats
  } = useGame();
  
  // State for managing blocks, viewport, and interaction
  const [blocks, setBlocks] = useState<Record<string, GameBlock>>({});
  const [viewport, setViewport] = useState<Viewport>({ x: 0, y: 0, zoom: DEFAULT_ZOOM });
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const [gems, setGems] = useState(10); // Starting gems
  const [showMinimap, setShowMinimap] = useState(true);
  
  // Refs for the container and its dimensions
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });
  
  // Get key for block coordinates
  const getBlockKey = (x: number, y: number): string => `${x},${y}`;
  
  // Calculate block bomb percentage based on distance from center
  const calculateBlockBombPercentage = (distance: number): number => {
    const baseBombPercentage = 10; // 10% at center
    const incrementPerBlock = 2;   // +2% per distance
    return Math.min(baseBombPercentage + (distance * incrementPerBlock), 40); // Cap at 40%
  };
  
  // Calculate distance from center (0,0)
  const calculateDistanceFromCenter = (x: number, y: number): number => {
    return Math.sqrt(x * x + y * y);
  };
  
  // Generate a new block at the given coordinates
  const generateBlock = useCallback((x: number, y: number): GameBlock => {
    const distance = calculateDistanceFromCenter(x, y);
    const bombPercentage = calculateBlockBombPercentage(distance);
    const bombCount = Math.floor((BLOCK_SIZE * BLOCK_SIZE) * (bombPercentage / 100));
    
    // Create empty cells
    const cells: Cell[][] = Array(BLOCK_SIZE).fill(null).map((_, rowIndex) => 
      Array(BLOCK_SIZE).fill(null).map((_, colIndex) => ({
        isMine: false,
        state: CellState.UNREVEALED,
        adjacentMines: 0,
        row: rowIndex,
        col: colIndex
      }))
    );
    
    // Place mines randomly
    let minesPlaced = 0;
    while (minesPlaced < bombCount) {
      const row = Math.floor(Math.random() * BLOCK_SIZE);
      const col = Math.floor(Math.random() * BLOCK_SIZE);
      
      if (!cells[row][col].isMine) {
        cells[row][col].isMine = true;
        minesPlaced++;
      }
    }
    
    // Calculate adjacent mines
    for (let row = 0; row < BLOCK_SIZE; row++) {
      for (let col = 0; col < BLOCK_SIZE; col++) {
        if (cells[row][col].isMine) continue;
        
        let count = 0;
        for (let r = Math.max(0, row - 1); r <= Math.min(BLOCK_SIZE - 1, row + 1); r++) {
          for (let c = Math.max(0, col - 1); c <= Math.min(BLOCK_SIZE - 1, col + 1); c++) {
            if (r === row && c === col) continue;
            if (cells[r][c].isMine) count++;
          }
        }
        cells[row][col].adjacentMines = count;
      }
    }
    
    return {
      coord: { x, y },
      cells,
      isLocked: false,
      distanceFromCenter: distance
    };
  }, []);
  
  // Check if a block exists, if not, generate it
  const ensureBlockExists = useCallback((x: number, y: number) => {
    const key = getBlockKey(x, y);
    if (!blocks[key]) {
      setBlocks(prevBlocks => ({
        ...prevBlocks,
        [key]: generateBlock(x, y)
      }));
    }
  }, [blocks, generateBlock]);
  
  // Check viewport to determine which blocks to generate or unload
  const checkViewport = useCallback(() => {
    if (!containerRef.current) return;
    
    const effectiveWidth = containerDimensions.width / viewport.zoom;
    const effectiveHeight = containerDimensions.height / viewport.zoom;
    
    // Calculate visible block range with buffer
    const blockWidth = BLOCK_SIZE * CELL_SIZE;
    const blockHeight = BLOCK_SIZE * CELL_SIZE;
    
    const minBlockX = Math.floor((viewport.x - effectiveWidth / 2) / blockWidth) - 1;
    const maxBlockX = Math.ceil((viewport.x + effectiveWidth / 2) / blockWidth) + 1;
    const minBlockY = Math.floor((viewport.y - effectiveHeight / 2) / blockHeight) - 1;
    const maxBlockY = Math.ceil((viewport.y + effectiveHeight / 2) / blockHeight) + 1;
    
    // Generate all needed blocks
    for (let x = minBlockX; x <= maxBlockX; x++) {
      for (let y = minBlockY; y <= maxBlockY; y++) {
        ensureBlockExists(x, y);
      }
    }
    
    // Optionally, unload blocks that are far outside the viewport
    // This would be important for memory optimization in a real game
  }, [viewport, containerDimensions, ensureBlockExists]);
  
  // Handle user interaction with a cell
  const handleCellInteraction = (blockX: number, blockY: number, cellRow: number, cellCol: number, action: 'reveal' | 'flag' | 'chord') => {
    const blockKey = getBlockKey(blockX, blockY);
    const block = blocks[blockKey];
    
    if (!block || block.isLocked) return;
    
    // Calculate absolute cell position
    const absoluteRow = blockY * BLOCK_SIZE + cellRow;
    const absoluteCol = blockX * BLOCK_SIZE + cellCol;
    
    // Perform the requested action
    if (action === 'reveal') {
      revealCell(absoluteRow, absoluteCol);
    } else if (action === 'flag') {
      toggleFlag(absoluteRow, absoluteCol);
    } else if (action === 'chord') {
      chordCell(absoluteRow, absoluteCol);
    }
    
    // Check if a mine was revealed
    if (action === 'reveal' && block.cells[cellRow][cellCol].isMine) {
      lockBlock(blockX, blockY);
    }
    
    // Save the block state
    saveBlockState(blockX, blockY);
  };
  
  // Lock a block
  const lockBlock = (x: number, y: number) => {
    const key = getBlockKey(x, y);
    setBlocks(prevBlocks => {
      if (!prevBlocks[key]) return prevBlocks;
      
      return {
        ...prevBlocks,
        [key]: {
          ...prevBlocks[key],
          isLocked: true
        }
      };
    });
  };
  
  // Unlock a block
  const unlockBlock = (x: number, y: number, method: 'gems' | 'ad' | 'neighbors') => {
    const key = getBlockKey(x, y);
    
    if (method === 'gems' && gems < 5) {
      console.log("Not enough gems to unlock!");
      return;
    }
    
    if (method === 'gems') {
      setGems(prev => prev - 5); // Spend 5 gems
    } else if (method === 'ad') {
      // In a real implementation, this would show an ad
      console.log("Ad would play here");
    }
    
    setBlocks(prevBlocks => {
      if (!prevBlocks[key]) return prevBlocks;
      
      return {
        ...prevBlocks,
        [key]: {
          ...prevBlocks[key],
          isLocked: false
        }
      };
    });
  };
  
  // Check if all neighboring blocks are cleared
  const checkNeighborsCleared = useCallback((x: number, y: number) => {
    const directions = [
      { dx: 0, dy: -1 }, // up
      { dx: 0, dy: 1 },  // down
      { dx: -1, dy: 0 }, // left
      { dx: 1, dy: 0 }   // right
    ];
    
    for (const { dx, dy } of directions) {
      const neighborKey = getBlockKey(x + dx, y + dy);
      const neighbor = blocks[neighborKey];
      
      // If any neighbor doesn't exist or isn't fully cleared, return false
      if (!neighbor || !isBlockFullyCleared(neighbor)) {
        return false;
      }
    }
    
    return true;
  }, [blocks]);
  
  // Check if a block is fully cleared without bombs
  const isBlockFullyCleared = (block: GameBlock) => {
    for (let row = 0; row < BLOCK_SIZE; row++) {
      for (let col = 0; col < BLOCK_SIZE; col++) {
        const cell = block.cells[row][col];
        
        // If any cell is a mine or not revealed, the block isn't cleared
        if (cell.isMine || cell.state !== CellState.REVEALED) {
          return false;
        }
      }
    }
    
    return true;
  };
  
  // Save block state (would use localStorage in a real implementation)
  const saveBlockState = (x: number, y: number) => {
    const key = getBlockKey(x, y);
    const block = blocks[key];
    
    if (!block) return;
    
    // In a real implementation, save to localStorage
    console.log(`Saving block ${key}`);
    // localStorage.setItem(`block_${key}`, JSON.stringify(block));
  };
  
  // Load block state (would use localStorage in a real implementation)
  const loadBlockState = (x: number, y: number): GameBlock | null => {
    const key = getBlockKey(x, y);
    
    // In a real implementation, load from localStorage
    console.log(`Loading block ${key}`);
    // const savedBlock = localStorage.getItem(`block_${key}`);
    // return savedBlock ? JSON.parse(savedBlock) : null;
    
    return null;
  };
  
  // Render a single block
  const renderBlock = (block: GameBlock) => {
    const { x, y } = block.coord;
    const cells = [];
    
    for (let row = 0; row < BLOCK_SIZE; row++) {
      for (let col = 0; col < BLOCK_SIZE; col++) {
        const cell = block.cells[row][col];
        const absoluteRow = y * BLOCK_SIZE + row;
        const absoluteCol = x * BLOCK_SIZE + col;
        
        const cellX = x * BLOCK_SIZE * CELL_SIZE + col * CELL_SIZE;
        const cellY = y * BLOCK_SIZE * CELL_SIZE + row * CELL_SIZE;
        
        cells.push(
          <div
            key={`cell-${absoluteRow}-${absoluteCol}`}
            style={{
              position: 'absolute',
              left: `${cellX}px`,
              top: `${cellY}px`,
              width: `${CELL_SIZE}px`,
              height: `${CELL_SIZE}px`,
              opacity: block.isLocked ? 0.7 : 1
            }}
          >
            <GameCell
              cell={cell}
              onReveal={() => handleCellInteraction(x, y, row, col, 'reveal')}
              onFlag={() => handleCellInteraction(x, y, row, col, 'flag')}
              onChord={() => handleCellInteraction(x, y, row, col, 'chord')}
            />
          </div>
        );
      }
    }
    
    // Add lock overlay and unlock button for locked blocks
    if (block.isLocked) {
      const blockX = x * BLOCK_SIZE * CELL_SIZE;
      const blockY = y * BLOCK_SIZE * CELL_SIZE;
      const blockWidth = BLOCK_SIZE * CELL_SIZE;
      
      cells.push(
        <div 
          key={`lock-${x}-${y}`}
          style={{
            position: 'absolute',
            left: `${blockX + blockWidth / 2 - 15}px`,
            top: `${blockY + blockWidth / 2 - 15}px`,
            width: '30px',
            height: '30px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '50%',
            color: 'white',
            zIndex: 10
          }}
        >
          <LockIcon size={20} />
        </div>
      );
      
      // Unlock button using gems
      cells.push(
        <Button
          key={`unlock-gems-${x}-${y}`}
          variant="outline"
          size="sm"
          className="absolute flex items-center gap-1"
          style={{
            left: `${blockX + 10}px`,
            top: `${blockY + blockWidth - 30}px`,
            zIndex: 10
          }}
          onClick={() => unlockBlock(x, y, 'gems')}
        >
          <UnlockIcon size={14} />
          <GemIcon size={14} />
          5
        </Button>
      );
      
      // Unlock button using ad
      cells.push(
        <Button
          key={`unlock-ad-${x}-${y}`}
          variant="outline"
          size="sm"
          className="absolute"
          style={{
            left: `${blockX + blockWidth - 80}px`,
            top: `${blockY + blockWidth - 30}px`,
            zIndex: 10
          }}
          onClick={() => unlockBlock(x, y, 'ad')}
        >
          Watch Ad
        </Button>
      );
    }
    
    return cells;
  };
  
  // Render all visible blocks
  const renderBlocks = () => {
    if (!containerRef.current) return null;
    
    const visibleBlocks = Object.values(blocks).filter(block => {
      // Simple visibility check - in a real game, this would be more sophisticated
      const { x, y } = block.coord;
      const blockWidth = BLOCK_SIZE * CELL_SIZE;
      const blockX = x * blockWidth;
      const blockY = y * blockWidth;
      
      const viewX = viewport.x;
      const viewY = viewport.y;
      const halfWidth = containerDimensions.width / (2 * viewport.zoom);
      const halfHeight = containerDimensions.height / (2 * viewport.zoom);
      
      return (
        blockX + blockWidth >= viewX - halfWidth &&
        blockX <= viewX + halfWidth &&
        blockY + blockWidth >= viewY - halfHeight &&
        blockY <= viewY + halfHeight
      );
    });
    
    return visibleBlocks.map(renderBlock).flat();
  };
  
  // Render minimap
  const renderMinimap = () => {
    if (!showMinimap) return null;
    
    const minimapSize = 150;
    const minimapScale = 0.1;
    
    return (
      <div 
        className="absolute right-4 bottom-4 bg-background/80 border border-border rounded-lg p-2 shadow-md"
        style={{ width: `${minimapSize}px`, height: `${minimapSize}px` }}
      >
        {/* Center indicator */}
        <div 
          className="absolute"
          style={{ 
            left: `${minimapSize / 2}px`, 
            top: `${minimapSize / 2}px`, 
            width: '6px', 
            height: '6px',
            borderRadius: '50%',
            background: '#ffcc00',
            transform: 'translate(-50%, -50%)',
            zIndex: 2
          }} 
        />
        
        {/* Viewport indicator */}
        <div 
          className="absolute border-2 border-blue-500"
          style={{ 
            left: `${minimapSize / 2 + (viewport.x * minimapScale * -1)}px`, 
            top: `${minimapSize / 2 + (viewport.y * minimapScale * -1)}px`, 
            width: `${containerDimensions.width * minimapScale / viewport.zoom}px`, 
            height: `${containerDimensions.height * minimapScale / viewport.zoom}px`,
            transform: 'translate(-50%, -50%)',
            zIndex: 1
          }} 
        />
        
        {/* Block indicators */}
        {Object.values(blocks).map(block => (
          <div 
            key={`minimap-${block.coord.x}-${block.coord.y}`}
            className={`absolute ${block.isLocked ? 'bg-red-300' : 'bg-green-300'}`}
            style={{ 
              left: `${minimapSize / 2 + (block.coord.x * BLOCK_SIZE * CELL_SIZE * minimapScale * -1)}px`, 
              top: `${minimapSize / 2 + (block.coord.y * BLOCK_SIZE * CELL_SIZE * minimapScale * -1)}px`, 
              width: `${BLOCK_SIZE * CELL_SIZE * minimapScale}px`, 
              height: `${BLOCK_SIZE * CELL_SIZE * minimapScale}px`,
              transform: 'translate(-50%, -50%)'
            }} 
          />
        ))}
      </div>
    );
  };
  
  // Mouse/touch event handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) { // Left click
      setIsDragging(true);
      setLastMousePos({ x: e.clientX, y: e.clientY });
    }
  };
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const dx = (e.clientX - lastMousePos.x) / viewport.zoom;
    const dy = (e.clientY - lastMousePos.y) / viewport.zoom;
    
    setViewport(prev => ({
      ...prev,
      x: prev.x - dx,
      y: prev.y - dy
    }));
    
    setLastMousePos({ x: e.clientX, y: e.clientY });
  };
  
  const handleMouseUp = () => {
    setIsDragging(false);
  };
  
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    
    setViewport(prev => {
      const zoomDelta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
      const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, prev.zoom + zoomDelta));
      
      return {
        ...prev,
        zoom: newZoom
      };
    });
  };
  
  // Touch event handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setLastMousePos({ 
        x: e.touches[0].clientX, 
        y: e.touches[0].clientY 
      });
    }
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    
    const dx = (e.touches[0].clientX - lastMousePos.x) / viewport.zoom;
    const dy = (e.touches[0].clientY - lastMousePos.y) / viewport.zoom;
    
    setViewport(prev => ({
      ...prev,
      x: prev.x - dx,
      y: prev.y - dy
    }));
    
    setLastMousePos({ 
      x: e.touches[0].clientX, 
      y: e.touches[0].clientY 
    });
  };
  
  const handleTouchEnd = () => {
    setIsDragging(false);
  };
  
  // Set up container dimensions
  useEffect(() => {
    if (!containerRef.current) return;
    
    const updateDimensions = () => {
      if (containerRef.current) {
        setContainerDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };
    
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    
    return () => {
      window.removeEventListener('resize', updateDimensions);
    };
  }, []);
  
  // Generate initial blocks
  useEffect(() => {
    // Start with the center block
    ensureBlockExists(0, 0);
    
    // Generate initial blocks around the center
    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        ensureBlockExists(x, y);
      }
    }
  }, [ensureBlockExists]);
  
  // Check viewport when it changes
  useEffect(() => {
    checkViewport();
  }, [viewport, checkViewport]);
  
  // Automatically unlock blocks when neighbors are cleared
  useEffect(() => {
    Object.values(blocks).forEach(block => {
      if (block.isLocked && checkNeighborsCleared(block.coord.x, block.coord.y)) {
        unlockBlock(block.coord.x, block.coord.y, 'neighbors');
      }
    });
  }, [blocks, checkNeighborsCleared]);
  
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="fixed top-4 right-4 bg-background/80 rounded-lg p-2 shadow-md flex items-center z-20">
        <GemIcon className="mr-1" size={16} />
        <span>{gems}</span>
      </div>
      
      <div 
        ref={containerRef}
        className="relative w-full h-[70vh] overflow-hidden bg-gray-100 dark:bg-gray-900 border border-border rounded-lg select-none cursor-grab"
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="absolute"
          style={{
            transform: `scale(${viewport.zoom}) translate(${-viewport.x + containerDimensions.width / (2 * viewport.zoom)}px, ${-viewport.y + containerDimensions.height / (2 * viewport.zoom)}px)`,
            transformOrigin: 'top left'
          }}
        >
          {renderBlocks()}
        </div>
        
        {renderMinimap()}
      </div>
      
      <div className="mt-4 flex gap-2">
        <Button 
          variant="outline"
          onClick={() => setViewport({ x: 0, y: 0, zoom: DEFAULT_ZOOM })}
        >
          Reset View
        </Button>
        <Button
          variant="outline"
          onClick={() => setShowMinimap(!showMinimap)}
        >
          {showMinimap ? 'Hide' : 'Show'} Minimap
        </Button>
      </div>
    </div>
  );
};

export default GameBoard;
