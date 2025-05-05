
import React, { useEffect, useRef, useState } from "react";
import { useGame } from "@/contexts/GameContext";
import { Block, BlockCoordinate } from "@/types/game";

const GameMinimap: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { grid } = useGame();
  const [blocks, setBlocks] = useState<Block[]>([]);
  
  // For a real implementation, we would get this from the InfiniteGridManager
  // This is a placeholder until we connect to the actual data
  useEffect(() => {
    // Simulate blocks based on viewport
    const simulatedBlocks: Block[] = [];
    const range = 5; // Show a 11x11 grid of blocks in minimap
    
    for (let r = -range; r <= range; r++) {
      for (let c = -range; c <= range; c++) {
        const distance = Math.sqrt(r * r + c * c);
        simulatedBlocks.push({
          coordinate: { blockRow: r, blockCol: c },
          cells: [], // We don't need the cells for the minimap
          isLocked: Math.random() > 0.7, // Random locked status for demo
          distance: distance
        });
      }
    }
    
    setBlocks(simulatedBlocks);
  }, []);

  // Draw the minimap
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Calculate block size
    const blockSize = 8;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    // Draw blocks
    blocks.forEach(block => {
      const { blockRow, blockCol } = block.coordinate;
      
      // Position relative to center
      const x = centerX + blockCol * blockSize;
      const y = centerY + blockRow * blockSize;
      
      // Set color based on status
      if (blockRow === 0 && blockCol === 0) {
        // Origin block
        ctx.fillStyle = "#9b87f5"; // Primary purple
      } else if (block.isLocked) {
        // Locked block
        ctx.fillStyle = "#8E9196"; // Neutral gray
      } else {
        // Normal block
        ctx.fillStyle = "#D6BCFA"; // Light purple
      }
      
      // Draw block
      ctx.fillRect(x - blockSize/2, y - blockSize/2, blockSize, blockSize);
      
      // Add border
      ctx.strokeStyle = "#1A1F2C"; // Dark purple
      ctx.lineWidth = 0.5;
      ctx.strokeRect(x - blockSize/2, y - blockSize/2, blockSize, blockSize);
    });
    
    // Draw viewport indicator (current view)
    ctx.strokeStyle = "#1EAEDB"; // Bright blue
    ctx.lineWidth = 2;
    ctx.strokeRect(
      centerX - blockSize * 1.5, 
      centerY - blockSize * 1.5, 
      blockSize * 3, 
      blockSize * 3
    );
    
  }, [blocks]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2 w-[180px] h-[180px]">
      <canvas 
        ref={canvasRef} 
        width={160} 
        height={160} 
        className="w-full h-full"
      />
    </div>
  );
};

export default GameMinimap;
