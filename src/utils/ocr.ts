// OCR機能のユーティリティ関数

export interface OCRResult {
  text: string;
  confidence: number;
}

export interface ExtractedTask {
  name: string;
  amount: number;
  unit: string;
  deadline: string;
  confidence: number;
}

// Web OCR API を使用してテキストを抽出
export async function extractTextFromImage(imageData: string): Promise<OCRResult> {
  try {
    // 実際のプロダクションでは、Google Cloud Vision API、Azure Computer Vision、
    // またはAWS Textractなどのサービスを使用します
    
    // デモ用のモック実装
    // 実際の実装では、以下のようなAPIコールを行います：
    /*
    const response = await fetch('https://api.ocr.space/parse/image', {
      method: 'POST',
      headers: {
        'apikey': 'YOUR_API_KEY',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        base64Image: imageData,
        language: 'jpn',
        isOverlayRequired: false,
        detectOrientation: true,
        scale: true,
        OCREngine: 2
      })
    });
    
    const result = await response.json();
    return {
      text: result.ParsedResults[0].ParsedText,
      confidence: result.ParsedResults[0].TextOverlay.HasOverlay ? 0.9 : 0.7
    };
    */

    // デモ用のサンプルテキスト
    await new Promise(resolve => setTimeout(resolve, 2000)); // API呼び出しをシミュレート
    
    const sampleTexts = [
      `夏休みの課題一覧

数学ワークブック: P.1-50 (8月20日まで)
国語読書感想文: 1冊 (8月25日まで)
理科自由研究: 1テーマ (8月30日まで)
社会レポート: 3枚 (8月15日まで)
英語ドリル: P.1-30 (8月18日まで)`,

      `宿題リスト

・算数プリント 20枚 締切：8月22日
・漢字練習帳 50ページ 締切：8月28日
・絵日記 10日分 締切：8月31日
・工作 1作品 締切：8月25日`,

      `Summer Homework

Math Workbook: Pages 1-40 (Due: Aug 20)
Science Project: 1 project (Due: Aug 30)
Reading Report: 2 books (Due: Aug 25)`
    ];

    const randomText = sampleTexts[Math.floor(Math.random() * sampleTexts.length)];
    
    return {
      text: randomText,
      confidence: 0.85
    };
  } catch (error) {
    console.error('OCR処理エラー:', error);
    throw new Error('テキスト抽出に失敗しました');
  }
}

// 抽出されたテキストから課題情報を解析
export function parseTasksFromText(text: string): ExtractedTask[] {
  const tasks: ExtractedTask[] = [];
  
  console.log('解析対象テキスト:', text);
  
  // テキストの前処理
  const cleanedText = text
    .replace(/\r\n/g, '\n')  // Windows改行を統一
    .replace(/\r/g, '\n')    // Mac改行を統一
    .trim();
  
  console.log('前処理後テキスト:', cleanedText);
  
  // Markdown表形式の検出と処理
  if (cleanedText.includes('|') && cleanedText.includes('---')) {
    console.log('Markdown表形式を検出');
    const markdownTasks = parseMarkdownTable(cleanedText);
    if (markdownTasks.length > 0) {
      console.log('Markdown表から抽出された課題:', markdownTasks);
      return markdownTasks;
    }
  }
  
  // CSV/TSV形式の検出
  const lines = cleanedText.split('\n').filter(line => line.trim());
  console.log('処理対象行数:', lines.length);
  
  // CSVヘッダーの検出
  if (lines.length > 1) {
    const firstLine = lines[0];
    if (firstLine.includes(',') || firstLine.includes('\t')) {
      console.log('CSV/TSV形式を検出');
      const csvTasks = parseCSVFormat(lines);
      if (csvTasks.length > 0) {
        console.log('CSV/TSVから抽出された課題:', csvTasks);
        return csvTasks;
      }
    }
  }

  // 通常のテキスト行解析
  console.log('通常のテキスト解析を実行');
  for (const line of lines) {
    console.log('解析中の行:', line);
    const task = parseTaskLine(line);
    if (task) {
      console.log('抽出された課題:', task);
      tasks.push(task);
    }
  }

  console.log('最終的に抽出された課題数:', tasks.length);
  return tasks;
}

// Markdown表形式の解析
function parseMarkdownTable(text: string): ExtractedTask[] {
  const tasks: ExtractedTask[] = [];
  const lines = text.split('\n').map(line => line.trim()).filter(line => line);
  
  console.log('Markdown表解析開始、行数:', lines.length);
  
  let headerIndex = -1;
  let separatorIndex = -1;
  
  // ヘッダー行と区切り行を見つける
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    console.log(`行${i}:`, line);
    
    if (line.includes('|') && !line.includes('-') && !line.startsWith('#')) {
      if (headerIndex === -1) {
        headerIndex = i;
        console.log('ヘッダー行を検出:', i);
      }
    } else if (line.includes('|') && line.includes('-') && line.match(/\|[\s\-]+\|/)) {
      separatorIndex = i;
      console.log('区切り行を検出:', i);
      break;
    }
  }
  
  console.log('ヘッダー行:', headerIndex, '区切り行:', separatorIndex);
  
  if (headerIndex === -1 || separatorIndex === -1) {
    console.log('Markdown表の構造が見つかりません');
    return tasks;
  }
  
  // ヘッダーを解析してカラムの意味を特定
  const headerLine = lines[headerIndex];
  console.log('ヘッダー行:', headerLine);
  
  const headers = headerLine.split('|')
    .map(h => h.trim())
    .filter(h => h)
    .map(h => h.toLowerCase());
  
  console.log('解析されたヘッダー:', headers);
  
  const columnMap = {
    name: -1,
    amount: -1,
    unit: -1,
    deadline: -1
  };
  
  // カラムマッピング
  headers.forEach((header, index) => {
    console.log(`ヘッダー${index}: "${header}"`);
    
    if (header.includes('課題') || header.includes('名前') || header.includes('タイトル') ||
        header.includes('科目') || header.includes('教科') ||
        header.includes('name') || header.includes('title') || header.includes('subject')) {
      columnMap.name = index;
      console.log('課題名カラム:', index);
    } else if (header.includes('分量') || header.includes('量') || header.includes('数') || 
               header.includes('amount') || header.includes('pages') || header.includes('ページ') ||
               header.includes('page')) {
      columnMap.amount = index;
      console.log('分量カラム:', index);
    } else if (header.includes('単位') || header.includes('unit')) {
      columnMap.unit = index;
      console.log('単位カラム:', index);
    } else if (header.includes('締切') || header.includes('期限') || header.includes('deadline') || 
               header.includes('due') || header.includes('日付') || header.includes('date') ||
               header.includes('期日')) {
      columnMap.deadline = index;
      console.log('締切カラム:', index);
    }
  });
  
  console.log('カラムマッピング:', columnMap);
  
  // データ行を処理
  for (let i = separatorIndex + 1; i < lines.length; i++) {
    const line = lines[i];
    console.log(`データ行${i}:`, line);
    
    if (!line.includes('|') || line.startsWith('#')) continue;
    
    const cells = line.split('|')
      .map(cell => cell.trim())
      .filter(cell => cell);
    
    console.log('セル:', cells);
    
    if (cells.length < 2) continue;
    
    const task: ExtractedTask = {
      name: '',
      amount: 1,
      unit: 'ページ',
      deadline: '',
      confidence: 0.9
    };
    
    // 各セルからデータを抽出
    cells.forEach((cell, index) => {
      if (columnMap.name === index) {
        task.name = cell;
        console.log('課題名設定:', cell);
      } else if (columnMap.amount === index) {
        const amountMatch = cell.match(/(\d+)/);
        if (amountMatch) {
          task.amount = Number(amountMatch[1]);
          console.log('分量設定:', task.amount);
        }
      } else if (columnMap.unit === index) {
        task.unit = cell || 'ページ';
        console.log('単位設定:', task.unit);
      } else if (columnMap.deadline === index) {
        task.deadline = normalizeDate(cell);
        console.log('締切設定:', task.deadline);
      }
    });
    
    // カラムマッピングが不完全な場合の推測処理
    if (!task.name) {
      // 最初の非空セルを課題名とする
      const nameCell = cells.find(cell => cell && cell.length > 1 && !cell.match(/^\d+$/) && !cell.match(/^\d+\/\d+$/));
      if (nameCell) {
        task.name = nameCell;
        console.log('推測で課題名設定:', task.name);
      }
    }
    
    if (!task.deadline) {
      // 日付らしきセルを探す
      for (const cell of cells) {
        if (cell.match(/\d{1,2}[\/\-月]\d{1,2}/) || cell.match(/\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}/) || 
            cell.match(/^\d{1,2}\/\d{1,2}$/) || cell.match(/^\d{1,2}-\d{1,2}$/)) {
          task.deadline = normalizeDate(cell);
          console.log('推測で締切設定:', task.deadline);
          break;
        }
      }
    }
    
    // 分量と単位を推測
    if (task.amount === 1 || !task.unit) {
      for (const cell of cells) {
        const amountMatch = cell.match(/(\d+)\s*(ページ|頁|問題|題|枚|冊|回|セット|ユニット|プロジェクト|作品|P\.?|pages?|p)/i);
        if (amountMatch) {
          task.amount = Number(amountMatch[1]);
          let unit = amountMatch[2];
          if (unit.toLowerCase() === 'p' || unit.toLowerCase() === 'pages' || unit.toLowerCase() === 'page') {
            unit = 'ページ';
          }
          task.unit = unit || 'ページ';
          console.log('推測で分量・単位設定:', task.amount, task.unit);
          break;
        }
      }
    }
    
    console.log('最終的な課題データ:', task);
    
    if (task.name && task.name.length > 1) {
      tasks.push(task);
      console.log('課題を追加しました');
    } else {
      console.log('課題名が不十分なためスキップ');
    }
  }
  
  console.log('Markdown表から抽出された課題数:', tasks.length);
  return tasks;
}

// CSV/TSV形式の解析
function parseCSVFormat(lines: string[]): ExtractedTask[] {
  const tasks: ExtractedTask[] = [];
  
  if (lines.length < 2) return tasks;
  
  const headerLine = lines[0];
  const delimiter = headerLine.includes('\t') ? '\t' : ',';
  
  console.log('CSV解析開始、区切り文字:', delimiter === '\t' ? 'TAB' : 'COMMA');
  
  const headers = headerLine.split(delimiter).map(h => h.trim().toLowerCase());
  console.log('CSVヘッダー:', headers);
  
  const columnMap = {
    name: -1,
    amount: -1,
    unit: -1,
    deadline: -1
  };
  
  // カラムマッピング
  headers.forEach((header, index) => {
    if (header.includes('課題') || header.includes('名前') || header.includes('タイトル') ||
        header.includes('科目') || header.includes('教科') ||
        header.includes('name') || header.includes('title') || header.includes('subject')) {
      columnMap.name = index;
    } else if (header.includes('分量') || header.includes('量') || header.includes('数') || 
               header.includes('amount') || header.includes('pages') || header.includes('ページ')) {
      columnMap.amount = index;
    } else if (header.includes('単位') || header.includes('unit')) {
      columnMap.unit = index;
    } else if (header.includes('締切') || header.includes('期限') || header.includes('deadline') || 
               header.includes('due') || header.includes('日付') || header.includes('date')) {
      columnMap.deadline = index;
    }
  });
  
  console.log('CSVカラムマッピング:', columnMap);
  
  // データ行を処理
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const cells = line.split(delimiter).map(cell => cell.trim());
    console.log(`CSV行${i}:`, cells);
    
    const task: ExtractedTask = {
      name: '',
      amount: 1,
      unit: 'ページ',
      deadline: '',
      confidence: 0.9
    };
    
    // 各セルからデータを抽出
    cells.forEach((cell, index) => {
      if (columnMap.name === index) {
        task.name = cell;
      } else if (columnMap.amount === index) {
        const amountMatch = cell.match(/(\d+)/);
        if (amountMatch) {
          task.amount = Number(amountMatch[1]);
        }
      } else if (columnMap.unit === index) {
        task.unit = cell || 'ページ';
      } else if (columnMap.deadline === index) {
        task.deadline = normalizeDate(cell);
      }
    });
    
    // 推測処理
    if (!task.name && cells.length > 0) {
      task.name = cells.find(cell => cell && cell.length > 1 && !cell.match(/^\d+$/)) || '';
    }
    
    if (!task.deadline) {
      for (const cell of cells) {
        if (cell.match(/\d{1,2}[\/\-月]\d{1,2}/) || cell.match(/\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}/)) {
          task.deadline = normalizeDate(cell);
          break;
        }
      }
    }
    
    for (const cell of cells) {
      const amountMatch = cell.match(/(\d+)\s*(ページ|頁|問題|題|枚|冊|回|P\.?|pages?)/i);
      if (amountMatch) {
        task.amount = Number(amountMatch[1]);
        task.unit = amountMatch[2] || 'ページ';
        break;
      }
    }
    
    console.log('CSV課題データ:', task);
    
    if (task.name && task.name.length > 1) {
      tasks.push(task);
    }
  }
  
  console.log('CSVから抽出された課題数:', tasks.length);
  return tasks;
}

// PDFから抽出されたテキストを解析（OCRと同じロジックを使用）
export function parseTasksFromPDFText(text: string): ExtractedTask[] {
  // PDFテキストの前処理
  const cleanedText = text
    .replace(/\s+/g, ' ') // 複数の空白を1つに
    .replace(/\n\s*\n/g, '\n') // 空行を削除
    .trim();
  
  return parseTasksFromText(cleanedText);
}

function parseTaskLine(line: string): ExtractedTask | null {
  // タイトル行や空行をスキップ
  const skipPatterns = [
    '課題一覧', '宿題一覧', 'homework', 'リスト', '---', 'table', 'list',
    '課題名', '分量', '単位', '締切', '期限', 'name', 'amount', 'deadline', 'due'
  ];
  
  const lowerLine = line.toLowerCase();
  if (skipPatterns.some(pattern => lowerLine.includes(pattern)) || 
      line.startsWith('#') || line.length < 3 || line.match(/^\|.*\|$/)) {
    console.log('スキップされた行:', line);
    return null;
  }

  let name = '';
  let amount = 1;
  let unit = 'ページ';
  let deadline = '';
  let confidence = 0.7;

  console.log('通常行解析:', line);

  // CSVやTSV形式の処理
  if (line.includes(',') || line.includes('\t')) {
    console.log('CSV/TSV形式として処理');
    const parts = line.split(/[,\t]/).map(part => part.trim());
    if (parts.length >= 2) {
      name = parts[0];
      
      // 各部分から情報を抽出
      for (let i = 1; i < parts.length; i++) {
        const part = parts[i];
        
        // 日付の検出
        if (part.match(/\d{1,2}[\/\-月]\d{1,2}/) || part.match(/\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}/)) {
          deadline = normalizeDate(part);
          console.log('日付検出:', deadline);
          confidence += 0.2;
        }
        
        // 分量の検出
        const amountMatch = part.match(/(\d+)\s*(ページ|頁|問題|題|枚|冊|回|P\.?|pages?|p)/i);
        if (amountMatch) {
          amount = Number(amountMatch[1]);
          let detectedUnit = amountMatch[2].toLowerCase();
          if (detectedUnit === 'p' || detectedUnit === 'pages' || detectedUnit === 'page') {
            detectedUnit = 'ページ';
          }
          unit = detectedUnit || 'ページ';
          console.log('分量・単位検出:', amount, unit);
          confidence += 0.2;
        }
      }
      
      if (name && name.length > 1) {
        console.log('CSV/TSV形式で課題抽出成功:', { name, amount, unit, deadline, confidence });
        return { name, amount, unit, deadline, confidence };
      }
    }
  }

  // 日付パターンを抽出
  const datePatterns = [
    /(\d{1,2})月(\d{1,2})日/,
    /(\d{1,2})\/(\d{1,2})/,
    /Aug\s+(\d{1,2})/i,
    /8月(\d{1,2})日/,
    /8\/(\d{1,2})/,
    /(\d{4})-(\d{1,2})-(\d{1,2})/,
    /(\d{1,2})-(\d{1,2})/,
    /まで|締切|期限|due/i,
    /(\d{1,2})\/(\d{1,2})\/(\d{4})/,
    /(\d{4})\/(\d{1,2})\/(\d{1,2})/
  ];

  for (const pattern of datePatterns) {
    const match = line.match(pattern);
    if (match) {
      console.log('日付パターンマッチ:', pattern.source, match);
      if (pattern.source.includes('Aug') || pattern.source.includes('due')) {
        deadline = `2024-08-${match[1].padStart(2, '0')}`;
      } else if (pattern.source.includes('\\d{4}')) {
        // YYYY-MM-DD形式
        deadline = `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
      } else if (pattern.source.includes('月')) {
        const month = match[1];
        const day = match[2] || match[1];
        deadline = `2024-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      } else if (pattern.source.includes('まで')) {
        // 「○月○日まで」のような表現から日付を抽出
        const dateInText = line.match(/(\d{1,2})月(\d{1,2})日/);
        if (dateInText) {
          deadline = `2024-${dateInText[1].padStart(2, '0')}-${dateInText[2].padStart(2, '0')}`;
        }
      } else {
        const month = match[1];
        const day = match[2];
        deadline = `2024-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
      console.log('設定された締切:', deadline);
      confidence += 0.2;
      break;
    }
  }

  // 分量と単位を抽出
  const amountPatterns = [
    /(\d+)\s*(ページ|頁|P\.?)/i,
    /P\.?\s*(\d+)-(\d+)/i,
    /(\d+)\s*(枚|冊|問題|題|回|日分|作品|テーマ)/,
    /Pages?\s+(\d+)-(\d+)/i,
    /(\d+)\s*～\s*(\d+)\s*(ページ|頁)/i,
    /全\s*(\d+)\s*(ページ|問題|枚)/i
  ];

  for (const pattern of amountPatterns) {
    const match = line.match(pattern);
    if (match) {
      console.log('分量パターンマッチ:', pattern.source, match);
      if (match[3]) {
        // 範囲指定の場合 (1～50ページ)
        amount = Number(match[2]) - Number(match[1]) + 1;
        unit = match[3];
      } else if (match[2] && !isNaN(Number(match[2]))) {
        // 範囲指定の場合 (P.1-50)
        amount = Number(match[2]) - Number(match[1]) + 1;
        unit = 'ページ';
      } else {
        amount = Number(match[1]);
        unit = match[2] || 'ページ';
      }
      console.log('設定された分量・単位:', amount, unit);
      confidence += 0.2;
      break;
    }
  }

  // 課題名を抽出（コロンや：で区切られた最初の部分）
  const nameMatch = line.match(/^[・•\-\*]?\s*([^:：\d\(\)]+?)(?:\s*[:：]|\s*\d|\s*\(|$)/);
  if (nameMatch) {
    name = nameMatch[1].trim();
    // 不要な文字を除去
    name = name.replace(/[（）\(\)、。]/g, '').trim();
    console.log('課題名抽出:', name);
    confidence += 0.1;
  } else {
    // フォールバック: 行全体から数字と記号を除去
    name = line.replace(/[0-9\-\/：:・•\(\)（）]*$/, '').replace(/^\s*[・•\-\*]\s*/, '').trim();
    console.log('フォールバック課題名:', name);
  }

  console.log('最終課題データ:', { name, amount, unit, deadline, confidence });

  // 最低限の情報が揃っている場合のみ返す
  if (name && name.length > 1) {
    console.log('課題抽出成功');
    return {
      name,
      amount,
      unit,
      deadline,
      confidence: Math.min(confidence, 1.0)
    };
  }

  console.log('課題抽出失敗');
  return null;
}

// 日付文字列を正規化
export function normalizeDate(dateStr: string): string {
  if (!dateStr || dateStr.trim() === '') return '';
  
  const today = new Date();
  const currentYear = today.getFullYear();
  const nextYear = currentYear + 1;
  
  // 既に正しい形式の場合
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }
  
  // YYYY/MM/DD形式
  const yyyymmddMatch = dateStr.match(/(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  if (yyyymmddMatch) {
    const year = yyyymmddMatch[1];
    const month = yyyymmddMatch[2].padStart(2, '0');
    const day = yyyymmddMatch[3].padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  // MM/DD/YYYY形式
  const mmddyyyyMatch = dateStr.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (mmddyyyyMatch) {
    const month = mmddyyyyMatch[1].padStart(2, '0');
    const day = mmddyyyyMatch[2].padStart(2, '0');
    const year = mmddyyyyMatch[3];
    return `${year}-${month}-${day}`;
  }
  
  // 月日のみの場合（9/1 形式）
  const monthDayMatch = dateStr.match(/(\d{1,2})[月\/](\d{1,2})/);
  if (monthDayMatch) {
    const month = monthDayMatch[1].padStart(2, '0');
    const day = monthDayMatch[2].padStart(2, '0');
    
    // 9月の場合は来年度とする（夏休み課題の場合）
    const targetYear = parseInt(month) >= 9 ? nextYear : currentYear;
    return `${targetYear}-${month}-${day}`;
  }
  
  // 数字のみの場合（YYYYMMDD）
  if (/^\d{8}$/.test(dateStr)) {
    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);
    return `${year}-${month}-${day}`;
  }
  
  return dateStr;
}