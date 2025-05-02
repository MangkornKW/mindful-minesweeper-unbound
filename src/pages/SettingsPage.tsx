
import React from "react";
import { useNavigate } from "react-router-dom";
import { useSettings } from "@/contexts/SettingsContext";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { 
    settings,
    toggleDarkMode,
    toggleSound,
    toggleMusic,
    toggleHaptic,
    toggleHighContrast,
    markTutorialSeen
  } = useSettings();
  
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-muted">
      <header className="p-4 border-b">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate("/")}
            className="mr-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">Settings</h1>
        </div>
      </header>
      
      <main className="flex-1 p-6 max-w-md mx-auto w-full">
        <div className="space-y-6">
          <div className="space-y-4">
            <h2 className="text-lg font-medium">Appearance</h2>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="dark-mode" className="flex-1">Dark Mode</Label>
              <Switch 
                id="dark-mode" 
                checked={settings.darkMode} 
                onCheckedChange={toggleDarkMode} 
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="high-contrast" className="flex-1">
                High Contrast Mode
                <p className="text-xs text-muted-foreground">Improves visibility for color-blind players</p>
              </Label>
              <Switch 
                id="high-contrast" 
                checked={settings.highContrastMode} 
                onCheckedChange={toggleHighContrast} 
              />
            </div>
          </div>
          
          <div className="space-y-4">
            <h2 className="text-lg font-medium">Sound & Feedback</h2>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="sound-effects" className="flex-1">Sound Effects</Label>
              <Switch 
                id="sound-effects" 
                checked={settings.soundEnabled} 
                onCheckedChange={toggleSound} 
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="music" className="flex-1">Background Music</Label>
              <Switch 
                id="music" 
                checked={settings.musicEnabled} 
                onCheckedChange={toggleMusic} 
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="haptic" className="flex-1">Haptic Feedback</Label>
              <Switch 
                id="haptic" 
                checked={settings.hapticEnabled} 
                onCheckedChange={toggleHaptic} 
              />
            </div>
          </div>
          
          <div className="space-y-4">
            <h2 className="text-lg font-medium">Tutorial</h2>
            
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => navigate("/", { state: { showTutorial: true } })}
            >
              View Tutorial Again
            </Button>
            
            <div className="text-xs text-muted-foreground text-center">
              The tutorial will automatically show for new players.
            </div>
          </div>
          
          <div className="space-y-4">
            <h2 className="text-lg font-medium">Reset</h2>
            
            <Button 
              variant="destructive" 
              className="w-full"
              onClick={() => {
                if (window.confirm("Are you sure you want to reset all settings to default?")) {
                  // Reset settings to default
                  localStorage.clear();
                  window.location.reload();
                }
              }}
            >
              Reset All Settings
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SettingsPage;
