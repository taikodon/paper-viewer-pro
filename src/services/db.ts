import Database from '@tauri-apps/plugin-sql';
import type { Paper, Highlight } from '../types';

let db: Database | null = null;

async function getDb(): Promise<Database> {
  if (!db) {
    db = await Database.load('sqlite:paperviewer.db');
    await initSchema(db);
  }
  return db;
}

async function initSchema(database: Database): Promise<void> {
  await database.execute(`
    CREATE TABLE IF NOT EXISTS papers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      file_path TEXT NOT NULL UNIQUE,
      last_opened_page INTEGER DEFAULT 1,
      last_zoom_level REAL DEFAULT 1.0,
      uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await database.execute(`
    CREATE TABLE IF NOT EXISTS highlights (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      paper_id INTEGER NOT NULL,
      original_text TEXT NOT NULL,
      translated_text TEXT NOT NULL,
      explanation_text TEXT NOT NULL,
      page_number INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (paper_id) REFERENCES papers(id) ON DELETE CASCADE
    )
  `);
}

export const dbService = {
  async upsertPaper(filePath: string, title: string): Promise<Paper> {
    const database = await getDb();
    const existing = await database.select<Paper[]>(
      'SELECT * FROM papers WHERE file_path = ?',
      [filePath]
    );
    if (existing.length > 0) return existing[0];

    const result = await database.execute(
      'INSERT INTO papers (title, file_path) VALUES (?, ?)',
      [title, filePath]
    );
    const inserted = await database.select<Paper[]>(
      'SELECT * FROM papers WHERE id = ?',
      [result.lastInsertId]
    );
    return inserted[0];
  },

  async getPaper(id: number): Promise<Paper | null> {
    const database = await getDb();
    const rows = await database.select<Paper[]>('SELECT * FROM papers WHERE id = ?', [id]);
    return rows[0] ?? null;
  },

  async updatePaperState(id: number, page: number, zoom: number): Promise<void> {
    const database = await getDb();
    await database.execute(
      'UPDATE papers SET last_opened_page = ?, last_zoom_level = ? WHERE id = ?',
      [page, zoom, id]
    );
  },

  async saveHighlight(
    paperId: number,
    originalText: string,
    translatedText: string,
    explanationText: string,
    pageNumber: number
  ): Promise<Highlight> {
    const database = await getDb();
    const result = await database.execute(
      'INSERT INTO highlights (paper_id, original_text, translated_text, explanation_text, page_number) VALUES (?, ?, ?, ?, ?)',
      [paperId, originalText, translatedText, explanationText, pageNumber]
    );
    const inserted = await database.select<Highlight[]>(
      'SELECT * FROM highlights WHERE id = ?',
      [result.lastInsertId]
    );
    return inserted[0];
  },

  async getHighlights(paperId?: number, keyword?: string): Promise<Highlight[]> {
    const database = await getDb();
    let query = 'SELECT h.*, p.title as paper_title FROM highlights h JOIN papers p ON h.paper_id = p.id';
    const params: (string | number)[] = [];

    const conditions: string[] = [];
    if (paperId !== undefined) {
      conditions.push('h.paper_id = ?');
      params.push(paperId);
    }
    if (keyword && keyword.trim()) {
      conditions.push('(h.original_text LIKE ? OR h.translated_text LIKE ? OR h.explanation_text LIKE ?)');
      const like = `%${keyword.trim()}%`;
      params.push(like, like, like);
    }
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY h.created_at DESC';
    return database.select<Highlight[]>(query, params);
  },

  async deleteHighlight(id: number): Promise<void> {
    const database = await getDb();
    await database.execute('DELETE FROM highlights WHERE id = ?', [id]);
  },

  async getAllPapers(): Promise<Paper[]> {
    const database = await getDb();
    return database.select<Paper[]>('SELECT * FROM papers ORDER BY uploaded_at DESC');
  },
};
