import React from 'react';
import { Home, BookOpen, Calendar, BarChart3, Bell } from 'lucide-react';

interface NavigationProps {
  currentView: string;
  onViewChange: (view: string) => void;
  onNotificationClick: () => void;
}

export default function Navigation({ currentView, onViewChange, onNotificationClick }: NavigationProps) {
  const navItems = [
    { id: 'home', label: 'ホーム', icon: Home },
    { id: 'tasks', label: '課題管理', icon: BookOpen },
    { id: 'calendar', label: 'カレンダー', icon: Calendar },
    { id: 'progress', label: '進捗', icon: BarChart3 }
  ];

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <BookOpen className="h-8 w-8 text-blue-600 mr-3" />
            <h1 className="text-xl font-bold text-gray-900">夏休み課題マネージャー</h1>
          </div>
          
          <div className="flex space-x-1">
            <button
              onClick={onNotificationClick}
              className="flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              <Bell size={18} className="mr-1" />
              <span className="hidden sm:inline">通知</span>
            </button>
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentView === item.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <item.icon size={18} className="mr-1" />
                <span className="hidden sm:inline">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}