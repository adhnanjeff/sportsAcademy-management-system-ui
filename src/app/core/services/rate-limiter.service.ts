import { Injectable } from '@angular/core';

/**
 * Service to prevent abuse by limiting the rate of actions
 * Implements a sliding window rate limiting algorithm
 */
@Injectable({
  providedIn: 'root'
})
export class RateLimiterService {
  private actionTimestamps = new Map<string, number[]>();

  /**
   * Checks if an action can be performed based on rate limits
   * @param actionKey Unique identifier for the action type
   * @param maxAttempts Maximum number of attempts allowed in the time window
   * @param windowMs Time window in milliseconds (default: 60 seconds)
   * @returns true if action is allowed, false if rate limit exceeded
   */
  canPerformAction(actionKey: string, maxAttempts: number = 5, windowMs: number = 60000): boolean {
    const now = Date.now();
    const timestamps = this.actionTimestamps.get(actionKey) || [];
    
    // Remove old timestamps outside the window
    const recentTimestamps = timestamps.filter(ts => now - ts < windowMs);
    
    if (recentTimestamps.length >= maxAttempts) {
      return false;
    }
    
    recentTimestamps.push(now);
    this.actionTimestamps.set(actionKey, recentTimestamps);
    return true;
  }

  /**
   * Gets the remaining time until the rate limit resets
   * @param actionKey Unique identifier for the action type
   * @param windowMs Time window in milliseconds
   * @returns Remaining time in milliseconds
   */
  getRemainingTime(actionKey: string, windowMs: number = 60000): number {
    const timestamps = this.actionTimestamps.get(actionKey) || [];
    if (timestamps.length === 0) return 0;
    
    const oldestTimestamp = Math.min(...timestamps);
    const remainingTime = windowMs - (Date.now() - oldestTimestamp);
    return Math.max(0, remainingTime);
  }

  /**
   * Resets the rate limit for a specific action
   * @param actionKey Unique identifier for the action type
   */
  reset(actionKey: string): void {
    this.actionTimestamps.delete(actionKey);
  }

  /**
   * Clears all rate limit data
   */
  clearAll(): void {
    this.actionTimestamps.clear();
  }

  /**
   * Gets the number of recent attempts for an action
   * @param actionKey Unique identifier for the action type
   * @param windowMs Time window in milliseconds
   * @returns Number of attempts in the current window
   */
  getAttemptCount(actionKey: string, windowMs: number = 60000): number {
    const now = Date.now();
    const timestamps = this.actionTimestamps.get(actionKey) || [];
    return timestamps.filter(ts => now - ts < windowMs).length;
  }
}
