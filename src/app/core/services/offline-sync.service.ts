import { Injectable } from '@angular/core';
import { BehaviorSubject, fromEvent, merge } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * Pending action that will be synced when online
 */
interface PendingAction {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  endpoint: string;
  data: any;
  timestamp: Date;
  retryCount: number;
}

/**
 * Service for handling offline functionality and syncing
 */
@Injectable({
  providedIn: 'root'
})
export class OfflineSyncService {
  private readonly STORAGE_KEY = 'pending_actions';
  private readonly MAX_RETRY_COUNT = 3;
  
  private pendingActions$ = new BehaviorSubject<PendingAction[]>([]);
  private isOnline$ = new BehaviorSubject<boolean>(navigator.onLine);

  constructor() {
    this.loadPendingActions();
    this.setupOnlineListener();
  }

  /**
   * Sets up listeners for online/offline events
   */
  private setupOnlineListener(): void {
    merge(
      fromEvent(window, 'online').pipe(map(() => true)),
      fromEvent(window, 'offline').pipe(map(() => false))
    ).subscribe(isOnline => {
      this.isOnline$.next(isOnline);
      if (isOnline) {
        this.syncPendingActions();
      }
    });
  }

  /**
   * Gets the current online status
   */
  get isOnline(): boolean {
    return this.isOnline$.value;
  }

  /**
   * Observable for online status changes
   */
  get onlineStatus$() {
    return this.isOnline$.asObservable();
  }

  /**
   * Observable for pending actions
   */
  get pendingActions() {
    return this.pendingActions$.asObservable();
  }

  /**
   * Gets count of pending actions
   */
  get pendingCount(): number {
    return this.pendingActions$.value.length;
  }

  /**
   * Queues an action to be executed when online
   * @param action Action to queue
   */
  queueAction(action: Omit<PendingAction, 'id' | 'timestamp' | 'retryCount'>): void {
    const newAction: PendingAction = {
      ...action,
      id: this.generateId(),
      timestamp: new Date(),
      retryCount: 0
    };
    
    const actions = this.pendingActions$.value;
    actions.push(newAction);
    this.savePendingActions(actions);

    console.log('Action queued for offline sync:', newAction);
  }

  /**
   * Syncs all pending actions
   */
  async syncPendingActions(): Promise<void> {
    if (!this.isOnline || this.pendingCount === 0) {
      return;
    }

    console.log(`Syncing ${this.pendingCount} pending actions...`);
    
    const actions = [...this.pendingActions$.value];
    const successfulActions: string[] = [];
    const failedActions: PendingAction[] = [];

    for (const action of actions) {
      try {
        await this.executeAction(action);
        successfulActions.push(action.id);
        console.log('Action synced successfully:', action.id);
      } catch (error) {
        console.error('Failed to sync action:', action.id, error);
        
        if (action.retryCount < this.MAX_RETRY_COUNT) {
          failedActions.push({
            ...action,
            retryCount: action.retryCount + 1
          });
        } else {
          console.error('Max retry count reached for action:', action.id);
        }
      }
    }

    // Update pending actions (keep only failed ones that haven't exceeded retry limit)
    this.savePendingActions(failedActions);
    
    if (successfulActions.length > 0) {
      console.log(`Successfully synced ${successfulActions.length} actions`);
    }
  }

  /**
   * Executes a pending action
   * @param action Action to execute
   */
  private async executeAction(action: PendingAction): Promise<void> {
    const response = await fetch(action.endpoint, {
      method: this.getHttpMethod(action.type),
      headers: {
        'Content-Type': 'application/json',
      },
      body: action.type !== 'DELETE' ? JSON.stringify(action.data) : undefined
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  }

  /**
   * Gets HTTP method for action type
   * @param type Action type
   */
  private getHttpMethod(type: PendingAction['type']): string {
    switch (type) {
      case 'CREATE': return 'POST';
      case 'UPDATE': return 'PUT';
      case 'DELETE': return 'DELETE';
      default: return 'POST';
    }
  }

  /**
   * Removes a specific pending action
   * @param actionId ID of action to remove
   */
  removePendingAction(actionId: string): void {
    const actions = this.pendingActions$.value.filter(a => a.id !== actionId);
    this.savePendingActions(actions);
  }

  /**
   * Clears all pending actions
   */
  clearAllPendingActions(): void {
    this.savePendingActions([]);
  }

  /**
   * Loads pending actions from local storage
   */
  private loadPendingActions(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const actions = JSON.parse(stored);
        // Convert timestamp strings back to Date objects
        const parsedActions = actions.map((a: any) => ({
          ...a,
          timestamp: new Date(a.timestamp)
        }));
        this.pendingActions$.next(parsedActions);
      }
    } catch (error) {
      console.error('Error loading pending actions:', error);
      this.pendingActions$.next([]);
    }
  }

  /**
   * Saves pending actions to local storage
   * @param actions Actions to save
   */
  private savePendingActions(actions: PendingAction[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(actions));
      this.pendingActions$.next(actions);
    } catch (error) {
      console.error('Error saving pending actions:', error);
    }
  }

  /**
   * Generates a unique ID for actions
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
