
import React from "react";
import { Difficulty, DIFFICULTY_CONFIGS } from "@/types/game";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

interface DifficultySelectorProps {
  value: Difficulty;
  onChange: (difficulty: Difficulty) => void;
}

const DifficultySelector: React.FC<DifficultySelectorProps> = ({ value, onChange }) => {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Difficulty</label>
      <Select
        value={value}
        onValueChange={(val) => onChange(val as Difficulty)}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select difficulty" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={Difficulty.BEGINNER}>
            Beginner ({DIFFICULTY_CONFIGS[Difficulty.BEGINNER].rows}x{DIFFICULTY_CONFIGS[Difficulty.BEGINNER].cols}, {DIFFICULTY_CONFIGS[Difficulty.BEGINNER].mines} mines)
          </SelectItem>
          <SelectItem value={Difficulty.INTERMEDIATE}>
            Intermediate ({DIFFICULTY_CONFIGS[Difficulty.INTERMEDIATE].rows}x{DIFFICULTY_CONFIGS[Difficulty.INTERMEDIATE].cols}, {DIFFICULTY_CONFIGS[Difficulty.INTERMEDIATE].mines} mines)
          </SelectItem>
          <SelectItem value={Difficulty.EXPERT}>
            Expert ({DIFFICULTY_CONFIGS[Difficulty.EXPERT].rows}x{DIFFICULTY_CONFIGS[Difficulty.EXPERT].cols}, {DIFFICULTY_CONFIGS[Difficulty.EXPERT].mines} mines)
          </SelectItem>
          <SelectItem value={Difficulty.INFINITE}>
            Infinite Mode
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default DifficultySelector;
