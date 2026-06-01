import { useState, useEffect, useCallback } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { invoke } from '@tauri-apps/api/core';
import { readFile } from '@tauri-apps/plugin-fs';
import { getCurrentWindow, PhysicalSize, PhysicalPosition } from '@tauri-apps/api/window';

const isTauri = () => typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
import { AppProvider, useApp } from './contexts/AppContext';
import { Sidebar } from './components/Sidebar';
import { Toolbar } from './components/Toolbar';
import { PdfCanvas } from './components/PdfCanvas';
import { ThumbnailPanel } from './components/ThumbnailPanel';
import { HistoryPanel } from './components/HistoryPanel';
import { SettingsPanel } from './components/SettingsPanel';
import { usePdfViewer } from './hooks/usePdfViewer';
import { dbService } from './services/db';
import { storeService } from './services/store';

function PdfApp() {
  const {
    currentPaper, setCurrentPaper,
    setCurrentPage, setTotalPages,
    setZoomLevel,
    currentPage,
    sidebarTab,
    setApiKey,
  } = useApp();

  const [fileData, setFileData] = useState<ArrayBuffer | null>(null);
  const [initialPage, setInitialPage] = useState(1);
  const [initialZoom, setInitialZoom] = useState(1.25);

  const {
    containerRef,
    pagesRef,
    pdfDoc,
    currentPage: viewerPage,
    totalPages,
    zoom,
    isLoading,
    loadPdf,
    goToPage,
    changeZoom,
    fitToWidth,
  } = usePdfViewer({
    onPageChange: (page, total) => {
      setCurrentPage(page);
      setTotalPages(total);
    },
  });

  // Sync viewer state to context
  useEffect(() => { setZoomLevel(zoom); }, [zoom, setZoomLevel]);

  // Persist page/zoom changes
  useEffect(() => {
    if (currentPaper && viewerPage > 0) {
      dbService.updatePaperState(currentPaper.id, viewerPage, zoom).catch(() => {});
    }
  }, [viewerPage, zoom, currentPaper]);

  // Initialize: load API key and last paper
  useEffect(() => {
    if (!isTauri()) return;
    (async () => {
      try {
        const key = await storeService.getApiKey();
        setApiKey(key);

        // Restore window position/size
        const win = getCurrentWindow();
        const w = await storeService.get('windowWidth');
        const h = await storeService.get('windowHeight');
        if (w > 0 && h > 0) {
          await win.setSize(new PhysicalSize(w, h)).catch(() => {});
        }
        const x = await storeService.get('windowX');
        const y = await storeService.get('windowY');
        if (x !== 0 || y !== 0) {
          await win.setPosition(new PhysicalPosition(x, y)).catch(() => {});
        }

        // Restore last paper
        const lastId = await storeService.getLastPaperId();
        if (lastId) {
          const paper = await dbService.getPaper(lastId);
          if (paper) {
            await openPaperByPath(paper.file_path, paper.last_opened_page, paper.last_zoom_level, paper);
          }
        }
      } catch (e) {
        console.warn('Init error:', e);
      }
    })();
  }, []);

  // Persist window size
  useEffect(() => {
    if (!isTauri()) return;
    const win = getCurrentWindow();
    let t: ReturnType<typeof setTimeout>;
    const unsubPromise = win.onResized(async () => {
      clearTimeout(t);
      t = setTimeout(async () => {
        const { width, height } = await win.innerSize();
        await storeService.set('windowWidth', width);
        await storeService.set('windowHeight', height);
      }, 500);
    });
    return () => { unsubPromise.then(f => f()); };
  }, []);

  const openPaperByPath = useCallback(
    async (filePath: string, page = 1, z = 1.25, paper?: typeof currentPaper) => {
      try {
        const bytes = await readFile(filePath);
        const buffer = bytes.buffer as ArrayBuffer;
        const title = filePath.split('/').pop()?.split('\\').pop() ?? filePath;
        const resolvedPaper = paper ?? (await dbService.upsertPaper(filePath, title));
        setCurrentPaper(resolvedPaper);
        setInitialPage(page);
        setInitialZoom(z);
        setFileData(buffer);
        await storeService.setLastPaperId(resolvedPaper.id);
      } catch (e) {
        console.error('Failed to open file:', e);
      }
    },
    [setCurrentPaper]
  );

  // Trigger PDF load when fileData changes
  useEffect(() => {
    if (fileData) {
      loadPdf(fileData, initialPage, initialZoom);
    }
  }, [fileData]);

  const handleOpenFile = useCallback(async () => {
    if (!isTauri()) return;
    const defaultPath = await invoke<string>('get_default_open_path').catch(() => '');
    const selected = await open({
      multiple: false,
      filters: [{ name: 'PDF', extensions: ['pdf'] }],
      defaultPath: defaultPath || undefined,
    });
    if (!selected || typeof selected !== 'string') return;
    await openPaperByPath(selected);
  }, [openPaperByPath]);

  const showLeftSubPanel = sidebarTab === 'thumbnails' || sidebarTab === 'settings';
  const showRightPanel = sidebarTab === 'history';

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-100 flex-col">
      {/* Main content */}
      <div className="flex flex-1 min-h-0">
        {/* Icon sidebar */}
        <Sidebar />

        {/* Left sub-panel */}
        {showLeftSubPanel && (
          <div className="w-44 flex-shrink-0 border-r border-gray-600 flex flex-col overflow-hidden">
            {sidebarTab === 'thumbnails' && (
              <ThumbnailPanel pdfDoc={pdfDoc} onPageSelect={goToPage} />
            )}
            {sidebarTab === 'settings' && <SettingsPanel />}
          </div>
        )}

        {/* Center: toolbar + PDF */}
        <div className="flex flex-col flex-1 min-w-0">
          <Toolbar
            currentPage={viewerPage || currentPage}
            totalPages={totalPages}
            zoom={zoom}
            filename={currentPaper?.title ?? ''}
            onOpenFile={handleOpenFile}
            onPageChange={goToPage}
            onZoomChange={changeZoom}
            onFitToWidth={fitToWidth}
          />
          <PdfCanvas
            containerRef={containerRef}
            pagesRef={pagesRef}
            isLoading={isLoading}
            hasFile={!!fileData}
            zoom={zoom}
            changeZoom={changeZoom}
          />
        </div>

        {/* Right history panel */}
        {showRightPanel && (
          <div className="w-72 flex-shrink-0 border-l border-gray-200 flex flex-col overflow-hidden">
            <HistoryPanel />
          </div>
        )}
      </div>

      {/* Status bar */}
      <div className="h-6 bg-white border-t border-gray-200 flex items-center px-3 gap-6 text-xs text-gray-500 flex-shrink-0">
        <span>現在の論文：{currentPaper?.title ?? '未選択'}</span>
        <span>
          ページ：{viewerPage || '–'}/{totalPages || '–'}　ズーム：{Math.round(zoom * 100)}%
        </span>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <PdfApp />
    </AppProvider>
  );
}
