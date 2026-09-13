// Web Push Notifications Client Helper

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }
  try {
    const reg = await navigator.serviceWorker.register('/sw.js');
    return reg;
  } catch (err) {
    console.warn('[SPYCAM] Service Worker registration failed:', err);
    return null;
  }
}

export async function requestPushPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  try {
    const perm = await Notification.requestPermission();
    if (perm === 'granted') {
      await registerServiceWorker();
    }
    return perm;
  } catch (err) {
    console.warn('[SPYCAM] Notification permission request error:', err);
    return 'denied';
  }
}

export function getPushPermissionStatus(): NotificationPermission {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  return Notification.permission;
}

export async function sendLocalNotification(title: string, body: string, url: string = '/') {
  if (typeof window === 'undefined' || !('Notification' in window)) return;

  // Si l'utilisateur est activement sur la page et que l'onglet a le focus, inutile d'envoyer une notification OS
  if (typeof document !== 'undefined' && document.visibilityState === 'visible' && document.hasFocus()) {
    return;
  }

  if (Notification.permission === 'granted') {
    try {
      const reg = await navigator.serviceWorker.ready;
      if (reg && reg.showNotification) {
        reg.showNotification(title, {
          body,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          data: { url },
        });
        return;
      }
    } catch (_) {}

    // Fallback native notification
    try {
      new Notification(title, {
        body,
        icon: '/favicon.ico',
      });
    } catch (_) {}
  }
}
