import React, { useRef, useState } from 'react';
import { FileText, Upload, X, Image, Type } from 'lucide-react';

interface PDFUploadProps {
  onExtract: (text: string) => void;
  onCancel: () => void;
}

export default function FileUpload({ onExtract, onCancel }: PDFUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (file: File) => {
    const supportedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'text/plain',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (!supportedTypes.includes(file.type)) {
      alert('対応していないファイル形式です。PDF、画像（JPG/PNG）、テキスト、またはWord文書を選択してください。');
      return;
    }

    setError(null);
    setIsProcessing(true);
    try {
      let text: string;
      
      if (file.type === 'application/pdf') {
        text = await extractTextFromPDF(file);
      } else if (file.type.startsWith('image/')) {
        text = await extractTextFromImage(file);
      } else if (file.type === 'text/plain') {
        text = await extractTextFromTextFile(file);
      } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        text = await extractTextFromWordDocument(file);
      } else {
        throw new Error('対応していないファイル形式です');
      }
      
      if (!text || text.trim().length === 0) {
        throw new Error('ファイルからテキストを抽出できませんでした。');
      }
      onExtract(text);
    } catch (error) {
      console.error('ファイル読み込みエラー:', error);
      const errorMessage = error instanceof Error ? error.message : 'PDFファイルの読み込みに失敗しました。';
      setError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const extractTextFromImage = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const imageData = e.target?.result as string;
          
          // OCR機能を使用してテキストを抽出
          const { extractTextFromImage } = await import('../utils/ocr');
          const result = await extractTextFromImage(imageData);
          resolve(result.text);
        } catch (error) {
          reject(new Error('画像からテキストを抽出できませんでした'));
        }
      };
      
      reader.onerror = () => reject(new Error('画像ファイル読み込みエラー'));
      reader.readAsDataURL(file);
    });
  };

  const extractTextFromTextFile = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          if (text && text.trim()) {
            resolve(text);
          } else {
            reject(new Error('テキストファイルが空です'));
          }
        } catch (error) {
          reject(new Error('テキストファイルの読み込みに失敗しました'));
        }
      };
      
      reader.onerror = () => reject(new Error('テキストファイル読み込みエラー'));
      reader.readAsText(file, 'UTF-8');
    });
  };

  const extractTextFromWordDocument = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          
          // Word文書からテキストを抽出
          // 注意: 完全なWord文書解析は複雑なため、基本的なテキスト抽出のみ実装
          try {
            // ArrayBufferを文字列に変換して基本的なテキストを抽出
            const uint8Array = new Uint8Array(arrayBuffer);
            const decoder = new TextDecoder('utf-8', { fatal: false });
            let text = decoder.decode(uint8Array);
            
            // Word文書の構造から可読テキストを抽出
            // XMLタグを除去し、テキスト部分のみを抽出
            text = text.replace(/<[^>]*>/g, ' '); // XMLタグを除去
            text = text.replace(/[^\x20-\x7E\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g, ' '); // 日本語と英数字のみ残す
            text = text.replace(/\s+/g, ' '); // 複数の空白を1つに
            text = text.trim();
            
            // 意味のあるテキストが抽出できた場合
            if (text && text.length > 10) {
              resolve(text);
              return;
            }
            
            // フォールバック: ファイル名から推測
            reject(new Error('Word文書からテキストを抽出できませんでした。Googleドキュメントから「プレーンテキスト (.txt)」形式でダウンロードしてお試しください。'));
            
          } catch (error) {
            reject(new Error('Word文書の解析に失敗しました。テキスト形式(.txt)でのダウンロードをお試しください。'));
          }
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Word文書読み込みエラー'));
      reader.readAsArrayBuffer(file);
    });
  };
  const extractTextFromPDF = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          
          // 複数の方法でPDFテキスト抽出を試行
          try {
            // 方法1: PDF.jsを使用
            const pdfjsLib = await import('pdfjs-dist');
            pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
              'pdfjs-dist/build/pdf.worker.min.js',
              import.meta.url
            ).toString();
            
            const pdf = await pdfjsLib.getDocument({ 
              data: arrayBuffer,
              verbosity: 0 // ログを抑制
            }).promise;
            
            let fullText = '';
            
            for (let i = 1; i <= pdf.numPages; i++) {
              const page = await pdf.getPage(i);
              const textContent = await page.getTextContent();
              const pageText = textContent.items
                .map((item: any) => item.str)
                .join(' ');
              fullText += pageText + '\n';
            }
            
            if (fullText.trim()) {
              resolve(fullText);
              return;
            }
          } catch (pdfError) {
            console.warn('PDF.js extraction failed:', pdfError);
          }
          
          // 方法2: フォールバック - 簡単なテキスト抽出
          try {
            const uint8Array = new Uint8Array(arrayBuffer);
            const text = new TextDecoder('utf-8').decode(uint8Array);
            
            // PDFから基本的なテキストパターンを抽出
            const textMatches = text.match(/\(([^)]+)\)/g);
            if (textMatches && textMatches.length > 0) {
              const extractedText = textMatches
                .map(match => match.slice(1, -1))
                .filter(text => text.length > 2)
                .join('\n');
              
              if (extractedText.trim()) {
                resolve(extractedText);
                return;
              }
            }
          } catch (fallbackError) {
            console.warn('Fallback extraction failed:', fallbackError);
          }
          
          reject(new Error('PDFからテキストを抽出できませんでした'));
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('ファイル読み込みエラー'));
      reader.readAsArrayBuffer(file);
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleRetry = () => {
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <FileText size={24} className="mr-2" />
            ファイルを読み込み
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isProcessing}
          >
            <X size={24} />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <X size={20} className="text-red-500 mt-0.5" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">読み込みエラー</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
                <button
                  onClick={handleRetry}
                  className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
                >
                  別のファイルを試す
                </button>
              </div>
            </div>
          </div>
        )}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          {isProcessing ? (
            <div className="space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto" />
              <p className="text-gray-600">ファイルを読み込み中...</p>
              <p className="text-xs text-gray-500">大きなファイルの場合、時間がかかることがあります</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-center space-x-4">
                <FileText size={32} className="text-red-500" />
                <Image size={32} className="text-blue-500" />
                <Type size={32} className="text-green-500" />
              </div>
              <div>
                <p className="text-lg font-medium text-gray-900 mb-2">
                  ファイルをドロップまたは選択
                </p>
                <p className="text-sm text-gray-600 mb-4">
                  課題一覧が記載されたファイルから自動で課題を抽出します
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <Upload size={18} className="mr-2" />
                  ファイルを選択
                </button>
              </div>
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.txt,.docx"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileSelect(file);
          }}
          className="hidden"
        />

        <div className="mt-6 p-4 bg-gray-50 rounded-lg text-sm text-gray-600">
          <p className="font-medium mb-2">📄 対応ファイル形式:</p>
          <ul className="space-y-1 text-xs">
            <li className="flex items-center">
              <FileText size={12} className="text-red-500 mr-1" />
              <strong>PDF:</strong> テキストが含まれているPDF（.pdf）
            </li>
            <li className="flex items-center">
              <Image size={12} className="text-blue-500 mr-1" />
              <strong>画像:</strong> 課題表の写真（.jpg, .png）
            </li>
            <li className="flex items-center">
              <Type size={12} className="text-green-500 mr-1" />
              <strong>テキスト:</strong> 課題リスト（.txt）
            </li>
            <li className="flex items-center">
              <FileText size={12} className="text-purple-500 mr-1" />
              <strong>Word文書:</strong> Microsoft Word（.docx）
            </li>
            <li className="text-gray-500">※ パスワード保護ファイルは対応していません</li>
          </ul>
          
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="font-medium text-blue-900 mb-2">📋 Googleドキュメントの読み込み方法:</p>
            <ol className="text-xs text-blue-800 space-y-1 ml-4 list-decimal">
              <li>Googleドキュメントを開く</li>
              <li>「ファイル」→「ダウンロード」を選択</li>
              <li>「Microsoft Word (.docx)」または「プレーンテキスト (.txt)」を選択</li>
              <li>ダウンロードしたファイルをここにアップロード</li>
            </ol>
            <p className="text-xs text-blue-700 mt-2">
              💡 <strong>おすすめ:</strong> テキスト形式(.txt)が最も確実に読み込めます
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}