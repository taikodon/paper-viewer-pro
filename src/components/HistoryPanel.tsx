import { useState, useEffect, useCallback } from 'react';
import { Search, Trash2 } from 'lucide-react';
import { dbService } from '../services/db';
import { useApp } from '../contexts/AppContext';
import type { Highlight } from '../types';

export function HistoryPanel() {
  const { currentPaper, highlights, setHighlights } = useApp();
  const [keyword, setKeyword] = useState('');
  const [filterAll, setFilterAll] = useState(true);

  const loadHighlights = useCallback(async () => {
    const paperId = !filterAll && currentPaper ? currentPaper.id : undefined;
    const data = await dbService.getHighlights(paperId, keyword);
    setHighlights(data);
  }, [filterAll, currentPaper, keyword, setHighlights]);

  useEffect(() => {
    loadHighlights();
  }, [loadHighlights]);

  const handleDelete = async (id: number) => {
    await dbService.deleteHighlight(id);
    setHighlights(highlights.filter(h => h.id !== id));
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="px-3 py-2 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-700 mb-2">履歴・単語帳</h2>
        <div className="flex items-center gap-1.5 bg-gray-100 rounded px-2 py-1">
          <Search size={13} className="text-gray-400" />
          <input
            type="text"
            placeholder="キーワードで検索"
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            className="bg-transparent flex-1 text-xs outline-none text-gray-700 placeholder-gray-400"
          />
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-gray-200">
        <button
          onClick={() => setFilterAll(true)}
          className={`text-xs px-2 py-0.5 rounded ${filterAll ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'}`}
        >
          すべての論文
        </button>
        {currentPaper && (
          <button
            onClick={() => setFilterAll(false)}
            className={`text-xs px-2 py-0.5 rounded ${!filterAll ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'}`}
          >
            この論文のみ
          </button>
        )}
        <span className="ml-auto text-xs text-gray-400">{highlights.length}件</span>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {highlights.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-300 text-xs py-8">
            <p>まだ保存した単語・翻訳がありません</p>
            <p className="mt-1">テキストを選択して保存しましょう</p>
          </div>
        ) : (
          highlights.map(h => <HighlightCard key={h.id} highlight={h} onDelete={handleDelete} />)
        )}
      </div>
    </div>
  );
}

function HighlightCard({ highlight: h, onDelete }: { highlight: Highlight; onDelete: (id: number) => void }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="border-b border-gray-100 px-3 py-2.5 cursor-pointer hover:bg-gray-50"
      onClick={() => setExpanded(v => !v)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-400 mb-0.5">ページ {h.page_number}</p>
          <p className="text-xs font-medium text-gray-800 line-clamp-2">{h.original_text}</p>
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{h.translated_text}</p>
        </div>
        <button
          onClick={e => { e.stopPropagation(); onDelete(h.id); }}
          className="p-1 text-gray-300 hover:text-red-400 flex-shrink-0"
        >
          <Trash2 size={13} />
        </button>
      </div>

      {expanded && (
        <div className="mt-2 text-xs text-gray-600 bg-blue-50 rounded p-2">
          <p className="font-medium text-gray-700 mb-1">用語解説</p>
          <p className="whitespace-pre-line">{h.explanation_text}</p>
          <p className="text-gray-400 mt-2">{new Date(h.created_at).toLocaleString('ja-JP')}</p>
        </div>
      )}
    </div>
  );
}
