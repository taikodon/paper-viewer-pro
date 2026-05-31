import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { Paper, Highlight, SelectionInfo, SidebarTab, TranslationResult } from '../types';

interface AppContextValue {
  // Current paper
  currentPaper: Paper | null;
  setCurrentPaper: (paper: Paper | null) => void;

  // PDF viewer state
  currentPage: number;
  setCurrentPage: (page: number) => void;
  totalPages: number;
  setTotalPages: (total: number) => void;
  zoomLevel: number;
  setZoomLevel: (zoom: number) => void;

  // Text selection & translation popup
  selection: SelectionInfo | null;
  setSelection: (sel: SelectionInfo | null) => void;
  translationResult: TranslationResult | null;
  setTranslationResult: (result: TranslationResult | null) => void;
  isTranslating: boolean;
  setIsTranslating: (v: boolean) => void;

  // Sidebar
  sidebarTab: SidebarTab;
  setSidebarTab: (tab: SidebarTab) => void;

  // History
  highlights: Highlight[];
  setHighlights: (highlights: Highlight[]) => void;
  addHighlight: (highlight: Highlight) => void;

  // Settings
  apiKey: string;
  setApiKey: (key: string) => void;

  closePopup: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentPaper, setCurrentPaper] = useState<Paper | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1.25);
  const [selection, setSelection] = useState<SelectionInfo | null>(null);
  const [translationResult, setTranslationResult] = useState<TranslationResult | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('reader');
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [apiKey, setApiKey] = useState('');

  const addHighlight = useCallback((highlight: Highlight) => {
    setHighlights(prev => [highlight, ...prev]);
  }, []);

  const closePopup = useCallback(() => {
    setSelection(null);
    setTranslationResult(null);
    setIsTranslating(false);
  }, []);

  return (
    <AppContext.Provider
      value={{
        currentPaper, setCurrentPaper,
        currentPage, setCurrentPage,
        totalPages, setTotalPages,
        zoomLevel, setZoomLevel,
        selection, setSelection,
        translationResult, setTranslationResult,
        isTranslating, setIsTranslating,
        sidebarTab, setSidebarTab,
        highlights, setHighlights,
        addHighlight,
        apiKey, setApiKey,
        closePopup,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
