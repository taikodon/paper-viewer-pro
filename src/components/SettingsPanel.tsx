import { useState, useEffect } from 'react';
import { Key, Save, Check, AlertCircle } from 'lucide-react';
import { storeService } from '../services/store';
import { useApp } from '../contexts/AppContext';

export function SettingsPanel() {
  const { apiKey, setApiKey } = useApp();
  const [inputKey, setInputKey] = useState('');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setInputKey(apiKey);
  }, [apiKey]);

  async function handleSave() {
    setError(null);
    try {
      await storeService.setApiKey(inputKey);
      setApiKey(inputKey);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error('API key save error:', e);
      setError('保存に失敗しました。再試行してください。');
    }
  }

  return (
    <div className="flex flex-col h-full bg-white p-4">
      <h2 className="text-sm font-semibold text-gray-700 mb-4">設定</h2>

      <div className="space-y-4">
        <div>
          <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 mb-1.5">
            <Key size={13} />
            Gemini API キー
          </label>
          <input
            type="password"
            value={inputKey}
            onChange={e => setInputKey(e.target.value)}
            placeholder="AIza..."
            className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <p className="text-xs text-gray-400 mt-1">
            Google AI Studio で無料取得できます。ローカルに安全に保存されます。
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-1.5 text-xs text-red-600">
            <AlertCircle size={13} />
            {error}
          </div>
        )}

        <button
          onClick={handleSave}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
        >
          {saved ? <Check size={14} /> : <Save size={14} />}
          {saved ? '保存しました' : '保存'}
        </button>
      </div>

      <div className="mt-6 p-3 bg-blue-50 rounded text-xs text-blue-700">
        <p className="font-medium mb-1">使い方</p>
        <ul className="space-y-1 text-blue-600">
          <li>1. PDF ファイルを開く</li>
          <li>2. 読みたいテキストをマウスでドラッグ選択</li>
          <li>3. 翻訳・解説が自動表示されます</li>
          <li>4. 「単語帳に保存」で履歴に追加</li>
        </ul>
      </div>
    </div>
  );
}
