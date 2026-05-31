import { useEffect, useRef, useState } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { useApp } from '../contexts/AppContext';

interface ThumbnailPanelProps {
  pdfDoc: PDFDocumentProxy | null;
  onPageSelect: (page: number) => void;
}

interface Thumbnail {
  page: number;
  dataUrl: string;
}

export function ThumbnailPanel({ pdfDoc, onPageSelect }: ThumbnailPanelProps) {
  const { currentPage } = useApp();
  const [thumbnails, setThumbnails] = useState<Thumbnail[]>([]);
  const activeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!pdfDoc) return;
    setThumbnails([]);
    let cancelled = false;

    (async () => {
      for (let i = 1; i <= pdfDoc.numPages; i++) {
        if (cancelled) break;
        const page = await pdfDoc.getPage(i);
        const vp = page.getViewport({ scale: 0.2 });
        const canvas = document.createElement('canvas');
        canvas.width = vp.width;
        canvas.height = vp.height;
        const ctx = canvas.getContext('2d')!;
        await page.render({ canvasContext: ctx, viewport: vp }).promise;
        setThumbnails(prev => [...prev, { page: i, dataUrl: canvas.toDataURL() }]);
      }
    })();

    return () => { cancelled = true; };
  }, [pdfDoc]);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [currentPage]);

  return (
    <div className="flex flex-col overflow-y-auto py-2 gap-2 px-2 bg-[#252b3b] flex-1">
      {thumbnails.map(({ page, dataUrl }) => (
        <button
          key={page}
          ref={page === currentPage ? activeRef : null}
          onClick={() => onPageSelect(page)}
          className={`flex flex-col items-center gap-1 rounded p-1 transition-colors ${
            page === currentPage
              ? 'bg-blue-500/30 ring-2 ring-blue-400'
              : 'hover:bg-white/10'
          }`}
        >
          <img
            src={dataUrl}
            alt={`Page ${page}`}
            className="w-full object-contain shadow"
            style={{ maxWidth: 120 }}
          />
          <span className="text-xs text-gray-400">{page}</span>
        </button>
      ))}
    </div>
  );
}
