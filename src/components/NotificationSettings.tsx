import React, { useState, useEffect } from 'react';
import { Bell, BellOff, Smartphone, Clock } from 'lucide-react';
import { requestNotificationPermission, scheduleDailyNotification, notifyTodayTasks } from '../utils/notifications';

interface NotificationSettingsProps {
  onClose: () => void;
}

export default function NotificationSettings({ onClose }: NotificationSettingsProps) {
  const [notificationEnabled, setNotificationEnabled] = useState(false);
  const [dailyNotificationTime, setDailyNotificationTime] = useState('09:00');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // 現在の通知設定を読み込み
    const enabled = localStorage.getItem('notifications-enabled') === 'true';
    const time = localStorage.getItem('daily-notification-time') || '09:00';
    setNotificationEnabled(enabled);
    setDailyNotificationTime(time);
  }, []);

  const handleEnableNotifications = async () => {
    setIsLoading(true);
    try {
      const granted = await requestNotificationPermission();
      if (granted) {
        setNotificationEnabled(true);
        localStorage.setItem('notifications-enabled', 'true');
        
        // 毎日の通知をスケジュール
        const [hour, minute] = dailyNotificationTime.split(':').map(Number);
        scheduleDailyNotification(hour, minute);
        
        // テスト通知を送信
        notifyTodayTasks(0);
      } else {
        alert('通知を有効にするには、ブラウザの設定で通知を許可してください。');
      }
    } catch (error) {
      console.error('通知設定エラー:', error);
      alert('通知の設定に失敗しました。');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisableNotifications = () => {
    setNotificationEnabled(false);
    localStorage.setItem('notifications-enabled', 'false');
  };

  const handleTimeChange = (time: string) => {
    setDailyNotificationTime(time);
    localStorage.setItem('daily-notification-time', time);
    
    if (notificationEnabled) {
      const [hour, minute] = time.split(':').map(Number);
      scheduleDailyNotification(hour, minute);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <Bell size={24} className="mr-2" />
            通知設定
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            ×
          </button>
        </div>

        <div className="space-y-6">
          {/* 通知の有効/無効 */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              {notificationEnabled ? (
                <Bell size={20} className="text-blue-600 mr-3" />
              ) : (
                <BellOff size={20} className="text-gray-400 mr-3" />
              )}
              <div>
                <h3 className="font-medium text-gray-900">プッシュ通知</h3>
                <p className="text-sm text-gray-600">
                  {notificationEnabled ? '有効' : '無効'}
                </p>
              </div>
            </div>
            {notificationEnabled ? (
              <button
                onClick={handleDisableNotifications}
                className="px-3 py-1 bg-red-100 text-red-700 rounded-md text-sm hover:bg-red-200 transition-colors"
              >
                無効にする
              </button>
            ) : (
              <button
                onClick={handleEnableNotifications}
                disabled={isLoading}
                className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isLoading ? '設定中...' : '有効にする'}
              </button>
            )}
          </div>

          {/* 通知時刻設定 */}
          {notificationEnabled && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center mb-3">
                <Clock size={20} className="text-blue-600 mr-2" />
                <h3 className="font-medium text-gray-900">毎日の通知時刻</h3>
              </div>
              <input
                type="time"
                value={dailyNotificationTime}
                onChange={(e) => handleTimeChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-600 mt-2">
                毎日この時刻に今日のタスクをお知らせします
              </p>
            </div>
          )}

          {/* PWA インストール案内 */}
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="flex items-center mb-3">
              <Smartphone size={20} className="text-green-600 mr-2" />
              <h3 className="font-medium text-gray-900">スマホアプリとして使用</h3>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              ホーム画面に追加すると、アプリのように使用できます
            </p>
            <div className="text-xs text-gray-500 space-y-1">
              <p><strong>iPhone/iPad:</strong> Safari で「共有」→「ホーム画面に追加」</p>
              <p><strong>Android:</strong> Chrome で「メニュー」→「ホーム画面に追加」</p>
            </div>
          </div>

          {/* 通知の種類説明 */}
          <div className="text-sm text-gray-600 space-y-2">
            <h4 className="font-medium text-gray-900">通知の種類:</h4>
            <ul className="space-y-1 ml-4">
              <li>• 毎日の学習リマインド</li>
              <li>• 締切間近の課題アラート</li>
              <li>• 課題完了のお祝いメッセージ</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}