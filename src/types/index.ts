export interface Paper {
  id: number;
  title: string;
  file_path: string;
  last_opened_page: number;
  last_zoom_level: number;
  uploaded_at: string;
}

export interface Highlight {
  id: number;
  paper_id: number;
  original_text: string;
  translated_text: string;
  explanation_text: string;
  page_number: number;
  created_at: string;
}

export interface SelectionInfo {
  text: string;
  x: number;
  y: number;
  pageNumber: number;
}

export interface TranslationResult {
  translation: string;
  explanation: string;
}

export type SidebarTab = 'reader' | 'thumbnails' | 'history' | 'settings';

export interface AppState {
  windowWidth: number;
  windowHeight: number;
  windowX: number;
  windowY: number;
  lastPaperId: number | null;
  geminiApiKey: string;
}
