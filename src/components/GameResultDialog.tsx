
import React from "react";
import { useGame } from "@/contexts/GameContext";
import { GameState } from "@/types/game";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Trophy, AlertCircle, RefreshCw, Home, Share2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const GameResultDialog: React.FC = () => {
  const { gameState, gameResult, restartGame } = useGame();
  const navigate = useNavigate();
  const [open, setOpen] = React.useState(false);
  
  // Show dialog when game is over
  React.useEffect(() => {
    if (gameState === GameState.WON || gameState === GameState.LOST) {
      setOpen(true);
    } else {
      setOpen(false);
    }
  }, [gameState]);
  
  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };
  
  // Share score (would typically use Web Share API)
  const handleShare = () => {
    if (!gameResult) return;
    
    const message = gameResult.victory
      ? `I just won a game of Minesweeper in ${formatTime(gameResult.elapsedTime)} with a score of ${gameResult.score}!`
      : `I just played a game of Minesweeper and reached a score of ${gameResult.score}.`;
      
    // Use Web Share API if available
    if (navigator.share) {
      navigator.share({
        title: 'My Minesweeper Score',
        text: message,
      })
      .catch((error) => console.log('Error sharing:', error));
    } else {
      // Fallback - copy to clipboard
      navigator.clipboard.writeText(message)
        .then(() => alert('Score copied to clipboard!'))
        .catch((error) => console.log('Error copying:', error));
    }
  };
  
  if (!gameResult) return null;
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            {gameResult.victory ? (
              <>
                <Trophy className="w-6 h-6 mr-2 text-yellow-500" />
                Victory!
              </>
            ) : (
              <>
                <AlertCircle className="w-6 h-6 mr-2 text-red-500" />
                Game Over
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {gameResult.victory
              ? "Congratulations! You've successfully cleared the minefield."
              : "Better luck next time!"}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="flex flex-col items-center space-y-2">
            {gameResult.victory && (
              <div className="text-3xl font-bold text-minesweeper-secondary">
                {gameResult.score} points
              </div>
            )}
            
            <div className="text-sm text-muted-foreground">
              Time: {formatTime(gameResult.elapsedTime)}
            </div>
            
            <div className="text-sm text-muted-foreground">
              Difficulty: {gameResult.difficulty}
            </div>
          </div>
        </div>
        
        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => {
              setOpen(false);
              restartGame();
            }}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Play Again
          </Button>
          
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => {
              setOpen(false);
              navigate("/");
            }}
          >
            <Home className="w-4 h-4 mr-2" />
            Main Menu
          </Button>
          
          <Button
            className="flex-1"
            onClick={handleShare}
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share Score
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GameResultDialog;
