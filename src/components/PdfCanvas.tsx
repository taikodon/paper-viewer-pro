import { useRef, useCallback } from 'react';
import { TranslationPopup } from './TranslationPopup';
import { useApp } from '../contexts/AppContext';
import { useTextSelection } from '../hooks/useTextSelection';
import { geminiService } from '../services/gemini';
import { dbService } from '../services/db';
import type { SelectionInfo } from '../types';

interface PdfCanvasProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  textLayerRef: React.RefObject<HTMLDivElement | null>;
  isLoading: boolean;
  hasFile: boolean;
  currentPage: number;
}

export function PdfCanvas({ canvasRef, textLayerRef, isLoading, hasFile, currentPage }: PdfCanvasProps) {
  const {
    currentPaper,
    selection, setSelection,
    translationResult, setTranslationResult,
    isTranslating, setIsTranslating,
    apiKey,
    closePopup,
    addHighlight,
  } = useApp();

  const containerRef = useRef<HTMLDivElement>(null);

  const handleSelect = useCallback(
    async (info: SelectionInfo) => {
      setSelection(info);
      setTranslationResult(null);
      if (!apiKey) return;
      setIsTranslating(true);
      try {
        const result = await geminiService.translate(info.text, apiKey);
        setTranslationResult(result);
      } catch (e) {
        console.error('Translation error:', e);
      } finally {
        setIsTranslating(false);
      }
    },
    [apiKey, setSelection, setTranslationResult, setIsTranslating]
  );

  const { handleMouseUp } = useTextSelection(handleSelect, currentPage, containerRef);

  const handleSave = useCallback(async () => {
    if (!selection || !translationResult || !currentPaper) return;
    const h = await dbService.saveHighlight(
      currentPaper.id,
      selection.text,
      translationResult.translation,
      translationResult.explanation,
      selection.pageNumber
    );
    addHighlight(h);
    closePopup();
  }, [selection, translationResult, currentPaper, addHighlight, closePopup]);

  const handleContainerClick = useCallback(
    (e: React.MouseEvent) => {
      if (!selection) return;
      if ((e.target as HTMLElement).closest('.translation-popup')) return;
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed) closePopup();
    },
    [selection, closePopup]
  );

  return (
    <div
      ref={containerRef}
      className="relative flex-1 overflow-auto bg-gray-400 flex flex-col items-center py-6 pb-8"
      onMouseUp={handleMouseUp}
      onClick={handleContainerClick}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-400/60 z-10">
          <span className="text-white text-sm bg-black/40 px-4 py-2 rounded">読み込み中...</span>
        </div>
      )}

      {!hasFile && !isLoading && (
        <div className="flex flex-col items-center justify-center h-full text-gray-200">
          <p className="text-lg font-medium">PDFファイルを開いてください</p>
          <p className="text-sm mt-2 text-gray-300">左上の「ファイルを開く」から選択</p>
        </div>
      )}

      {hasFile && (
        <div className="relative shadow-2xl">
          <canvas ref={canvasRef} className="block" />
          <div
            ref={textLayerRef}
            className="absolute top-0 left-0 pdf-text-layer select-text"
          />
          {selection && (
            <div className="translation-popup">
              <TranslationPopup
                selection={selection}
                result={translationResult}
                isLoading={isTranslating}
                onClose={closePopup}
                onSave={handleSave}
                containerRef={containerRef}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
