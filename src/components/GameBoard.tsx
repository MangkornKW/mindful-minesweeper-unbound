
import React, { useState, useEffect, useRef } from "react";
import GameCell from "@/components/GameCell";
import { useGame } from "@/contexts/GameContext";
import { Difficulty } from "@/types/game";
import { Button } from "@/components/ui/button";
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from "lucide-react";

const GameBoard: React.FC = () => {
  const { grid, revealCell, toggleFlag, chordCell, difficulty, panViewport } = useGame();
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const boardRef = useRef<HTMLDivElement>(null);
  
  // Handle mouse or touch dragging for panning in infinite mode
  const handleMouseDown = (e: React.MouseEvent) => {
    if (difficulty !== Difficulty.INFINITE) return;
    
    setIsDragging(true);
    setStartX(e.clientX);
    setStartY(e.clientY);
  };
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || difficulty !== Difficulty.INFINITE) return;
    
    const deltaX = startX - e.clientX;
    const deltaY = startY - e.clientY;
    
    // Only pan if movement is significant
    if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
      const panDirectionX = deltaX > 0 ? 'right' : 'left';
      const panDirectionY = deltaY > 0 ? 'down' : 'up';
      
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        panViewport(panDirectionX);
      } else {
        panViewport(panDirectionY);
      }
      
      setStartX(e.clientX);
      setStartY(e.clientY);
    }
  };
  
  const handleMouseUp = () => {
    setIsDragging(false);
  };
  
  // Add event listener for mouse up outside the board
  useEffect(() => {
    const handleGlobalMouseUp = () => setIsDragging(false);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);
  
  return (
    <div className="flex flex-col items-center justify-center">
      <div 
        ref={boardRef}
        className="p-2 bg-gray-200 dark:bg-gray-800 rounded-lg shadow-md relative"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {grid.map((row, rowIndex) => (
          <div key={`row-${rowIndex}`} className="flex">
            {row.map((cell) => (
              <GameCell
                key={`cell-${cell.row}-${cell.col}`}
                cell={cell}
                onReveal={revealCell}
                onFlag={toggleFlag}
                onChord={chordCell}
              />
            ))}
          </div>
        ))}
      </div>
      
      {difficulty === Difficulty.INFINITE && (
        <div className="mt-4 grid grid-cols-3 grid-rows-3 gap-2 w-36">
          <div className="col-start-1 col-span-1"></div>
          <Button 
            variant="outline" 
            size="icon"
            className="h-10 w-10"
            onClick={() => panViewport('up')}
          >
            <ArrowUp size={18} />
          </Button>
          <div className="col-start-3 col-span-1"></div>
          
          <Button 
            variant="outline" 
            size="icon"
            className="h-10 w-10"
            onClick={() => panViewport('left')}
          >
            <ArrowLeft size={18} />
          </Button>
          <div className="col-start-2 col-span-1"></div>
          <Button 
            variant="outline" 
            size="icon"
            className="h-10 w-10"
            onClick={() => panViewport('right')}
          >
            <ArrowRight size={18} />
          </Button>
          
          <div className="col-start-1 col-span-1"></div>
          <Button 
            variant="outline" 
            size="icon"
            className="h-10 w-10"
            onClick={() => panViewport('down')}
          >
            <ArrowDown size={18} />
          </Button>
          <div className="col-start-3 col-span-1"></div>
        </div>
      )}
    </div>
  );
};

export default GameBoard;
