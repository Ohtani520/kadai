import React from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { CalendarDay } from '../types';

interface CalendarProps {
  days: CalendarDay[];
  currentMonth: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onDayClick: (date: string) => void;
}

export default function Calendar({ days, currentMonth, onPrevMonth, onNextMonth, onDayClick }: CalendarProps) {
  const monthNames = [
    '1月', '2月', '3月', '4月', '5月', '6月',
    '7月', '8月', '9月', '10月', '11月', '12月'
  ];
  
  const weekDays = ['日', '月', '火', '水', '木', '金', '土'];

  // カレンダーグリッドを生成
  const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay());
  
  const calendarDays: (CalendarDay | null)[] = [];
  const currentDate = new Date(startDate);
  
  // 6週間分のマス目を作成
  for (let i = 0; i < 42; i++) {
    const dateString = currentDate.toISOString().split('T')[0];
    const dayData = days.find(day => day.date === dateString);
    
    if (currentDate.getMonth() === currentMonth.getMonth()) {
      calendarDays.push(dayData || {
        date: dateString,
        tasks: [],
        isToday: false,
        isPast: false,
        completionRate: 0
      });
    } else {
      calendarDays.push(null);
    }
    
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <CalendarIcon size={20} className="mr-2" />
            学習カレンダー
          </h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={onPrevMonth}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="text-lg font-semibold text-gray-900 min-w-[120px] text-center">
              {currentMonth.getFullYear()}年 {monthNames[currentMonth.getMonth()]}
            </span>
            <button
              onClick={onNextMonth}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map(day => (
            <div key={day} className="h-8 flex items-center justify-center text-sm font-medium text-gray-600">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, index) => {
            if (!day) {
              return <div key={index} className="h-20" />;
            }

            const dayNumber = new Date(day.date).getDate();
            const hasTask = day.tasks.length > 0;
            
            return (
              <button
                key={day.date}
                onClick={() => onDayClick(day.date)}
                className={`h-20 p-1 border border-gray-200 rounded-lg text-left transition-all hover:shadow-md ${
                  day.isToday
                    ? 'bg-blue-100 border-blue-300'
                    : hasTask
                    ? 'bg-gray-50 hover:bg-gray-100'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className={`text-sm font-medium mb-1 ${
                  day.isToday ? 'text-blue-700' : 'text-gray-900'
                }`}>
                  {dayNumber}
                </div>
                
                {hasTask && (
                  <div className="space-y-1">
                    <div className="text-xs text-gray-600">
                      {day.tasks.length}件
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1">
                      <div
                        className={`h-1 rounded-full ${
                          day.completionRate === 100 ? 'bg-green-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${day.completionRate}%` }}
                      />
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}