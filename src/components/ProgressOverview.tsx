import React from 'react';
import { BarChart3, Target, TrendingUp, Calendar } from 'lucide-react';
import { Task } from '../types';

interface ProgressOverviewProps {
  tasks: Task[];
}

export default function ProgressOverview({ tasks }: ProgressOverviewProps) {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => task.completed >= task.amount).length;
  const overallProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  
  const totalAmount = tasks.reduce((sum, task) => sum + task.amount, 0);
  const completedAmount = tasks.reduce((sum, task) => sum + task.completed, 0);
  const workProgress = totalAmount > 0 ? Math.round((completedAmount / totalAmount) * 100) : 0;

  // 締切が近い課題
  const urgentTasks = tasks.filter(task => {
    const deadline = new Date(task.deadline);
    const today = new Date();
    const daysUntil = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntil <= 3 && daysUntil >= 0 && task.completed < task.amount;
  }).length;

  // 期限切れ課題
  const overdueTasks = tasks.filter(task => {
    const deadline = new Date(task.deadline);
    const today = new Date();
    return deadline < today && task.completed < task.amount;
  }).length;

  const stats = [
    {
      icon: Target,
      label: 'タスク完了率',
      value: `${completedTasks}/${totalTasks}`,
      percentage: overallProgress,
      color: 'blue'
    },
    {
      icon: BarChart3,
      label: '作業進捗',
      value: `${workProgress}%`,
      percentage: workProgress,
      color: 'green'
    },
    {
      icon: Calendar,
      label: '緊急タスク',
      value: `${urgentTasks}件`,
      percentage: null,
      color: 'orange'
    },
    {
      icon: TrendingUp,
      label: '期限切れ',
      value: `${overdueTasks}件`,
      percentage: null,
      color: 'red'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat, index) => (
        <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className={`p-2 rounded-lg ${
              stat.color === 'blue' ? 'bg-blue-100' :
              stat.color === 'green' ? 'bg-green-100' :
              stat.color === 'orange' ? 'bg-orange-100' :
              'bg-red-100'
            }`}>
              <stat.icon size={20} className={
                stat.color === 'blue' ? 'text-blue-600' :
                stat.color === 'green' ? 'text-green-600' :
                stat.color === 'orange' ? 'text-orange-600' :
                'text-red-600'
              } />
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
            <div className="text-sm text-gray-600">{stat.label}</div>
            
            {stat.percentage !== null && (
              <div className="space-y-1">
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      stat.color === 'blue' ? 'bg-blue-500' :
                      stat.color === 'green' ? 'bg-green-500' :
                      stat.color === 'orange' ? 'bg-orange-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${stat.percentage}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}