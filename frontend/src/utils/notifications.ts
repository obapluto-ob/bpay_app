export class NotificationService {
  private static instance: NotificationService;
  private permission: NotificationPermission = 'default';

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return false;
    }

    if (this.permission === 'granted') {
      return true;
    }

    const permission = await Notification.requestPermission();
    this.permission = permission;
    return permission === 'granted';
  }

  async showNotification(title: string, options?: NotificationOptions) {
    const hasPermission = await this.requestPermission();
    
    if (!hasPermission) {
      console.log('Notification permission denied');
      return;
    }

    const defaultOptions: NotificationOptions = {
      icon: '/5782897843587714011_120.jpg',
      badge: '/5782897843587714011_120.jpg',
      tag: 'bpay-notification',
      requireInteraction: true,
      ...options
    };

    return new Notification(title, defaultOptions);
  }

  // Specific notification types
  async notifyTradeUpdate(status: string, amount: string, currency: string) {
    return this.showNotification(`Trade ${status}`, {
      body: `Your ${amount} ${currency} trade has been ${status.toLowerCase()}`,
      icon: '/5782897843587714011_120.jpg'
    });
  }

  async notifyPaymentReceived(amount: string, currency: string) {
    return this.showNotification('Payment Received', {
      body: `${amount} ${currency} has been credited to your wallet`,
      icon: '/5782897843587714011_120.jpg'
    });
  }

  async notifyPriceAlert(crypto: string, price: string, change: string) {
    return this.showNotification(`${crypto} Price Alert`, {
      body: `${crypto} is now ${price} (${change}% change)`,
      icon: '/5782897843587714011_120.jpg'
    });
  }
}

export const notifications = NotificationService.getInstance();