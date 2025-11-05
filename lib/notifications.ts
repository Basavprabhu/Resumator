import { logInfo } from './logger';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
}

class NotificationManager {
  private notifications: Notification[] = [];
  private listeners: Array<(notifications: Notification[]) => void> = [];

  show(type: NotificationType, title: string, message?: string, duration = 5000): string {
    const id = Math.random().toString(36).substr(2, 9);
    const notification: Notification = { id, type, title, message, duration };

    this.notifications.push(notification);
    this.notifyListeners();

    logInfo('Notification shown', { type, title, message });

    // Auto-remove after duration
    if (duration > 0) {
      setTimeout(() => {
        this.remove(id);
      }, duration);
    }

    return id;
  }

  remove(id: string): void {
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.notifyListeners();
  }

  clear(): void {
    this.notifications = [];
    this.notifyListeners();
  }

  subscribe(listener: (notifications: Notification[]) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener([...this.notifications]));
  }

  getNotifications(): Notification[] {
    return [...this.notifications];
  }
}

// Singleton instance
export const notificationManager = new NotificationManager();

// Convenience methods
export const showSuccess = (title: string, message?: string, duration?: number) =>
  notificationManager.show('success', title, message, duration);

export const showError = (title: string, message?: string, duration?: number) =>
  notificationManager.show('error', title, message, duration);

export const showWarning = (title: string, message?: string, duration?: number) =>
  notificationManager.show('warning', title, message, duration);

export const showInfo = (title: string, message?: string, duration?: number) =>
  notificationManager.show('info', title, message, duration); 