import { useState, useEffect, useCallback } from 'react';
import { Search, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
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
      <div className="px-3 py-2.5 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-700 mb-2">履歴・単語帳</h2>
        <div className="flex items-center gap-1.5 bg-gray-100 rounded-lg px-2.5 py-1.5">
          <Search size={13} className="text-gray-400 flex-shrink-0" />
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
          className={`text-xs px-2 py-0.5 rounded-full ${filterAll ? 'bg-blue-100 text-blue-700 font-medium' : 'text-gray-500 hover:bg-gray-100'}`}
        >
          すべて
        </button>
        {currentPaper && (
          <button
            onClick={() => setFilterAll(false)}
            className={`text-xs px-2 py-0.5 rounded-full ${!filterAll ? 'bg-blue-100 text-blue-700 font-medium' : 'text-gray-500 hover:bg-gray-100'}`}
          >
            この論文
          </button>
        )}
        <span className="ml-auto text-xs text-gray-400">{highlights.length}件</span>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {highlights.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-300 text-xs py-8 gap-1">
            <p>まだ保存した翻訳がありません</p>
            <p>テキストを選択して保存しましょう</p>
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
    <div className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
      {/* Collapsed view */}
      <div
        className="px-3 py-3 cursor-pointer"
        onClick={() => setExpanded(v => !v)}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            {/* Page number */}
            <span className="text-[10px] text-gray-400 font-medium">p.{h.page_number}</span>

            {/* Original text */}
            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed line-clamp-2 italic">
              {h.original_text}
            </p>

            {/* Translation — most prominent */}
            <p className="text-sm text-gray-900 font-medium mt-1.5 leading-relaxed line-clamp-2">
              {h.translated_text}
            </p>
          </div>

          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <button
              onClick={e => { e.stopPropagation(); onDelete(h.id); }}
              className="p-1 text-gray-300 hover:text-red-400 transition-colors"
            >
              <Trash2 size={12} />
            </button>
            <span className="text-gray-300">
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </span>
          </div>
        </div>
      </div>

      {/* Expanded view */}
      {expanded && (
        <div className="px-3 pb-3 space-y-3">
          {/* Full original */}
          <div className="bg-amber-50 rounded-lg p-3">
            <p className="text-[10px] font-semibold text-amber-700 uppercase tracking-wide mb-1.5">原文</p>
            <p className="text-xs text-gray-700 leading-relaxed italic">{h.original_text}</p>
          </div>

          {/* Full translation */}
          <div className="bg-blue-50 rounded-lg p-3">
            <p className="text-[10px] font-semibold text-blue-700 uppercase tracking-wide mb-1.5">日本語訳</p>
            <p className="text-sm text-gray-900 leading-relaxed">{h.translated_text}</p>
          </div>

          {/* Explanation */}
          <div className="bg-emerald-50 rounded-lg p-3">
            <p className="text-[10px] font-semibold text-emerald-700 uppercase tracking-wide mb-1.5">解説</p>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{h.explanation_text}</p>
          </div>

          {/* Timestamp */}
          <p className="text-[10px] text-gray-400 text-right">
            {new Date(h.created_at).toLocaleString('ja-JP')}
          </p>
        </div>
      )}
    </div>
  );
}
