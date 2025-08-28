import React, { useState } from 'react';
import { Plus, X, Camera, FileText } from 'lucide-react';
import { Task } from '../types';
import CameraCapture from './CameraCapture';
import FileUpload from './PDFUpload';
import OCRResultEditor from './OCRResultEditor';
import { extractTextFromImage, parseTasksFromText, parseTasksFromPDFText } from '../utils/ocr';

interface TaskFormProps {
  onSubmit: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  onSubmitMultiple?: (tasks: Omit<Task, 'id' | 'createdAt'>[]) => void;
  onCancel: () => void;
  initialTask?: Task;
}

export default function TaskForm({ onSubmit, onSubmitMultiple, onCancel, initialTask }: TaskFormProps) {
  const [name, setName] = useState(initialTask?.name || '');
  const [amount, setAmount] = useState(initialTask?.amount || 1);
  const [unit, setUnit] = useState(initialTask?.unit || 'ページ');
  const [deadline, setDeadline] = useState(initialTask?.deadline || '');
  const [completed, setCompleted] = useState(initialTask?.completed || 0);
  const [showCamera, setShowCamera] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [showOCREditor, setShowOCREditor] = useState(false);
  const [extractedText, setExtractedText] = useState('');
  const [extractedTasks, setExtractedTasks] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !deadline) return;

    onSubmit({
      name: name.trim(),
      amount,
      unit,
      deadline,
      completed
    });
  };

  const handleCameraCapture = async (imageData: string) => {
    setIsProcessing(true);
    try {
      const ocrResult = await extractTextFromImage(imageData);
      const tasks = parseTasksFromText(ocrResult.text);
      
      setExtractedText(ocrResult.text);
      setExtractedTasks(tasks);
      setShowCamera(false);
      setShowOCREditor(true);
    } catch (error) {
      console.error('OCR処理エラー:', error);
      alert('画像の処理に失敗しました。もう一度お試しください。');
      setShowCamera(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileExtract = async (text: string) => {
    setIsProcessing(true);
    try {
      const tasks = parseTasksFromPDFText(text);
      
      setExtractedText(text);
      setExtractedTasks(tasks);
      setShowFileUpload(false);
      setShowOCREditor(true);
    } catch (error) {
      console.error('ファイル処理エラー:', error);
      alert('ファイルの処理に失敗しました。もう一度お試しください。');
      setShowFileUpload(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOCRConfirm = (tasks: Omit<Task, 'id' | 'createdAt'>[]) => {
    if (onSubmitMultiple) {
      onSubmitMultiple(tasks);
    }
    setShowOCREditor(false);
  };

  const handleOCRCancel = () => {
    setShowOCREditor(false);
    setExtractedText('');
    setExtractedTasks([]);
  };
  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 my-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            {initialTask ? '課題を編集' : '課題を追加'}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {!initialTask && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="text-sm font-medium text-blue-900 mb-2">📋 課題表から一括登録</h3>
            <p className="text-xs text-blue-700 mb-3">
              課題表を撮影、またはファイルから複数の課題を一度に登録できます
            </p>
            <div className="space-y-2">
              <button
                onClick={() => setShowCamera(true)}
                className="w-full flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                disabled={isProcessing}
              >
                <Camera size={16} className="mr-2" />
                {isProcessing ? '処理中...' : '課題表を撮影'}
              </button>
              <button
                onClick={() => setShowFileUpload(true)}
                className="w-full flex items-center justify-center px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors text-sm"
                disabled={isProcessing}
              >
                <FileText size={16} className="mr-2" />
                ファイルを読み込み
              </button>
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              課題名
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="例: 数学ワークブック"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                分量
              </label>
              <input
                type="number"
                id="amount"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label htmlFor="unit" className="block text-sm font-medium text-gray-700 mb-1">
                単位
              </label>
              <select
                id="unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
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

          <div>
            <label htmlFor="deadline" className="block text-sm font-medium text-gray-700 mb-1">
              締切日
            </label>
            <input
              type="date"
              id="deadline"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          {initialTask && (
            <div>
              <label htmlFor="completed" className="block text-sm font-medium text-gray-700 mb-1">
                完了済み
              </label>
              <input
                type="number"
                id="completed"
                value={completed}
                onChange={(e) => setCompleted(Number(e.target.value))}
                min="0"
                max={amount}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center"
            >
              <Plus size={18} className="mr-1" />
              {initialTask ? '更新' : '追加'}
            </button>
          </div>
        </form>
        </div>
      </div>

      {showCamera && (
        <CameraCapture
          onCapture={handleCameraCapture}
          onCancel={() => setShowCamera(false)}
        />
      )}

      {showFileUpload && (
        <FileUpload
          onExtract={handleFileExtract}
          onCancel={() => setShowFileUpload(false)}
        />
      )}

      {showOCREditor && (
        <OCRResultEditor
          extractedText={extractedText}
          extractedTasks={extractedTasks}
          onConfirm={handleOCRConfirm}
          onCancel={handleOCRCancel}
        />
      )}
    </>
  );
}