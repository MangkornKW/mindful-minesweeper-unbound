
import React, { useState, useEffect } from "react";
import { Cell, CellState } from "@/types/game";
import { cn } from "@/lib/utils";
import { useSettings } from "@/contexts/SettingsContext";
import { FlagIcon, HelpCircleIcon, BombIcon } from "lucide-react";

interface GameCellProps {
  cell: Cell;
  onReveal: (row: number, col: number) => void;
  onFlag: (row: number, col: number) => void;
  onChord: (row: number, col: number) => void;
}

const GameCell: React.FC<GameCellProps> = ({ cell, onReveal, onFlag, onChord }) => {
  const { settings } = useSettings();
  const [isLongPressing, setIsLongPressing] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Handle long press for flagging
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isLongPressing) {
      timer = setTimeout(() => {
        onFlag(cell.row, cell.col);
        setIsLongPressing(false);
      }, 500);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isLongPressing, cell, onFlag]);
  
  // Handle mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    // Right click
    if (e.button === 2) {
      e.preventDefault();
      onFlag(cell.row, cell.col);
      return;
    }
    
    // Middle click
    if (e.button === 1) {
      e.preventDefault();
      onChord(cell.row, cell.col);
      return;
    }
    
    // Left click - start long press timer
    if (e.button === 0) {
      setIsLongPressing(true);
    }
  };
  
  const handleMouseUp = (e: React.MouseEvent) => {
    if (e.button === 0 && isLongPressing) {
      setIsLongPressing(false);
      onReveal(cell.row, cell.col);
    }
  };
  
  const handleMouseLeave = () => {
    setIsLongPressing(false);
  };
  
  // Handle touch events
  const handleTouchStart = () => {
    setIsLongPressing(true);
  };
  
  const handleTouchEnd = () => {
    if (isLongPressing) {
      setIsLongPressing(false);
      onReveal(cell.row, cell.col);
    }
  };
  
  const handleTouchMove = () => {
    setIsLongPressing(false);
  };
  
  // Handle context menu (right click)
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };
  
  // Determine cell content and style
  const getCellContent = () => {
    switch (cell.state) {
      case CellState.UNREVEALED:
        return null;
      case CellState.FLAGGED:
        return <FlagIcon className="w-4 h-4" />;
      case CellState.QUESTION:
        return <HelpCircleIcon className="w-4 h-4" />;
      case CellState.REVEALED:
        if (cell.isMine) {
          return <BombIcon className="w-4 h-4" />;
        }
        return cell.adjacentMines > 0 ? cell.adjacentMines : null;
    }
  };
  
  const getCellClass = () => {
    const baseClass = "game-cell";
    
    if (cell.state === CellState.REVEALED) {
      if (cell.isMine) {
        return `${baseClass} cell-mine`;
      }
      return cn(
        baseClass, 
        "cell-revealed", 
        cell.adjacentMines > 0 && `cell-number-${cell.adjacentMines}`
      );
    }
    
    if (cell.state === CellState.FLAGGED) {
      return `${baseClass} cell-flagged`;
    }
    
    if (cell.state === CellState.QUESTION) {
      return `${baseClass} cell-unrevealed`;
    }
    
    return `${baseClass} cell-unrevealed`;
  };
  
  // Animation effect when cell is revealed
  useEffect(() => {
    if (cell.state === CellState.REVEALED) {
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [cell.state]);
  
  return (
    <div
      className={cn(
        getCellClass(),
        isAnimating && "animate-reveal-tile",
        isLongPressing && "scale-95"
      )}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
      onContextMenu={handleContextMenu}
      aria-label={`Cell at row ${cell.row}, column ${cell.col}`}
      role="button"
      tabIndex={0}
    >
      {getCellContent()}
    </div>
  );
};

export default GameCell;
