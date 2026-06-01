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
  const containerWidth = containerRect?.width ?? 800;
  const scrollTop = containerRef.current?.scrollTop ?? 0;

  const POPUP_HEIGHT = 420;
  const POPUP_WIDTH = 500;
  const MARGIN = 16;

  const viewportRelY = selection.y - scrollTop;

  let top = selection.y - POPUP_HEIGHT - MARGIN;
  if (viewportRelY < POPUP_HEIGHT + MARGIN) {
    top = selection.y + 30;
  }

  let left = selection.x - POPUP_WIDTH / 2;
  if (left < MARGIN) left = MARGIN;
  if (left + POPUP_WIDTH > containerWidth - MARGIN) left = containerWidth - POPUP_WIDTH - MARGIN;

  return (
    <div
      className="translation-popup absolute z-50 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col"
      style={{ top, left, width: POPUP_WIDTH, maxHeight: POPUP_HEIGHT }}
      onMouseDown={(e) => e.stopPropagation()}
      onMouseUp={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-200 flex-shrink-0">
        <span className="text-xs font-semibold text-gray-500 tracking-wide uppercase">
          ページ {selection.pageNumber}
        </span>
        <button
          onClick={onClose}
          className="p-1 rounded-md hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={15} />
        </button>
      </div>

      {/* Original text */}
      <div className="px-4 py-3 border-b border-gray-100 bg-amber-50 flex-shrink-0">
        <p className="text-xs font-medium text-amber-700 mb-1">選択テキスト</p>
        <p className="text-sm text-gray-700 leading-relaxed line-clamp-3 italic">{selection.text}</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3 text-gray-400">
            <Loader2 size={22} className="animate-spin text-blue-400" />
            <span className="text-sm">解析中...</span>
          </div>
        ) : result ? (
          <div className="divide-y divide-gray-100">
            {/* Translation */}
            <div className="px-4 py-4">
              <p className="text-xs font-bold text-blue-600 mb-2 flex items-center gap-1">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500" />
                日本語訳
              </p>
              <p className="text-base text-gray-900 leading-relaxed">{result.translation}</p>
            </div>

            {/* Explanation */}
            <div className="px-4 py-4">
              <p className="text-xs font-bold text-emerald-600 mb-2 flex items-center gap-1">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
                解説
              </p>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                {result.explanation}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center py-10 text-sm text-gray-400">
            APIキーを設定してください
          </div>
        )}
      </div>

      {/* Footer */}
      {result && !isLoading && (
        <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-200 flex justify-end flex-shrink-0">
          <button
            onClick={onSave}
            className="flex items-center gap-2 text-sm px-4 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
          >
            <BookmarkPlus size={14} />
            単語帳に保存
          </button>
        </div>
      )}
    </div>
  );
}
