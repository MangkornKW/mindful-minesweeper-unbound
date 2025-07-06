
import { ITimerManager } from "./types";

export class TimerManager implements ITimerManager {
  private startTime: number | null;
  private elapsedTime: number;
  private lastTimerUpdate: number;
  private timerInterval: ReturnType<typeof setTimeout> | null;
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
    // If the timer is not currently running, simply exit early.
    if (!this.isRunning) {
      return;
    }

    // Capture the elapsed time since the last tick *before* marking the
    // timer as stopped so that `updateTimer` does not bail out early.
    this.updateTimer();

    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    this.isRunning = false;
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
