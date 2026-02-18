import { Injectable, signal } from '@angular/core';

export interface ToastMessage {
  id: number;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private readonly _toasts = signal<ToastMessage[]>([]);
  private idCounter = 0;

  readonly toasts = this._toasts.asReadonly();

  /**
   * Show success toast
   */
  success(title: string, message: string = '', duration: number = 5000): void {
    this.show({ type: 'success', title, message, duration });
  }

  /**
   * Show error toast
   */
  error(title: string, message: string = '', duration: number = 7000): void {
    this.show({ type: 'error', title, message, duration });
  }

  /**
   * Show warning toast
   */
  warning(title: string, message: string = '', duration: number = 5000): void {
    this.show({ type: 'warning', title, message, duration });
  }

  /**
   * Show info toast
   */
  info(title: string, message: string = '', duration: number = 5000): void {
    this.show({ type: 'info', title, message, duration });
  }

  /**
   * Remove a specific toast
   */
  remove(id: number): void {
    this._toasts.update(toasts => toasts.filter(t => t.id !== id));
  }

  /**
   * Clear all toasts
   */
  clear(): void {
    this._toasts.set([]);
  }

  private show(toast: Omit<ToastMessage, 'id'>): void {
    const id = ++this.idCounter;
    const newToast: ToastMessage = { ...toast, id };
    
    this._toasts.update(toasts => [...toasts, newToast]);

    // Auto-remove after duration
    if (toast.duration) {
      setTimeout(() => this.remove(id), toast.duration);
    }
  }
}
