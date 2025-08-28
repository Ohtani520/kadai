import React from 'react';
import { Edit2, Trash2, CheckCircle } from 'lucide-react';
import { Task } from '../types';

interface TaskListProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}

export default function TaskList({ tasks, onEdit, onDelete }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <CheckCircle size={48} className="mx-auto" />
        </div>
        <p className="text-gray-600">まだ課題が登録されていません</p>
        <p className="text-sm text-gray-500">「課題を追加」ボタンから課題を登録してみましょう</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {tasks.map((task) => {
        const progressPercent = (task.completed / task.amount) * 100;
        const isCompleted = task.completed >= task.amount;
        const daysUntilDeadline = Math.ceil((new Date(task.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        
        return (
          <div
            key={task.id}
            className={`bg-white rounded-lg shadow-sm border p-4 transition-all hover:shadow-md ${
              isCompleted ? 'border-green-200 bg-green-50' : 'border-gray-200'
            }`}
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <h3 className={`font-semibold text-lg ${isCompleted ? 'text-green-800' : 'text-gray-900'}`}>
                  {task.name}
                </h3>
                <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                  <span>{task.amount} {task.unit}</span>
                  <span>締切: {new Date(task.deadline).toLocaleDateString('ja-JP')}</span>
                  <span className={`font-medium ${
                    daysUntilDeadline < 0 ? 'text-red-600' : 
                    daysUntilDeadline <= 3 ? 'text-orange-600' : 'text-gray-600'
                  }`}>
                    {daysUntilDeadline < 0 ? `${Math.abs(daysUntilDeadline)}日経過` : 
                     daysUntilDeadline === 0 ? '今日まで' : `あと${daysUntilDeadline}日`}
                  </span>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => onEdit(task)}
                  className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                >
                  <Edit2 size={18} />
                </button>
                <button
                  onClick={() => onDelete(task.id)}
                  className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">
                  進捗: {task.completed} / {task.amount} {task.unit}
                </span>
                <span className={`font-medium ${isCompleted ? 'text-green-600' : 'text-blue-600'}`}>
                  {Math.round(progressPercent)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    isCompleted ? 'bg-green-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${Math.min(progressPercent, 100)}%` }}
                />
              </div>
            </div>

            {isCompleted && (
              <div className="mt-3 flex items-center text-green-600 text-sm font-medium">
                <CheckCircle size={16} className="mr-1" />
                完了済み
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}