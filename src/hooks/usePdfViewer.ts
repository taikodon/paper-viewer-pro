import { useState, useRef, useCallback } from 'react';
import * as pdfjs from 'pdfjs-dist';
import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

interface UsePdfViewerOptions {
  onPageChange?: (page: number, total: number) => void;
}

export function usePdfViewer({ onPageChange }: UsePdfViewerOptions = {}) {
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [zoom, setZoom] = useState(1.25);
  const [isLoading, setIsLoading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);
  const renderTaskRef = useRef<pdfjs.RenderTask | null>(null);
  const textLayerInstanceRef = useRef<pdfjs.TextLayer | null>(null);

  const renderPage = useCallback(
    async (doc: PDFDocumentProxy, pageNum: number, scale: number) => {
      if (!canvasRef.current || !textLayerRef.current) return;

      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }
      if (textLayerInstanceRef.current) {
        textLayerInstanceRef.current.cancel();
        textLayerInstanceRef.current = null;
      }

      const page: PDFPageProxy = await doc.getPage(pageNum);
      const viewport = page.getViewport({ scale });

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d')!;
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      const renderTask = page.render({ canvasContext: ctx, viewport });
      renderTaskRef.current = renderTask;

      try {
        await renderTask.promise;
      } catch (e: unknown) {
        if ((e as { name: string }).name !== 'RenderingCancelledException') throw e;
        return;
      }

      // Text layer using pdfjs-dist v4 TextLayer class
      const textLayer = textLayerRef.current;
      textLayer.innerHTML = '';
      textLayer.style.width = `${viewport.width}px`;
      textLayer.style.height = `${viewport.height}px`;

      const textContent = await page.getTextContent();
      const tl = new pdfjs.TextLayer({
        textContentSource: textContent as unknown as ReadableStream,
        container: textLayer,
        viewport,
      });
      textLayerInstanceRef.current = tl;
      await tl.render();
    },
    []
  );

  const loadPdf = useCallback(
    async (data: ArrayBuffer, initialPage = 1, initialZoom = 1.25) => {
      setIsLoading(true);
      try {
        const copy = data.slice(0);
        const doc = await pdfjs.getDocument({ data: copy }).promise;
        setPdfDoc(doc);
        setTotalPages(doc.numPages);
        const page = Math.min(Math.max(1, initialPage), doc.numPages);
        setCurrentPage(page);
        setZoom(initialZoom);
        onPageChange?.(page, doc.numPages);
        await renderPage(doc, page, initialZoom);
      } finally {
        setIsLoading(false);
      }
    },
    [renderPage, onPageChange]
  );

  const goToPage = useCallback(
    async (page: number) => {
      if (!pdfDoc) return;
      const p = Math.min(Math.max(1, page), pdfDoc.numPages);
      setCurrentPage(p);
      onPageChange?.(p, pdfDoc.numPages);
      await renderPage(pdfDoc, p, zoom);
    },
    [pdfDoc, zoom, renderPage, onPageChange]
  );

  const changeZoom = useCallback(
    async (newZoom: number) => {
      if (!pdfDoc) return;
      const z = Math.min(Math.max(0.25, newZoom), 4.0);
      setZoom(z);
      await renderPage(pdfDoc, currentPage, z);
    },
    [pdfDoc, currentPage, renderPage]
  );

  const fitToWidth = useCallback(async () => {
    if (!pdfDoc || !canvasRef.current) return;
    const page = await pdfDoc.getPage(currentPage);
    const containerWidth = canvasRef.current.parentElement?.clientWidth ?? 800;
    const vp = page.getViewport({ scale: 1 });
    const newZoom = (containerWidth - 32) / vp.width;
    await changeZoom(newZoom);
  }, [pdfDoc, currentPage, changeZoom]);

  return {
    canvasRef,
    textLayerRef,
    pdfDoc,
    currentPage,
    totalPages,
    zoom,
    isLoading,
    loadPdf,
    goToPage,
    changeZoom,
    fitToWidth,
  };
}
