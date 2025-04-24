import { toast } from 'sonner';

type NotificationType = 'success' | 'error' | 'info' | 'warning';

interface NotificationOptions {
  description?: string;
  duration?: number;
}

export const showNotification = (
  type: NotificationType,
  title: string,
  options?: NotificationOptions
) => {
  const { description, duration = 5000 } = options || {};
  
  switch (type) {
    case 'success':
      toast.success(title, {
        description,
        duration,
      });
      break;
    case 'error':
      toast.error(title, {
        description,
        duration,
      });
      break;
    case 'info':
      toast.info(title, {
        description,
        duration,
      });
      break;
    case 'warning':
      toast.warning(title, {
        description,
        duration,
      });
      break;
    default:
      toast(title, {
        description,
        duration,
      });
  }
};

export const notifySuccess = (title: string, options?: NotificationOptions) => 
  showNotification('success', title, options);

export const notifyError = (title: string, options?: NotificationOptions) => 
  showNotification('error', title, options);

export const notifyInfo = (title: string, options?: NotificationOptions) => 
  showNotification('info', title, options);

export const notifyWarning = (title: string, options?: NotificationOptions) => 
  showNotification('warning', title, options); 