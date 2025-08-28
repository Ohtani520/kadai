// 通知権限の確認と要求
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.log('このブラウザは通知をサポートしていません');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

// ローカル通知の送信
export function sendLocalNotification(title: string, body: string, options?: NotificationOptions) {
  if (Notification.permission === 'granted') {
    const notification = new Notification(title, {
      body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      vibrate: [200, 100, 200],
      ...options
    });

    // 通知クリック時にアプリを開く
    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    // 5秒後に自動で閉じる
    setTimeout(() => {
      notification.close();
    }, 5000);

    return notification;
  }
  return null;
}

// 今日のタスク通知
export function notifyTodayTasks(taskCount: number) {
  const title = '夏休み課題マネージャー';
  const body = taskCount > 0 
    ? `今日は${taskCount}件のタスクがあります！頑張りましょう🎯`
    : '今日のタスクはありません。お疲れ様でした！✨';
  
  sendLocalNotification(title, body);
}

// 締切間近の課題通知
export function notifyUrgentTasks(urgentTasks: Array<{name: string, daysLeft: number}>) {
  if (urgentTasks.length === 0) return;

  const title = '⚠️ 締切間近の課題があります';
  const taskNames = urgentTasks.map(task => 
    `${task.name} (あと${task.daysLeft}日)`
  ).join('\n');
  
  sendLocalNotification(title, taskNames, {
    requireInteraction: true // ユーザーが操作するまで表示し続ける
  });
}

// 完了おめでとう通知
export function notifyTaskCompletion(taskName: string) {
  const title = '🎉 課題完了！';
  const body = `「${taskName}」が完了しました！素晴らしいです！`;
  
  sendLocalNotification(title, body);
}

// 毎日の通知スケジュール設定
export function scheduleDailyNotification(hour: number = 9, minute: number = 0) {
  const now = new Date();
  const scheduledTime = new Date();
  scheduledTime.setHours(hour, minute, 0, 0);

  // 今日の指定時刻が過ぎていたら明日に設定
  if (scheduledTime <= now) {
    scheduledTime.setDate(scheduledTime.getDate() + 1);
  }

  const timeUntilNotification = scheduledTime.getTime() - now.getTime();

  setTimeout(() => {
    // 今日のタスク数を取得（実際の実装では localStorage から取得）
    const todayTasks = JSON.parse(localStorage.getItem('today-tasks') || '[]');
    notifyTodayTasks(todayTasks.length);

    // 次の日の通知もスケジュール
    scheduleDailyNotification(hour, minute);
  }, timeUntilNotification);
}

// Service Worker の登録
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered successfully:', registration);
      return registration;
    } catch (error) {
      // StackBlitz環境では Service Worker がサポートされていないため、
      // 環境固有のエラーは静かに処理する
      if (String(error).includes('StackBlitz')) {
        console.log('Service Worker is not supported in StackBlitz environment');
      } else {
        console.error('Service Worker registration failed:', error);
      }
      return null;
    }
  }
  return null;
}

// PWA インストール促進
export function promptPWAInstall() {
  let deferredPrompt: any;

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    // インストールボタンを表示
    const installButton = document.getElementById('install-button');
    if (installButton) {
      installButton.style.display = 'block';
      installButton.addEventListener('click', () => {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult: any) => {
          if (choiceResult.outcome === 'accepted') {
            console.log('PWA インストールが受け入れられました');
          }
          deferredPrompt = null;
        });
      });
    }
  });
}