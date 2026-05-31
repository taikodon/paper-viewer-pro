import React from 'react';
import { X, BookmarkPlus, Loader2 } from 'lucide-react';
import type { SelectionInfo, TranslationResult } from '../types';

interface TranslationPopupProps {
  selection: SelectionInfo;
  result: TranslationResult | null;
  isLoading: boolean;
  onClose: () => void;
  onSave: () => void;
  containerRef: React.RefObject<HTMLElement | null>;
}

export function TranslationPopup({
  selection,
  result,
  isLoading,
  onClose,
  onSave,
  containerRef,
}: TranslationPopupProps) {
  const containerRect = containerRef.current?.getBoundingClientRect();
  const containerHeight = containerRect?.height ?? 600;

  const POPUP_HEIGHT = 280;
  const POPUP_WIDTH = 340;
  const MARGIN = 12;

  let top = selection.y - POPUP_HEIGHT - MARGIN;
  if (top < 0) top = selection.y + 30;
  if (top + POPUP_HEIGHT > containerHeight) top = containerHeight - POPUP_HEIGHT - MARGIN;

  let left = selection.x - POPUP_WIDTH / 2;
  const containerWidth = containerRect?.width ?? 800;
  if (left < MARGIN) left = MARGIN;
  if (left + POPUP_WIDTH > containerWidth - MARGIN) left = containerWidth - POPUP_WIDTH - MARGIN;

  return (
    <div
      className="absolute z-50 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden"
      style={{ top, left, width: POPUP_WIDTH }}
      onMouseDown={e => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-200">
        <span className="text-xs font-medium text-gray-600">
          選択したテキスト（ページ{selection.pageNumber}）
        </span>
        <button onClick={onClose} className="p-0.5 rounded hover:bg-gray-200">
          <X size={14} />
        </button>
      </div>

      {/* Selected text */}
      <div className="px-3 py-2 border-b border-gray-100">
        <p className="text-xs text-gray-700 line-clamp-2">{selection.text}</p>
      </div>

      {/* Content */}
      <div className="px-3 py-2 max-h-52 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-6 gap-2 text-gray-400">
            <Loader2 size={18} className="animate-spin" />
            <span className="text-sm">翻訳中...</span>
          </div>
        ) : result ? (
          <>
            <div className="mb-3">
              <p className="text-xs font-semibold text-gray-500 mb-1">日本語訳</p>
              <p className="text-sm text-gray-800">{result.translation}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-1">用語解説</p>
              <p className="text-sm text-gray-700 whitespace-pre-line">{result.explanation}</p>
            </div>
          </>
        ) : (
          <p className="text-xs text-gray-400 py-4 text-center">
            APIキーを設定してください
          </p>
        )}
      </div>

      {/* Footer */}
      {result && !isLoading && (
        <div className="px-3 py-2 bg-gray-50 border-t border-gray-200 flex justify-end">
          <button
            onClick={onSave}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            <BookmarkPlus size={13} />
            単語帳に保存
          </button>
        </div>
      )}
    </div>
  );
}
