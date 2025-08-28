import React, { useState } from 'react';
import { Edit3, Plus, Trash2, X, Check } from 'lucide-react';
import { Task } from '../types';

interface ExtractedTask {
  name: string;
  amount: number;
  unit: string;
  deadline: string;
  confidence: number;
}

interface OCRResultEditorProps {
  extractedText: string;
  extractedTasks: ExtractedTask[];
  onConfirm: (tasks: Omit<Task, 'id' | 'createdAt'>[]) => void;
  onCancel: () => void;
}

export default function OCRResultEditor({ 
  extractedText, 
  extractedTasks, 
  onConfirm, 
  onCancel 
}: OCRResultEditorProps) {
  const [tasks, setTasks] = useState<ExtractedTask[]>(extractedTasks);
  const [showRawText, setShowRawText] = useState(false);

  const addNewTask = () => {
    setTasks(prev => [...prev, {
      name: '',
      amount: 1,
      unit: 'ページ',
      deadline: '',
      confidence: 1.0
    }]);
  };

  const updateTask = (index: number, field: keyof ExtractedTask, value: string | number) => {
    setTasks(prev => prev.map((task, i) => 
      i === index ? { ...task, [field]: value } : task
    ));
  };

  const removeTask = (index: number) => {
    setTasks(prev => prev.filter((_, i) => i !== index));
  };

  const handleConfirm = () => {
    const validTasks = tasks
      .filter(task => task.name.trim() && task.deadline)
      .map(task => ({
        name: task.name.trim(),
        amount: task.amount,
        unit: task.unit,
        deadline: task.deadline,
        completed: 0
      }));
    
    onConfirm(validTasks);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col my-8">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <Edit3 size={24} className="mr-2" />
            OCR結果の確認・編集
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 抽出されたテキストの表示 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <button
              onClick={() => setShowRawText(!showRawText)}
              className="text-sm text-blue-600 hover:text-blue-800 mb-2"
            >
              {showRawText ? '▼' : '▶'} 抽出されたテキストを{showRawText ? '隠す' : '表示'}
            </button>
            {showRawText && (
              <pre className="text-sm text-gray-700 whitespace-pre-wrap bg-white p-3 rounded border max-h-32 overflow-y-auto">
                {extractedText}
              </pre>
            )}
          </div>

          {/* 課題リストの編集 */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                抽出された課題 ({tasks.length}件)
              </h3>
              <button
                onClick={addNewTask}
                className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                <Plus size={16} className="mr-1" />
                課題を追加
              </button>
            </div>

            <div className="space-y-4">
              {tasks.map((task, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-700">課題 {index + 1}</span>
                      {task.confidence < 0.8 && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                          要確認
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => removeTask(index)}
                      className="text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        課題名 *
                      </label>
                      <input
                        type="text"
                        value={task.name}
                        onChange={(e) => updateTask(index, 'name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="例: 数学ワークブック"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        締切日 *
                      </label>
                      <input
                        type="date"
                        value={task.deadline}
                        onChange={(e) => updateTask(index, 'deadline', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        分量
                      </label>
                      <input
                        type="number"
                        value={task.amount}
                        onChange={(e) => updateTask(index, 'amount', Number(e.target.value))}
                        min="1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        単位
                      </label>
                      <select
                        value={task.unit}
                        onChange={(e) => updateTask(index, 'unit', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="ページ">ページ</option>
                        <option value="問題">問題</option>
                        <option value="題">題</option>
                        <option value="章">章</option>
                        <option value="単元">単元</option>
                        <option value="回">回</option>
                        <option value="セット">セット</option>
                        <option value="ユニット">ユニット</option>
                        <option value="冊">冊</option>
                        <option value="プロジェクト">プロジェクト</option>
                        <option value="作品">作品</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}

              {tasks.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>課題が検出されませんでした。</p>
                  <p className="text-sm mt-1">「課題を追加」ボタンから手動で追加してください。</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <div className="text-sm text-gray-600">
            {tasks.filter(t => t.name.trim() && t.deadline).length} / {tasks.length} 件の課題が有効です
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              キャンセル
            </button>
            <button
              onClick={handleConfirm}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
              disabled={tasks.filter(t => t.name.trim() && t.deadline).length === 0}
            >
              <Check size={18} className="mr-1" />
              課題を追加 ({tasks.filter(t => t.name.trim() && t.deadline).length}件)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}