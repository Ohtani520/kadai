import { Task, DailySchedule, ScheduledTask } from '../types';

export function generateSchedule(tasks: Task[], startDate: Date, endDate: Date): DailySchedule[] {
  const schedule: DailySchedule[] = [];
  const activeTasks = tasks.filter(task => task.completed < task.amount);
  
  // 日付の配列を生成
  const dates: string[] = [];
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    dates.push(currentDate.toISOString().split('T')[0]);
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // 各タスクの残り作業量と優先度を計算
  const taskPriorities = activeTasks.map(task => {
    const remaining = task.amount - task.completed;
    const deadline = new Date(task.deadline);
    const daysUntilDeadline = Math.max(1, Math.ceil((deadline.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    const dailyRequired = Math.ceil(remaining / daysUntilDeadline);
    
    return {
      ...task,
      remaining,
      daysUntilDeadline,
      dailyRequired,
      priority: 1 / daysUntilDeadline // 締切が近いほど高い優先度
    };
  }).sort((a, b) => b.priority - a.priority);

  // 各日のスケジュールを生成
  dates.forEach(date => {
    const dailyTasks: ScheduledTask[] = [];
    const currentDateObj = new Date(date);
    
    taskPriorities.forEach(task => {
      const deadline = new Date(task.deadline);
      if (currentDateObj <= deadline && task.remaining > 0) {
        const daysLeft = Math.max(1, Math.ceil((deadline.getTime() - currentDateObj.getTime()) / (1000 * 60 * 60 * 24)));
        const plannedAmount = Math.min(task.remaining, Math.ceil(task.remaining / daysLeft));
        
        if (plannedAmount > 0) {
          dailyTasks.push({
            taskId: task.id,
            name: task.name,
            plannedAmount,
            unit: task.unit,
            completed: false,
            deadline: task.deadline
          });
          
          // 残り作業量を更新
          task.remaining -= plannedAmount;
        }
      }
    });
    
    schedule.push({
      date,
      tasks: dailyTasks
    });
  });

  return schedule;
}

export function calculateProgress(tasks: Task[]): number {
  if (tasks.length === 0) return 0;
  
  const totalAmount = tasks.reduce((sum, task) => sum + task.amount, 0);
  const completedAmount = tasks.reduce((sum, task) => sum + task.completed, 0);
  
  return Math.round((completedAmount / totalAmount) * 100);
}