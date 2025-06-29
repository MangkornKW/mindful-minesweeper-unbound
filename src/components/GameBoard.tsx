import React from "react";
import GameCell from "@/components/GameCell";
import { useGame } from "@/contexts/GameContext";
import { GameState } from "@/types/game";

const GameBoard: React.FC = () => {
  const { 
    grid, 
    gameState, 
    revealCell, 
    toggleFlag, 
    chordCell 
  } = useGame();

  // Don't render if no grid
  if (!grid || grid.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg text-muted-foreground">Loading game...</div>
      </div>
    );
  }

  // Calculate grid dimensions
  const rows = grid.length;
  const cols = grid[0]?.length || 0;

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div 
        className="inline-grid gap-1 p-4 bg-gray-200 dark:bg-gray-800 rounded-lg shadow-lg"
        style={{
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`
        }}
      >
        {grid.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <GameCell
              key={`${rowIndex}-${colIndex}`}
              cell={cell}
              onReveal={revealCell}
              onFlag={toggleFlag}
              onChord={chordCell}
            />
          ))
        )}
      </div>
      
      {gameState === GameState.WON && (
        <div className="mt-4 text-lg font-bold text-green-600">
          🎉 Congratulations! You won! 🎉
        </div>
      )}
      
      {gameState === GameState.LOST && (
        <div className="mt-4 text-lg font-bold text-red-600">
          💥 Game Over! Try again! 💥
        </div>
      )}
    </div>
  );
};

export default GameBoard;
