
import React, { createContext, useContext, useState, useEffect } from "react";
import { AppSettings } from "@/types/game";

// Default settings
const DEFAULT_SETTINGS: AppSettings = {
  darkMode: false,
  soundEnabled: true,
  musicEnabled: true,
  hapticEnabled: true,
  highContrastMode: false,
  seenTutorial: false
};

// Local storage key
const SETTINGS_STORAGE_KEY = "minesweeper_settings";

// Context type
interface SettingsContextType {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  toggleDarkMode: () => void;
  toggleSound: () => void;
  toggleMusic: () => void;
  toggleHaptic: () => void;
  toggleHighContrast: () => void;
  markTutorialSeen: () => void;
}

// Create context
const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

// Provider component
export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize settings from local storage or defaults
  const [settings, setSettings] = useState<AppSettings>(() => {
    const savedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
    return savedSettings ? JSON.parse(savedSettings) : DEFAULT_SETTINGS;
  });

  // Save settings to local storage when they change
  useEffect(() => {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    
    // Apply dark mode
    if (settings.darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [settings]);

  // Update settings
  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  // Toggle functions
  const toggleDarkMode = () => updateSettings({ darkMode: !settings.darkMode });
  const toggleSound = () => updateSettings({ soundEnabled: !settings.soundEnabled });
  const toggleMusic = () => updateSettings({ musicEnabled: !settings.musicEnabled });
  const toggleHaptic = () => updateSettings({ hapticEnabled: !settings.hapticEnabled });
  const toggleHighContrast = () => updateSettings({ highContrastMode: !settings.highContrastMode });
  const markTutorialSeen = () => updateSettings({ seenTutorial: true });

  // Context value
  const contextValue: SettingsContextType = {
    settings,
    updateSettings,
    toggleDarkMode,
    toggleSound,
    toggleMusic,
    toggleHaptic,
    toggleHighContrast,
    markTutorialSeen
  };

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
};

// Custom hook to use the settings context
export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
};
