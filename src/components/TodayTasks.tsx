import React from 'react';
import { Check, Clock, AlertCircle } from 'lucide-react';
import { ScheduledTask, Task } from '../types';

interface TodayTasksProps {
  tasks: ScheduledTask[];
  allTasks: Task[];
  onToggleComplete: (taskId: string, plannedAmount: number) => void;
}

export default function TodayTasks({ tasks, allTasks, onToggleComplete }: TodayTasksProps) {
  const today = new Date().toLocaleDateString('ja-JP');

  if (tasks.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center">
          <Clock size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">今日のタスクはありません</h3>
          <p className="text-gray-600">お疲れ様でした！</p>
        </div>
      </div>
    );
  }

  const completedTasks = tasks.filter(task => task.completed);
  const completionRate = Math.round((completedTasks.length / tasks.length) * 100);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">今日のタスク</h3>
          <span className="text-sm text-gray-500">{today}</span>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">
              進捗: {completedTasks.length} / {tasks.length} タスク
            </span>
            <span className="font-medium text-blue-600">{completionRate}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {tasks.map((task) => {
          const parentTask = allTasks.find(t => t.id === task.taskId);
          const isOverdue = new Date(task.deadline) < new Date();
          
          return (
            <div
              key={`${task.taskId}-${task.plannedAmount}`}
              className={`flex items-center space-x-3 p-3 rounded-lg border transition-all ${
                task.completed
                  ? 'bg-green-50 border-green-200'
                  : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
              }`}
            >
              <button
                onClick={() => onToggleComplete(task.taskId, task.plannedAmount)}
                className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                  task.completed
                    ? 'bg-green-500 border-green-500 text-white'
                    : 'border-gray-300 hover:border-green-500'
                }`}
              >
                {task.completed && <Check size={14} />}
              </button>

              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h4 className={`font-medium ${task.completed ? 'text-green-800 line-through' : 'text-gray-900'}`}>
                    {task.name}
                  </h4>
                  {isOverdue && !task.completed && (
                    <AlertCircle size={16} className="text-red-500" />
                  )}
                </div>
                <div className="flex items-center space-x-3 text-sm text-gray-600 mt-1">
                  <span>{task.plannedAmount} {task.unit}</span>
                  <span>締切: {new Date(task.deadline).toLocaleDateString('ja-JP')}</span>
                  {isOverdue && !task.completed && (
                    <span className="text-red-600 font-medium">期限切れ</span>
                  )}
                </div>
              </div>

              {parentTask && (
                <div className="text-xs text-gray-500">
                  全体進捗: {Math.round((parentTask.completed / parentTask.amount) * 100)}%
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}