// ============================================
// PEAK COACH - Push Notification Service
// ============================================

import { createClient } from './supabase';

// ============================================
// SERVICE WORKER REGISTRATION
// ============================================

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    console.log('Service workers not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    console.log('Service Worker registered:', registration.scope);
    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    return null;
  }
}

// ============================================
// PUSH SUBSCRIPTION
// ============================================

export async function subscribeToPush(userId: string): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.ready;
    
    // Check if already subscribed
    const existingSubscription = await registration.pushManager.getSubscription();
    if (existingSubscription) {
      console.log('Already subscribed to push');
      return true;
    }

    // Request notification permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('Notification permission denied');
      return false;
    }

    // VAPID public key (generate with web-push library)
    // TODO: Set this in env vars
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    
    if (!vapidPublicKey) {
      console.warn('VAPID public key not set, skipping push subscription');
      return false;
    }

    // Subscribe to push
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
    });

    // Save subscription to database
    const supabase = createClient();
    const { error } = await supabase
      .from('push_subscriptions')
      .upsert({
        user_id: userId,
        endpoint: subscription.endpoint,
        keys: JSON.stringify(subscription.toJSON().keys),
        created_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      });

    if (error) {
      console.error('Error saving push subscription:', error);
      return false;
    }

    console.log('Push subscription saved');
    return true;
  } catch (error) {
    console.error('Error subscribing to push:', error);
    return false;
  }
}

export async function unsubscribeFromPush(userId: string): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      await subscription.unsubscribe();
    }

    // Remove from database
    const supabase = createClient();
    await supabase
      .from('push_subscriptions')
      .delete()
      .eq('user_id', userId);

    return true;
  } catch (error) {
    console.error('Error unsubscribing from push:', error);
    return false;
  }
}

// ============================================
// LOCAL NOTIFICATIONS (fallback)
// ============================================

export async function showLocalNotification(
  title: string,
  body: string,
  options?: NotificationOptions
): Promise<boolean> {
  if (!('Notification' in window)) {
    console.log('Notifications not supported');
    return false;
  }

  if (Notification.permission === 'default') {
    await Notification.requestPermission();
  }

  if (Notification.permission !== 'granted') {
    console.log('Notification permission not granted');
    return false;
  }

  const registration = await navigator.serviceWorker.ready;
  
  await registration.showNotification(title, {
    body,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: 'peak-coach-local',
    ...options,
  });

  return true;
}

// ============================================
// NOTIFICATION TYPES
// ============================================

export async function notifyTaskReminder(taskTitle: string) {
  return showLocalNotification(
    '📋 Task Erinnerung',
    taskTitle,
    { tag: 'task-reminder', data: { url: '/tasks' } }
  );
}

export async function notifyHabitReminder(habitName: string, streak: number) {
  return showLocalNotification(
    `🔄 ${habitName}`,
    streak > 0 ? `Dein ${streak}-Tage Streak wartet!` : 'Zeit für deine Gewohnheit!',
    { tag: 'habit-reminder', data: { url: '/habits' } }
  );
}

export async function notifyGoalProgress(goalTitle: string, progress: number) {
  return showLocalNotification(
    '🎯 Ziel-Update',
    `${goalTitle}: ${progress}% erreicht!`,
    { tag: 'goal-progress', data: { url: '/goals' } }
  );
}

export async function notifyCoachMessage(message: string) {
  return showLocalNotification(
    '💬 Dein Coach',
    message,
    { tag: 'coach-message', requireInteraction: true }
  );
}

// ============================================
// HELPERS
// ============================================

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  
  return outputArray;
}

// ============================================
// PERMISSION CHECK
// ============================================

export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!('Notification' in window)) {
    return 'unsupported';
  }
  
  if (Notification.permission === 'default') {
    return await Notification.requestPermission();
  }
  
  return Notification.permission;
}

