import { useRef, useCallback, useEffect } from 'react';
import { TranslationPopup } from './TranslationPopup';
import { useApp } from '../contexts/AppContext';
import { geminiService } from '../services/gemini';
import { dbService } from '../services/db';
import type { SelectionInfo } from '../types';

interface PdfCanvasProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  pagesRef: React.RefObject<HTMLDivElement | null>;
  isLoading: boolean;
  hasFile: boolean;
  zoom: number;
  changeZoom: (zoom: number) => void;
}

export function PdfCanvas({ containerRef, pagesRef, isLoading, hasFile, zoom, changeZoom }: PdfCanvasProps) {
  const {
    currentPaper,
    selection, setSelection,
    translationResult, setTranslationResult,
    isTranslating, setIsTranslating,
    apiKey,
    closePopup,
    addHighlight,
  } = useApp();

  // Native non-passive listener so preventDefault() works for Ctrl+wheel zoom
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey) e.preventDefault();
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [containerRef]);

  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;
  const changeZoomRef = useRef(changeZoom);
  changeZoomRef.current = changeZoom;

  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLDivElement>) => {
      if (e.ctrlKey) {
        changeZoomRef.current(zoomRef.current + (e.deltaY > 0 ? -0.1 : 0.1));
      }
    },
    []
  );

  const handleMouseUp = useCallback(() => {
    setTimeout(() => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed) return;
      const text = sel.toString().trim();
      if (!text || text.length < 3) return;

      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const container = containerRef.current;
      if (!container) return;
      const containerRect = container.getBoundingClientRect();

      // Detect which page the selection is on via DOM traversal
      let pageNumber = 1;
      let node: Node | null = range.startContainer;
      while (node) {
        if (node instanceof HTMLElement && node.dataset.pageNumber) {
          pageNumber = parseInt(node.dataset.pageNumber);
          break;
        }
        node = node.parentNode;
      }

      // Document-space coordinates: viewport-relative + scrollTop so popup follows text on scroll
      const scrollTop = container.scrollTop;
      const x = rect.left - containerRect.left + rect.width / 2;
      const y = rect.top - containerRect.top + scrollTop;

      const info: SelectionInfo = { text, x, y, pageNumber };
      setSelection(info);
      setTranslationResult(null);
      if (!apiKey) return;
      setIsTranslating(true);
      geminiService
        .translate(info.text, apiKey)
        .then((result) => setTranslationResult(result))
        .catch((e) => console.error('Translation error:', e))
        .finally(() => setIsTranslating(false));
    }, 100);
  }, [apiKey, containerRef, setSelection, setTranslationResult, setIsTranslating]);

  // テキスト選択を解除してポップアップを閉じる。選択状態を残すと mouseup で即再表示される
  const handleClose = useCallback(() => {
    window.getSelection()?.removeAllRanges();
    closePopup();
  }, [closePopup]);

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
    handleClose();
  }, [selection, translationResult, currentPaper, addHighlight, handleClose]);

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
      className="relative flex-1 overflow-auto bg-gray-400 flex flex-col items-center"
      onMouseUp={handleMouseUp}
      onClick={handleContainerClick}
      onWheel={handleWheel}
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

      {/* Pages are injected here by usePdfViewer */}
      <div ref={pagesRef} className="flex flex-col items-center w-full py-6 pb-8 gap-3" />

      {selection && hasFile && (
        <TranslationPopup
          selection={selection}
          result={translationResult}
          isLoading={isTranslating}
          onClose={handleClose}
          onSave={handleSave}
          containerRef={containerRef}
        />
      )}
    </div>
  );
}
