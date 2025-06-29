import React from "react";
import { Difficulty, DIFFICULTY_CONFIGS, DifficultyConfig } from "@/types/game";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

interface DifficultySelectorProps {
  value: Difficulty;
  onChange: (difficulty: Difficulty) => void;
  customConfig: Partial<DifficultyConfig>;
  onCustomConfigChange: (config: Partial<DifficultyConfig>) => void;
}

const DifficultySelector: React.FC<DifficultySelectorProps> = ({ value, onChange, customConfig, onCustomConfigChange }) => {
  const handleNumberChange = (field: keyof DifficultyConfig) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const num = parseInt(e.target.value, 10);
    if (isNaN(num)) return;
    onCustomConfigChange({ ...customConfig, [field]: num });
  };

  return (
    <div className="space-y-4">
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
            <SelectItem value={Difficulty.CUSTOM}>
              Custom
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {value === Difficulty.CUSTOM && (
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block mb-1 text-xs font-medium" htmlFor="rows">Rows</label>
            <Input
              id="rows"
              type="number"
              min={5}
              max={30}
              value={customConfig.rows ?? ""}
              onChange={handleNumberChange("rows")}
            />
          </div>
          <div>
            <label className="block mb-1 text-xs font-medium" htmlFor="cols">Cols</label>
            <Input
              id="cols"
              type="number"
              min={5}
              max={30}
              value={customConfig.cols ?? ""}
              onChange={handleNumberChange("cols")}
            />
          </div>
          <div>
            <label className="block mb-1 text-xs font-medium" htmlFor="mines">Mines</label>
            <Input
              id="mines"
              type="number"
              min={1}
              max={(customConfig.rows ?? 10)*(customConfig.cols ?? 10)-1}
              value={customConfig.mines ?? ""}
              onChange={handleNumberChange("mines")}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default DifficultySelector;
