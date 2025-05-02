
import { ITimerManager } from "./types";

export class TimerManager implements ITimerManager {
  private startTime: number | null;
  private elapsedTime: number;
  private lastTimerUpdate: number;
  private timerInterval: NodeJS.Timeout | null;
  private isRunning: boolean;

  constructor() {
    this.startTime = null;
    this.elapsedTime = 0;
    this.lastTimerUpdate = 0;
    this.timerInterval = null;
    this.isRunning = false;
  }

  startTimer(): void {
    if (this.startTime === null) {
      this.startTime = Date.now();
      this.lastTimerUpdate = Date.now();
      this.isRunning = true;
      this.timerInterval = setInterval(() => this.updateTimer(), 1000);
    }
  }

  updateTimer(): void {
    if (!this.isRunning) return;

    const now = Date.now();
    const delta = now - this.lastTimerUpdate;
    this.lastTimerUpdate = now;
    
    this.elapsedTime += delta / 1000;
  }

  stopTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
      this.isRunning = false;
      this.updateTimer(); // One final update
    }
  }

  getElapsedTime(): number {
    return Math.floor(this.elapsedTime);
  }

  cleanup(): void {
    this.stopTimer();
  }

  reset(): void {
    this.stopTimer();
    this.startTime = null;
    this.elapsedTime = 0;
    this.lastTimerUpdate = 0;
  }
}
