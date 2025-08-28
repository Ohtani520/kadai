import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import Navigation from './components/Navigation';
import NotificationSettings from './components/NotificationSettings';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import TaskForm from './components/TaskForm';
import TaskList from './components/TaskList';
import TodayTasks from './components/TodayTasks';
import Calendar from './components/Calendar';
import ProgressOverview from './components/ProgressOverview';
import { useLocalStorage } from './hooks/useLocalStorage';
import { generateSchedule } from './utils/scheduler';
import { 
  registerServiceWorker, 
  requestNotificationPermission, 
  notifyTodayTasks, 
  notifyUrgentTasks, 
  notifyTaskCompletion,
  scheduleDailyNotification 
} from './utils/notifications';
import { Task, DailySchedule, CalendarDay } from './types';

function App() {
  const [currentView, setCurrentView] = useState('home');
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [tasks, setTasks] = useLocalStorage<Task[]>('summer-homework-tasks', []);
  const [schedule, setSchedule] = useState<DailySchedule[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // PWA と通知の初期化
  useEffect(() => {
    // Service Worker の登録
    registerServiceWorker();
    
    // 通知が有効な場合、毎日の通知をスケジュール
    const notificationsEnabled = localStorage.getItem('notifications-enabled') === 'true';
    if (notificationsEnabled) {
      const time = localStorage.getItem('daily-notification-time') || '09:00';
      const [hour, minute] = time.split(':').map(Number);
      scheduleDailyNotification(hour, minute);
    }
  }, []);

  // スケジュール生成
  useEffect(() => {
    if (tasks.length > 0) {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 2); // 2ヶ月先まで
      
      const newSchedule = generateSchedule(tasks, startDate, endDate);
      setSchedule(newSchedule);
    }
  }, [tasks]);

  const handleAddTask = (taskData: Omit<Task, 'id' | 'createdAt'>) => {
    const newTask: Task = {
      ...taskData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    setTasks(prev => [...prev, newTask]);
    setShowTaskForm(false);
  };

  const handleAddMultipleTasks = (tasksData: Omit<Task, 'id' | 'createdAt'>[]) => {
    const newTasks: Task[] = tasksData.map((taskData, index) => ({
      ...taskData,
      id: (Date.now() + index).toString(),
      createdAt: new Date().toISOString()
    }));
    setTasks(prev => [...prev, ...newTasks]);
    setShowTaskForm(false);
  };
  const handleEditTask = (taskData: Omit<Task, 'id' | 'createdAt'>) => {
    if (!editingTask) return;
    
    setTasks(prev => prev.map(task => 
      task.id === editingTask.id 
        ? { ...task, ...taskData }
        : task
    ));
    setEditingTask(null);
  };

  const handleDeleteTask = (id: string) => {
    if (window.confirm('この課題を削除しますか？')) {
      setTasks(prev => prev.filter(task => task.id !== id));
    }
  };

  const handleToggleTaskComplete = (taskId: string, plannedAmount: number) => {
    let taskCompleted = false;
    let completedTaskName = '';
    
    setTasks(prev => prev.map(task => {
      if (task.id === taskId) {
        const newCompleted = Math.min(task.amount, task.completed + plannedAmount);
        
        // 課題が完了した場合
        if (newCompleted >= task.amount && task.completed < task.amount) {
          taskCompleted = true;
          completedTaskName = task.name;
        }
        
        return { ...task, completed: newCompleted };
      }
      return task;
    }));
    
    // 完了通知を送信
    if (taskCompleted) {
      notifyTaskCompletion(completedTaskName);
    }
  };

  // 緊急タスクの通知チェック
  useEffect(() => {
    const urgentTasks = tasks
      .filter(task => {
        const deadline = new Date(task.deadline);
        const today = new Date();
        const daysUntil = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return daysUntil <= 2 && daysUntil >= 0 && task.completed < task.amount;
      })
      .map(task => ({
        name: task.name,
        daysLeft: Math.ceil((new Date(task.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      }));

    if (urgentTasks.length > 0) {
      const lastNotified = localStorage.getItem('last-urgent-notification');
      const today = new Date().toDateString();
      
      // 1日1回のみ通知
      if (lastNotified !== today) {
        notifyUrgentTasks(urgentTasks);
        localStorage.setItem('last-urgent-notification', today);
      }
    }
  }, [tasks]);

  // 今日のタスク取得
  const today = new Date().toISOString().split('T')[0];
  const todaySchedule = schedule.find(day => day.date === today);
  const todayTasks = todaySchedule?.tasks || [];

  // カレンダー用データ生成
  const calendarDays: CalendarDay[] = schedule.map(day => {
    const dayDate = new Date(day.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const completedTasks = day.tasks.filter(task => {
      const parentTask = tasks.find(t => t.id === task.taskId);
      return parentTask && parentTask.completed >= task.plannedAmount;
    }).length;
    
    const completionRate = day.tasks.length > 0 ? Math.round((completedTasks / day.tasks.length) * 100) : 0;
    
    return {
      date: day.date,
      tasks: day.tasks,
      isToday: day.date === new Date().toISOString().split('T')[0],
      isPast: dayDate < today,
      completionRate
    };
  });

  const renderContent = () => {
    switch (currentView) {
      case 'home':
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
              <h2 className="text-2xl font-bold mb-2">夏休み課題マネージャーへようこそ！</h2>
              <p className="text-blue-100">
                課題を登録して、効率的に夏休みの学習を進めましょう。
                締切日に基づいて自動的に学習スケジュールを作成します。
              </p>
            </div>
            
            <ProgressOverview tasks={tasks} />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TodayTasks 
                tasks={todayTasks} 
                allTasks={tasks}
                onToggleComplete={handleToggleTaskComplete}
              />
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">クイックアクション</h3>
                <div className="space-y-3">
                  <button
                    onClick={() => setShowTaskForm(true)}
                    className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus size={20} className="mr-2" />
                    新しい課題を追加
                  </button>
                  <button
                    onClick={() => setCurrentView('calendar')}
                    className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    カレンダーを見る
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'tasks':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">課題管理</h2>
              <button
                onClick={() => setShowTaskForm(true)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus size={18} className="mr-2" />
                課題を追加
              </button>
            </div>
            <TaskList 
              tasks={tasks}
              onEdit={setEditingTask}
              onDelete={handleDeleteTask}
            />
          </div>
        );

      case 'calendar':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">学習カレンダー</h2>
            <Calendar
              days={calendarDays}
              currentMonth={currentMonth}
              onPrevMonth={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1))}
              onNextMonth={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1))}
              onDayClick={(date) => {
                // 特定の日付の詳細表示（今後実装）
                console.log('Selected date:', date);
              }}
            />
          </div>
        );

      case 'progress':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">進捗状況</h2>
            <ProgressOverview tasks={tasks} />
            <TaskList 
              tasks={tasks}
              onEdit={setEditingTask}
              onDelete={handleDeleteTask}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation 
        currentView={currentView} 
        onViewChange={setCurrentView}
        onNotificationClick={() => setShowNotificationSettings(true)}
      />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {renderContent()}
      </main>

      <PWAInstallPrompt />

      {(showTaskForm || editingTask) && (
        <TaskForm
          onSubmit={editingTask ? handleEditTask : handleAddTask}
          onSubmitMultiple={!editingTask ? handleAddMultipleTasks : undefined}
          onCancel={() => {
            setShowTaskForm(false);
            setEditingTask(null);
          }}
          initialTask={editingTask || undefined}
        />
      )}

      {showNotificationSettings && (
        <NotificationSettings
          onClose={() => setShowNotificationSettings(false)}
        />
      )}
    </div>
  );
}

export default App;