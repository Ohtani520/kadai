export interface Task {
  id: string;
  name: string;
  amount: number; // 課題の分量（ページ数や問題数）
  unit: string; // 単位（ページ、問題、など）
  deadline: string; // 締切日 (YYYY-MM-DD)
  completed: number; // 完了した分量
  createdAt: string;
}

export interface DailySchedule {
  date: string;
  tasks: ScheduledTask[];
}

export interface ScheduledTask {
  taskId: string;
  name: string;
  plannedAmount: number;
  unit: string;
  completed: boolean;
  deadline: string;
}

export interface CalendarDay {
  date: string;
  tasks: ScheduledTask[];
  isToday: boolean;
  isPast: boolean;
  completionRate: number;
}