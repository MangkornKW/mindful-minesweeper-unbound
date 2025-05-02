
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, X, Flag, Hand, Clock, Bomb } from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";

interface TutorialStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  position: "center" | "top-left" | "top-right" | "bottom-left" | "bottom-right";
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    title: "Welcome to Minesweeper!",
    description: "The goal is to reveal all cells without mines. I'll show you how to play.",
    icon: <Bomb className="w-8 h-8" />,
    position: "center"
  },
  {
    title: "Tap to reveal",
    description: "Tap any cell to reveal what's underneath. Numbers show how many mines are adjacent.",
    icon: <Hand className="w-8 h-8" />,
    position: "center"
  },
  {
    title: "Flag potential mines",
    description: "Long press or right-click to place a flag on cells you suspect contain mines.",
    icon: <Flag className="w-8 h-8" />,
    position: "bottom-right"
  },
  {
    title: "Watch your time",
    description: "The timer starts on your first move. Try to complete the game as fast as possible!",
    icon: <Clock className="w-8 h-8" />,
    position: "top-right"
  },
  {
    title: "You're ready!",
    description: "Now you know the basics. Be careful not to tap on any mines, and good luck!",
    icon: <Check className="w-8 h-8" />,
    position: "center"
  }
];

interface TutorialOverlayProps {
  onComplete: () => void;
  onSkip?: () => void;
}

const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ onComplete, onSkip }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const { markTutorialSeen } = useSettings();
  const isLastStep = currentStep === TUTORIAL_STEPS.length - 1;
  
  const handleNext = () => {
    if (isLastStep) {
      markTutorialSeen();
      onComplete();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };
  
  const handleSkip = () => {
    markTutorialSeen();
    if (onSkip) {
      onSkip();
    } else {
      onComplete();
    }
  };
  
  const step = TUTORIAL_STEPS[currentStep];
  
  // Position class based on step
  const getPositionClass = () => {
    switch (step.position) {
      case "top-left":
        return "items-start justify-start text-left p-8";
      case "top-right":
        return "items-start justify-end text-right p-8";
      case "bottom-left":
        return "items-end justify-start text-left p-8";
      case "bottom-right":
        return "items-end justify-end text-right p-8";
      case "center":
      default:
        return "items-center justify-center text-center";
    }
  };
  
  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex flex-col">
      <div className={`flex-1 flex ${getPositionClass()}`}>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-sm">
          <div className="flex justify-center mb-4">
            <div className="bg-minesweeper-primary p-4 rounded-full text-white">
              {step.icon}
            </div>
          </div>
          
          <h3 className="text-xl font-bold mb-2">{step.title}</h3>
          <p className="mb-6 text-muted-foreground">{step.description}</p>
          
          <div className="flex justify-between">
            <Button variant="outline" onClick={handleSkip}>
              <X className="w-4 h-4 mr-2" />
              {currentStep === 0 ? "Skip Tutorial" : "Skip to End"}
            </Button>
            
            <Button onClick={handleNext}>
              {isLastStep ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Start Playing
                </>
              ) : (
                "Next"
              )}
            </Button>
          </div>
        </div>
      </div>
      
      <div className="h-2 bg-minesweeper-primary" style={{ 
        width: `${((currentStep + 1) / TUTORIAL_STEPS.length) * 100}%`,
        transition: 'width 0.3s ease'
      }} />
    </div>
  );
};

export default TutorialOverlay;
