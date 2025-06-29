import React, { useState } from "react";
import { Lesson } from "@/tutorial/lessons";
import GameCell from "@/components/GameCell";
import { Cell, CellState } from "@/types/game";

interface Props {
  lesson: Lesson;
  onComplete: () => void;
}

const TutorialBoard: React.FC<Props> = ({ lesson, onComplete }) => {
  const [grid, setGrid] = useState<Cell[][]>(() => lesson.grid.map(row => row.map(cell => ({ ...cell }))));

  const handleReveal = (row: number, col: number) => {
    if (lesson.highlight && (row !== lesson.highlight.row || col !== lesson.highlight.col)) return;
    const newGrid = grid.map(r => r.map(c => ({ ...c })));
    const cell = newGrid[row][col];
    if (cell.state !== CellState.UNREVEALED) return;
    cell.state = CellState.REVEALED;
    setGrid(newGrid);
    if (lesson.goal === "reveal") onComplete();
  };

  const handleFlag = (row: number, col: number) => {
    if (lesson.highlight && (row !== lesson.highlight.row || col !== lesson.highlight.col)) return;
    const newGrid = grid.map(r => r.map(c => ({ ...c })));
    const cell = newGrid[row][col];
    if (cell.state === CellState.UNREVEALED) {
      cell.state = CellState.FLAGGED;
    } else if (cell.state === CellState.FLAGGED) {
      cell.state = CellState.UNREVEALED;
    }
    setGrid(newGrid);
    if (lesson.goal === "flag" && cell.state === CellState.FLAGGED) onComplete();
  };

  return (
    <div className="inline-grid gap-1" style={{ gridTemplateColumns: `repeat(${grid[0].length}, 1fr)` }}>
      {grid.map((row, r) =>
        row.map((cell, c) => (
          <GameCell key={`${r}-${c}`} cell={cell} onReveal={handleReveal} onFlag={handleFlag} onChord={() => {}} highlight={lesson.highlight?.row===r && lesson.highlight?.col===c} />
        ))
      )}
    </div>
  );
};

export default TutorialBoard; 