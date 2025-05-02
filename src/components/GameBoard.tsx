
import React from "react";
import GameCell from "@/components/GameCell";
import { useGame } from "@/contexts/GameContext";

const GameBoard: React.FC = () => {
  const { grid, revealCell, toggleFlag, chordCell } = useGame();
  
  return (
    <div className="flex flex-col items-center justify-center">
      <div className="p-2 bg-gray-200 dark:bg-gray-800 rounded-lg shadow-md">
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
    </div>
  );
};

export default GameBoard;
